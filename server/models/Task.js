import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['personal', 'club'],
    required: true,
    default: 'personal'
  },
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'archived'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: Date,
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    // Required only if type is 'club'
    required: function() { return this.type === 'club'; }
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ createdBy: 1 });
taskSchema.index({ club: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ type: 1 });
taskSchema.index({ dueDate: 1 });

// Update the updatedAt field before saving
taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Task', taskSchema);
