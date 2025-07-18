import mongoose from 'mongoose';

const systemActivityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetType: { type: String, required: true }, // e.g., 'User', 'Club', 'Community', 'Task'
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

const SystemActivityLog = mongoose.model('SystemActivityLog', systemActivityLogSchema);

export default SystemActivityLog;
