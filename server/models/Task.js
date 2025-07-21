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
    enum: ['pending', 'in-progress', 'completed', 'archived', 'cancelled', 'on-hold'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  estimatedHours: {
    type: Number,
    min: 0,
    default: 0
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0
  },
  dueDate: Date,
  startDate: Date,
  completedDate: Date,
  tags: [{
    type: String,
    trim: true
  }],
  checklist: [{
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  comments: [{
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    author: {
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
  }],
  timeLog: [{
    id: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    hours: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    size: Number,
    type: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
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

// Virtual fields
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && new Date() > this.dueDate && this.status !== 'completed';
});

taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

taskSchema.virtual('checklistProgress').get(function() {
  if (!this.checklist || this.checklist.length === 0) return 0;
  const completed = this.checklist.filter(item => item.completed).length;
  return Math.round((completed / this.checklist.length) * 100);
});

taskSchema.virtual('totalTimeLogged').get(function() {
  if (!this.timeLog || this.timeLog.length === 0) return 0;
  return this.timeLog.reduce((total, log) => total + log.hours, 0);
});

// Instance methods
taskSchema.methods.updateProgress = function() {
  if (this.status === 'completed') {
    this.progress = 100;
    this.completedDate = new Date();
  } else if (this.status === 'in-progress' && this.progress === 0) {
    this.progress = 10; // Set minimum progress when started
    this.startDate = this.startDate || new Date();
  } else if (this.status === 'pending') {
    this.progress = 0;
    this.startDate = null;
    this.completedDate = null;
  }
  
  // Auto-calculate progress based on checklist if available
  if (this.checklist && this.checklist.length > 0) {
    const checklistProgress = this.checklistProgress;
    if (checklistProgress > this.progress) {
      this.progress = checklistProgress;
    }
  }
  
  return this;
};

taskSchema.methods.addComment = function(text, authorId) {
  const comment = {
    id: new mongoose.Types.ObjectId().toString(),
    text,
    author: authorId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  this.comments.push(comment);
  return comment;
};

taskSchema.methods.addTimeLog = function(userId, hours, description, date) {
  const timeEntry = {
    id: new mongoose.Types.ObjectId().toString(),
    user: userId,
    hours,
    description: description || '',
    date: date || new Date(),
    createdAt: new Date()
  };
  this.timeLog.push(timeEntry);
  this.actualHours += hours;
  return timeEntry;
};

taskSchema.methods.toggleChecklistItem = function(itemId, userId) {
  const item = this.checklist.id(itemId);
  if (item) {
    item.completed = !item.completed;
    if (item.completed) {
      item.completedAt = new Date();
      item.completedBy = userId;
    } else {
      item.completedAt = null;
      item.completedBy = null;
    }
    this.updateProgress();
    return item;
  }
  return null;
};

// Indexes for better query performance
taskSchema.index({ createdBy: 1 });
taskSchema.index({ club: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ type: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ tags: 1 });

// Update the updatedAt field and auto-update progress before saving
taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.updateProgress();
  next();
});

export default mongoose.model('Task', taskSchema);
