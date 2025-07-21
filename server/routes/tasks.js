import express from 'express';
import { 
  getTasks, 
  getTask, 
  createTask, 
  updateTask, 
  deleteTask, 
  getClubTasks,
  addTaskComment,
  addTaskTimeLog,
  toggleTaskChecklistItem,
  updateTaskProgress
} from '../controllers/taskController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks for current user
// @access  Private
router.get('/', auth, getTasks);

// @route   GET /api/tasks/:id
// @desc    Get a specific task
// @access  Private
router.get('/:id', auth, getTask);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', auth, createTask);

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', auth, updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth, deleteTask);

// @route   GET /api/tasks/club/:clubId
// @desc    Get tasks for a specific club
// @access  Private
router.get('/club/:clubId', auth, getClubTasks);

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post('/:id/comments', auth, addTaskComment);

// @route   POST /api/tasks/:id/time-log
// @desc    Add time log entry to task
// @access  Private
router.post('/:id/time-log', auth, addTaskTimeLog);

// @route   PUT /api/tasks/:id/checklist/:itemId/toggle
// @desc    Toggle checklist item completion
// @access  Private
router.put('/:id/checklist/:itemId/toggle', auth, toggleTaskChecklistItem);

// @route   PUT /api/tasks/:id/progress
// @desc    Update task progress
// @access  Private
router.put('/:id/progress', auth, updateTaskProgress);

export default router;
