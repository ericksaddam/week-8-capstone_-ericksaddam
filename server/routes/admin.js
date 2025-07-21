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
  getDashboardStats,
  getPendingClubRequests,
  getPendingJoinRequests,
  approveClubCreationRequest,
  rejectClubCreationRequest,
  approveJoinRequest,
  rejectJoinRequest,
  getAnalytics,
  getSystemSettings,
  updateSystemSettings,
  backupDatabase,
  clearCache,
  getUserActivityLogs,
  sendSystemNotification,
  getNotificationStats
} from '../controllers/adminController.js';
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth, admin);

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', getDashboardStats);

// @route   GET /api/admin/analytics
// @desc    Get analytics data
// @access  Private (Admin)
router.get('/analytics', getAnalytics);

// User Activity Logs
router.get('/activity-logs', getUserActivityLogs);

// Notification Management
router.post('/notifications/send', sendSystemNotification);
router.get('/notifications/stats', getNotificationStats);

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
// @desc    Get all pending requests (clubs and joins)
// @access  Private (Admin)
router.get('/requests', getPendingRequests);

// @route   GET /api/admin/club-requests
// @desc    Get pending club creation requests
// @access  Private (Admin)
router.get('/club-requests', getPendingClubRequests);

// @route   GET /api/admin/join-requests
// @desc    Get pending join requests
// @access  Private (Admin)
router.get('/join-requests', getPendingJoinRequests);

// @route   POST /api/admin/club-requests/:requestId/approve
// @desc    Approve club creation request
// @access  Private (Admin)
router.post('/club-requests/:requestId/approve', approveClubCreationRequest);

// @route   POST /api/admin/club-requests/:requestId/reject
// @desc    Reject club creation request
// @access  Private (Admin)
router.post('/club-requests/:requestId/reject', rejectClubCreationRequest);

// @route   POST /api/admin/clubs/:clubId/join-requests/:requestId/approve
// @desc    Approve join request
// @access  Private (Admin)
router.post('/clubs/:clubId/join-requests/:requestId/approve', approveJoinRequest);

// @route   POST /api/admin/clubs/:clubId/join-requests/:requestId/reject
// @desc    Reject join request
// @access  Private (Admin)
router.post('/clubs/:clubId/join-requests/:requestId/reject', rejectJoinRequest);

// @route   GET /api/admin/settings
// @desc    Get system settings and info
// @access  Private (Admin)
router.get('/settings', getSystemSettings);

// @route   PUT /api/admin/settings
// @desc    Update system settings
// @access  Private (Admin)
router.put('/settings', updateSystemSettings);

// @route   POST /api/admin/backup
// @desc    Backup database
// @access  Private (Admin)
router.post('/backup', backupDatabase);

// @route   POST /api/admin/cache/clear
// @desc    Clear system cache
// @access  Private (Admin)
router.post('/cache/clear', clearCache);

export default router;
