import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema({
  clubLogs: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    action: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    details: { type: Object },
    createdAt: { type: Date, default: Date.now }
  }],
  communities: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvalRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalActionedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isArchived: { type: Boolean, default: false },
    members: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['member', 'admin'], default: 'member' },
      joinedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    chat: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      message: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
    polls: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      question: { type: String, required: true },
      options: [{ text: String, votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }],
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    }]
  }],
  knowledgeBase: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [String],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  category: { 
    type: String,
    trim: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['member', 'admin', 'owner'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  joinRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  topics: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    replies: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }]
  }],
  goals: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    description: { type: String },
    targetDate: { type: Date },
    status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  tasks: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task' 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Utility method for logging club actions
clubSchema.methods.logAction = async function(action, user, details = {}) {
  this.clubLogs.push({ action, user, details });
  await this.save();
};

// Indexes for better query performance
clubSchema.index({ status: 1 });
clubSchema.index({ createdBy: 1 });
clubSchema.index({ 'members.user': 1 });
clubSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Club', clubSchema);
