import EnhancedTask from '../models/EnhancedTask.js';
import Goal from '../models/Goal.js';
import Objective from '../models/Objective.js';
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

// @route   GET /api/clubs/:clubId/tasks
// @desc    Get all tasks for a club
// @access  Private (Club Member)
export const getClubTasks = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { 
      status, 
      priority, 
      owner, 
      assignedTo,
      goal,
      objective,
      parent,
      view = 'list',
      page = 1, 
      limit = 50 
    } = req.query;
    
    // Verify club access
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }
    
    const isMember = club.members.some(member => 
      member.user.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Build filter
    const filter = { club: clubId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (owner) filter.owner = owner;
    if (assignedTo) filter.assignedTo = { $in: [assignedTo] };
    if (goal) filter.goal = goal;
    if (objective) filter.objective = objective;
    if (parent) filter.parent = parent;
    
    // For hierarchical view, only get root tasks
    if (view === 'hierarchy') {
      filter.parent = null;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    let tasks;
    if (view === 'hierarchy') {
      // Get tasks with all subtasks populated
      tasks = await EnhancedTask.getTaskHierarchy(clubId, filter);
    } else {
      // Get flat list of tasks
      tasks = await EnhancedTask.find(filter)
        .populate('owner', 'name email avatar')
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email avatar')
        .populate('goal', 'title')
        .populate('objective', 'title')
        .populate('parent', 'title')
        .populate('dependencies', 'title status')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);
    }
    
    // Get total count for pagination
    const total = await EnhancedTask.countDocuments(filter);
    
    res.json({
      tasks,
      view,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: tasks.length,
        totalTasks: total
      }
    });
  } catch (error) {
    console.error('Get club tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// @route   POST /api/clubs/:clubId/tasks
// @desc    Create a new task
// @access  Private (Club Member)
export const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { clubId } = req.params;
    
    // Verify club access
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }
    
    const isMember = club.members.some(member => 
      member.user.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const taskData = {
      ...req.body,
      club: clubId,
      createdBy: req.user.id,
      owner: req.body.owner || req.user.id
    };
    
    const task = new EnhancedTask(taskData);
    await task.save();
    
    // Add task to goal/objective if specified
    if (task.goal) {
      await Goal.findByIdAndUpdate(task.goal, {
        $push: { tasks: task._id }
      });
    }
    
    if (task.objective) {
      await Objective.findByIdAndUpdate(task.objective, {
        $push: { tasks: task._id }
      });
    }
    
    // Add to parent task if specified
    if (task.parent) {
      await EnhancedTask.findByIdAndUpdate(task.parent, {
        $push: { subtasks: task._id }
      });
    }
    
    // Populate the task
    await task.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'goal', select: 'title' },
      { path: 'objective', select: 'title' },
      { path: 'parent', select: 'title' }
    ]);
    
    // Log activity
    await logActivity(
      { category: 'create', verb: 'created', object: 'task' },
      req.user.id,
      'task',
      task._id,
      task.title,
      `Created task "${task.title}" in ${club.name}`,
      { 
        club: clubId, 
        goal: task.goal,
        objective: task.objective,
        task: task._id 
      }
    );
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// @route   GET /api/tasks/:taskId
// @desc    Get task details
// @access  Private (Club Member)
export const getTaskDetails = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await EnhancedTask.findById(taskId)
      .populate('owner', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('club', 'name description')
      .populate('goal', 'title description')
      .populate('objective', 'title description')
      .populate('parent', 'title status')
      .populate('subtasks')
      .populate('dependencies', 'title status progress')
      .populate('dependents', 'title status progress')
      .populate('comments.author', 'name email avatar')
      .populate('attachments.uploadedBy', 'name email avatar')
      .populate('timeEntries.user', 'name email avatar');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user has access
    const club = await Club.findById(task.club);
    const isMember = club.members.some(member => 
      member.user.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Get task details error:', error);
    res.status(500).json({ error: 'Failed to fetch task details' });
  }
};

// @route   PUT /api/tasks/:taskId
// @desc    Update task
// @access  Private (Task Owner/Assignee/Club Admin)
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    
    const task = await EnhancedTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check permissions
    const club = await Club.findById(task.club);
    const isMember = club.members.some(member => 
      member.user.toString() === req.user.id
    );
    const isOwner = task.owner.toString() === req.user.id;
    const isAssigned = task.assignedTo.some(user => user.toString() === req.user.id);
    const isClubAdmin = club.members.some(member => 
      member.user.toString() === req.user.id && 
      ['admin', 'owner'].includes(member.role)
    );
    
    if (!isMember || (!isOwner && !isAssigned && !isClubAdmin)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Store old values for activity log
    const oldValues = task.toObject();
    
    // Update task
    Object.assign(task, updates);
    task.updatedAt = new Date();
    
    // Auto-complete if progress is 100%
    if (updates.progress === 100 && task.status !== 'completed') {
      task.status = 'completed';
      task.completedAt = new Date();
    }
    
    await task.save();
    
    // Populate the updated task
    await task.populate([
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
      { category: 'update', verb: 'updated', object: 'task' },
      req.user.id,
      'task',
      task._id,
      task.title,
      `Updated task "${task.title}"`,
      { 
        club: task.club, 
        goal: task.goal,
        objective: task.objective,
        task: task._id, 
        changes,
        oldValues: oldValues,
        newValues: updates 
      }
    );
    
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// @route   DELETE /api/tasks/:taskId
// @desc    Delete task
// @access  Private (Task Owner/Club Admin)
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await EnhancedTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check permissions
    const club = await Club.findById(task.club);
    const isOwner = task.owner.toString() === req.user.id;
    const isClubAdmin = club.members.some(member => 
      member.user.toString() === req.user.id && 
      ['admin', 'owner'].includes(member.role)
    );
    
    if (!isOwner && !isClubAdmin) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Remove from goal/objective
    if (task.goal) {
      await Goal.findByIdAndUpdate(task.goal, {
        $pull: { tasks: taskId }
      });
    }
    
    if (task.objective) {
      await Objective.findByIdAndUpdate(task.objective, {
        $pull: { tasks: taskId }
      });
    }
    
    // Remove from parent task
    if (task.parent) {
      await EnhancedTask.findByIdAndUpdate(task.parent, {
        $pull: { subtasks: taskId }
      });
    }
    
    // Delete subtasks
    await EnhancedTask.deleteMany({ parent: taskId });
    
    // Remove dependencies
    await EnhancedTask.updateMany(
      { dependencies: taskId },
      { $pull: { dependencies: taskId } }
    );
    
    // Delete the task
    await EnhancedTask.findByIdAndDelete(taskId);
    
    // Log activity
    await logActivity(
      { category: 'delete', verb: 'deleted', object: 'task' },
      req.user.id,
      'task',
      taskId,
      task.title,
      `Deleted task "${task.title}"`,
      { 
        club: task.club, 
        goal: task.goal,
        objective: task.objective 
      }
    );
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

// @route   POST /api/tasks/:taskId/comments
// @desc    Add comment to task
// @access  Private (Club Member)
export const addTaskComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, mentions = [] } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    const task = await EnhancedTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check access
    const club = await Club.findById(task.club);
    const isMember = club.members.some(member => 
      member.user.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Add comment
    const comment = {
      content: content.trim(),
      author: req.user.id,
      mentions
    };
    
    task.comments.push(comment);
    await task.save();
    
    // Populate the new comment
    await task.populate('comments.author', 'name email avatar');
    const newComment = task.comments[task.comments.length - 1];
    
    // Log activity
    await logActivity(
      { category: 'comment', verb: 'commented on', object: 'task' },
      req.user.id,
      'task',
      task._id,
      task.title,
      `Added comment to task "${task.title}"`,
      { 
        club: task.club, 
        goal: task.goal,
        objective: task.objective,
        task: task._id,
        mentions
      }
    );
    
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Add task comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// @route   POST /api/tasks/:taskId/time
// @desc    Log time for task
// @access  Private (Task Owner/Assignee)
export const logTaskTime = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { hours, description, date } = req.body;
    
    if (!hours || hours <= 0) {
      return res.status(400).json({ error: 'Valid hours are required' });
    }
    
    const task = await EnhancedTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user can log time
    const isOwner = task.owner.toString() === req.user.id;
    const isAssigned = task.assignedTo.some(user => user.toString() === req.user.id);
    
    if (!isOwner && !isAssigned) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Add time entry
    const timeEntry = {
      user: req.user.id,
      hours,
      description,
      date: date ? new Date(date) : new Date()
    };
    
    task.timeEntries.push(timeEntry);
    await task.save();
    
    // Populate the new time entry
    await task.populate('timeEntries.user', 'name email avatar');
    const newTimeEntry = task.timeEntries[task.timeEntries.length - 1];
    
    // Log activity
    await logActivity(
      { category: 'update', verb: 'logged time for', object: 'task' },
      req.user.id,
      'task',
      task._id,
      task.title,
      `Logged ${hours} hours for task "${task.title}"`,
      { 
        club: task.club, 
        goal: task.goal,
        objective: task.objective,
        task: task._id,
        metadata: { hours, description }
      }
    );
    
    res.status(201).json(newTimeEntry);
  } catch (error) {
    console.error('Log task time error:', error);
    res.status(500).json({ error: 'Failed to log time' });
  }
};

// @route   POST /api/tasks/:taskId/checklist/:itemId/toggle
// @desc    Toggle checklist item
// @access  Private (Task Owner/Assignee)
export const toggleChecklistItem = async (req, res) => {
  try {
    const { taskId, itemId } = req.params;
    
    const task = await EnhancedTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check permissions
    const isOwner = task.owner.toString() === req.user.id;
    const isAssigned = task.assignedTo.some(user => user.toString() === req.user.id);
    
    if (!isOwner && !isAssigned) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Toggle checklist item
    const item = task.checklist.id(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }
    
    item.completed = !item.completed;
    item.completedAt = item.completed ? new Date() : null;
    item.completedBy = item.completed ? req.user.id : null;
    
    await task.save();
    
    // Log activity
    await logActivity(
      { category: 'update', verb: item.completed ? 'completed' : 'uncompleted', object: 'checklist item' },
      req.user.id,
      'task',
      task._id,
      task.title,
      `${item.completed ? 'Completed' : 'Uncompleted'} checklist item "${item.text}" in task "${task.title}"`,
      { 
        club: task.club, 
        goal: task.goal,
        objective: task.objective,
        task: task._id 
      }
    );
    
    res.json(item);
  } catch (error) {
    console.error('Toggle checklist item error:', error);
    res.status(500).json({ error: 'Failed to toggle checklist item' });
  }
};

// @route   GET /api/tasks/:taskId/analytics
// @desc    Get task analytics
// @access  Private (Club Member)
export const getTaskAnalytics = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await EnhancedTask.findById(taskId)
      .populate('subtasks')
      .populate('timeEntries.user', 'name');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check access
    const club = await Club.findById(task.club);
    const isMember = club.members.some(member => 
      member.user.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Calculate analytics
    const totalTimeLogged = task.timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const completedSubtasks = task.subtasks.filter(subtask => subtask.status === 'completed').length;
    const completedChecklistItems = task.checklist.filter(item => item.completed).length;
    
    const analytics = {
      overview: {
        status: task.status,
        progress: task.progress,
        priority: task.priority,
        isOverdue: task.isOverdue,
        daysRemaining: task.daysRemaining
      },
      time: {
        estimatedHours: task.estimatedHours,
        actualHours: totalTimeLogged,
        variance: task.estimatedHours ? totalTimeLogged - task.estimatedHours : 0,
        timeByUser: task.timeEntries.reduce((acc, entry) => {
          const userName = entry.user.name;
          acc[userName] = (acc[userName] || 0) + entry.hours;
          return acc;
        }, {})
      },
      completion: {
        subtasks: {
          total: task.subtasks.length,
          completed: completedSubtasks,
          percentage: task.subtasks.length > 0 ? (completedSubtasks / task.subtasks.length) * 100 : 0
        },
        checklist: {
          total: task.checklist.length,
          completed: completedChecklistItems,
          percentage: task.checklist.length > 0 ? (completedChecklistItems / task.checklist.length) * 100 : 0
        }
      },
      engagement: {
        totalComments: task.comments.length,
        totalAttachments: task.attachments.length,
        lastActivity: task.updatedAt
      }
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Get task analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch task analytics' });
  }
};

export default {
  getClubTasks,
  createTask,
  getTaskDetails,
  updateTask,
  deleteTask,
  addTaskComment,
  logTaskTime,
  toggleChecklistItem,
  getTaskAnalytics
};
