import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  pairKey: { type: String, required: true, index: true },
  reportIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true }],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
});

chatMessageSchema.index({ pairKey: 1, createdAt: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export default ChatMessage;
