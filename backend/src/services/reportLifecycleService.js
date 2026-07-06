import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import ChatMessage from '../models/ChatMessage.js';
import { deleteFromCloudinary } from './cloudinaryService.js';

export const deleteReportAndCleanup = async (report) => {
  if (report.matchedReportId) {
    const counterpart = await Report.findById(report.matchedReportId);
    if (counterpart && counterpart.matchedReportId?.toString() === report._id.toString()) {
      counterpart.matchedReportId = null;
      if (counterpart.status === 'matched') counterpart.status = 'open';
      await counterpart.save();
      await Notification.deleteMany({ reportId: counterpart._id, type: 'match' });
    }
  }

  try {
    await deleteFromCloudinary(report.cloudinaryPublicId);
  } catch (error) {
    console.warn('Cloudinary cleanup failed while deleting report', error.message);
  }
  await Promise.all([
    Notification.deleteMany({ reportId: report._id }),
    ChatMessage.deleteMany({ reportIds: report._id }),
  ]);
  await Report.findByIdAndDelete(report._id);
};
