import express from 'express';
import {
  createCommunity,
  approveCommunity,
  rejectCommunity,
  updateCommunity,
  deleteCommunity,
  listCommunities
} from '../controllers/communityController.js';
import { auth, clubAdmin } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Create a community (pending approval)
router.post('/clubs/:clubId/communities', auth, createCommunity);

// Approve a community (admin only)
router.patch('/clubs/:clubId/communities/:communityId/approve', auth, clubAdmin, approveCommunity);

// Reject a community (admin only)
router.patch('/clubs/:clubId/communities/:communityId/reject', auth, clubAdmin, rejectCommunity);

// Edit or archive a community
router.patch('/clubs/:clubId/communities/:communityId', auth, clubAdmin, updateCommunity);

// Delete (archive) a community
router.delete('/clubs/:clubId/communities/:communityId', auth, clubAdmin, deleteCommunity);

// List all communities in a club
router.get('/clubs/:clubId/communities', auth, listCommunities);

// Community TASK routes
import {
  createCommunityTask,
  listCommunityTasks,
  updateCommunityTask,
  deleteCommunityTask
} from '../controllers/communityController.js';

// Create a task in a community
router.post('/clubs/:clubId/communities/:communityId/tasks', auth, createCommunityTask);
// List all tasks in a community
router.get('/clubs/:clubId/communities/:communityId/tasks', auth, listCommunityTasks);
// Update a task in a community
router.patch('/clubs/:clubId/communities/:communityId/tasks/:taskId', auth, updateCommunityTask);
// Delete a task in a community
router.delete('/clubs/:clubId/communities/:communityId/tasks/:taskId', auth, deleteCommunityTask);

// Community CHAT routes
import {
  postCommunityMessage,
  listCommunityMessages,
  deleteCommunityMessage
} from '../controllers/communityController.js';

// Post a message in community chat
router.post('/clubs/:clubId/communities/:communityId/chat', auth, postCommunityMessage);
// List all messages in community chat
router.get('/clubs/:clubId/communities/:communityId/chat', auth, listCommunityMessages);
// Delete a message in community chat
router.delete('/clubs/:clubId/communities/:communityId/chat/:messageId', auth, deleteCommunityMessage);

// Community POLL routes
import {
  createCommunityPoll,
  listCommunityPolls,
  voteCommunityPoll,
  deleteCommunityPoll
} from '../controllers/communityController.js';

// Create a poll in a community
router.post('/clubs/:clubId/communities/:communityId/polls', auth, createCommunityPoll);
// List all polls in a community
router.get('/clubs/:clubId/communities/:communityId/polls', auth, listCommunityPolls);
// Vote on a poll in a community
router.post('/clubs/:clubId/communities/:communityId/polls/:pollId/vote', auth, voteCommunityPoll);
// Delete a poll in a community
router.delete('/clubs/:clubId/communities/:communityId/polls/:pollId', auth, deleteCommunityPoll);

export default router;
