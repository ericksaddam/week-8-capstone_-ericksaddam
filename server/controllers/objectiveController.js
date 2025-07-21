import Objective from '../models/Objective.js';
import Goal from '../models/Goal.js';
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

// @route   GET /api/goals/:goalId/objectives
// @desc    Get all objectives for a goal
// @access  Private (Club Member)
export const getGoalObjectives = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { status, priority, owner, page = 1, limit = 20 } = req.query;
    
    // Verify goal exists and user has access
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const club = await Club.findById(goal.club);
    const isMember = club.members.some(member => 
      member.user.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Build filter
    const filter = { goal: goalId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (owner) filter.owner = owner;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get objectives with analytics
    const objectives = await Objective.getObjectivesWithAnalytics(goalId, filter);
    
    // Get total count for pagination
    const total = await Objective.countDocuments(filter);
    
    // Populate references
    const populatedObjectives = await Objective.populate(objectives, [
      { path: 'owner', select: 'name email avatar' },
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'tasks', select: 'title status progress priority' }
    ]);
    
    res.json({
      objectives: populatedObjectives.slice(skip, skip + parseInt(limit)),
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: populatedObjectives.length,
        totalObjectives: total
      }
    });
  } catch (error) {
    console.error('Get goal objectives error:', error);
    res.status(500).json({ error: 'Failed to fetch objectives' });
  }
};

// @route   POST /api/goals/:goalId/objectives
// @desc    Create a new objective
// @access  Private (Club Member with permission)
export const createObjective = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { goalId } = req.params;
    
    // Verify goal exists and user has access
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const club = await Club.findById(goal.club);
    const isMember = club.members.some(member => 
      member.user.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const objectiveData = {
      ...req.body,
      goal: goalId,
      club: goal.club,
      createdBy: req.user.id,
      owner: req.body.owner || req.user.id
    };
    
    const objective = new Objective(objectiveData);
    await objective.save();
    
    // Add objective to goal
    goal.objectives.push(objective._id);
    await goal.save();
    
    // Populate the objective
    await objective.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' }
    ]);
    
    // Log activity
    await logActivity(
      { category: 'create', verb: 'created', object: 'objective' },
      req.user.id,
      'objective',
      objective._id,
      objective.title,
      `Created objective "${objective.title}" for goal "${goal.title}"`,
      { club: goal.club, goal: goalId, objective: objective._id }
    );
    
    res.status(201).json(objective);
  } catch (error) {
    console.error('Create objective error:', error);
    res.status(500).json({ error: 'Failed to create objective' });
  }
};

// @route   GET /api/objectives/:objectiveId
// @desc    Get objective details
// @access  Private (Club Member)
export const getObjectiveDetails = async (req, res) => {
  try {
    const { objectiveId } = req.params;
    
    const objective = await Objective.findById(objectiveId)
      .populate('owner', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('goal', 'title description')
      .populate('club', 'name description')
      .populate({
        path: 'tasks',
        populate: {
          path: 'owner assignedTo',
          select: 'name email avatar'
        }
      });
    
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }
    
    // Check if user has access
    const club = await Club.findById(objective.club);
    const isMember = club.members.some(member => 
      member.user.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get objective analytics
    const analytics = await Objective.getObjectivesWithAnalytics(objective.goal, { _id: objectiveId });
    const objectiveWithAnalytics = analytics[0] || objective;
    
    res.json(objectiveWithAnalytics);
  } catch (error) {
    console.error('Get objective details error:', error);
    res.status(500).json({ error: 'Failed to fetch objective details' });
  }
};

// @route   PUT /api/objectives/:objectiveId
// @desc    Update objective
// @access  Private (Objective Owner/Club Admin)
export const updateObjective = async (req, res) => {
  try {
    const { objectiveId } = req.params;
    const updates = req.body;
    
    const objective = await Objective.findById(objectiveId);
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }
    
    // Check permissions
    const club = await Club.findById(objective.club);
    const isMember = club.members.some(member => 
      member.user.toString() === req.user.id
    );
    const isOwner = objective.owner.toString() === req.user.id;
    const isClubAdmin = club.members.some(member => 
      member.user.toString() === req.user.id && 
      ['admin', 'owner'].includes(member.role)
    );
    
    if (!isMember || (!isOwner && !isClubAdmin)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Store old values for activity log
    const oldValues = objective.toObject();
    
    // Update objective
    Object.assign(objective, updates);
    objective.updatedAt = new Date();
    await objective.save();
    
    // Populate the updated objective
    await objective.populate([
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
      { category: 'update', verb: 'updated', object: 'objective' },
      req.user.id,
      'objective',
      objective._id,
      objective.title,
      `Updated objective "${objective.title}"`,
      { 
        club: objective.club, 
        goal: objective.goal,
        objective: objective._id, 
        changes,
        oldValues: oldValues,
        newValues: updates 
      }
    );
    
    res.json(objective);
  } catch (error) {
    console.error('Update objective error:', error);
    res.status(500).json({ error: 'Failed to update objective' });
  }
};

// @route   DELETE /api/objectives/:objectiveId
// @desc    Delete objective
// @access  Private (Objective Owner/Club Admin)
export const deleteObjective = async (req, res) => {
  try {
    const { objectiveId } = req.params;
    
    const objective = await Objective.findById(objectiveId);
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }
    
    // Check permissions
    const club = await Club.findById(objective.club);
    const isOwner = objective.owner.toString() === req.user.id;
    const isClubAdmin = club.members.some(member => 
      member.user.toString() === req.user.id && 
      ['admin', 'owner'].includes(member.role)
    );
    
    if (!isOwner && !isClubAdmin) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Remove from goal
    await Goal.findByIdAndUpdate(objective.goal, {
      $pull: { objectives: objectiveId }
    });
    
    // Delete associated tasks
    await EnhancedTask.deleteMany({ objective: objectiveId });
    
    // Delete the objective
    await Objective.findByIdAndDelete(objectiveId);
    
    // Log activity
    await logActivity(
      { category: 'delete', verb: 'deleted', object: 'objective' },
      req.user.id,
      'objective',
      objectiveId,
      objective.title,
      `Deleted objective "${objective.title}"`,
      { club: objective.club, goal: objective.goal }
    );
    
    res.json({ message: 'Objective deleted successfully' });
  } catch (error) {
    console.error('Delete objective error:', error);
    res.status(500).json({ error: 'Failed to delete objective' });
  }
};

// @route   POST /api/objectives/:objectiveId/key-results/:keyResultId/progress
// @desc    Update key result progress
// @access  Private (Objective Owner/Assignee)
export const updateKeyResultProgress = async (req, res) => {
  try {
    const { objectiveId, keyResultId } = req.params;
    const { currentValue, notes } = req.body;
    
    const objective = await Objective.findById(objectiveId);
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }
    
    // Check if user can update progress
    const canUpdate = objective.owner.toString() === req.user.id || 
                     objective.assignedTo.some(user => user.toString() === req.user.id);
    
    if (!canUpdate) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Update key result progress
    await objective.updateKeyResultProgress(keyResultId, currentValue);
    
    // Log activity
    const keyResult = objective.keyResults.id(keyResultId);
    await logActivity(
      { category: 'update', verb: 'updated progress for', object: 'key result' },
      req.user.id,
      'objective',
      objective._id,
      objective.title,
      `Updated key result "${keyResult.title}" progress to ${currentValue} ${keyResult.unit}`,
      { 
        club: objective.club, 
        goal: objective.goal,
        objective: objective._id,
        metadata: { keyResultId, currentValue, notes }
      }
    );
    
    res.json({ 
      message: 'Key result progress updated successfully',
      keyResult: objective.keyResults.id(keyResultId),
      objectiveProgress: objective.progress
    });
  } catch (error) {
    console.error('Update key result progress error:', error);
    res.status(500).json({ error: 'Failed to update key result progress' });
  }
};

// @route   POST /api/objectives/:objectiveId/key-results
// @desc    Add key result to objective
// @access  Private (Objective Owner/Club Admin)
export const addKeyResult = async (req, res) => {
  try {
    const { objectiveId } = req.params;
    const keyResultData = req.body;
    
    const objective = await Objective.findById(objectiveId);
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }
    
    // Check permissions
    const club = await Club.findById(objective.club);
    const isOwner = objective.owner.toString() === req.user.id;
    const isClubAdmin = club.members.some(member => 
      member.user.toString() === req.user.id && 
      ['admin', 'owner'].includes(member.role)
    );
    
    if (!isOwner && !isClubAdmin) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Add key result
    objective.keyResults.push({
      ...keyResultData,
      owner: keyResultData.owner || req.user.id
    });
    
    await objective.save();
    
    const newKeyResult = objective.keyResults[objective.keyResults.length - 1];
    
    // Log activity
    await logActivity(
      { category: 'create', verb: 'added', object: 'key result' },
      req.user.id,
      'objective',
      objective._id,
      objective.title,
      `Added key result "${newKeyResult.title}" to objective "${objective.title}"`,
      { 
        club: objective.club, 
        goal: objective.goal,
        objective: objective._id 
      }
    );
    
    res.status(201).json(newKeyResult);
  } catch (error) {
    console.error('Add key result error:', error);
    res.status(500).json({ error: 'Failed to add key result' });
  }
};

// @route   PUT /api/objectives/:objectiveId/key-results/:keyResultId
// @desc    Update key result
// @access  Private (Objective Owner/Club Admin)
export const updateKeyResult = async (req, res) => {
  try {
    const { objectiveId, keyResultId } = req.params;
    const updates = req.body;
    
    const objective = await Objective.findById(objectiveId);
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }
    
    // Check permissions
    const club = await Club.findById(objective.club);
    const isOwner = objective.owner.toString() === req.user.id;
    const isClubAdmin = club.members.some(member => 
      member.user.toString() === req.user.id && 
      ['admin', 'owner'].includes(member.role)
    );
    
    if (!isOwner && !isClubAdmin) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Update key result
    const keyResult = objective.keyResults.id(keyResultId);
    if (!keyResult) {
      return res.status(404).json({ error: 'Key result not found' });
    }
    
    Object.assign(keyResult, updates);
    await objective.save();
    
    // Log activity
    await logActivity(
      { category: 'update', verb: 'updated', object: 'key result' },
      req.user.id,
      'objective',
      objective._id,
      objective.title,
      `Updated key result "${keyResult.title}"`,
      { 
        club: objective.club, 
        goal: objective.goal,
        objective: objective._id 
      }
    );
    
    res.json(keyResult);
  } catch (error) {
    console.error('Update key result error:', error);
    res.status(500).json({ error: 'Failed to update key result' });
  }
};

// @route   DELETE /api/objectives/:objectiveId/key-results/:keyResultId
// @desc    Delete key result
// @access  Private (Objective Owner/Club Admin)
export const deleteKeyResult = async (req, res) => {
  try {
    const { objectiveId, keyResultId } = req.params;
    
    const objective = await Objective.findById(objectiveId);
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }
    
    // Check permissions
    const club = await Club.findById(objective.club);
    const isOwner = objective.owner.toString() === req.user.id;
    const isClubAdmin = club.members.some(member => 
      member.user.toString() === req.user.id && 
      ['admin', 'owner'].includes(member.role)
    );
    
    if (!isOwner && !isClubAdmin) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Remove key result
    const keyResult = objective.keyResults.id(keyResultId);
    if (!keyResult) {
      return res.status(404).json({ error: 'Key result not found' });
    }
    
    const keyResultTitle = keyResult.title;
    objective.keyResults.pull(keyResultId);
    await objective.save();
    
    // Log activity
    await logActivity(
      { category: 'delete', verb: 'deleted', object: 'key result' },
      req.user.id,
      'objective',
      objective._id,
      objective.title,
      `Deleted key result "${keyResultTitle}" from objective "${objective.title}"`,
      { 
        club: objective.club, 
        goal: objective.goal,
        objective: objective._id 
      }
    );
    
    res.json({ message: 'Key result deleted successfully' });
  } catch (error) {
    console.error('Delete key result error:', error);
    res.status(500).json({ error: 'Failed to delete key result' });
  }
};

export default {
  getGoalObjectives,
  createObjective,
  getObjectiveDetails,
  updateObjective,
  deleteObjective,
  updateKeyResultProgress,
  addKeyResult,
  updateKeyResult,
  deleteKeyResult
};
