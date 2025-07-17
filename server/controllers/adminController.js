import User from '../models/User.js';
import Club from '../models/Club.js';
import Task from '../models/Task.js';

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) query.role = role;
    if (status === 'blocked') query.isBlocked = true;
    if (status === 'active') query.isBlocked = { $ne: true };

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .populate('clubs', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: users.length,
        totalUsers: total
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get user details (admin only)
export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('clubs', 'name description status')
      .populate('tasks', 'title status priority type createdAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's club creation requests
    const clubRequests = await Club.find({ createdBy: user._id })
      .select('name status createdAt');

    res.json({
      user: {
        ...user.toObject(),
        clubRequests,
        taskCount: user.tasks.length,
        clubCount: user.clubs.length
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};

// Update user (admin only)
export const updateUser = async (req, res) => {
  try {
    const { name, email, role, isBlocked } = req.body;
    const userId = req.params.userId;

    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (role) updates.role = role;
    if (typeof isBlocked === 'boolean') updates.isBlocked = isBlocked;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Block/unblock user (admin only)
export const toggleUserBlock = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { isBlocked } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      user
    });
  } catch (error) {
    console.error('Toggle user block error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Get all clubs (admin only)
export const getAllClubs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const clubs = await Club.find(query)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Club.countDocuments(query);

    res.json({
      clubs: clubs.map(club => ({
        ...club.toObject(),
        memberCount: club.members.length,
        joinRequestCount: club.joinRequests.filter(r => r.status === 'pending').length
      })),
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: clubs.length,
        totalClubs: total
      }
    });
  } catch (error) {
    console.error('Get all clubs error:', error);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
};

// Get club details (admin only)
export const getClubDetails = async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')
      .populate('joinRequests.user', 'name email')
      .populate('tasks', 'title status priority createdAt');

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    res.json({
      club: {
        ...club.toObject(),
        memberCount: club.members.length,
        taskCount: club.tasks.length,
        pendingJoinRequests: club.joinRequests.filter(r => r.status === 'pending').length
      }
    });
  } catch (error) {
    console.error('Get club details error:', error);
    res.status(500).json({ error: 'Failed to fetch club details' });
  }
};

// Approve/reject club (admin only)
export const handleClubApproval = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const status = action === 'approve' ? 'approved' : 'rejected';

    const club = await Club.findByIdAndUpdate(
      clubId,
      { status },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    res.json({
      message: `Club ${action}d successfully`,
      club
    });
  } catch (error) {
    console.error('Handle club approval error:', error);
    res.status(500).json({ error: 'Failed to update club status' });
  }
};

// Get pending requests (admin only)
export const getPendingRequests = async (req, res) => {
  try {
    // Get pending club creation requests
    const pendingClubs = await Club.find({ status: 'pending' })
      .populate('createdBy', 'name email')
      .select('name description category createdBy createdAt')
      .sort({ createdAt: -1 });

    // Get pending join requests from all clubs
    const clubsWithJoinRequests = await Club.find({
      'joinRequests.status': 'pending'
    })
      .populate('joinRequests.user', 'name email')
      .select('name joinRequests')
      .sort({ createdAt: -1 });

    const pendingJoinRequests = [];
    clubsWithJoinRequests.forEach(club => {
      club.joinRequests.forEach(request => {
        if (request.status === 'pending') {
          pendingJoinRequests.push({
            _id: request._id,
            club: {
              _id: club._id,
              name: club.name
            },
            user: request.user,
            message: request.message,
            createdAt: request.createdAt
          });
        }
      });
    });

    res.json({
      pendingClubs,
      pendingJoinRequests,
      summary: {
        totalPendingClubs: pendingClubs.length,
        totalPendingJoinRequests: pendingJoinRequests.length
      }
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
};

// Get dashboard statistics (admin only)
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalClubs,
      totalTasks,
      blockedUsers,
      pendingClubs,
      approvedClubs,
      recentUsers,
      recentClubs
    ] = await Promise.all([
      User.countDocuments(),
      Club.countDocuments(),
      Task.countDocuments(),
      User.countDocuments({ isBlocked: true }),
      Club.countDocuments({ status: 'pending' }),
      Club.countDocuments({ status: 'approved' }),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt'),
      Club.find().sort({ createdAt: -1 }).limit(5).select('name status createdAt').populate('createdBy', 'name')
    ]);

    res.json({
      stats: {
        totalUsers,
        totalClubs,
        totalTasks,
        blockedUsers,
        pendingClubs,
        approvedClubs,
        activeUsers: totalUsers - blockedUsers
      },
      recent: {
        users: recentUsers,
        clubs: recentClubs
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};
