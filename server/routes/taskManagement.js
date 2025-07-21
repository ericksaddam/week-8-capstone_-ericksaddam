import express from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';

// Import controllers
import goalController from '../controllers/goalController.js';
import objectiveController from '../controllers/objectiveController.js';
import enhancedTaskController from '../controllers/enhancedTaskController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// ===================
// GOAL ROUTES
// ===================

// @route   GET /api/clubs/:clubId/goals
// @desc    Get all goals for a club
// @access  Private (Club Member)
router.get('/clubs/:clubId/goals', goalController.getClubGoals);

// @route   POST /api/clubs/:clubId/goals
// @desc    Create a new goal
// @access  Private (Club Member with permission)
router.post('/clubs/:clubId/goals', [
  body('title').notEmpty().withMessage('Goal title is required'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
  body('format').isIn(['SMART', 'OKR']).withMessage('Format must be SMART or OKR'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['draft', 'active', 'on_hold', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('estimatedHours').optional().isNumeric().withMessage('Estimated hours must be a number')
], goalController.createGoal);

// @route   GET /api/goals/:goalId
// @desc    Get goal details
// @access  Private (Club Member)
router.get('/goals/:goalId', goalController.getGoalDetails);

// @route   PUT /api/goals/:goalId
// @desc    Update goal
// @access  Private (Goal Owner/Club Admin)
router.put('/goals/:goalId', [
  body('title').optional().notEmpty().withMessage('Goal title cannot be empty'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['draft', 'active', 'on_hold', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('estimatedHours').optional().isNumeric().withMessage('Estimated hours must be a number')
], goalController.updateGoal);

// @route   DELETE /api/goals/:goalId
// @desc    Delete goal
// @access  Private (Goal Owner/Club Admin)
router.delete('/goals/:goalId', goalController.deleteGoal);

// @route   POST /api/goals/:goalId/progress
// @desc    Update goal progress
// @access  Private (Goal Owner/Assignee)
router.post('/goals/:goalId/progress', [
  body('progress').isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes too long')
], goalController.updateGoalProgress);

// @route   GET /api/goals/:goalId/analytics
// @desc    Get goal analytics
// @access  Private (Club Member)
router.get('/goals/:goalId/analytics', goalController.getGoalAnalytics);

// @route   POST /api/goals/:goalId/duplicate
// @desc    Duplicate a goal
// @access  Private (Club Member)
router.post('/goals/:goalId/duplicate', [
  body('title').notEmpty().withMessage('New goal title is required'),
  body('includeObjectives').optional().isBoolean().withMessage('includeObjectives must be boolean'),
  body('includeTasks').optional().isBoolean().withMessage('includeTasks must be boolean')
], goalController.duplicateGoal);

// ===================
// OBJECTIVE ROUTES
// ===================

// @route   GET /api/goals/:goalId/objectives
// @desc    Get all objectives for a goal
// @access  Private (Club Member)
router.get('/goals/:goalId/objectives', objectiveController.getGoalObjectives);

// @route   POST /api/goals/:goalId/objectives
// @desc    Create a new objective
// @access  Private (Club Member with permission)
router.post('/goals/:goalId/objectives', [
  body('title').notEmpty().withMessage('Objective title is required'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['draft', 'active', 'on_hold', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('keyResults').optional().isArray().withMessage('Key results must be an array'),
  body('keyResults.*.title').optional().notEmpty().withMessage('Key result title is required'),
  body('keyResults.*.targetValue').optional().isNumeric().withMessage('Target value must be numeric'),
  body('keyResults.*.unit').optional().isString().withMessage('Unit must be a string')
], objectiveController.createObjective);

// @route   GET /api/objectives/:objectiveId
// @desc    Get objective details
// @access  Private (Club Member)
router.get('/objectives/:objectiveId', objectiveController.getObjectiveDetails);

// @route   PUT /api/objectives/:objectiveId
// @desc    Update objective
// @access  Private (Objective Owner/Club Admin)
router.put('/objectives/:objectiveId', [
  body('title').optional().notEmpty().withMessage('Objective title cannot be empty'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['draft', 'active', 'on_hold', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date')
], objectiveController.updateObjective);

// @route   DELETE /api/objectives/:objectiveId
// @desc    Delete objective
// @access  Private (Objective Owner/Club Admin)
router.delete('/objectives/:objectiveId', objectiveController.deleteObjective);

// @route   POST /api/objectives/:objectiveId/key-results/:keyResultId/progress
// @desc    Update key result progress
// @access  Private (Objective Owner/Assignee)
router.post('/objectives/:objectiveId/key-results/:keyResultId/progress', [
  body('currentValue').isNumeric().withMessage('Current value must be numeric'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes too long')
], objectiveController.updateKeyResultProgress);

// @route   POST /api/objectives/:objectiveId/key-results
// @desc    Add key result to objective
// @access  Private (Objective Owner/Club Admin)
router.post('/objectives/:objectiveId/key-results', [
  body('title').notEmpty().withMessage('Key result title is required'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
  body('targetValue').isNumeric().withMessage('Target value must be numeric'),
  body('unit').notEmpty().withMessage('Unit is required'),
  body('type').isIn(['increase', 'decrease', 'maintain']).withMessage('Invalid type')
], objectiveController.addKeyResult);

// @route   PUT /api/objectives/:objectiveId/key-results/:keyResultId
// @desc    Update key result
// @access  Private (Objective Owner/Club Admin)
router.put('/objectives/:objectiveId/key-results/:keyResultId', [
  body('title').optional().notEmpty().withMessage('Key result title cannot be empty'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
  body('targetValue').optional().isNumeric().withMessage('Target value must be numeric'),
  body('unit').optional().notEmpty().withMessage('Unit cannot be empty'),
  body('type').optional().isIn(['increase', 'decrease', 'maintain']).withMessage('Invalid type')
], objectiveController.updateKeyResult);

// @route   DELETE /api/objectives/:objectiveId/key-results/:keyResultId
// @desc    Delete key result
// @access  Private (Objective Owner/Club Admin)
router.delete('/objectives/:objectiveId/key-results/:keyResultId', objectiveController.deleteKeyResult);

// ===================
// ENHANCED TASK ROUTES
// ===================

// @route   GET /api/clubs/:clubId/tasks
// @desc    Get all tasks for a club
// @access  Private (Club Member)
router.get('/clubs/:clubId/tasks', enhancedTaskController.getClubTasks);

// @route   POST /api/clubs/:clubId/tasks
// @desc    Create a new task
// @access  Private (Club Member)
router.post('/clubs/:clubId/tasks', [
  body('title').notEmpty().withMessage('Task title is required'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('estimatedHours').optional().isNumeric().withMessage('Estimated hours must be a number'),
  body('assignedTo').optional().isArray().withMessage('Assigned to must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('checklist').optional().isArray().withMessage('Checklist must be an array'),
  body('checklist.*.text').optional().notEmpty().withMessage('Checklist item text is required')
], enhancedTaskController.createTask);

// @route   GET /api/tasks/:taskId
// @desc    Get task details
// @access  Private (Club Member)
router.get('/tasks/:taskId', enhancedTaskController.getTaskDetails);

// @route   PUT /api/tasks/:taskId
// @desc    Update task
// @access  Private (Task Owner/Assignee/Club Admin)
router.put('/tasks/:taskId', [
  body('title').optional().notEmpty().withMessage('Task title cannot be empty'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('estimatedHours').optional().isNumeric().withMessage('Estimated hours must be a number'),
  body('assignedTo').optional().isArray().withMessage('Assigned to must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
], enhancedTaskController.updateTask);

// @route   DELETE /api/tasks/:taskId
// @desc    Delete task
// @access  Private (Task Owner/Club Admin)
router.delete('/tasks/:taskId', enhancedTaskController.deleteTask);

// @route   POST /api/tasks/:taskId/comments
// @desc    Add comment to task
// @access  Private (Club Member)
router.post('/tasks/:taskId/comments', [
  body('content').notEmpty().withMessage('Comment content is required'),
  body('content').isLength({ max: 2000 }).withMessage('Comment too long'),
  body('mentions').optional().isArray().withMessage('Mentions must be an array')
], enhancedTaskController.addTaskComment);

// @route   POST /api/tasks/:taskId/time
// @desc    Log time for task
// @access  Private (Task Owner/Assignee)
router.post('/tasks/:taskId/time', [
  body('hours').isFloat({ min: 0.1, max: 24 }).withMessage('Hours must be between 0.1 and 24'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
  body('date').optional().isISO8601().withMessage('Invalid date')
], enhancedTaskController.logTaskTime);

// @route   POST /api/tasks/:taskId/checklist/:itemId/toggle
// @desc    Toggle checklist item
// @access  Private (Task Owner/Assignee)
router.post('/tasks/:taskId/checklist/:itemId/toggle', enhancedTaskController.toggleChecklistItem);

// @route   GET /api/tasks/:taskId/analytics
// @desc    Get task analytics
// @access  Private (Club Member)
router.get('/tasks/:taskId/analytics', enhancedTaskController.getTaskAnalytics);

// ===================
// BULK OPERATIONS
// ===================

// @route   POST /api/clubs/:clubId/tasks/bulk
// @desc    Bulk operations on tasks
// @access  Private (Club Member)
router.post('/clubs/:clubId/tasks/bulk', [
  body('action').isIn(['update_status', 'assign', 'delete', 'move']).withMessage('Invalid bulk action'),
  body('taskIds').isArray({ min: 1 }).withMessage('Task IDs array is required'),
  body('data').optional().isObject().withMessage('Data must be an object')
], async (req, res) => {
  try {
    const { clubId } = req.params;
    const { action, taskIds, data } = req.body;
    
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
    
    let result;
    
    switch (action) {
      case 'update_status':
        result = await EnhancedTask.updateMany(
          { _id: { $in: taskIds }, club: clubId },
          { status: data.status, updatedAt: new Date() }
        );
        break;
        
      case 'assign':
        result = await EnhancedTask.updateMany(
          { _id: { $in: taskIds }, club: clubId },
          { $addToSet: { assignedTo: { $each: data.assignedTo } }, updatedAt: new Date() }
        );
        break;
        
      case 'delete':
        // Check permissions for each task
        const tasksToDelete = await EnhancedTask.find({ 
          _id: { $in: taskIds }, 
          club: clubId 
        });
        
        const canDeleteAll = tasksToDelete.every(task => 
          task.owner.toString() === req.user.id || 
          club.members.some(member => 
            member.user.toString() === req.user.id && 
            ['admin', 'owner'].includes(member.role)
          )
        );
        
        if (!canDeleteAll) {
          return res.status(403).json({ error: 'Permission denied for some tasks' });
        }
        
        result = await EnhancedTask.deleteMany({ _id: { $in: taskIds }, club: clubId });
        break;
        
      case 'move':
        result = await EnhancedTask.updateMany(
          { _id: { $in: taskIds }, club: clubId },
          { 
            goal: data.goalId || null,
            objective: data.objectiveId || null,
            updatedAt: new Date()
          }
        );
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    // Log bulk activity
    await ActivityLog.logActivity({
      action: { category: 'update', verb: 'performed bulk', object: 'tasks' },
      actor: req.user.id,
      entityType: 'task',
      entityId: null,
      entityName: `${taskIds.length} tasks`,
      description: `Performed bulk ${action} on ${taskIds.length} tasks`,
      club: clubId,
      metadata: { action, taskIds, data }
    });
    
    res.json({
      message: `Bulk ${action} completed successfully`,
      affected: result.modifiedCount || result.deletedCount,
      total: taskIds.length
    });
    
  } catch (error) {
    console.error('Bulk task operation error:', error);
    res.status(500).json({ error: 'Failed to perform bulk operation' });
  }
});

export default router;
