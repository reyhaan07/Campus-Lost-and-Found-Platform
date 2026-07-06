import mongoose from 'mongoose';

const submissionLockSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 30 },
});

const SubmissionLock = mongoose.model('SubmissionLock', submissionLockSchema);
export default SubmissionLock;
