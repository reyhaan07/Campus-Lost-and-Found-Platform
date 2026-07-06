import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import SubmissionLock from '../models/SubmissionLock.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import escapeRegex from '../utils/escapeRegex.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';
import { extractEmbedding, buildTextInput } from '../services/aiService.js';
import { claimMatch, findMatchesForReport } from '../services/matchService.js';
import { deleteReportAndCleanup } from '../services/reportLifecycleService.js';

const buildSubmissionKey = ({ userId, type, title, category, description, location, date }) => [
  userId, type, title.trim().toLowerCase(), category, description.trim().toLowerCase(),
  location.trim().toLowerCase(), new Date(date).toISOString(),
].join('|');

const parsePagination = (page, limit) => ({
  page: Math.max(1, Number.parseInt(page, 10) || 1),
  limit: Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10)),
});

export const createReport = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError(400, 'Image file is required'));

  const { title, category, description, location, date, type } = req.body;
  const submissionKey = buildSubmissionKey({ userId: req.user._id, type, title, category, description, location, date });
  try {
    await SubmissionLock.create({ key: submissionKey });
  } catch (error) {
    if (error.code === 11000) return next(new AppError(409, 'This report was already submitted'));
    throw error;
  }

  const uploadResult = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype);

  let embedding = [];
  try {
    embedding = await extractEmbedding(req.file.buffer, 'image');
  } catch (embeddingError) {
    try {
      const textInput = buildTextInput(title, description);
      embedding = await extractEmbedding(textInput, 'text');
    } catch (fallbackError) {
      console.warn('AI embedding unavailable; saving report without matching', fallbackError.message);
    }
  }

  let report;
  try {
    report = await Report.create({
      userId: req.user._id,
      type,
      title,
      category,
      description,
      location,
      date,
      imageUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      embedding,
    });
  } catch (error) {
    await deleteFromCloudinary(uploadResult.public_id).catch(() => {});
    throw error;
  }

  let claimedMatch = null;
  let claimedScore = null;
  try {
    const matches = await findMatchesForReport(report);
    for (const match of matches) {
      claimedMatch = await claimMatch(report, match.report);
      if (claimedMatch) {
        claimedScore = match.score;
        break;
      }
    }
  } catch (error) {
    console.warn('Report saved but automatic matching failed', error.message);
  }

  res.status(201).json({
    report: claimedMatch?.report || report,
    matches: claimedMatch ? [{ report: claimedMatch.matchedReport, score: claimedScore }] : [],
  });
});

export const getReports = catchAsync(async (req, res) => {
  const { type, category, search } = req.query;
  const pagination = parsePagination(req.query.page, req.query.limit);
  const filter = { status: 'open' };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (search) filter.$or = [
    { title: { $regex: escapeRegex(search), $options: 'i' } },
    { description: { $regex: escapeRegex(search), $options: 'i' } },
    { location: { $regex: escapeRegex(search), $options: 'i' } },
  ];

  const skip = (pagination.page - 1) * pagination.limit;
  const reports = await Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pagination.limit);
  const total = await Report.countDocuments(filter);

  res.json({ reports, pagination: { ...pagination, total, pages: Math.ceil(total / pagination.limit) } });
});

export const getMyReports = catchAsync(async (req, res) => {
  const reports = await Report.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ reports });
});

export const getReportById = catchAsync(async (req, res, next) => {
  const report = await Report.findById(req.params.id)
    .populate('userId', 'name')
    .populate({ path: 'matchedReportId', populate: { path: 'userId', select: 'name' } });
  if (!report) return next(new AppError(404, 'Report not found'));
  res.json({ report });
});

export const updateReport = catchAsync(async (req, res, next) => {
  const report = await Report.findById(req.params.id);
  if (!report) return next(new AppError(404, 'Report not found'));
  if (report.userId.toString() !== req.user._id.toString()) return next(new AppError(403, 'You can only edit your own reports'));
  if (report.status !== 'open') return next(new AppError(409, 'Matched or resolved reports cannot be edited'));

  const { title, category, description, location, date } = req.body;
  if (title) report.title = title;
  if (category) report.category = category;
  if (description) report.description = description;
  if (location) report.location = location;
  if (date) report.date = date;

  await report.save();
  res.json({ report });
});

export const deleteReport = catchAsync(async (req, res, next) => {
  const report = await Report.findById(req.params.id);
  if (!report) return next(new AppError(404, 'Report not found'));
  if (report.userId.toString() !== req.user._id.toString()) return next(new AppError(403, 'You can only delete your own reports'));

  await deleteReportAndCleanup(report);
  res.status(204).send();
});

export const resolveReport = catchAsync(async (req, res, next) => {
  const report = await Report.findById(req.params.id);
  if (!report) return next(new AppError(404, 'Report not found'));
  if (report.userId.toString() !== req.user._id.toString()) return next(new AppError(403, 'You can only resolve your own reports'));

  if (report.status === 'resolved') return res.json({ report });

  const resolvedAt = new Date();
  const resolvedReports = [report];
  report.status = 'resolved';
  report.resolvedAt = resolvedAt;
  if (report.matchedReportId) {
    const counterpart = await Report.findById(report.matchedReportId);
    if (counterpart && counterpart.matchedReportId?.toString() === report._id.toString()) {
      counterpart.status = 'resolved';
      counterpart.resolvedAt = resolvedAt;
      resolvedReports.push(counterpart);
    }
  }
  await Promise.all(resolvedReports.map((item) => item.save()));

  const resolutionMessage = resolvedReports.length > 1
    ? 'The matched item was marked as recovered.'
    : 'Your report was marked as resolved.';
  await Notification.create(resolvedReports.map((item) => ({
    userId: item.userId,
    reportId: item._id,
    message: resolutionMessage,
    type: 'status_update',
  })));

  res.json({ report });
});

export const getMatches = catchAsync(async (req, res, next) => {
  const report = await Report.findById(req.params.id);
  if (!report) return next(new AppError(404, 'Report not found'));
  if (report.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError(403, 'You can only view matches for your own reports'));
  }
  if (report.status !== 'open') return next(new AppError(409, 'Only open reports can be matched'));
  const matches = await findMatchesForReport(report);
  res.json({ matches });
});
