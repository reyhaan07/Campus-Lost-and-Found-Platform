import Notification from '../models/Notification.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

export const getNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ notifications });
});

export const markNotificationRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return next(new AppError(404, 'Notification not found'));
  if (notification.userId.toString() !== req.user._id.toString()) return next(new AppError(403, 'Forbidden'));

  notification.isRead = true;
  await notification.save();
  res.json({ notification });
});
