import dotenv from 'dotenv';
import dns from 'node:dns';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Report from './models/Report.js';
import Notification from './models/Notification.js';
import ChatMessage from './models/ChatMessage.js';
import { claimMatch, findMatchesForReport, isValidMatchPair } from './services/matchService.js';

dotenv.config();
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(',').map((server) => server.trim()).filter(Boolean));
}

const decodeLegacyHtml = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
};

const repairText = async () => {
  const reports = await Report.find();
  let repaired = 0;
  for (const report of reports) {
    const fields = ['title', 'description', 'location'];
    let changed = false;
    for (const field of fields) {
      const decoded = decodeLegacyHtml(report[field]);
      if (decoded !== report[field]) {
        report[field] = decoded;
        changed = true;
      }
    }
    if (changed) {
      await report.save();
      repaired += 1;
    }
  }
  return repaired;
};

const clearInvalidPair = async (report, counterpart) => {
  const reportIds = [report._id];
  report.matchedReportId = null;
  if (report.status === 'matched') report.status = 'open';

  if (counterpart) {
    reportIds.push(counterpart._id);
    counterpart.matchedReportId = null;
    if (counterpart.status === 'matched') counterpart.status = 'open';
    await Promise.all([report.save(), counterpart.save()]);
  } else {
    await report.save();
  }

  await Promise.all([
    Notification.deleteMany({ type: 'match', reportId: { $in: reportIds } }),
    ChatMessage.deleteMany({ reportIds: { $in: reportIds } }),
  ]);
};

const rematchOpenReport = async (report) => {
  if (report.status !== 'open' || report.matchedReportId) return false;
  const matches = await findMatchesForReport(report);
  for (const match of matches) {
    if (await claimMatch(report, match.report)) return true;
  }
  return false;
};

const repairMatches = async () => {
  const linkedReports = await Report.find({ matchedReportId: { $ne: null } });
  const processed = new Set();
  let cleared = 0;
  let rematched = 0;

  for (const report of linkedReports) {
    if (processed.has(report._id.toString())) continue;
    const counterpart = await Report.findById(report.matchedReportId);
    processed.add(report._id.toString());
    if (counterpart) processed.add(counterpart._id.toString());

    const reciprocal = counterpart?.matchedReportId?.toString() === report._id.toString();
    if (reciprocal && isValidMatchPair(report, counterpart)) continue;

    await clearInvalidPair(report, counterpart);
    cleared += 1;

    for (const candidate of [report, counterpart].filter(Boolean)) {
      if (await rematchOpenReport(candidate)) {
        rematched += 1;
        break;
      }
    }
  }

  const orphanedMatched = await Report.find({ status: 'matched', matchedReportId: null });
  if (orphanedMatched.length) {
    await Report.updateMany(
      { _id: { $in: orphanedMatched.map((report) => report._id) } },
      { status: 'open' },
    );
  }

  return { cleared, rematched, orphaned: orphanedMatched.length };
};

const deduplicateNotifications = async () => {
  const notifications = await Notification.find({ type: 'status_update' }).sort({ createdAt: -1 });
  const seen = new Set();
  const duplicateIds = [];
  for (const notification of notifications) {
    const key = `${notification.userId}:${notification.reportId}:${notification.message}`;
    if (seen.has(key)) duplicateIds.push(notification._id);
    else seen.add(key);
  }
  if (duplicateIds.length) await Notification.deleteMany({ _id: { $in: duplicateIds } });
  return duplicateIds.length;
};

const repairLogicalData = async () => {
  await connectDB();
  const repairedText = await repairText();
  const matchResult = await repairMatches();
  const removedNotifications = await deduplicateNotifications();
  console.log({ repairedText, ...matchResult, removedNotifications });
  await mongoose.disconnect();
};

repairLogicalData().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
