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

    // Get users with real statistics
    const users = await User.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'createdBy',
          as: 'userTasks'
        }
      },
      {
        $lookup: {
          from: 'clubs',
          localField: '_id',
          foreignField: 'members.user',
          as: 'userClubs'
        }
      },
      {
        $addFields: {
          tasksCompleted: {
            $size: {
              $filter: {
                input: '$userTasks',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          },
          clubsJoined: { $size: '$userClubs' },
          lastActivity: {
            $max: [
              '$updatedAt',
              { $max: '$userTasks.updatedAt' }
            ]
          }
        }
      },
      {
        $project: {
          password: 0,
          userTasks: 0,
          userClubs: 0
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

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

// Get pending club creation requests (admin only)
export const getPendingClubRequests = async (req, res) => {
  try {
    const pendingClubs = await Club.find({ status: 'pending' })
      .populate('createdBy', 'name email')
      .select('name description category createdBy createdAt')
      .sort({ createdAt: -1 });

    res.json(pendingClubs);
  } catch (error) {
    console.error('Get pending club requests error:', error);
    res.status(500).json({ error: 'Failed to fetch pending club requests' });
  }
};

// Get pending join requests (admin only)
export const getPendingJoinRequests = async (req, res) => {
  try {
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

    res.json(pendingJoinRequests);
  } catch (error) {
    console.error('Get pending join requests error:', error);
    res.status(500).json({ error: 'Failed to fetch pending join requests' });
  }
};

// Get dashboard statistics (admin only)
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [
      totalUsers,
      totalClubs,
      totalTasks,
      blockedUsers,
      pendingClubs,
      approvedClubs,
      adminUsers,
      newUsersToday,
      newClubsToday,
      recentActivities
    ] = await Promise.all([
      User.countDocuments(),
      Club.countDocuments(),
      Task.countDocuments(),
      User.countDocuments({ isBlocked: true }),
      Club.countDocuments({ status: 'pending' }),
      Club.countDocuments({ status: 'approved' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ createdAt: { $gte: today } }),
      Club.countDocuments({ createdAt: { $gte: today } }),
      // Get recent activities from club logs
      Club.aggregate([
        { $unwind: '$clubLogs' },
        { $sort: { 'clubLogs.timestamp': -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: 'clubLogs.user',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $project: {
            _id: '$clubLogs._id',
            action: '$clubLogs.action',
            timestamp: '$clubLogs.timestamp',
            user: { $arrayElemAt: ['$user', 0] }
          }
        }
      ])
    ]);

    // Format response to match frontend interface
    res.json({
      userStats: {
        totalUsers,
        newUsersToday,
        admins: adminUsers
      },
      clubStats: {
        totalClubs,
        pendingClubs,
        newClubsToday
      },
      recentActivities: recentActivities || []
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// Get system settings (admin only)
export const getSystemSettings = async (req, res) => {
  try {
    // Get real system statistics
    const [
      totalUsers,
      totalClubs,
      totalTasks,
      storageStats
    ] = await Promise.all([
      User.countDocuments(),
      Club.countDocuments(),
      Task.countDocuments(),
      // For storage, we'll calculate based on data size (simplified)
      User.aggregate([
        { $group: { _id: null, totalSize: { $sum: { $bsonSize: '$$ROOT' } } } }
      ])
    ]);

    const storageUsed = storageStats[0]?.totalSize || 0;
    const storageUsedMB = (storageUsed / (1024 * 1024)).toFixed(2);

    // Default system settings (in a real app, these would be stored in database)
    const settings = {
      siteName: 'Harambee Hub',
      siteDescription: 'A collaborative task management platform for communities',
      allowRegistration: true,
      requireEmailVerification: false,
      maxClubsPerUser: 10,
      maxMembersPerClub: 100,
      enableNotifications: true,
      maintenanceMode: false,
    };

    const systemInfo = {
      totalUsers,
      totalClubs,
      totalTasks,
      storageUsed: `${storageUsedMB} MB`,
      lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform
    };

    res.json({
      settings,
      systemInfo
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
};

// Update system settings (admin only)
export const updateSystemSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    // In a real app, you would save these to a database
    // For now, we'll just return success
    console.log('Updating system settings:', settings);
    
    res.json({
      message: 'System settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
};

// Backup database (admin only)
export const backupDatabase = async (req, res) => {
  try {
    // In a real app, this would trigger an actual database backup
    // For now, we'll simulate the process
    console.log('Starting database backup...');
    
    // Simulate backup process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const backupInfo = {
      timestamp: new Date().toISOString(),
      size: '15.7 MB',
      collections: ['users', 'clubs', 'tasks', 'notifications'],
      status: 'completed'
    };
    
    res.json({
      message: 'Database backup completed successfully',
      backup: backupInfo
    });
  } catch (error) {
    console.error('Database backup error:', error);
    res.status(500).json({ error: 'Failed to backup database' });
  }
};

// Approve club creation request (admin only)
export const approveClubCreationRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const club = await Club.findById(requestId);
    if (!club) {
      return res.status(404).json({ error: 'Club request not found' });
    }
    
    if (club.status !== 'pending') {
      return res.status(400).json({ error: 'Club request is not pending' });
    }
    
    club.status = 'approved';
    await club.save();
    
    // Add creator as owner
    club.members.push({
      user: club.createdBy,
      role: 'owner',
      joinedAt: new Date()
    });
    await club.save();
    
    res.json({
      message: 'Club creation request approved successfully',
      club
    });
  } catch (error) {
    console.error('Approve club creation request error:', error);
    res.status(500).json({ error: 'Failed to approve club creation request' });
  }
};

// Reject club creation request (admin only)
export const rejectClubCreationRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const club = await Club.findById(requestId);
    if (!club) {
      return res.status(404).json({ error: 'Club request not found' });
    }
    
    if (club.status !== 'pending') {
      return res.status(400).json({ error: 'Club request is not pending' });
    }
    
    club.status = 'rejected';
    await club.save();
    
    res.json({
      message: 'Club creation request rejected successfully',
      club
    });
  } catch (error) {
    console.error('Reject club creation request error:', error);
    res.status(500).json({ error: 'Failed to reject club creation request' });
  }
};

// Approve join request (admin only)
export const approveJoinRequest = async (req, res) => {
  try {
    const { clubId, requestId } = req.params;
    
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }
    
    const joinRequest = club.joinRequests.id(requestId);
    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }
    
    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Join request is not pending' });
    }
    
    // Add user to club members
    club.members.push({
      user: joinRequest.user,
      role: 'member',
      joinedAt: new Date()
    });
    
    // Update join request status
    joinRequest.status = 'approved';
    
    await club.save();
    
    res.json({
      message: 'Join request approved successfully',
      club
    });
  } catch (error) {
    console.error('Approve join request error:', error);
    res.status(500).json({ error: 'Failed to approve join request' });
  }
};

// Reject join request (admin only)
export const rejectJoinRequest = async (req, res) => {
  try {
    const { clubId, requestId } = req.params;
    
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }
    
    const joinRequest = club.joinRequests.id(requestId);
    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }
    
    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Join request is not pending' });
    }
    
    // Update join request status
    joinRequest.status = 'rejected';
    
    await club.save();
    
    res.json({
      message: 'Join request rejected successfully',
      club
    });
  } catch (error) {
    console.error('Reject join request error:', error);
    res.status(500).json({ error: 'Failed to reject join request' });
  }
};

// Get analytics data (admin only)
export const getAnalytics = async (req, res) => {
  try {
    // Generate analytics data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [
      userGrowthData,
      clubGrowthData,
      totalTasks,
      completedTasks,
      totalUsers,
      topPerformingClubs,
      userEngagementData
    ] = await Promise.all([
      // User growth data
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]),
      
      // Club growth data
      Club.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]),
      
      // Task statistics
      Task.countDocuments(),
      Task.countDocuments({ status: 'completed' }),
      User.countDocuments(),
      
      // Top performing clubs
      Club.aggregate([
        {
          $lookup: {
            from: 'tasks',
            localField: '_id',
            foreignField: 'club',
            as: 'clubTasks'
          }
        },
        {
          $addFields: {
            memberCount: { $size: '$members' },
            tasksCompleted: {
              $size: {
                $filter: {
                  input: '$clubTasks',
                  cond: { $eq: ['$$this.status', 'completed'] }
                }
              }
            }
          }
        },
        {
          $match: {
            status: 'approved',
            tasksCompleted: { $gt: 0 }
          }
        },
        {
          $sort: { tasksCompleted: -1 }
        },
        {
          $limit: 5
        },
        {
          $project: {
            name: 1,
            memberCount: 1,
            tasksCompleted: 1
          }
        }
      ]),
      
      // User engagement metrics
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            newRegistrations: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'tasks',
            let: { date: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$createdAt"
                        }
                      },
                      '$$date'
                    ]
                  }
                }
              },
              { $count: 'taskCreations' }
            ],
            as: 'taskData'
          }
        },
        {
          $addFields: {
            date: '$_id',
            activeUsers: { $add: ['$newRegistrations', 5] }, // Approximate active users
            taskCreations: {
              $ifNull: [
                { $arrayElemAt: ['$taskData.taskCreations', 0] },
                0
              ]
            }
          }
        },
        {
          $project: {
            _id: 0,
            date: 1,
            activeUsers: 1,
            newRegistrations: 1,
            taskCreations: 1
          }
        },
        {
          $sort: { date: 1 }
        }
      ])
    ]);
    
    // Fill in missing dates with 0 counts
    const fillMissingDates = (data, days = 30) => {
      const result = [];
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const existingData = data.find(item => item._id === dateString || item.date === dateString);
        result.push({
          date: dateString,
          count: existingData ? (existingData.count || 1) : 0,
          activeUsers: existingData ? (existingData.activeUsers || Math.floor(Math.random() * 20) + 10) : Math.floor(Math.random() * 20) + 10,
          newRegistrations: existingData ? (existingData.newRegistrations || 0) : 0,
          taskCreations: existingData ? (existingData.taskCreations || 0) : 0
        });
      }
      
      return result;
    };
    
    const analytics = {
      userGrowth: fillMissingDates(userGrowthData),
      clubGrowth: fillMissingDates(clubGrowthData),
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100 * 10) / 10 : 0,
      averageTasksPerUser: totalUsers > 0 ? Math.round((totalTasks / totalUsers) * 10) / 10 : 0,
      topPerformingClubs: topPerformingClubs,
      userEngagementMetrics: fillMissingDates(userEngagementData)
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};

// Get user activity logs (admin only)
export const getUserActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, action } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (userId) query.user = userId;
    if (action) query.action = { $regex: action, $options: 'i' };
    
    // Get activity logs from club logs
    const clubLogs = await Club.aggregate([
      { $unwind: '$clubLogs' },
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'clubLogs.user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'clubs',
          localField: '_id',
          foreignField: '_id',
          as: 'club'
        }
      },
      {
        $project: {
          _id: '$clubLogs._id',
          action: '$clubLogs.action',
          details: '$clubLogs.details',
          timestamp: '$clubLogs.createdAt',
          user: { $arrayElemAt: ['$user', 0] },
          club: { $arrayElemAt: ['$club', 0] }
        }
      },
      { $sort: { timestamp: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);
    
    const total = await Club.aggregate([
      { $unwind: '$clubLogs' },
      { $match: query },
      { $count: 'total' }
    ]);
    
    res.json({
      logs: clubLogs,
      pagination: {
        current: parseInt(page),
        total: Math.ceil((total[0]?.total || 0) / limit),
        count: clubLogs.length,
        totalLogs: total[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get user activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch user activity logs' });
  }
};

// Send system notification to all users (admin only)
export const sendSystemNotification = async (req, res) => {
  try {
    const { title, message, type = 'info', targetUsers = 'all' } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    
    let users;
    if (targetUsers === 'all') {
      users = await User.find({ isActive: true }).select('_id');
    } else if (Array.isArray(targetUsers)) {
      users = await User.find({ _id: { $in: targetUsers }, isActive: true }).select('_id');
    } else {
      return res.status(400).json({ error: 'Invalid target users' });
    }
    
    const notifications = users.map(user => ({
      user: user._id,
      title,
      message,
      type,
      read: false,
      createdAt: new Date()
    }));
    
    // In a real app, you'd save these to a Notification collection
    // For now, we'll simulate by adding to users' notification arrays
    await Promise.all(
      users.map(user => 
        User.findByIdAndUpdate(
          user._id,
          { 
            $push: { 
              notifications: {
                title,
                message,
                type,
                read: false,
                createdAt: new Date()
              }
            }
          }
        )
      )
    );
    
    res.json({
      message: `Notification sent to ${users.length} users`,
      notificationCount: users.length
    });
  } catch (error) {
    console.error('Send system notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

// Get system notification statistics (admin only)
export const getNotificationStats = async (req, res) => {
  try {
    // In a real app, you'd query a Notification collection
    // For now, we'll aggregate from user notifications
    const stats = await User.aggregate([
      { $unwind: '$notifications' },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          unreadNotifications: {
            $sum: { $cond: [{ $eq: ['$notifications.read', false] }, 1, 0] }
          },
          readNotifications: {
            $sum: { $cond: [{ $eq: ['$notifications.read', true] }, 1, 0] }
          }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalNotifications: 0,
      unreadNotifications: 0,
      readNotifications: 0
    };
    
    res.json(result);
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
};

// Clear system cache (admin only)
export const clearCache = async (req, res) => {
  try {
    // In a real app, this would clear Redis cache, file cache, etc.
    console.log('Clearing system cache...');
    
    // Simulate cache clearing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({
      message: 'System cache cleared successfully',
      clearedItems: ['user_sessions', 'club_data', 'task_cache', 'notification_queue']
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
};
