import Report from '../models/Report.js';
import ChatMessage from '../models/ChatMessage.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

const getChatContext = async (reportId, userId) => {
  const report = await Report.findById(reportId).populate('userId', 'name');
  if (!report) throw new AppError(404, 'Report not found');
  if (!report.matchedReportId) throw new AppError(400, 'This report has not been matched yet');

  const matchedReport = await Report.findById(report.matchedReportId).populate('userId', 'name');
  if (!matchedReport) throw new AppError(404, 'Matched report not found');

  const participants = [report.userId, matchedReport.userId];
  const participantIds = participants.map((participant) => participant._id.toString());
  if (!participantIds.includes(userId.toString())) {
    throw new AppError(403, 'Only the matched report owners can access this chat');
  }

  const reportIds = [report._id, matchedReport._id];
  const pairKey = reportIds.map((id) => id.toString()).sort().join(':');
  const otherUser = participants.find((participant) => participant._id.toString() !== userId.toString());

  return { report, matchedReport, reportIds, participantIds, pairKey, otherUser };
};

export const getMessages = catchAsync(async (req, res) => {
  const context = await getChatContext(req.params.reportId, req.user._id);
  const messages = await ChatMessage.find({ pairKey: context.pairKey })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('senderId', 'name')
    .lean();
  messages.reverse();

  res.json({
    messages,
    otherUser: context.otherUser,
    report: { _id: context.report._id, title: context.report.title },
  });
});

export const sendMessage = catchAsync(async (req, res, next) => {
  const messageText = String(req.body.message || '').trim();
  if (!messageText) return next(new AppError(400, 'Message cannot be empty'));
  if (messageText.length > 1000) return next(new AppError(400, 'Message cannot exceed 1000 characters'));

  const context = await getChatContext(req.params.reportId, req.user._id);
  const message = await ChatMessage.create({
    pairKey: context.pairKey,
    reportIds: context.reportIds,
    participants: context.participantIds,
    senderId: req.user._id,
    message: messageText,
  });

  await message.populate('senderId', 'name');
  res.status(201).json({ message });
});
