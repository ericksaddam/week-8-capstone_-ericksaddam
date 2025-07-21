import mongoose from 'mongoose';

// Task Dependency Schema
const taskDependencySchema = new mongoose.Schema({
  dependentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  dependsOnTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  type: {
    type: String,
    enum: ['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish'],
    default: 'finish-to-start'
  },
  lag: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Task Recurrence Schema
const taskRecurrenceSchema = new mongoose.Schema({
  pattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
    required: true
  },
  interval: {
    type: Number,
    required: true,
    min: 1
  },
  daysOfWeek: [Number], // 0-6 for Sunday-Saturday
  dayOfMonth: Number, // 1-31
  endDate: Date,
  maxOccurrences: Number
});

// Task Label Schema
const taskLabelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    match: /^#[0-9A-F]{6}$/i
  },
  description: String
});

// Checklist Item Schema
const checklistItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: Date
}, {
  timestamps: true
});

// Comment Schema
const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  edited: {
    type: Boolean,
    default: false
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
  reactions: [{
    emoji: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Automation Rule Schema
const automationRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  trigger: {
    type: {
      type: String,
      enum: ['status_change', 'due_date', 'assignment', 'time_based', 'progress_update'],
      required: true
    },
    value: mongoose.Schema.Types.Mixed
  },
  conditions: [{
    field: String,
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains']
    },
    value: mongoose.Schema.Types.Mixed
  }],
  actions: [{
    type: {
      type: String,
      enum: ['send_notification', 'update_status', 'assign_user', 'create_task', 'send_email']
    },
    parameters: mongoose.Schema.Types.Mixed
  }],
  enabled: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Enhanced Task Schema
const enhancedTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  type: {
    type: String,
    enum: ['personal', 'club'],
    required: true
  },
  
  // Hierarchy relationships
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  },
  objective: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Objective'
  },
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  subtasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  
  // Status and Priority
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'completed', 'cancelled', 'blocked'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Assignment and Ownership
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club'
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Dates and Time
  startDate: Date,
  dueDate: Date,
  completedAt: Date,
  estimatedHours: Number,
  actualHours: Number,
  
  // Dependencies and Blocking
  dependencies: [taskDependencySchema],
  blockedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  blocking: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  
  // Recurrence
  recurrence: taskRecurrenceSchema,
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [String],
  labels: [taskLabelSchema],
  
  // Content
  comments: [commentSchema],
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
  checklist: [checklistItemSchema],
  
  // Metrics
  storyPoints: Number,
  complexity: {
    type: String,
    enum: ['simple', 'medium', 'complex'],
    default: 'medium'
  },
  
  // Automation
  automationRules: [automationRuleSchema],
  
  // Custom fields support
  customFields: [{
    name: String,
    value: mongoose.Schema.Types.Mixed,
    type: String
  }],
  
  // Time tracking
  timeEntries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    description: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
enhancedTaskSchema.index({ club: 1, status: 1 });
enhancedTaskSchema.index({ assignedTo: 1, status: 1 });
enhancedTaskSchema.index({ owner: 1, status: 1 });
enhancedTaskSchema.index({ dueDate: 1, status: 1 });
enhancedTaskSchema.index({ goal: 1, status: 1 });
enhancedTaskSchema.index({ objective: 1, status: 1 });
enhancedTaskSchema.index({ parentTask: 1 });
enhancedTaskSchema.index({ createdAt: -1 });
enhancedTaskSchema.index({ priority: 1, status: 1 });

// Virtual for checking if task is overdue
enhancedTaskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'completed';
});

// Virtual for days remaining
enhancedTaskSchema.virtual('daysRemaining').get(function() {
  if (!this.dueDate || this.status === 'completed') return null;
  const today = new Date();
  const diffTime = this.dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total time spent
enhancedTaskSchema.virtual('totalTimeSpent').get(function() {
  if (!this.timeEntries || this.timeEntries.length === 0) return 0;
  return this.timeEntries.reduce((total, entry) => total + (entry.duration || 0), 0);
});

// Virtual for checklist completion percentage
enhancedTaskSchema.virtual('checklistProgress').get(function() {
  if (!this.checklist || this.checklist.length === 0) return 100;
  const completed = this.checklist.filter(item => item.completed).length;
  return Math.round((completed / this.checklist.length) * 100);
});

// Pre-save middleware
enhancedTaskSchema.pre('save', function(next) {
  // Auto-complete if progress reaches 100%
  if (this.isModified('progress') && this.progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  // Update actual hours from time entries
  if (this.timeEntries && this.timeEntries.length > 0) {
    const totalMinutes = this.timeEntries.reduce((total, entry) => total + (entry.duration || 0), 0);
    this.actualHours = totalMinutes / 60;
  }
  
  next();
});

// Method to add time entry
enhancedTaskSchema.methods.addTimeEntry = function(userId, startTime, endTime, description) {
  const duration = Math.round((endTime - startTime) / (1000 * 60)); // in minutes
  
  this.timeEntries.push({
    user: userId,
    startTime,
    endTime,
    duration,
    description
  });
  
  return this.save();
};

// Method to update checklist item
enhancedTaskSchema.methods.updateChecklistItem = function(itemId, updates) {
  const item = this.checklist.id(itemId);
  if (item) {
    Object.assign(item, updates);
    
    // Update task progress based on checklist completion
    const checklistProgress = this.checklistProgress;
    if (checklistProgress > this.progress) {
      this.progress = checklistProgress;
    }
    
    return this.save();
  }
  throw new Error('Checklist item not found');
};

// Method to add comment
enhancedTaskSchema.methods.addComment = function(authorId, content, mentions = [], attachments = []) {
  this.comments.push({
    content,
    author: authorId,
    mentions,
    attachments
  });
  
  return this.save();
};

// Method to check dependencies
enhancedTaskSchema.methods.canStart = function() {
  if (!this.dependencies || this.dependencies.length === 0) return true;
  
  // Check if all dependencies are satisfied
  return this.dependencies.every(dep => {
    // This would need to be populated or queried separately
    // For now, return true
    return true;
  });
};

// Static method to get tasks with analytics
enhancedTaskSchema.statics.getTasksWithAnalytics = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: 'assignedUsers'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerDetails'
      }
    },
    {
      $addFields: {
        isOverdue: {
          $and: [
            { $ne: ['$status', 'completed'] },
            { $lt: ['$dueDate', new Date()] }
          ]
        },
        daysRemaining: {
          $cond: {
            if: { $eq: ['$status', 'completed'] },
            then: 0,
            else: {
              $ceil: {
                $divide: [
                  { $subtract: ['$dueDate', new Date()] },
                  1000 * 60 * 60 * 24
                ]
              }
            }
          }
        },
        checklistProgress: {
          $cond: {
            if: { $eq: [{ $size: '$checklist' }, 0] },
            then: 100,
            else: {
              $multiply: [
                {
                  $divide: [
                    { $size: { $filter: { input: '$checklist', cond: { $eq: ['$$this.completed', true] } } } },
                    { $size: '$checklist' }
                  ]
                },
                100
              ]
            }
          }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get overdue tasks
enhancedTaskSchema.statics.getOverdueTasks = function(clubId = null) {
  const match = {
    dueDate: { $lt: new Date() },
    status: { $ne: 'completed' }
  };
  
  if (clubId) {
    match.club = mongoose.Types.ObjectId(clubId);
  }
  
  return this.find(match)
    .populate('assignedTo', 'name email')
    .populate('owner', 'name email')
    .populate('club', 'name')
    .sort({ dueDate: 1 });
};

const EnhancedTask = mongoose.model('EnhancedTask', enhancedTaskSchema);

export default EnhancedTask;
