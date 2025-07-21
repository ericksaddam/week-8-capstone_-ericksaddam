import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import clubRoutes from './routes/clubs.js';
import adminRoutes from './routes/admin.js';
import communitiesRoutes from './routes/communities.js';
import taskManagementRoutes from './routes/taskManagement.js';
import { auth } from './middleware/auth.js';
import { getUserClubs } from './controllers/clubController.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  'https://week-8-capstone-ericksaddam.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:8083',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:8082',
  'http://127.0.0.1:8083',
  process.env.CLIENT_URL
].filter(Boolean); // Filter out undefined/null values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like server-to-server or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      console.log('CORS origin allowed:', origin);
      callback(null, true);
    } else {
      console.error('CORS origin NOT allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Detailed request logging middleware
app.use((req, res, next) => {
  const { method, path, headers } = req;
  // Suppress health check logs to keep logs clean
  if (path === '/api/health' || path === '/health') {
    return next();
  }

  const logData = {
    timestamp: new Date().toISOString(),
    method,
    path,
    origin: headers.origin || 'N/A',
    referer: headers.referer || 'N/A',
  };

  console.log('Incoming Request:', JSON.stringify(logData, null, 2));
  
  next();
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/communities', communitiesRoutes);
app.use('/api', taskManagementRoutes);

// User-specific routes
app.get('/api/user/clubs', auth, getUserClubs);

// User profile endpoint
app.get('/api/profile', auth, (req, res) => {
  // Return the user profile from the auth middleware
  res.json(req.user);
});

// User stats endpoint with enhanced points system
app.get('/api/users/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Import models
    const Task = (await import('./models/Task.js')).default;
    const Club = (await import('./models/Club.js')).default;
    const User = (await import('./models/User.js')).default;
    
    // Get user's tasks
    const userTasks = await Task.find({ createdBy: userId });
    const completedTasks = userTasks.filter(task => task.status === 'completed');
    const pendingTasks = userTasks.filter(task => task.status === 'todo');
    const inProgressTasks = userTasks.filter(task => task.status === 'in_progress');
    
    // Get user's clubs with member details
    const userClubs = await Club.find({
      $or: [
        { 'members.user': userId },
        { owner: userId }
      ]
    });
    
    // Get user details for account age
    const user = await User.findById(userId);
    const accountAge = user ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // Enhanced Points Calculation System
    let totalPoints = 0;
    let pointsBreakdown = {
      taskCompletion: 0,
      clubParticipation: 0,
      leadership: 0,
      engagement: 0,
      bonuses: 0
    };
    
    // 1. Task Completion Points (based on priority)
    completedTasks.forEach(task => {
      let taskPoints = 10; // Base points
      
      // Priority multipliers
      switch(task.priority) {
        case 'low': taskPoints = 5; break;
        case 'medium': taskPoints = 10; break;
        case 'high': taskPoints = 15; break;
        case 'critical': taskPoints = 25; break;
        default: taskPoints = 10;
      }
      
      // Early completion bonus (if completed before due date)
      if (task.dueDate && task.updatedAt) {
        const dueDate = new Date(task.dueDate);
        const completedDate = new Date(task.updatedAt);
        if (completedDate < dueDate) {
          taskPoints += 5; // Early completion bonus
          pointsBreakdown.bonuses += 5;
        }
      }
      
      pointsBreakdown.taskCompletion += taskPoints;
      totalPoints += taskPoints;
    });
    
    // 2. Club Participation Points
    userClubs.forEach(club => {
      const userMember = club.members.find(member => member.user.toString() === userId);
      const isOwner = club.owner.toString() === userId;
      
      if (isOwner) {
        // Club ownership points
        pointsBreakdown.leadership += 25;
        totalPoints += 25;
      } else if (userMember) {
        // Regular membership points
        pointsBreakdown.clubParticipation += 5;
        totalPoints += 5;
        
        // Admin role bonus
        if (userMember.role === 'admin') {
          pointsBreakdown.leadership += 15;
          totalPoints += 15;
        }
      }
    });
    
    // 3. Engagement Bonuses
    // Account longevity bonus (1 point per week, max 52 points)
    const longevityBonus = Math.min(Math.floor(accountAge / 7), 52);
    pointsBreakdown.engagement += longevityBonus;
    totalPoints += longevityBonus;
    
    // Active user bonus (if has tasks in last 30 days)
    const recentTasks = userTasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return taskDate > thirtyDaysAgo;
    });
    
    if (recentTasks.length > 0) {
      pointsBreakdown.engagement += 10; // Active user bonus
      totalPoints += 10;
    }
    
    // 4. Achievement Milestones
    // First task completion
    if (completedTasks.length >= 1 && completedTasks.length < 5) {
      pointsBreakdown.bonuses += 20;
      totalPoints += 20;
    }
    
    // Task completion milestones
    const milestones = [5, 10, 25, 50, 100];
    milestones.forEach(milestone => {
      if (completedTasks.length >= milestone) {
        pointsBreakdown.bonuses += milestone * 2;
        totalPoints += milestone * 2;
      }
    });
    
    // Club creation milestone
    const ownedClubs = userClubs.filter(club => club.owner.toString() === userId);
    if (ownedClubs.length >= 1) {
      pointsBreakdown.bonuses += 50; // First club creation bonus
      totalPoints += 50;
    }
    
    const stats = {
      totalTasks: userTasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      inProgressTasks: inProgressTasks.length,
      clubs: userClubs.length,
      points: totalPoints,
      pointsBreakdown: pointsBreakdown,
      achievements: {
        firstTaskCompleted: completedTasks.length >= 1,
        taskMaster: completedTasks.length >= 10,
        clubLeader: ownedClubs.length >= 1,
        socialButterfly: userClubs.length >= 3,
        earlyBird: pointsBreakdown.bonuses > 0,
        veteran: accountAge >= 30
      },
      level: Math.floor(totalPoints / 100) + 1, // Level system (100 points per level)
      nextLevelPoints: 100 - (totalPoints % 100)
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Points explanation endpoint
app.get('/api/users/points-guide', auth, (req, res) => {
  const pointsGuide = {
    taskCompletion: {
      low: 5,
      medium: 10,
      high: 15,
      critical: 25,
      earlyCompletion: '+5 bonus'
    },
    clubParticipation: {
      membership: 5,
      adminRole: '+15 bonus',
      ownership: 25
    },
    engagement: {
      weeklyActivity: '1 point per week (max 52)',
      monthlyActive: '10 points if active in last 30 days'
    },
    achievements: {
      firstTask: 20,
      milestone5Tasks: 10,
      milestone10Tasks: 20,
      milestone25Tasks: 50,
      milestone50Tasks: 100,
      milestone100Tasks: 200,
      firstClub: 50
    },
    levelSystem: {
      pointsPerLevel: 100,
      description: 'Every 100 points = 1 level up'
    }
  };
  
  res.json(pointsGuide);
});

// Notifications endpoint (placeholder)
app.get('/api/notifications', auth, (req, res) => {
  // Return array directly to match frontend expectations
  res.json([]);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({ error: 'Validation Error', details: errors });
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(409).json({ error: `${field} already exists` });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  // Default error
  res.status(error.status || 500).json({ 
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

export default app;
