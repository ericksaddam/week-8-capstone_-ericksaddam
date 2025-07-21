import Goal from '../models/Goal.js';
import Objective from '../models/Objective.js';
import EnhancedTask from '../models/EnhancedTask.js';
import Club from '../models/Club.js';
import ActivityLog from '../models/ActivityLog.js';
import { validationResult } from 'express-validator';

// Helper function to log activity
const logActivity = async (action, actor, entityType, entityId, entityName, description, context = {}) => {
  try {
    await ActivityLog.logActivity({
      action,
      actor,
      entityType,
      entityId,
      entityName,
      description,
      ...context
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// @route   GET /api/clubs/:clubId/goals
// @desc    Get all goals for a club
// @access  Private (Club Member)
export const getClubGoals = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { status, priority, owner, format, page = 1, limit = 20 } = req.query;
    
    // Build filter
    const filter = { club: clubId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (owner) filter.owner = owner;
    if (format) filter.format = format;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get goals with analytics
    const goals = await Goal.getGoalsWithAnalytics(clubId, filter);
    
    // Get total count for pagination
    const total = await Goal.countDocuments(filter);
    
    // Populate references
    const populatedGoals = await Goal.populate(goals, [
      { path: 'owner', select: 'name email avatar' },
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'objectives', select: 'title status progress' },
      { path: 'tasks', select: 'title status progress' }
    ]);
    
    res.json({
      goals: populatedGoals.slice(skip, skip + parseInt(limit)),
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: populatedGoals.length,
        totalGoals: total
      }
    });
  } catch (error) {
    console.error('Get club goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

// @route   POST /api/clubs/:clubId/goals
// @desc    Create a new goal
// @access  Private (Club Member with permission)
export const createGoal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { clubId } = req.params;
    const goalData = {
      ...req.body,
      club: clubId,
      createdBy: req.user.id,
      owner: req.body.owner || req.user.id
    };
    
    // Verify club exists and user has permission
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }
    
    // Check if user is a member
    const isMember = club.members.some(member => 
      member.user.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Not a club member' });
    }
    
    const goal = new Goal(goalData);
    await goal.save();
    
    // Populate the goal
    await goal.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'assignedTo.user', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' }
    ]);
    
    // Log activity
    await logActivity(
      { category: 'create', verb: 'created', object: 'goal' },
      req.user.id,
      'goal',
      goal._id,
      goal.title,
      `Created goal "${goal.title}" in ${club.name}`,
      { club: clubId, goal: goal._id }
    );
    
    res.status(201).json(goal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

// @route   GET /api/goals/:goalId
// @desc    Get goal details
// @access  Private (Club Member)
export const getGoalDetails = async (req, res) => {
  try {
    const { goalId } = req.params;
    
    const goal = await Goal.findById(goalId)
      .populate('createdBy', 'name email avatar')
      .populate('club', 'name description')
      .populate('assignedTo.user', 'name email avatar')
      .populate({
        path: 'objectives',
        populate: {
          path: 'assignedTo createdBy',
          select: 'name email avatar'
        }
      })
      .populate({
        path: 'tasks',
        populate: {
          path: 'assignees.user createdBy',
          select: 'name email avatar'
        }
      });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Check if user has access to this goal
    const club = await Club.findById(goal.club);
    const isMember = club.members.some(member => 
      member.user.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Return goal with basic analytics
    const goalData = {
      ...goal.toObject(),
      isOverdue: goal.isOverdue,
      daysRemaining: goal.daysRemaining,
      calculatedProgress: goal.calculatedProgress
    };
    
    res.json({ goal: goalData });
  } catch (error) {
    console.error('Get goal details error:', error);
    res.status(500).json({ error: 'Failed to fetch goal details' });
  }
};

// @route   PUT /api/goals/:goalId
// @desc    Update goal
// @access  Private (Goal Owner/Club Admin)
export const updateGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const updates = req.body;
    
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Check permissions
    const club = await Club.findById(goal.club);
    const isMember = club.members.some(member => 
      member.user.toString() === req.user.id
    );
    const isOwner = goal.owner.toString() === req.user.id;
    const isClubAdmin = club.members.some(member => 
      member.user.toString() === req.user.id && 
      ['admin', 'owner'].includes(member.role)
    );
    
    if (!isMember || (!isOwner && !isClubAdmin)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Store old values for activity log
    const oldValues = goal.toObject();
    
    // Update goal
    Object.assign(goal, updates);
    goal.updatedAt = new Date();
    await goal.save();
    
    // Populate the updated goal
    await goal.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' }
    ]);
    
    // Log activity with changes
    const changes = Object.keys(updates).map(field => ({
      field,
      oldValue: oldValues[field],
      newValue: updates[field],
      fieldType: typeof updates[field]
    }));
    
    await logActivity(
      { category: 'update', verb: 'updated', object: 'goal' },
      req.user.id,
      'goal',
      goal._id,
      goal.title,
      `Updated goal "${goal.title}"`,
      { 
        club: goal.club, 
        goal: goal._id, 
        changes,
        oldValues: oldValues,
        newValues: updates 
      }
    );
    
    res.json(goal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

// @route   DELETE /api/goals/:goalId
// @desc    Delete goal
// @access  Private (Goal Owner/Club Admin)
export const deleteGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Check permissions
    const club = await Club.findById(goal.club);
    const isOwner = goal.owner.toString() === req.user.id;
    const isClubAdmin = club.members.some(member => 
      member.user.toString() === req.user.id && 
      ['admin', 'owner'].includes(member.role)
    );
    
    if (!isOwner && !isClubAdmin) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Delete associated objectives and tasks
    await Objective.deleteMany({ goal: goalId });
    await EnhancedTask.deleteMany({ goal: goalId });
    
    // Delete the goal
    await Goal.findByIdAndDelete(goalId);
    
    // Log activity
    await logActivity(
      { category: 'delete', verb: 'deleted', object: 'goal' },
      req.user.id,
      'goal',
      goalId,
      goal.title,
      `Deleted goal "${goal.title}"`,
      { club: goal.club }
    );
    
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};

// @route   POST /api/goals/:goalId/progress
// @desc    Update goal progress
// @access  Private (Goal Owner/Assignee)
export const updateGoalProgress = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { progress, notes } = req.body;
    
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be between 0 and 100' });
    }
    
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Check if user can update progress
    const canUpdate = goal.owner.toString() === req.user.id || 
                     goal.assignedTo.some(user => user.toString() === req.user.id);
    
    if (!canUpdate) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    const oldProgress = goal.progress;
    goal.progress = progress;
    
    if (progress === 100 && goal.status !== 'completed') {
      goal.status = 'completed';
      goal.completedAt = new Date();
    }
    
    await goal.save();
    
    // Log activity
    await logActivity(
      { category: 'update', verb: 'updated progress for', object: 'goal' },
      req.user.id,
      'goal',
      goal._id,
      goal.title,
      `Updated progress from ${oldProgress}% to ${progress}% for goal "${goal.title}"`,
      { 
        club: goal.club, 
        goal: goal._id,
        metadata: { oldProgress, newProgress: progress, notes }
      }
    );
    
    res.json({ 
      message: 'Progress updated successfully', 
      progress: goal.progress,
      status: goal.status 
    });
  } catch (error) {
    console.error('Update goal progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
};

// @route   GET /api/goals/:goalId/analytics
// @desc    Get goal analytics
// @access  Private (Club Member)
export const getGoalAnalytics = async (req, res) => {
  try {
    const { goalId } = req.params;
    
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Check access
    const club = await Club.findById(goal.club);
    const isMember = club.members.some(member => 
      member.user.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get objectives and tasks analytics
    const objectives = await Objective.find({ goal: goalId });
    const tasks = await EnhancedTask.find({ goal: goalId });
    
    // Calculate analytics
    const analytics = {
      overview: {
        totalObjectives: objectives.length,
        completedObjectives: objectives.filter(obj => obj.status === 'completed').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(task => task.status === 'completed').length,
        overdueTasks: tasks.filter(task => task.isOverdue).length,
        progress: goal.calculatedProgress,
        daysRemaining: goal.daysRemaining,
        isOverdue: goal.isOverdue
      },
      timeline: {
        startDate: goal.startDate,
        dueDate: goal.dueDate,
        completedAt: goal.completedAt,
        estimatedHours: goal.estimatedHours,
        actualHours: goal.actualHours
      },
      team: {
        owner: goal.owner,
        assignedMembers: goal.assignedTo.length,
        activeContributors: [...new Set(tasks.flatMap(task => task.assignedTo))].length
      },
      progress: {
        byObjective: objectives.map(obj => ({
          id: obj._id,
          title: obj.title,
          progress: obj.progress,
          status: obj.status
        })),
        byTask: tasks.map(task => ({
          id: task._id,
          title: task.title,
          progress: task.progress,
          status: task.status,
          priority: task.priority
        }))
      }
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Get goal analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch goal analytics' });
  }
};

// @route   POST /api/goals/:goalId/duplicate
// @desc    Duplicate a goal
// @access  Private (Club Member)
export const duplicateGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { title, includeObjectives = true, includeTasks = false } = req.body;
    
    const originalGoal = await Goal.findById(goalId);
    if (!originalGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Check access
    const club = await Club.findById(originalGoal.club);
    const isMember = club.members.some(member => 
      member.user.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Create duplicate goal
    const duplicateData = originalGoal.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    delete duplicateData.completedAt;
    
    duplicateData.title = title || `${originalGoal.title} (Copy)`;
    duplicateData.status = 'draft';
    duplicateData.progress = 0;
    duplicateData.createdBy = req.user.id;
    duplicateData.owner = req.user.id;
    duplicateData.objectives = [];
    duplicateData.tasks = [];
    
    const newGoal = new Goal(duplicateData);
    await newGoal.save();
    
    // Duplicate objectives if requested
    if (includeObjectives) {
      const objectives = await Objective.find({ goal: goalId });
      for (const obj of objectives) {
        const objData = obj.toObject();
        delete objData._id;
        delete objData.createdAt;
        delete objData.updatedAt;
        delete objData.completedAt;
        
        objData.goal = newGoal._id;
        objData.status = 'draft';
        objData.progress = 0;
        objData.createdBy = req.user.id;
        objData.owner = req.user.id;
        objData.tasks = [];
        
        const newObjective = new Objective(objData);
        await newObjective.save();
        
        newGoal.objectives.push(newObjective._id);
      }
    }
    
    // Duplicate tasks if requested
    if (includeTasks) {
      const tasks = await EnhancedTask.find({ goal: goalId });
      for (const task of tasks) {
        const taskData = task.toObject();
        delete taskData._id;
        delete taskData.createdAt;
        delete taskData.updatedAt;
        delete taskData.completedAt;
        
        taskData.goal = newGoal._id;
        taskData.status = 'todo';
        taskData.progress = 0;
        taskData.createdBy = req.user.id;
        taskData.owner = req.user.id;
        taskData.comments = [];
        taskData.timeEntries = [];
        
        const newTask = new EnhancedTask(taskData);
        await newTask.save();
        
        newGoal.tasks.push(newTask._id);
      }
    }
    
    await newGoal.save();
    
    // Log activity
    await logActivity(
      { category: 'create', verb: 'duplicated', object: 'goal' },
      req.user.id,
      'goal',
      newGoal._id,
      newGoal.title,
      `Duplicated goal "${originalGoal.title}" as "${newGoal.title}"`,
      { club: originalGoal.club, goal: newGoal._id }
    );
    
    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Duplicate goal error:', error);
    res.status(500).json({ error: 'Failed to duplicate goal' });
  }
};

export default {
  getClubGoals,
  createGoal,
  getGoalDetails,
  updateGoal,
  deleteGoal,
  updateGoalProgress,
  getGoalAnalytics,
  duplicateGoal
};
