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
  getClubMembers,
  createClubGoal,
  getClubGoals,
  createClubTopic,
  getClubTopics,
  addTopicReply,
  getTopicReplies,
  createKnowledgeBaseEntry,
  getKnowledgeBase,
  updateMemberRole,
  removeMember
} from '../controllers/clubController.js';
import { auth, clubAdmin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/clubs
// @desc    Get all approved clubs (public)
// @access  Private
router.get('/', auth, getPublicClubs);

// @route   GET /api/clubs/public
// @desc    Get all approved clubs (public) - alias
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

// @route   POST /api/clubs/:clubId/goals
// @desc    Create a club goal
// @access  Private (Club Admin/Owner)
router.post('/:clubId/goals', auth, createClubGoal);

// @route   GET /api/clubs/:clubId/goals
// @desc    Get club goals
// @access  Private (Club Members)
router.get('/:clubId/goals', auth, getClubGoals);

// @route   POST /api/clubs/:clubId/topics
// @desc    Create a club topic
// @access  Private (Club Members)
router.post('/:clubId/topics', auth, createClubTopic);

// @route   GET /api/clubs/:clubId/topics
// @desc    Get club topics
// @access  Private (Club Members)
router.get('/:clubId/topics', auth, getClubTopics);

// @route   POST /api/clubs/:clubId/topics/:topicId/replies
// @desc    Add a reply to a topic
// @access  Private (Club Members)
router.post('/:clubId/topics/:topicId/replies', auth, addTopicReply);

// @route   GET /api/clubs/:clubId/topics/:topicId/replies
// @desc    Get all replies for a topic
// @access  Private (Club Members)
router.get('/:clubId/topics/:topicId/replies', auth, getTopicReplies);

// @route   POST /api/clubs/:clubId/knowledge
// @desc    Create a knowledge base entry
// @access  Private (Club Members)
router.post('/:clubId/knowledge', auth, createKnowledgeBaseEntry);

// @route   GET /api/clubs/:clubId/knowledge
// @desc    Get knowledge base entries
// @access  Private (Club Members)
router.get('/:clubId/knowledge', auth, getKnowledgeBase);

// @route   PUT /api/clubs/:clubId/members/:memberId/role
// @desc    Update member role
// @access  Private (Club Owner)
router.put('/:clubId/members/:memberId/role', auth, updateMemberRole);

// @route   DELETE /api/clubs/:clubId/members/:memberId
// @desc    Remove club member
// @access  Private (Club Admin/Owner)
router.delete('/:clubId/members/:memberId', auth, removeMember);

export default router;
