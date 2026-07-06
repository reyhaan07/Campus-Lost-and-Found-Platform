import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import { cosineSimilarity, getTextSimilarity, getDateProximity, scoreMatch } from './aiService.js';

const MATCH_THRESHOLD = 0.6;

export const isValidMatchPair = (left, right) => {
  if (!left || !right || left.type === right.type) return false;
  if (left.userId.toString() === right.userId.toString()) return false;
  if (left.category !== right.category) return false;

  const lostReport = left.type === 'lost' ? left : right;
  const foundReport = left.type === 'found' ? left : right;
  return new Date(foundReport.date).getTime() >= new Date(lostReport.date).getTime();
};

export const findMatchesForReport = async (report) => {
  const oppositeType = report.type === 'lost' ? 'found' : 'lost';
  const candidates = await Report.find({
    type: oppositeType,
    status: 'open',
    userId: { $ne: report.userId },
    category: report.category,
    date: report.type === 'lost' ? { $gte: report.date } : { $lte: report.date },
    _id: { $ne: report._id },
  }).lean();

  const matches = [];
  for (const candidate of candidates) {
    const hasEmbeddings = Boolean(report.embedding?.length && candidate.embedding?.length);
    const imageScore = hasEmbeddings ? cosineSimilarity(report.embedding, candidate.embedding) : null;
    const titleScore = getTextSimilarity(report.title, candidate.title);
    const descriptionScore = getTextSimilarity(report.description, candidate.description);
    const locationScore = getTextSimilarity(report.location, candidate.location);
    const dateProximity = getDateProximity(report.date, candidate.date);
    const finalScore = scoreMatch({ imageScore, titleScore, descriptionScore, locationScore, dateProximity });

    if (finalScore > MATCH_THRESHOLD) {
      matches.push({ report: candidate, score: finalScore });
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, 5);
};

export const claimMatch = async (report, matchedReport) => {
  const candidate = await Report.findOneAndUpdate(
    { _id: matchedReport._id, status: 'open', matchedReportId: null },
    { status: 'matched', matchedReportId: report._id },
    { new: true },
  );
  if (!candidate) return null;

  const currentReport = await Report.findOneAndUpdate(
    { _id: report._id, status: 'open', matchedReportId: null },
    { status: 'matched', matchedReportId: candidate._id },
    { new: true },
  );

  if (!currentReport) {
    await Report.findOneAndUpdate(
      { _id: candidate._id, matchedReportId: report._id },
      { status: 'open', matchedReportId: null },
    );
    return null;
  }

  try {
    await createMatchNotifications(currentReport, candidate);
  } catch (error) {
    console.warn('Match claimed but notification creation failed', error.message);
  }
  return { report: currentReport, matchedReport: candidate };
};

export const createMatchNotifications = async (report, matchedReport) => {
  await Notification.create([
    {
      userId: report.userId,
      reportId: report._id,
      message: `A potential match was found for your ${report.type} report.`,
      type: 'match',
    },
    {
      userId: matchedReport.userId,
      reportId: matchedReport._id,
      message: `A potential match was found for your ${matchedReport.type} report.`,
      type: 'match',
    },
  ]);
};
