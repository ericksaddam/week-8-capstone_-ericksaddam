import mongoose from 'mongoose';

// Activity Action Schema
const activityActionSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['create', 'read', 'update', 'delete', 'assign', 'complete', 'comment', 'attach'],
    required: true
  },
  verb: {
    type: String,
    required: true,
    trim: true
  },
  object: {
    type: String,
    required: true,
    trim: true
  }
});

// Activity Change Schema
const activityChangeSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true
  },
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  fieldType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'date', 'array', 'object'],
    required: true
  }
});

// Activity Log Schema
const activityLogSchema = new mongoose.Schema({
  // Core information
  action: {
    type: activityActionSchema,
    required: true
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Context
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club'
  },
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  },
  objective: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Objective'
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnhancedTask'
  },
  
  // Entity details
  entityType: {
    type: String,
    enum: ['club', 'goal', 'objective', 'task', 'user', 'comment', 'attachment'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  entityName: String,
  
  // Change details
  changes: [activityChangeSchema],
  oldValues: mongoose.Schema.Types.Mixed,
  newValues: mongoose.Schema.Types.Mixed,
  
  // Additional context
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  metadata: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  
  // Visibility
  visibility: {
    type: String,
    enum: ['public', 'club', 'private'],
    default: 'club'
  },
  
  // Related entities
  relatedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Additional tracking
  sessionId: String,
  source: {
    type: String,
    enum: ['web', 'mobile', 'api', 'automation'],
    default: 'web'
  },
  
  // Aggregation helpers
  day: String, // YYYY-MM-DD format for daily aggregations
  week: String, // YYYY-WW format for weekly aggregations
  month: String, // YYYY-MM format for monthly aggregations
  
  // Performance tracking
  duration: Number, // Time taken for the action in milliseconds
  
  // Error tracking
  error: {
    message: String,
    stack: String,
    code: String
  }
}, {
  timestamps: false, // We use our own timestamp field
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ actor: 1, timestamp: -1 });
activityLogSchema.index({ club: 1, timestamp: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
activityLogSchema.index({ 'action.category': 1, timestamp: -1 });
activityLogSchema.index({ day: 1 });
activityLogSchema.index({ week: 1 });
activityLogSchema.index({ month: 1 });
activityLogSchema.index({ visibility: 1, club: 1, timestamp: -1 });

// Compound indexes for common queries
activityLogSchema.index({ club: 1, entityType: 1, timestamp: -1 });
activityLogSchema.index({ actor: 1, club: 1, timestamp: -1 });
activityLogSchema.index({ goal: 1, timestamp: -1 });
activityLogSchema.index({ objective: 1, timestamp: -1 });
activityLogSchema.index({ task: 1, timestamp: -1 });

// Virtual for human-readable action
activityLogSchema.virtual('actionText').get(function() {
  return `${this.action.verb} ${this.action.object}`;
});

// Virtual for relative time
activityLogSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Pre-save middleware to set aggregation helpers
activityLogSchema.pre('save', function(next) {
  const date = this.timestamp || new Date();
  
  // Set day, week, month for aggregations
  this.day = date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Calculate week number
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - startOfYear) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  this.week = `${date.getFullYear()}-${weekNumber.toString().padStart(2, '0')}`;
  
  this.month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  
  next();
});

// Static method to log activity
activityLogSchema.statics.logActivity = function(activityData) {
  const {
    action,
    actor,
    entityType,
    entityId,
    entityName,
    description,
    club,
    goal,
    objective,
    task,
    changes,
    oldValues,
    newValues,
    metadata,
    visibility = 'club',
    relatedUsers,
    mentions,
    ipAddress,
    userAgent,
    sessionId,
    source = 'web',
    duration
  } = activityData;
  
  const log = new this({
    action,
    actor,
    entityType,
    entityId,
    entityName,
    description,
    club,
    goal,
    objective,
    task,
    changes,
    oldValues,
    newValues,
    metadata,
    visibility,
    relatedUsers,
    mentions,
    ipAddress,
    userAgent,
    sessionId,
    source,
    duration
  });
  
  return log.save();
};

// Static method to get activity feed
activityLogSchema.statics.getActivityFeed = function(filters = {}, options = {}) {
  const {
    club,
    actor,
    entityType,
    startDate,
    endDate,
    visibility = ['public', 'club'],
    limit = 50,
    skip = 0
  } = filters;
  
  const query = {};
  
  if (club) query.club = club;
  if (actor) query.actor = actor;
  if (entityType) query.entityType = entityType;
  if (visibility) query.visibility = { $in: Array.isArray(visibility) ? visibility : [visibility] };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('actor', 'name email avatar')
    .populate('club', 'name')
    .populate('relatedUsers', 'name email avatar')
    .populate('mentions', 'name email avatar')
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get activity analytics
activityLogSchema.statics.getActivityAnalytics = function(clubId, period = 'week') {
  const groupBy = period === 'day' ? '$day' : period === 'week' ? '$week' : '$month';
  
  const pipeline = [
    {
      $match: {
        club: mongoose.Types.ObjectId(clubId),
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }
    },
    {
      $group: {
        _id: {
          period: groupBy,
          category: '$action.category'
        },
        count: { $sum: 1 },
        uniqueActors: { $addToSet: '$actor' }
      }
    },
    {
      $group: {
        _id: '$_id.period',
        activities: {
          $push: {
            category: '$_id.category',
            count: '$count',
            uniqueActors: { $size: '$uniqueActors' }
          }
        },
        totalActivities: { $sum: '$count' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get user activity summary
activityLogSchema.statics.getUserActivitySummary = function(userId, clubId = null, days = 30) {
  const match = {
    actor: mongoose.Types.ObjectId(userId),
    timestamp: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  };
  
  if (clubId) {
    match.club = mongoose.Types.ObjectId(clubId);
  }
  
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$action.category',
        count: { $sum: 1 },
        entities: { $addToSet: '$entityType' },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to detect suspicious activity
activityLogSchema.statics.detectSuspiciousActivity = function(userId, timeWindow = 60) {
  const since = new Date(Date.now() - timeWindow * 60 * 1000); // timeWindow in minutes
  
  const pipeline = [
    {
      $match: {
        actor: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: since }
      }
    },
    {
      $group: {
        _id: {
          actor: '$actor',
          action: '$action.category'
        },
        count: { $sum: 1 },
        activities: { $push: '$$ROOT' }
      }
    },
    {
      $match: {
        count: { $gte: 10 } // More than 10 actions of same type in time window
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Method to generate notification text
activityLogSchema.methods.getNotificationText = function() {
  const actorName = this.actor?.name || 'Someone';
  const entityName = this.entityName || this.entityType;
  
  switch (this.action.category) {
    case 'create':
      return `${actorName} created ${this.action.object} "${entityName}"`;
    case 'update':
      return `${actorName} updated ${this.action.object} "${entityName}"`;
    case 'delete':
      return `${actorName} deleted ${this.action.object} "${entityName}"`;
    case 'assign':
      return `${actorName} assigned ${this.action.object} "${entityName}"`;
    case 'complete':
      return `${actorName} completed ${this.action.object} "${entityName}"`;
    case 'comment':
      return `${actorName} commented on ${this.action.object} "${entityName}"`;
    case 'attach':
      return `${actorName} added attachment to ${this.action.object} "${entityName}"`;
    default:
      return this.description;
  }
};

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
