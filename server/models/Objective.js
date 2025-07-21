import mongoose from 'mongoose';

const keyResultSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  targetValue: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'at-risk'],
    default: 'not-started'
  },
  dueDate: {
    type: Date,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const objectiveSchema = new mongoose.Schema({
  // Required Fields
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
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true
  },
  successCriteria: {
    type: String,
    required: true,
    maxlength: 1000
  },
  metricType: {
    type: String,
    enum: ['percentage', 'count', 'currency', 'time', 'yes_no', 'custom'],
    default: 'percentage'
  },
  startDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    required: true,
    default: 'not_started'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Optional Fields
  parentObjective: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Objective'
  },
  tags: [{
    type: String,
    trim: true
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
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
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
  
  // Key Results (for OKR format)
  keyResults: [keyResultSchema],
  
  // Completion tracking
  completedAt: Date,
  
  // Relationships
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Metrics
  estimatedHours: Number,
  actualHours: Number
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
objectiveSchema.index({ goal: 1, status: 1 });
objectiveSchema.index({ club: 1, status: 1 });
objectiveSchema.index({ owner: 1, status: 1 });
objectiveSchema.index({ dueDate: 1, status: 1 });
objectiveSchema.index({ createdAt: -1 });

// Virtual for calculating progress based on key results
objectiveSchema.virtual('calculatedProgress').get(function() {
  if (this.keyResults && this.keyResults.length > 0) {
    const totalKeyResults = this.keyResults.length;
    const completedKeyResults = this.keyResults.filter(kr => kr.status === 'completed').length;
    return Math.round((completedKeyResults / totalKeyResults) * 100);
  } else if (this.tasks && this.tasks.length > 0) {
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / totalTasks) * 100);
  }
  return this.progress || 0;
});

// Virtual for checking if objective is overdue
objectiveSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'completed';
});

// Virtual for days remaining
objectiveSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'completed') return 0;
  const today = new Date();
  const diffTime = this.dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for key results progress
objectiveSchema.virtual('keyResultsProgress').get(function() {
  if (!this.keyResults || this.keyResults.length === 0) return 0;
  
  const totalProgress = this.keyResults.reduce((sum, kr) => {
    const progress = (kr.currentValue / kr.targetValue) * 100;
    return sum + Math.min(progress, 100);
  }, 0);
  
  return Math.round(totalProgress / this.keyResults.length);
});

// Pre-save middleware to update progress and status
objectiveSchema.pre('save', function(next) {
  // Update progress based on key results if available
  if (this.keyResults && this.keyResults.length > 0) {
    this.progress = this.keyResultsProgress;
  }
  
  // Auto-complete if progress reaches 100%
  if (this.isModified('progress') && this.progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  next();
});

// Method to update key result progress
objectiveSchema.methods.updateKeyResultProgress = function(keyResultId, currentValue) {
  const keyResult = this.keyResults.id(keyResultId);
  if (keyResult) {
    keyResult.currentValue = currentValue;
    
    // Update key result status based on progress
    const progress = (currentValue / keyResult.targetValue) * 100;
    if (progress >= 100) {
      keyResult.status = 'completed';
    } else if (progress > 0) {
      keyResult.status = 'in-progress';
    }
    
    // Check if key result is at risk (due date approaching and low progress)
    const daysUntilDue = Math.ceil((keyResult.dueDate - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 3 && progress < 80) {
      keyResult.status = 'at-risk';
    }
    
    return this.save();
  }
  throw new Error('Key result not found');
};

// Static method to get objectives with analytics
objectiveSchema.statics.getObjectivesWithAnalytics = function(goalId, filters = {}) {
  const pipeline = [
    { $match: { goal: mongoose.Types.ObjectId(goalId), ...filters } },
    {
      $lookup: {
        from: 'tasks',
        localField: '_id',
        foreignField: 'objective',
        as: 'taskDetails'
      }
    },
    {
      $addFields: {
        taskCount: { $size: '$taskDetails' },
        completedTasks: {
          $size: {
            $filter: {
              input: '$taskDetails',
              cond: { $eq: ['$$this.status', 'completed'] }
            }
          }
        },
        keyResultsProgress: {
          $cond: {
            if: { $gt: [{ $size: '$keyResults' }, 0] },
            then: {
              $avg: {
                $map: {
                  input: '$keyResults',
                  as: 'kr',
                  in: {
                    $min: [
                      { $multiply: [{ $divide: ['$$kr.currentValue', '$$kr.targetValue'] }, 100] },
                      100
                    ]
                  }
                }
              }
            },
            else: 0
          }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

const Objective = mongoose.model('Objective', objectiveSchema);

export default Objective;
