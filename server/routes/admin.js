import express from 'express';
import { 
  getAllUsers, 
  getUserDetails, 
  updateUser, 
  toggleUserBlock, 
  getAllClubs, 
  getClubDetails, 
  handleClubApproval, 
  getPendingRequests, 
  getDashboardStats 
} from '../controllers/adminController.js';
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth, admin);

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', getDashboardStats);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', getAllUsers);

// @route   GET /api/admin/users/:userId
// @desc    Get user details
// @access  Private (Admin)
router.get('/users/:userId', getUserDetails);

// @route   PUT /api/admin/users/:userId
// @desc    Update user
// @access  Private (Admin)
router.put('/users/:userId', updateUser);

// @route   PATCH /api/admin/users/:userId/block
// @desc    Block/unblock user
// @access  Private (Admin)
router.patch('/users/:userId/block', toggleUserBlock);

// @route   GET /api/admin/clubs
// @desc    Get all clubs
// @access  Private (Admin)
router.get('/clubs', getAllClubs);

// @route   GET /api/admin/clubs/:clubId
// @desc    Get club details
// @access  Private (Admin)
router.get('/clubs/:clubId', getClubDetails);

// @route   POST /api/admin/clubs/:clubId/approval
// @desc    Approve/reject club
// @access  Private (Admin)
router.post('/clubs/:clubId/approval', handleClubApproval);

// @route   GET /api/admin/requests
// @desc    Get pending requests
// @access  Private (Admin)
router.get('/requests', getPendingRequests);

export default router;
