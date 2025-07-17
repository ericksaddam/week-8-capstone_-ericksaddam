import express from 'express';
import { 
  getPublicClubs, 
  getUserClubs, 
  getClub, 
  createClub, 
  updateClub, 
  requestJoinClub, 
  handleJoinRequest, 
  leaveClub, 
  getClubMembers 
} from '../controllers/clubController.js';
import { auth, clubAdmin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/clubs/public
// @desc    Get all approved clubs (public)
// @access  Private
router.get('/public', auth, getPublicClubs);

// @route   GET /api/clubs/user
// @desc    Get user's clubs
// @access  Private
router.get('/user', auth, getUserClubs);

// @route   GET /api/clubs/:id
// @desc    Get a specific club
// @access  Private
router.get('/:id', auth, getClub);

// @route   POST /api/clubs
// @desc    Create a new club
// @access  Private
router.post('/', auth, createClub);

// @route   PUT /api/clubs/:id
// @desc    Update a club
// @access  Private (Club Admin/Owner)
router.put('/:id', auth, updateClub);

// @route   POST /api/clubs/:id/join
// @desc    Request to join a club
// @access  Private
router.post('/:id/join', auth, requestJoinClub);

// @route   POST /api/clubs/:clubId/join-requests/:requestId
// @desc    Approve/reject join request
// @access  Private (Club Admin/Owner)
router.post('/:clubId/join-requests/:requestId', auth, handleJoinRequest);

// @route   DELETE /api/clubs/:id/leave
// @desc    Leave a club
// @access  Private
router.delete('/:id/leave', auth, leaveClub);

// @route   GET /api/clubs/:id/members
// @desc    Get club members
// @access  Private (Club Members)
router.get('/:id/members', auth, getClubMembers);

export default router;
