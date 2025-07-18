import Club from '../models/Club.js';
import User from '../models/User.js';

// Get all approved clubs (public)
export const getPublicClubs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    const query = { status: 'approved' };

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    const skip = (page - 1) * limit;

    const clubs = await Club.find(query)
      .select('name description category createdBy members createdAt')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Club.countDocuments(query);

    res.json({
      clubs: clubs.map(club => ({
        ...club.toObject(),
        memberCount: club.members.length
      })),
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: clubs.length,
        totalClubs: total
      }
    });
  } catch (error) {
    console.error('Get public clubs error:', error);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
};

// Get user's clubs
export const getUserClubs = async (req, res) => {
  try {
    const clubs = await Club.find({ 
      'members.user': req.user.id, 
      status: 'approved' 
    })
      .select('name description category members tasks createdAt')
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      clubs: clubs.map(club => {
        const userMember = club.members.find(m => m.user._id.toString() === req.user.id);
        return {
          ...club.toObject(),
          memberCount: club.members.length,
          userRole: userMember?.role,
          joinedAt: userMember?.joinedAt
        };
      })
    });
  } catch (error) {
    console.error('Get user clubs error:', error);
    res.status(500).json({ error: 'Failed to fetch user clubs' });
  }
};

// Get a specific club
export const getClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')
      .populate('tasks', 'title status priority dueDate');

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is a member or if club is public
    const isMember = club.members.some(m => m.user._id.toString() === req.user.id);
    const isPublic = club.status === 'approved';

    if (!isMember && !isPublic) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const userMember = club.members.find(m => m.user._id.toString() === req.user.id);

    res.json({
      club: {
        ...club.toObject(),
        memberCount: club.members.length,
        userRole: userMember?.role,
        joinedAt: userMember?.joinedAt,
        isMember
      }
    });
  } catch (error) {
    console.error('Get club error:', error);
    res.status(500).json({ error: 'Failed to fetch club' });
  }
};

// Create a new club
export const createClub = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Club name is required' });
    }

    // Check if club name already exists
    const existingClub = await Club.findOne({ name: name.trim() });
    if (existingClub) {
      return res.status(409).json({ error: 'Club name already exists' });
    }

    const club = new Club({
      name: name.trim(),
      description: description?.trim(),
      category: category?.trim(),
      createdBy: req.user.id,
      members: [{
        user: req.user.id,
        role: 'owner',
        joinedAt: new Date()
      }]
    });

    await club.save();
    await club.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Club created successfully and is pending approval',
      club: {
        ...club.toObject(),
        memberCount: club.members.length,
        userRole: 'owner'
      }
    });
  } catch (error) {
    console.error('Create club error:', error);
    res.status(500).json({ error: 'Failed to create club' });
  }
};

// Update a club
export const updateClub = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const clubId = req.params.id;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is owner or admin
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ error: 'Only club owners and admins can update club details' });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim();
    if (category !== undefined) updates.category = category?.trim();

    const updatedClub = await Club.findByIdAndUpdate(
      clubId,
      updates,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');

    res.json({
      message: 'Club updated successfully',
      club: {
        ...updatedClub.toObject(),
        memberCount: updatedClub.members.length,
        userRole: member.role
      }
    });
  } catch (error) {
    console.error('Update club error:', error);
    res.status(500).json({ error: 'Failed to update club' });
  }
};

// Request to join a club
export const requestJoinClub = async (req, res) => {
  try {
    const { message } = req.body;
    const clubId = req.params.id;

    const club = await Club.findById(clubId);
    if (!club || club.status !== 'approved') {
      return res.status(404).json({ error: 'Club not found or not approved' });
    }

    // Check if user is already a member
    const isMember = club.members.some(m => m.user.toString() === req.user.id);
    if (isMember) {
      return res.status(400).json({ error: 'You are already a member of this club' });
    }

    // Check if user has already requested to join
    const existingRequest = club.joinRequests.find(r => 
      r.user.toString() === req.user.id && r.status === 'pending'
    );
    if (existingRequest) {
      return res.status(400).json({ error: 'You have already requested to join this club' });
    }

    club.joinRequests.push({
      user: req.user.id,
      message: message?.trim(),
      status: 'pending'
    });

    await club.save();

    res.json({ message: 'Join request sent successfully' });
  } catch (error) {
    console.error('Request join club error:', error);
    res.status(500).json({ error: 'Failed to send join request' });
  }
};

// Approve/reject join request
export const handleJoinRequest = async (req, res) => {
  try {
    const { clubId, requestId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is owner or admin
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ error: 'Only club owners and admins can handle join requests' });
    }

    const joinRequest = club.joinRequests.id(requestId);
    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Join request has already been processed' });
    }

    if (action === 'approve') {
      // Add user to club members
      club.members.push({
        user: joinRequest.user,
        role: 'member',
        joinedAt: new Date()
      });
      joinRequest.status = 'approved';
    } else if (action === 'reject') {
      joinRequest.status = 'rejected';
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Remove the processed request from the array
    club.joinRequests.pull(requestId);

    await club.save();

    res.json({ 
      message: `Join request ${action}d successfully` 
    });
  } catch (error) {
    console.error('Handle join request error:', error);
    res.status(500).json({ error: 'Failed to handle join request' });
  }
};

// Leave a club
export const leaveClub = async (req, res) => {
  try {
    const clubId = req.params.id;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const memberIndex = club.members.findIndex(m => m.user._id.toString() === req.user.id);
    if (memberIndex === -1) {
      return res.status(400).json({ error: 'You are not a member of this club' });
    }

    const member = club.members[memberIndex];
    if (member.role === 'owner') {
      return res.status(400).json({ error: 'Club owner cannot leave the club. Transfer ownership first.' });
    }

    club.members.splice(memberIndex, 1);
    await club.save();

    res.json({ message: 'Left club successfully' });
  } catch (error) {
    console.error('Leave club error:', error);
    res.status(500).json({ error: 'Failed to leave club' });
  }
};

// Get club members
export const getClubMembers = async (req, res) => {
  try {
    const clubId = req.params.id;

    const club = await Club.findById(clubId)
      .populate('members.user', 'name email createdAt');

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is a member
    const isMember = club.members.some(m => m.user._id.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      members: club.members.map(member => ({
        id: member._id,
        user: member.user,
        role: member.role,
        joinedAt: member.joinedAt
      }))
    });
  } catch (error) {
    console.error('Get club members error:', error);
    res.status(500).json({ error: 'Failed to fetch club members' });
  }
};

// Create club goal
export const createClubGoal = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { title, description, targetDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Goal title is required' });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is a member with admin/owner role or system admin
    const isSystemAdmin = req.user.role === 'admin';
    const member = club.members.find(m => {
      const userId = typeof m.user === 'object' ? m.user._id.toString() : m.user.toString();
      return userId === req.user.id;
    });
    
    if (!isSystemAdmin && (!member || (member.role !== 'admin' && member.role !== 'owner'))) {
      return res.status(403).json({ error: 'Only club admins and owners can create goals' });
    }

    const newGoal = {
      title: title.trim(),
      description: description?.trim(),
      targetDate: targetDate ? new Date(targetDate) : undefined,
      createdBy: req.user.id,
      status: 'active'
    };

    club.goals.push(newGoal);
    await club.save();
    await club.logAction('goal_created', req.user.id, { goalTitle: title });

    const createdGoal = club.goals[club.goals.length - 1];
    await club.populate('goals.createdBy', 'name email');

    res.status(201).json({
      message: 'Goal created successfully',
      goal: createdGoal
    });
  } catch (error) {
    console.error('Create club goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

// Get club goals
export const getClubGoals = async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId)
      .populate('goals.createdBy', 'name email');

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is a member or admin
    const isAdmin = req.user.role === 'admin';
    const isMember = club.members.some(m => {
      const userId = typeof m.user === 'object' ? m.user._id.toString() : m.user.toString();
      return userId === req.user.id;
    });
    
    if (!isMember && !isAdmin && club.status !== 'approved') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ goals: club.goals });
  } catch (error) {
    console.error('Get club goals error:', error);
    res.status(500).json({ error: 'Failed to fetch club goals' });
  }
};

// Create club topic
export const createClubTopic = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Topic title is required' });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is a member or admin
    const isAdmin = req.user.role === 'admin';
    const isMember = club.members.some(m => {
      const userId = typeof m.user === 'object' ? m.user._id.toString() : m.user.toString();
      return userId === req.user.id;
    });
    
    if (!isMember && !isAdmin) {
      return res.status(403).json({ error: 'Only club members can create topics' });
    }

    const newTopic = {
      title: title.trim(),
      description: description?.trim(),
      createdBy: req.user.id
    };

    club.topics.push(newTopic);
    await club.save();
    await club.logAction('topic_created', req.user.id, { topicTitle: title });

    const createdTopic = club.topics[club.topics.length - 1];
    await club.populate('topics.createdBy', 'name email');

    res.status(201).json({
      message: 'Topic created successfully',
      topic: createdTopic
    });
  } catch (error) {
    console.error('Create club topic error:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
};

// Get club topics
export const getClubTopics = async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId)
      .populate('topics.createdBy', 'name email');

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is a member or admin
    const isAdmin = req.user.role === 'admin';
    const isMember = club.members.some(m => {
      const userId = typeof m.user === 'object' ? m.user._id.toString() : m.user.toString();
      return userId === req.user.id;
    });
    
    if (!isMember && !isAdmin && club.status !== 'approved') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ topics: club.topics });
  } catch (error) {
    console.error('Get club topics error:', error);
    res.status(500).json({ error: 'Failed to fetch club topics' });
  }
};

// Create knowledge base entry
export const createKnowledgeBaseEntry = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is a member or admin
    const isAdmin = req.user.role === 'admin';
    const isMember = club.members.some(m => {
      const userId = typeof m.user === 'object' ? m.user._id.toString() : m.user.toString();
      return userId === req.user.id;
    });
    
    if (!isMember && !isAdmin) {
      return res.status(403).json({ error: 'Only club members can create knowledge base entries' });
    }

    const newEntry = {
      title: title.trim(),
      content: content.trim(),
      tags: tags || [],
      createdBy: req.user.id
    };

    club.knowledgeBase.push(newEntry);
    await club.save();
    await club.logAction('kb_entry_created', req.user.id, { entryTitle: title });

    const createdEntry = club.knowledgeBase[club.knowledgeBase.length - 1];
    await club.populate('knowledgeBase.createdBy', 'name email');

    res.status(201).json({
      message: 'Knowledge base entry created successfully',
      entry: createdEntry
    });
  } catch (error) {
    console.error('Create knowledge base entry error:', error);
    res.status(500).json({ error: 'Failed to create knowledge base entry' });
  }
};

// Get knowledge base entries
export const getKnowledgeBase = async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId)
      .populate('knowledgeBase.createdBy', 'name email');

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is a member or admin
    const isAdmin = req.user.role === 'admin';
    const isMember = club.members.some(m => {
      const userId = typeof m.user === 'object' ? m.user._id.toString() : m.user.toString();
      return userId === req.user.id;
    });
    
    if (!isMember && !isAdmin && club.status !== 'approved') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ knowledgeBase: club.knowledgeBase });
  } catch (error) {
    console.error('Get knowledge base error:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
};

// Add a reply to a topic
export const addTopicReply = async (req, res) => {
  try {
    const { clubId, topicId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ error: 'Reply content is required' });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is a member or admin
    const isAdmin = req.user.role === 'admin';
    const isMember = club.members.some(m => {
      const memberId = typeof m.user === 'object' ? m.user._id.toString() : m.user.toString();
      return memberId === userId;
    });
    
    if (!isMember && !isAdmin) {
      return res.status(403).json({ error: 'Only club members can reply to topics' });
    }

    const topic = club.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const newReply = {
      user: userId,
      content,
      createdAt: new Date()
    };

    topic.replies.push(newReply);
    await club.save();

    // Populate user details in the response
    const populatedClub = await Club.populate(club, {
      path: 'topics.replies.user',
      select: 'name email avatar'
    });

    const savedReply = populatedClub.topics.id(topicId).replies[topic.replies.length - 1];
    
    res.status(201).json({ reply: savedReply });
  } catch (error) {
    console.error('Add topic reply error:', error);
    res.status(500).json({ error: 'Failed to add reply to topic' });
  }
};

// Get all replies for a topic
export const getTopicReplies = async (req, res) => {
  try {
    const { clubId, topicId } = req.params;

    const club = await Club.findById(clubId).populate({
      path: 'topics.replies.user',
      select: 'name email avatar'
    });
    
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is a member or admin
    const isAdmin = req.user.role === 'admin';
    const isMember = club.members.some(m => {
      const memberId = typeof m.user === 'object' ? m.user._id.toString() : m.user.toString();
      return memberId === req.user.id;
    });
    
    if (!isMember && !isAdmin && club.status !== 'approved') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const topic = club.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json({ replies: topic.replies });
  } catch (error) {
    console.error('Get topic replies error:', error);
    res.status(500).json({ error: 'Failed to fetch topic replies' });
  }
};

// Update club member role
export const updateMemberRole = async (req, res) => {
  try {
    const { clubId, memberId } = req.params;
    const { role } = req.body;

    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is owner
    const requesterMember = club.members.find(m => m.user.toString() === req.user.id);
    if (!requesterMember || requesterMember.role !== 'owner') {
      return res.status(403).json({ error: 'Only club owners can update member roles' });
    }

    const targetMember = club.members.id(memberId);
    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (targetMember.role === 'owner') {
      return res.status(400).json({ error: 'Cannot change owner role' });
    }

    targetMember.role = role;
    await club.save();
    await club.logAction('member_role_updated', req.user.id, { 
      memberId: targetMember.user, 
      newRole: role 
    });

    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
};

// Remove club member
export const removeMember = async (req, res) => {
  try {
    const { clubId, memberId } = req.params;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is owner or admin
    const requesterMember = club.members.find(m => m.user.toString() === req.user.id);
    if (!requesterMember || (requesterMember.role !== 'owner' && requesterMember.role !== 'admin')) {
      return res.status(403).json({ error: 'Only club owners and admins can remove members' });
    }

    const targetMember = club.members.id(memberId);
    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (targetMember.role === 'owner') {
      return res.status(400).json({ error: 'Cannot remove club owner' });
    }

    // Admins cannot remove other admins, only owners can
    if (targetMember.role === 'admin' && requesterMember.role !== 'owner') {
      return res.status(403).json({ error: 'Only club owners can remove admins' });
    }

    club.members.pull(memberId);
    await club.save();
    await club.logAction('member_removed', req.user.id, { 
      removedMemberId: targetMember.user 
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};
