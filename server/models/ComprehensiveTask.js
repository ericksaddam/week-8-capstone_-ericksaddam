import mongoose from 'mongoose';

// Subtask schema
const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  status: {
    type: String,
    enum: ['not_started', 'done'],
    default: 'not_started'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
}, {
  timestamps: true
});

// Checklist item schema
const checklistItemSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: Date
}, {
  timestamps: true
});

// Comment schema
const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }]
}, {
  timestamps: true
});

// Recurrence rule schema
const recurrenceRuleSchema = new mongoose.Schema({
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  interval: {
    type: Number,
    default: 1,
    min: 1
  },
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6 // 0 = Sunday, 6 = Saturday
  }],
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31
  },
  endDate: Date,
  occurrences: Number
});

// Main task schema
const taskSchema = new mongoose.Schema({
  // Required Fields
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  objective: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Objective',
    required: true
  },
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal' // Optional for faster lookup
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'blocked', 'completed'],
    required: true,
    default: 'not_started'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    required: true,
    default: 'medium'
  },
  dueDate: {
    type: Date,
    required: true
  },
  assignees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'contributor', 'reviewer'],
      default: 'contributor'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Optional Fields
  description: {
    type: String,
    maxlength: 2000
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  estimatedTime: {
    hours: {
      type: Number,
      min: 0
    },
    minutes: {
      type: Number,
      min: 0,
      max: 59
    }
  },
  actualTime: {
    hours: {
      type: Number,
      min: 0,
      default: 0
    },
    minutes: {
      type: Number,
      min: 0,
      max: 59,
      default: 0
    }
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  labels: [{
    name: String,
    color: String
  }],
  
  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Task relationships
  dependencies: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    type: {
      type: String,
      enum: ['blocks', 'blocked_by', 'related'],
      default: 'blocks'
    }
  }],
  
  // Recurrence
  recurrenceRule: recurrenceRuleSchema,
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task' // For recurring tasks
  },
  
  // Subtasks and checklist
  subtasks: [subtaskSchema],
  checklist: [checklistItemSchema],
  
  // Communication
  comments: [commentSchema],
  
  // Completion tracking
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Blocking information
  blockedReason: String,
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  blockedAt: Date,
  
  // Custom fields
  customFields: [{
    name: String,
    value: mongoose.Schema.Types.Mixed,
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'boolean', 'select']
    }
  }],
  
  // Visibility and permissions
  visibility: {
    type: String,
    enum: ['private', 'team', 'club', 'public'],
    default: 'club'
  },
  
  // Automation
  automationRules: [{
    trigger: String,
    action: String,
    parameters: mongoose.Schema.Types.Mixed,
    enabled: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
taskSchema.index({ objective: 1, status: 1 });
taskSchema.index({ goal: 1, status: 1 });
taskSchema.index({ club: 1, status: 1 });
taskSchema.index({ 'assignees.user': 1, status: 1 });
taskSchema.index({ createdBy: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ priority: 1, status: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ tags: 1 });

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'completed';
});

// Virtual for days remaining
taskSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'completed') return 0;
  const today = new Date();
  const diffTime = this.dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for completion percentage based on checklist
taskSchema.virtual('checklistProgress').get(function() {
  if (!this.checklist || this.checklist.length === 0) return 0;
  const completedItems = this.checklist.filter(item => item.completed).length;
  return Math.round((completedItems / this.checklist.length) * 100);
});

// Virtual for subtask progress
taskSchema.virtual('subtaskProgress').get(function() {
  if (!this.subtasks || this.subtasks.length === 0) return 0;
  const completedSubtasks = this.subtasks.filter(subtask => subtask.status === 'done').length;
  return Math.round((completedSubtasks / this.subtasks.length) * 100);
});

// Virtual for overall progress calculation
taskSchema.virtual('calculatedProgress').get(function() {
  if (this.checklist && this.checklist.length > 0) {
    return this.checklistProgress;
  } else if (this.subtasks && this.subtasks.length > 0) {
    return this.subtaskProgress;
  }
  return this.progress || 0;
});

// Virtual for primary assignee
taskSchema.virtual('primaryAssignee').get(function() {
  if (this.assignees && this.assignees.length > 0) {
    const owner = this.assignees.find(a => a.role === 'owner');
    return owner ? owner.user : this.assignees[0].user;
  }
  return null;
});

// Pre-save middleware
taskSchema.pre('save', function(next) {
  // Auto-complete if progress reaches 100%
  if (this.isModified('progress') && this.progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
    this.completedBy = this.modifiedBy || this.createdBy;
  }
  
  // Update progress based on checklist/subtasks
  if (this.isModified('checklist') || this.isModified('subtasks')) {
    this.progress = this.calculatedProgress;
  }
  
  // Set blocked status
  if (this.isModified('blockedReason') && this.blockedReason && this.status !== 'blocked') {
    this.status = 'blocked';
    this.blockedAt = new Date();
  }
  
  next();
});

// Method to add comment
taskSchema.methods.addComment = function(userId, content, mentions = [], attachments = []) {
  this.comments.push({
    user: userId,
    content,
    mentions,
    attachments
  });
  return this.save();
};

// Method to update checklist item
taskSchema.methods.updateChecklistItem = function(itemId, completed, userId) {
  const item = this.checklist.id(itemId);
  if (item) {
    item.completed = completed;
    if (completed) {
      item.completedBy = userId;
      item.completedAt = new Date();
    } else {
      item.completedBy = undefined;
      item.completedAt = undefined;
    }
    return this.save();
  }
  throw new Error('Checklist item not found');
};

// Method to add subtask
taskSchema.methods.addSubtask = function(title, assignee = null) {
  this.subtasks.push({
    title,
    assignee
  });
  return this.save();
};

// Method to assign user
taskSchema.methods.assignUser = function(userId, role = 'contributor', assignedBy = null) {
  // Check if user is already assigned
  const existingAssignment = this.assignees.find(a => a.user.toString() === userId.toString());
  if (existingAssignment) {
    existingAssignment.role = role;
    existingAssignment.assignedBy = assignedBy;
    existingAssignment.assignedAt = new Date();
  } else {
    this.assignees.push({
      user: userId,
      role,
      assignedBy,
      assignedAt: new Date()
    });
  }
  return this.save();
};

// Static method to get tasks with analytics
taskSchema.statics.getTasksWithAnalytics = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $lookup: {
        from: 'users',
        localField: 'assignees.user',
        foreignField: '_id',
        as: 'assigneeDetails'
      }
    },
    {
      $lookup: {
        from: 'objectives',
        localField: 'objective',
        foreignField: '_id',
        as: 'objectiveDetails'
      }
    },
    {
      $lookup: {
        from: 'goals',
        localField: 'goal',
        foreignField: '_id',
        as: 'goalDetails'
      }
    },
    {
      $addFields: {
        assigneeCount: { $size: '$assignees' },
        commentCount: { $size: '$comments' },
        attachmentCount: { $size: '$attachments' },
        checklistCount: { $size: '$checklist' },
        completedChecklistItems: {
          $size: {
            $filter: {
              input: '$checklist',
              cond: { $eq: ['$$this.completed', true] }
            }
          }
        },
        subtaskCount: { $size: '$subtasks' },
        completedSubtasks: {
          $size: {
            $filter: {
              input: '$subtasks',
              cond: { $eq: ['$$this.status', 'done'] }
            }
          }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

const Task = mongoose.model('Task', taskSchema);

export default Task;
