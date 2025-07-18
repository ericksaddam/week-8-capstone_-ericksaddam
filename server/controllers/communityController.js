import Club from '../models/Club.js';
import User from '../models/User.js';

// Create a community (pending admin approval)
export const createCommunity = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Community name is required' });
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });

    // Only club members can propose a community
    const isMember = club.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only club members can create communities' });

    // Prepare new community
    const newCommunity = {
      name,
      description: description || '',
      createdBy: req.user.id,
      status: 'pending',
      approvalRequestedBy: req.user.id,
      isArchived: false,
      members: [{ user: req.user.id, role: 'admin', joinedAt: new Date() }],
      createdAt: new Date(),
      tasks: [],
      chat: [],
      polls: []
    };
    club.communities.push(newCommunity);
    await club.save();
    const created = club.communities[club.communities.length - 1];
    res.status(201).json({ community: created, message: 'Community created and pending admin approval' });
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({ error: 'Failed to create community' });
  }
};

// Approve a community (admin)
export const approveCommunity = async (req, res) => {
  try {
    const { clubId, communityId } = req.params;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });

    // Find the community
    const community = club.communities.id(communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });

    // Check if user is club admin/owner
    const userMember = club.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['admin', 'owner'].includes(userMember.role)) {
      return res.status(403).json({ error: 'Only club admins can approve communities' });
    }

    // Update community status
    community.status = 'approved';
    community.approvalActionedBy = req.user.id;
    
    // Log the action
    await club.logAction('community_approved', req.user.id, { 
      communityId: community._id, 
      communityName: community.name 
    });
    
    await club.save();
    res.json({ community, message: 'Community approved successfully' });
  } catch (error) {
    console.error('Approve community error:', error);
    res.status(500).json({ error: 'Failed to approve community' });
  }
};

// Reject a community (admin)
export const rejectCommunity = async (req, res) => {
  try {
    const { clubId, communityId } = req.params;
    const { reason } = req.body;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });

    // Find the community
    const community = club.communities.id(communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });

    // Check if user is club admin/owner
    const userMember = club.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['admin', 'owner'].includes(userMember.role)) {
      return res.status(403).json({ error: 'Only club admins can reject communities' });
    }

    // Update community status
    community.status = 'rejected';
    community.approvalActionedBy = req.user.id;
    
    // Log the action
    await club.logAction('community_rejected', req.user.id, { 
      communityId: community._id, 
      communityName: community.name,
      reason: reason || 'No reason provided'
    });
    
    await club.save();
    res.json({ community, message: 'Community rejected successfully' });
  } catch (error) {
    console.error('Reject community error:', error);
    res.status(500).json({ error: 'Failed to reject community' });
  }
};

// Edit or archive a community
export const updateCommunity = async (req, res) => {
  try {
    const { clubId, communityId } = req.params;
    const { name, description, archive } = req.body;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });

    // Find the community
    const community = club.communities.id(communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });

    // Check if user is club admin/owner
    const userMember = club.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['admin', 'owner'].includes(userMember.role)) {
      return res.status(403).json({ error: 'Only club admins can update/archive communities' });
    }

    let action = '';
    if (archive === true) {
      community.isArchived = true;
      action = 'community_archived';
    } else {
      if (name) community.name = name;
      if (description !== undefined) community.description = description;
      action = 'community_updated';
    }

    await club.logAction(action, req.user.id, {
      communityId: community._id,
      communityName: community.name
    });
    await club.save();
    res.json({ community, message: action === 'community_archived' ? 'Community archived' : 'Community updated' });
  } catch (error) {
    console.error('Update community error:', error);
    res.status(500).json({ error: 'Failed to update/archive community' });
  }
};

// List all communities in a club
export const listCommunities = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { status } = req.query;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });

    let communities = club.communities.filter(c => !c.isArchived);
    if (status) {
      communities = communities.filter(c => c.status === status);
    }
    res.json({ communities });
  } catch (error) {
    console.error('List communities error:', error);
    res.status(500).json({ error: 'Failed to list communities' });
  }
};

// Delete (archive) a community
export const deleteCommunity = async (req, res) => {
  try {
    const { clubId, communityId } = req.params;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });

    // Find the community
    const community = club.communities.id(communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });

    // Check if user is club admin/owner
    const userMember = club.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !['admin', 'owner'].includes(userMember.role)) {
      return res.status(403).json({ error: 'Only club admins can archive communities' });
    }

    community.isArchived = true;
    await club.logAction('community_archived', req.user.id, {
      communityId: community._id,
      communityName: community.name
    });
    await club.save();
    res.json({ community, message: 'Community archived' });
  } catch (error) {
    console.error('Delete (archive) community error:', error);
    res.status(500).json({ error: 'Failed to archive community' });
  }
};

// Community-level: TASKS

// Create a task in a community
export const createCommunityTask = async (req, res) => {
  try {
    const { clubId, communityId } = req.params;
    const { title, description, dueDate } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required' });
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(communityId);
    if (!community || community.isArchived) return res.status(404).json({ error: 'Community not found' });

    // Check if user is a member of the community
    const isMember = community.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only community members can add tasks' });

    // Prepare new task
    const newTask = {
      title,
      description: description || '',
      createdBy: req.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      completed: false,
      createdAt: new Date()
    };
    community.tasks.push(newTask);
    await club.save();
    const created = community.tasks[community.tasks.length - 1];
    res.status(201).json({ task: created, message: 'Task created successfully' });
  } catch (error) {
    console.error('Create community task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// List all tasks in a community
export const listCommunityTasks = async (req, res) => {
  try {
    const { clubId, communityId } = req.params;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(communityId);
    if (!community || community.isArchived) return res.status(404).json({ error: 'Community not found' });

    // Check if user is a member of the community
    const isMember = community.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only community members can view tasks' });

    res.json({ tasks: community.tasks });
  } catch (error) {
    console.error('List community tasks error:', error);
    res.status(500).json({ error: 'Failed to list tasks' });
  }
};

// Update a task in a community
export const updateCommunityTask = async (req, res) => {
  try {
    const { clubId, communityId, taskId } = req.params;
    const { title, description, dueDate, completed } = req.body;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(communityId);
    if (!community || community.isArchived) return res.status(404).json({ error: 'Community not found' });

    // Check if user is a member of the community
    const isMember = community.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only community members can update tasks' });

    const task = community.tasks.id(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (completed !== undefined) task.completed = completed;

    await club.save();
    res.json({ task, message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update community task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// Delete a task in a community
export const deleteCommunityTask = async (req, res) => {
  try {
    const { clubId, communityId, taskId } = req.params;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(communityId);
    if (!community || community.isArchived) return res.status(404).json({ error: 'Community not found' });

    const task = community.tasks.id(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Permission: Only creator or community admin can delete
    const isCreator = task.createdBy.toString() === req.user.id;
    const userMember = community.members.find(m => m.user.toString() === req.user.id);
    const isAdmin = userMember && ['admin', 'owner'].includes(userMember.role);
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Only the task creator or a community admin can delete this task' });
    }

    task.remove();
    await club.save();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete community task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

// Community-level: CHAT

// Post a message in community chat
export const postCommunityMessage = async (req, res) => {
  try {
    const { clubId, communityId } = req.params;
    const { text } = req.body;
    if (!text || text.trim() === '') return res.status(400).json({ error: 'Message text is required' });
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(communityId);
    if (!community || community.isArchived) return res.status(404).json({ error: 'Community not found' });

    // Check if user is a member of the community
    const isMember = community.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only community members can post messages' });

    // Prepare new message
    const newMessage = {
      sender: req.user.id,
      text: text.trim(),
      createdAt: new Date()
    };
    community.chat.push(newMessage);
    await club.save();
    const created = community.chat[community.chat.length - 1];
    res.status(201).json({ message: created, info: 'Message posted successfully' });
  } catch (error) {
    console.error('Post community message error:', error);
    res.status(500).json({ error: 'Failed to post message' });
  }
};

// List all messages in community chat
export const listCommunityMessages = async (req, res) => {
  try {
    const { clubId, communityId } = req.params;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(communityId);
    if (!community || community.isArchived) return res.status(404).json({ error: 'Community not found' });

    // Check if user is a member of the community
    const isMember = community.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only community members can view messages' });

    res.json({ messages: community.chat });
  } catch (error) {
    console.error('List community messages error:', error);
    res.status(500).json({ error: 'Failed to list messages' });
  }
};

// Delete a message in community chat
export const deleteCommunityMessage = async (req, res) => {
  try {
    const { clubId, communityId, messageId } = req.params;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(communityId);
    if (!community || community.isArchived) return res.status(404).json({ error: 'Community not found' });

    const message = community.chat.id(messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Permission: Only sender or community admin can delete
    const isSender = message.sender.toString() === req.user.id;
    const userMember = community.members.find(m => m.user.toString() === req.user.id);
    const isAdmin = userMember && ['admin', 'owner'].includes(userMember.role);
    if (!isSender && !isAdmin) {
      return res.status(403).json({ error: 'Only the sender or a community admin can delete this message' });
    }

    message.remove();
    await club.save();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete community message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// Community-level: POLLS

// Create a poll in a community
export const createCommunityPoll = async (req, res) => {
  try {
    const { clubId, communityId } = req.params;
    const { question, options } = req.body;
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({ error: 'Poll question is required' });
    }
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'At least two options are required' });
    }
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(communityId);
    if (!community || community.isArchived) return res.status(404).json({ error: 'Community not found' });

    // Check if user is a member of the community
    const isMember = community.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only community members can create polls' });

    // Prepare new poll
    const newPoll = {
      question: question.trim(),
      options: options.map(opt => ({ text: opt, votes: [] })),
      createdBy: req.user.id,
      createdAt: new Date(),
      isClosed: false
    };
    community.polls.push(newPoll);
    await club.save();
    const created = community.polls[community.polls.length - 1];
    res.status(201).json({ poll: created, message: 'Poll created successfully' });
  } catch (error) {
    console.error('Create community poll error:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
};

// List all polls in a community
export const listCommunityPolls = async (req, res) => {
  try {
    const { clubId, communityId } = req.params;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(communityId);
    if (!community || community.isArchived) return res.status(404).json({ error: 'Community not found' });

    // Check if user is a member of the community
    const isMember = community.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only community members can view polls' });

    res.json({ polls: community.polls });
  } catch (error) {
    console.error('List community polls error:', error);
    res.status(500).json({ error: 'Failed to list polls' });
  }
};

// Vote on a poll in a community
export const voteCommunityPoll = async (req, res) => {
  try {
    const { clubId, communityId, pollId } = req.params;
    const { optionIndex } = req.body;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(communityId);
    if (!community || community.isArchived) return res.status(404).json({ error: 'Community not found' });
    const poll = community.polls.id(pollId);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    if (poll.isClosed) return res.status(400).json({ error: 'Poll is closed' });
    if (typeof optionIndex !== 'number' || optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid option index' });
    }
    // Check if user is a member of the community
    const isMember = community.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only community members can vote' });
    // Check if user already voted
    const alreadyVoted = poll.options.some(opt => opt.votes.some(v => v.toString() === req.user.id));
    if (alreadyVoted) return res.status(400).json({ error: 'You have already voted in this poll' });
    // Record vote
    poll.options[optionIndex].votes.push(req.user.id);
    await club.save();
    res.json({ poll, message: 'Vote recorded' });
  } catch (error) {
    console.error('Vote community poll error:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
};

// Delete a poll in a community
export const deleteCommunityPoll = async (req, res) => {
  try {
    const { clubId, communityId, pollId } = req.params;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(communityId);
    if (!community || community.isArchived) return res.status(404).json({ error: 'Community not found' });
    const poll = community.polls.id(pollId);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });

    // Permission: Only creator or community admin can delete
    const isCreator = poll.createdBy.toString() === req.user.id;
    const userMember = community.members.find(m => m.user.toString() === req.user.id);
    const isAdmin = userMember && ['admin', 'owner'].includes(userMember.role);
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Only the poll creator or a community admin can delete this poll' });
    }

    poll.remove();
    await club.save();
    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Delete community poll error:', error);
    res.status(500).json({ error: 'Failed to delete poll' });
  }
};



