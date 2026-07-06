import User from '../models/User.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import escapeRegex from '../utils/escapeRegex.js';
import { deleteReportAndCleanup } from '../services/reportLifecycleService.js';

const parsePagination = (page, limit) => ({
  page: Math.max(1, Number.parseInt(page, 10) || 1),
  limit: Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10)),
});

export const getUsers = catchAsync(async (req, res) => {
  const { search = '' } = req.query;
  const pagination = parsePagination(req.query.page, req.query.limit);
  const filter = search
    ? { name: { $regex: escapeRegex(search), $options: 'i' } }
    : {};

  const users = await User.find(filter).select('-password').skip((pagination.page - 1) * pagination.limit).limit(pagination.limit);
  const total = await User.countDocuments(filter);
  res.json({ users, total });
});

export const deactivateUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError(404, 'User not found'));
  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError(400, 'You cannot deactivate your own admin account'));
  }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ user: { ...user.toObject(), password: undefined } });
});

export const getAllReports = catchAsync(async (req, res) => {
  const { status, type } = req.query;
  const pagination = parsePagination(req.query.page, req.query.limit);
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;

  const reports = await Report.find(filter).sort({ createdAt: -1 }).skip((pagination.page - 1) * pagination.limit).limit(pagination.limit);
  res.json({ reports });
});

export const deleteReportAdmin = catchAsync(async (req, res, next) => {
  const report = await Report.findById(req.params.id);
  if (!report) return next(new AppError(404, 'Report not found'));
  await deleteReportAndCleanup(report);
  res.status(204).send();
});

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const getStats = catchAsync(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const openReports = await Report.countDocuments({ status: 'open' });
  const matchedReports = await Report.countDocuments({ status: 'matched' });
  const resolvedReports = await Report.countDocuments({ status: 'resolved' });
  const categoryBreakdown = await Report.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const now = new Date();
  const rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  const monthlyAggregation = await Report.aggregate([
    { $match: { createdAt: { $gte: rangeStart } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
  ]);
  const monthlyCounts = new Map(monthlyAggregation.map((entry) => [`${entry._id.year}-${entry._id.month}`, entry.count]));
  const reportsPerMonth = Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date(Date.UTC(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth() + index, 1));
    const key = `${monthDate.getUTCFullYear()}-${monthDate.getUTCMonth() + 1}`;
    return { label: `${MONTH_LABELS[monthDate.getUTCMonth()]} ${monthDate.getUTCFullYear()}`, count: monthlyCounts.get(key) || 0 };
  });

  const totalReports = openReports + matchedReports + resolvedReports;
  const matchSuccessRate = totalReports ? Math.round(((matchedReports + resolvedReports) / totalReports) * 100) : 0;
  const recoveryRate = totalReports ? Math.round((resolvedReports / totalReports) * 100) : 0;

  res.json({
    totalUsers,
    openReports,
    matchedReports,
    resolvedReports,
    categoryBreakdown,
    reportsPerMonth,
    matchSuccessRate,
    recoveryRate,
  });
});
