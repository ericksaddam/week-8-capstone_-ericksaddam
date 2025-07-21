import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  format: {
    type: String,
    enum: ['SMART', 'OKR'],
    required: true,
    default: 'SMART'
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'on-hold', 'completed', 'cancelled'],
    default: 'draft'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // SMART criteria
  specific: String,
  measurable: String,
  achievable: String,
  relevant: String,
  timeBound: String,
  
  // OKR format
  keyResults: [String],
  
  // Dates
  startDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  completedAt: Date,
  
  // Relationships
  objectives: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Objective'
  }],
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [String],
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
  
  // Metrics
  estimatedHours: Number,
  actualHours: Number,
  budget: Number,
  actualCost: Number,
  
  // Automation and Workflow
  automationRules: [{
    name: String,
    trigger: {
      type: String,
      value: mongoose.Schema.Types.Mixed
    },
    conditions: [{
      field: String,
      operator: String,
      value: mongoose.Schema.Types.Mixed
    }],
    actions: [{
      type: String,
      parameters: mongoose.Schema.Types.Mixed
    }],
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
goalSchema.index({ club: 1, status: 1 });
goalSchema.index({ owner: 1, status: 1 });
goalSchema.index({ dueDate: 1, status: 1 });
goalSchema.index({ createdAt: -1 });
goalSchema.index({ priority: 1, status: 1 });

// Virtual for calculating progress based on objectives and tasks
goalSchema.virtual('calculatedProgress').get(function() {
  if (this.objectives && this.objectives.length > 0) {
    // Calculate based on objectives
    const totalObjectives = this.objectives.length;
    const completedObjectives = this.objectives.filter(obj => obj.status === 'completed').length;
    return Math.round((completedObjectives / totalObjectives) * 100);
  } else if (this.tasks && this.tasks.length > 0) {
    // Calculate based on tasks
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / totalTasks) * 100);
  }
  return this.progress || 0;
});

// Virtual for checking if goal is overdue
goalSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'completed';
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'completed') return 0;
  const today = new Date();
  const diffTime = this.dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update progress
goalSchema.pre('save', function(next) {
  if (this.isModified('progress') && this.progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  next();
});

// Static method to get goals with analytics
goalSchema.statics.getGoalsWithAnalytics = function(clubId, filters = {}) {
  const pipeline = [
    { $match: { club: mongoose.Types.ObjectId(clubId), ...filters } },
    {
      $lookup: {
        from: 'objectives',
        localField: '_id',
        foreignField: 'goal',
        as: 'objectiveDetails'
      }
    },
    {
      $lookup: {
        from: 'tasks',
        localField: '_id',
        foreignField: 'goal',
        as: 'taskDetails'
      }
    },
    {
      $addFields: {
        objectiveCount: { $size: '$objectiveDetails' },
        taskCount: { $size: '$taskDetails' },
        completedObjectives: {
          $size: {
            $filter: {
              input: '$objectiveDetails',
              cond: { $eq: ['$$this.status', 'completed'] }
            }
          }
        },
        completedTasks: {
          $size: {
            $filter: {
              input: '$taskDetails',
              cond: { $eq: ['$$this.status', 'completed'] }
            }
          }
        }
      }
    },
    {
      $addFields: {
        calculatedProgress: {
          $cond: {
            if: { $gt: ['$objectiveCount', 0] },
            then: { $multiply: [{ $divide: ['$completedObjectives', '$objectiveCount'] }, 100] },
            else: {
              $cond: {
                if: { $gt: ['$taskCount', 0] },
                then: { $multiply: [{ $divide: ['$completedTasks', '$taskCount'] }, 100] },
                else: '$progress'
              }
            }
          }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
