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
      .sort({ createdAt: -1 });

    res.json({
      clubs: clubs.map(club => {
        const userMember = club.members.find(m => m.user.toString() === req.user.id);
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

    const memberIndex = club.members.findIndex(m => m.user.toString() === req.user.id);
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
