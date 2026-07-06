import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['lost', 'found'], required: true },
  title: { type: String, required: true, trim: true },
  category: { type: String, enum: ['Electronics', 'Documents', 'Accessories', 'Clothing', 'Others'], required: true },
  description: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  imageUrl: { type: String, required: true },
  cloudinaryPublicId: { type: String, required: true },
  embedding: { type: [Number], default: [] },
  status: { type: String, enum: ['open', 'matched', 'resolved'], default: 'open' },
  matchedReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', default: null },
  resolvedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

reportSchema.index({ userId: 1 });
reportSchema.index({ type: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ resolvedAt: -1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
