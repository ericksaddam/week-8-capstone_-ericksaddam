import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/harambee';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(express.json());

// Basic Mongoose models
const taskSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['personal', 'club'],
    required: true,
    default: 'personal'
  },
  title: { type: String, required: true },
  description: String,
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'archived'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: Date,
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    // Required only if type is 'club'
    required: function() { return this.type === 'club'; }
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
const Task = mongoose.model('Task', taskSchema);

const clubSchema = new mongoose.Schema({
  clubLogs: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    action: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    details: { type: Object },
    createdAt: { type: Date, default: Date.now }
  }],
  communities: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
    members: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['member', 'admin'], default: 'member' },
      joinedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    chat: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      message: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
    polls: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      question: { type: String, required: true },
      options: [{ text: String, votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }],
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    }]
  }],
  knowledgeBase: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 }
  }],
  topics: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    replies: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      content: { type: String, required: true },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    }]
  }],
  goals: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  purpose: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: String,
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['member', 'admin', 'owner'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    joinRequests: {
      type: Boolean,
      default: true
    }
  },
  joinRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }]
});
const Club = mongoose.model('Club', clubSchema);

const userSchema = new mongoose.Schema({
  notifications: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  name: String,
  email: { type: String, unique: true },
  phone: { type: String },
  bio: { type: String, maxlength: 500 },
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isBlocked: { type: Boolean, default: false },
  clubs: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Club' 
  }],
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Africa/Nairobi' }
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});
const User = mongoose.model('User', userSchema);

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        isBlocked: user.isBlocked || false,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      } 
    });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// JWT Auth Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('No token provided');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });
    if (!user) throw new Error('User not found');
    if (user.isBlocked) throw new Error('Account is blocked');
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    // Attach user data to request
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked || false
    };
    req.token = token;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Please authenticate: ' + e.message });
  }
};

// Admin Middleware
const admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// API routes

// ========== ADMIN: USER DETAILS ========== //
app.get('/api/admin/users/:userId/details', auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Clubs with role
    const clubs = await Club.find({ 'members.user': user._id, status: 'approved' })
      .select('name members')
      .lean();
    const clubsWithRole = clubs.map(club => {
      const member = club.members.find(m => m.user.toString() === user._id.toString());
      return {
        _id: club._id,
        name: club.name,
        role: member ? member.role : null
      };
    });
    // Club tasks
    const clubIds = clubs.map(c => c._id);
    const clubTasks = await Task.find({ type: 'club', club: { $in: clubIds }, $or: [
      { createdBy: user._id },
      { assignedTo: user._id }
    ] }).lean();
    // Private tasks
    const privateTasks = await Task.find({ type: 'personal', createdBy: user._id }).lean();
    // Activity log (simple: login history)
    const activity = [];
    if (user.lastLogin) activity.push({ type: 'login', timestamp: user.lastLogin });
    // TODO: If you have an activity log model, fetch here
    res.json({
      profile: user,
      clubs: clubsWithRole,
      clubTasks,
      privateTasks,
      activity
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// ========== CLUB COMMUNITIES ========== //
// Request to create a community (member)
app.post('/api/clubs/:clubId/communities/request', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member) return res.status(403).json({ error: 'Only club members can request a community' });
    const exists = club.communities.find(c => c.name === req.body.name);
    if (exists) return res.status(400).json({ error: 'Community name already exists' });
    const community = {
      name: req.body.name,
      description: req.body.description,
      createdBy: req.user.id,
      status: 'pending',
      members: [{ user: req.user.id, role: 'member', joinedAt: new Date() }],
      createdAt: new Date(),
      tasks: [],
      chat: [],
      polls: []
    };
    club.communities.push(community);
    await club.save();
    res.status(201).json(club.communities[club.communities.length - 1]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to request community' });
  }
});
// List communities (all club members)
app.get('/api/clubs/:clubId/communities', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member) return res.status(403).json({ error: 'Only club members can view communities' });
    res.json(club.communities || []);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});
// Approve community (admin)
app.post('/api/clubs/:clubId/communities/:communityId/approve', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Only club admins/owners can approve communities' });
    }
    const community = club.communities.id(req.params.communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });
    community.status = 'approved';
    await club.save();
    res.json(community);
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve community' });
  }
});
// Join community (member)
app.post('/api/clubs/:clubId/communities/:communityId/join', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member) return res.status(403).json({ error: 'Only club members can join communities' });
    const community = club.communities.id(req.params.communityId);
    if (!community || community.status !== 'approved') return res.status(404).json({ error: 'Community not found or not approved' });
    if (community.members.some(m => m.user.toString() === req.user.id)) {
      return res.status(400).json({ error: 'Already a community member' });
    }
    community.members.push({ user: req.user.id, role: 'member', joinedAt: new Date() });
    await club.save();
    res.json(community);
  } catch (e) {
    res.status(500).json({ error: 'Failed to join community' });
  }
});

// ========== COMMUNITY TASKS ========== //
// Create community task (community member)
app.post('/api/clubs/:clubId/communities/:communityId/tasks', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(req.params.communityId);
    if (!community || community.status !== 'approved') return res.status(404).json({ error: 'Community not found or not approved' });
    const isMember = community.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only community members can create tasks' });
    const task = new Task({ ...req.body, type: 'community', createdBy: req.user.id });
    await task.save();
    community.tasks.push(task._id);
    await club.save();
    res.status(201).json(task);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create community task' });
  }
});
// List community tasks (community member)
app.get('/api/clubs/:clubId/communities/:communityId/tasks', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId).populate({
      path: 'communities.tasks',
      model: 'Task'
    });
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(req.params.communityId);
    if (!community || community.status !== 'approved') return res.status(404).json({ error: 'Community not found or not approved' });
    const isMember = community.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only community members can view tasks' });
    res.json(community.tasks || []);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch community tasks' });
  }
});

// ========== COMMUNITY CHAT ========== //
// Send message (community member)
app.post('/api/clubs/:clubId/communities/:communityId/chat', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(req.params.communityId);
    if (!community || community.status !== 'approved') return res.status(404).json({ error: 'Community not found or not approved' });
    const isMember = community.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only community members can chat' });
    const message = {
      user: req.user.id,
      message: req.body.message,
      createdAt: new Date()
    };
    community.chat.push(message);
    await club.save();
    res.status(201).json(message);
  } catch (e) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});
// Get messages (community member)
app.get('/api/clubs/:clubId/communities/:communityId/chat', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(req.params.communityId);
    if (!community || community.status !== 'approved') return res.status(404).json({ error: 'Community not found or not approved' });
    const isMember = community.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only community members can view chat' });
    res.json(community.chat || []);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// ========== COMMUNITY POLLS ========== //
// Create poll (community member)
app.post('/api/clubs/:clubId/communities/:communityId/polls', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(req.params.communityId);
    if (!community || community.status !== 'approved') return res.status(404).json({ error: 'Community not found or not approved' });
    const isMember = community.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only community members can create polls' });
    const poll = {
      question: req.body.question,
      options: (req.body.options || []).map(o => ({ text: o, votes: [] })),
      createdBy: req.user.id,
      createdAt: new Date()
    };
    community.polls.push(poll);
    await club.save();
    res.status(201).json(community.polls[community.polls.length - 1]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create poll' });
  }
});
// List polls (community member)
app.get('/api/clubs/:clubId/communities/:communityId/polls', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(req.params.communityId);
    if (!community || community.status !== 'approved') return res.status(404).json({ error: 'Community not found or not approved' });
    const isMember = community.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only community members can view polls' });
    res.json(community.polls || []);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});
// Vote in poll (community member)
app.post('/api/clubs/:clubId/communities/:communityId/polls/:pollId/vote', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const community = club.communities.id(req.params.communityId);
    if (!community || community.status !== 'approved') return res.status(404).json({ error: 'Community not found or not approved' });
    const isMember = community.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Only community members can vote' });
    const poll = community.polls.id(req.params.pollId);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    const { optionIndex } = req.body;
    if (typeof optionIndex !== 'number' || optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid option index' });
    }
    // Prevent double voting
    if (poll.options[optionIndex].votes.some(uid => uid.toString() === req.user.id)) {
      return res.status(400).json({ error: 'Already voted' });
    }
    poll.options[optionIndex].votes.push(req.user.id);
    await club.save();
    res.json(poll);
  } catch (e) {
    res.status(500).json({ error: 'Failed to vote in poll' });
  }
});

// ========== CLUB KNOWLEDGE BASE / SOPs ========== //
// List knowledge base entries (all members)
app.get('/api/clubs/:clubId/knowledge-base', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member) return res.status(403).json({ error: 'Only club members can view knowledge base' });
    res.json(club.knowledgeBase || []);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});
// Create knowledge base entry (admin/owner)
app.post('/api/clubs/:clubId/knowledge-base', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Only club admins/owners can create knowledge base entries' });
    }
    const entry = {
      title: req.body.title,
      content: req.body.content,
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };
    club.knowledgeBase.push(entry);
    await club.save();
    res.status(201).json(club.knowledgeBase[club.knowledgeBase.length - 1]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create knowledge base entry' });
  }
});
// Update knowledge base entry (admin/owner)
app.put('/api/clubs/:clubId/knowledge-base/:entryId', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Only club admins/owners can update knowledge base entries' });
    }
    const entry = club.knowledgeBase.id(req.params.entryId);
    if (!entry) return res.status(404).json({ error: 'Knowledge base entry not found' });
    entry.title = req.body.title || entry.title;
    entry.content = req.body.content || entry.content;
    entry.updatedAt = new Date();
    entry.version = (entry.version || 1) + 1;
    await club.save();
    res.json(entry);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update knowledge base entry' });
  }
});
// Delete knowledge base entry (admin/owner)
app.delete('/api/clubs/:clubId/knowledge-base/:entryId', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Only club admins/owners can delete knowledge base entries' });
    }
    club.knowledgeBase = club.knowledgeBase.filter(e => e._id.toString() !== req.params.entryId);
    await club.save();
    res.json({ message: 'Knowledge base entry deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete knowledge base entry' });
  }
});

// ========== CLUB TOPICS (FORUM) ========== //
// List topics
app.get('/api/clubs/:clubId/topics', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member) return res.status(403).json({ error: 'Only club members can view topics' });
    res.json(club.topics || []);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});
// Create topic
app.post('/api/clubs/:clubId/topics', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member) return res.status(403).json({ error: 'Only club members can create topics' });
    const topic = {
      title: req.body.title,
      content: req.body.content,
      createdBy: req.user.id,
      createdAt: new Date(),
      replies: []
    };
    club.topics.push(topic);
    await club.save();
    res.status(201).json(club.topics[club.topics.length - 1]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create topic' });
  }
});
// Reply to topic
app.post('/api/clubs/:clubId/topics/:topicId/replies', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member) return res.status(403).json({ error: 'Only club members can reply to topics' });
    const topic = club.topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    const reply = {
      content: req.body.content,
      createdBy: req.user.id,
      createdAt: new Date()
    };
    topic.replies.push(reply);
    await club.save();
    res.status(201).json(topic.replies[topic.replies.length - 1]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to reply to topic' });
  }
});
// Delete topic (admin/owner only)
app.delete('/api/clubs/:clubId/topics/:topicId', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Only club admins/owners can delete topics' });
    }
    club.topics = club.topics.filter(t => t._id.toString() !== req.params.topicId);
    await club.save();
    res.json({ message: 'Topic deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});
// Delete reply (admin/owner or reply creator)
app.delete('/api/clubs/:clubId/topics/:topicId/replies/:replyId', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const topic = club.topics.id(req.params.topicId);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    const reply = topic.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ error: 'Reply not found' });
    // Permission: admin/owner or reply creator
    const member = club.members.find(m => m.user.toString() === req.user.id);
    const isAdmin = member && (member.role === 'admin' || member.role === 'owner');
    if (!isAdmin && reply.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this reply' });
    }
    topic.replies = topic.replies.filter(r => r._id.toString() !== req.params.replyId);
    await club.save();
    res.json({ message: 'Reply deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete reply' });
  }
});

// ========== CLUB GOALS ========== //
// List club goals (all members)
app.get('/api/clubs/:clubId/goals', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member) return res.status(403).json({ error: 'Only club members can view club goals' });
    res.json(club.goals || []);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch club goals' });
  }
});
// Add club goal (admin/owner only)
app.post('/api/clubs/:clubId/goals', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Only club admins/owners can add club goals' });
    }
    const goal = {
      title: req.body.title,
      description: req.body.description,
      createdBy: req.user.id,
      createdAt: new Date()
    };
    club.goals.push(goal);
    await club.save();
    res.status(201).json(club.goals[club.goals.length - 1]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add club goal' });
  }
});
// Update club goal (admin/owner only)
app.put('/api/clubs/:clubId/goals/:goalId', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Only club admins/owners can update club goals' });
    }
    const goal = club.goals.id(req.params.goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    goal.title = req.body.title || goal.title;
    goal.description = req.body.description || goal.description;
    await club.save();
    res.json(goal);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update club goal' });
  }
});
// Delete club goal (admin/owner only)
app.delete('/api/clubs/:clubId/goals/:goalId', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Only club admins/owners can delete club goals' });
    }
    club.goals = club.goals.filter(g => g._id.toString() !== req.params.goalId);
    await club.save();
    res.json({ message: 'Goal deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete club goal' });
  }
});

// ========== CLUB ADMIN CONTROLS ========== //
// Assign/remove admin role
app.post('/api/clubs/:clubId/members/:userId/role', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Only club admins/owners can change roles' });
    }
    const target = club.members.find(m => m.user.toString() === req.params.userId);
    if (!target) return res.status(404).json({ error: 'Target user not a member' });
    target.role = req.body.role;
    // Log action
    club.clubLogs.push({ action: 'role_change', user: req.user.id, details: { target: req.params.userId, newRole: req.body.role } });
    await club.save();
    res.json(target);
  } catch (e) {
    res.status(500).json({ error: 'Failed to change role' });
  }
});
// Add member
app.post('/api/clubs/:clubId/members/add', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Only club admins/owners can add members' });
    }
    const exists = club.members.find(m => m.user.toString() === req.body.userId);
    if (exists) return res.status(400).json({ error: 'User already a member' });
    club.members.push({ user: req.body.userId, role: 'member', joinedAt: new Date() });
    club.clubLogs.push({ action: 'add_member', user: req.user.id, details: { added: req.body.userId } });
    await club.save();
    res.json(club.members);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add member' });
  }
});
// Remove member
app.delete('/api/clubs/:clubId/members/:userId', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Only club admins/owners can remove members' });
    }
    club.members = club.members.filter(m => m.user.toString() !== req.params.userId);
    club.clubLogs.push({ action: 'remove_member', user: req.user.id, details: { removed: req.params.userId } });
    await club.save();
    res.json(club.members);
  } catch (e) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});
// Approve member join
app.post('/api/clubs/:clubId/members/:userId/approve', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Only club admins/owners can approve members' });
    }
    const target = club.members.find(m => m.user.toString() === req.params.userId);
    if (!target) return res.status(404).json({ error: 'Target user not a member' });
    target.approved = true;
    club.clubLogs.push({ action: 'approve_member', user: req.user.id, details: { approved: req.params.userId } });
    await club.save();
    res.json(target);
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve member' });
  }
});

// ========== CLUB TASKS ========== //
// Create club task (admin/owner only)
app.post('/api/clubs/:clubId/tasks', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    // Check admin/owner
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Only club admins/owners can create club tasks' });
    }
    const task = new Task({
      ...req.body,
      type: 'club',
      club: club._id,
      createdBy: req.user.id
    });
    await task.save();
    res.status(201).json(task);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create club task' });
  }
});

// List club tasks (all members)
app.get('/api/clubs/:clubId/tasks', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member) return res.status(403).json({ error: 'Only club members can view club tasks' });
    const tasks = await Task.find({ type: 'club', club: club._id }).populate('createdBy', 'name');
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch club tasks' });
  }
});

// Update club task (admin/owner only)
app.put('/api/clubs/:clubId/tasks/:taskId', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Only club admins/owners can update club tasks' });
    }
    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, club: club._id, type: 'club' },
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update club task' });
  }
});

// Delete club task (admin/owner only)
app.delete('/api/clubs/:clubId/tasks/:taskId', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club || club.status !== 'approved') return res.status(404).json({ error: 'Club not found or not approved' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Only club admins/owners can delete club tasks' });
    }
    const task = await Task.findOneAndDelete({ _id: req.params.taskId, club: club._id, type: 'club' });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete club task' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('Harambee Task Force Backend Running');
});

// Admin User Management Routes
app.get('/api/admin/users', auth, admin, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/users/:id', auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password')
      .populate('clubs', 'name description')
      .populate('tasks', 'title status priority dueDate');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/admin/users', auth, admin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashed,
      role: role || 'user'
    });
    
    await user.save();
    res.status(201).json({ ...user.toObject(), password: undefined });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/admin/users/:id', auth, admin, async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Don't allow changing password through this endpoint
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/admin/users/:id', auth, admin, async (req, res) => {
  try {
    // Don't allow deleting yourself
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Remove user from any clubs they're in
    await Club.updateMany(
      { 'members.user': user._id },
      { $pull: { members: { user: user._id } } }
    );
    
    // Unassign user from any tasks
    await Task.updateMany(
      { assignedTo: user._id },
      { $pull: { assignedTo: user._id } }
    );
    
    res.json({ message: 'User deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Block/Unblock user
app.post('/api/admin/users/:id/block', auth, admin, async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ error: 'Cannot block your own account' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to block user' });
  }
});

app.post('/api/admin/users/:id/unblock', auth, admin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

app.get('/api/tasks', auth, async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      // Admins can see all tasks
      tasks = await Task.find().populate('club', 'name').populate('createdBy', 'name');
    } else {
      // Regular users see their personal tasks and tasks from their clubs
      const userClubs = await Club.find({ 'members.user': req.user.id, 'status': 'approved' }).select('_id');
      const clubIds = userClubs.map(c => c._id);

      tasks = await Task.find({
        $or: [
          { type: 'personal', createdBy: req.user.id },
          { type: 'club', club: { $in: clubIds } }
        ]
      }).populate('club', 'name').populate('createdBy', 'name');
    }
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', auth, async (req, res) => {
  try {
    const taskData = { ...req.body, createdBy: req.user.id };
    const task = new Task(taskData);
    await task.save();
    res.status(201).json(task);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.type === 'personal') {
      if (task.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this task' });
      }
    } else if (task.type === 'club') {
      return res.status(403).json({ error: 'Use club task endpoints for club tasks' });
    }
    Object.assign(task, req.body);
    await task.save();
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.type === 'personal') {
      if (task.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to delete this task' });
      }
    } else if (task.type === 'club') {
      return res.status(403).json({ error: 'Use club task endpoints for club tasks' });
    }
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.put('/api/tasks/:id', auth, async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.delete('/api/tasks/:id', auth, async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
  if (!task) return res.status(404).json({ error: 'Task not found or not authorized' });
  res.json({ message: 'Task deleted' });
});

// User Settings/Profile Endpoints
app.get('/api/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/user/profile', auth, async (req, res) => {
  const { name, email, phone, bio } = req.body;
  try {
    const update = { name, email, phone, bio };
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.put('/api/user/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

app.put('/api/user/preferences', auth, async (req, res) => {
  const { notifications, theme, language, timezone } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (notifications) user.preferences.notifications = notifications;
    if (theme) user.preferences.theme = theme;
    if (language) user.preferences.language = language;
    if (timezone) user.preferences.timezone = timezone;
    await user.save();
    res.json({ message: 'Preferences updated', preferences: user.preferences });
  } catch {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

app.delete('/api/user', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Additional cleanup logic if needed
    res.json({ message: 'User account deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user account' });
  }
});

// Club Routes

// GET all approved clubs for public view
app.get('/api/clubs', async (req, res) => {
  try {
    const clubs = await Club.find({ status: 'approved', 'settings.isPublic': true })
      .populate('createdBy', 'name')
      .populate('members.user', 'name');
    res.json(clubs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
});

// POST to submit a club creation request
app.post('/api/clubs/request', auth, async (req, res) => {
  try {
    const { name, description, purpose } = req.body;
    if (!name || !description || !purpose) {
      return res.status(400).json({ error: 'Name, description, and purpose are required.' });
    }
    const club = new Club({
      name,
      description,
      purpose,
      createdBy: req.user.id,
      status: 'pending'
    });
    await club.save();
    res.status(201).json({ message: 'Club creation request submitted for admin approval.', club });
  } catch (e) {
    res.status(500).json({ error: 'Failed to submit club creation request.' });
  }
});

// GET clubs for the logged-in user
app.get('/api/user/clubs', auth, async (req, res) => {
  try {
    const clubs = await Club.find({ 'members.user': req.user.id, status: 'approved' })
      .select('name description');
    res.json(clubs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user clubs.' });
  }
});

// --- User Profile and Stats ---

// GET /api/user/club-requests - Get all club creation requests by the current user
app.get('/api/user/club-requests', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    // Find all clubs created by this user, regardless of status
    const clubs = await Club.find({ createdBy: userId })
      .select('name status createdAt approvedAt');
    res.json(clubs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch club creation requests.' });
  }
});
// GET /api/stats - Get dashboard stats for current user
app.get('/api/stats', auth, async (req, res) => {
  try {
    console.log('User from auth middleware:', req.user);
    if (!req.user || !req.user._id) {
      console.error('No user ID found in request');
      return res.status(401).json({ error: 'Unauthorized - No user ID found' });
    }
    
    const userId = req.user._id;
    console.log('Fetching stats for user ID:', userId);
    
    // Count clubs where user is a member
    const clubs = await Club.find({ 'members.user': userId });
    console.log('Found clubs:', clubs.length);
    
    // Count tasks assigned to user
    const tasks = await Task.find({ assignedTo: userId });
    console.log('Found tasks:', tasks.length);
    
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    const stats = {
      clubCount: clubs.length,
      taskCount: tasks.length,
      completedTaskCount: completedTasks.length
    };
    
    console.log('Returning stats:', stats);
    res.json(stats);
  } catch (e) {
    console.error('Error in /api/stats:', e);
    res.status(500).json({ 
      error: 'Failed to fetch user stats',
      details: e.message 
    });
  }
});

// --- Admin Static Routes ---

// GET all clubs (for admin view)
app.get('/api/admin/clubs', auth, admin, async (req, res) => {
  try {
    const clubs = await Club.find().populate('createdBy', 'name');
    res.json(clubs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch clubs.' });
  }
});

// GET all pending club creation requests
app.get('/api/admin/clubs/requests', auth, admin, async (req, res) => {
  try {
    const requests = await Club.find({ status: 'pending' }).populate('createdBy', 'name email');
    res.json(requests);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch club creation requests.' });
  }
});

// GET all pending join requests across all clubs
app.get('/api/admin/join-requests', auth, admin, async (req, res) => {
  try {
    const clubsWithPendingRequests = await Club.find({ 'joinRequests.status': 'pending' })
      .populate('joinRequests.user', 'name email')
      .select('name joinRequests');

    const allRequests = clubsWithPendingRequests.flatMap(club =>
      club.joinRequests
        .filter(r => r.status === 'pending')
        .map(request => ({
          _id: request._id,
          user: request.user,
          club: { _id: club._id, name: club.name },
          requestedAt: request.requestedAt
        }))
    );
    res.json(allRequests);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch join requests.' });
  }
});

// POST to approve a club creation request
app.post('/api/admin/clubs/requests/:id/approve', auth, admin, async (req, res) => {
  try {
    const club = await Club.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!club) return res.status(404).json({ error: 'Club request not found.' });
    // Ensure creator is a member and owner
    const alreadyMember = club.members.some(m => m.user.toString() === club.createdBy.toString());
    if (!alreadyMember) {
      club.members.push({ user: club.createdBy, role: 'owner' });
    } else {
      // If already a member, ensure role is owner
      club.members = club.members.map(m =>
        m.user.toString() === club.createdBy.toString() ? { ...m.toObject(), role: 'owner' } : m
      );
    }
    await club.save();
    res.json({ message: 'Club approved.', club });
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve club.' });
  }
});

// POST to reject a club creation request
app.post('/api/admin/clubs/requests/:id/reject', auth, admin, async (req, res) => {
  try {
    const club = await Club.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!club) return res.status(404).json({ error: 'Club request not found.' });
    res.json({ message: 'Club rejected.', club });
  } catch (e) {
    res.status(500).json({ error: 'Failed to reject club.' });
  }
});

// POST to approve a join request for a specific club
app.post('/api/admin/clubs/:clubId/join-requests/:requestId/approve', auth, admin, async (req, res) => {
  try {
    const { clubId, requestId } = req.params;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found.' });

    const request = club.joinRequests.id(requestId);
    if (!request || request.status !== 'pending') {
      return res.status(404).json({ error: 'Request not found or already handled.' });
    }

    request.status = 'approved';
    club.members.push({ user: request.user, role: 'member' });
    await club.save();

    res.json({ message: 'Join request approved.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve join request.' });
  }
});

// POST to reject a join request for a specific club
app.post('/api/admin/clubs/:clubId/join-requests/:requestId/reject', auth, admin, async (req, res) => {
  try {
    const { clubId, requestId } = req.params;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found.' });

    const request = club.joinRequests.id(requestId);
    if (!request || request.status !== 'pending') {
      return res.status(404).json({ error: 'Request not found or already handled.' });
    }

    request.status = 'rejected';
    await club.save();

    res.json({ message: 'Join request rejected.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to reject join request.' });
  }
});

// --- Dynamic Routes Last ---

// GET a single club's details
app.get('/api/clubs/:id', async (req, res) => {
  try {
    const club = await Club.findOne({ _id: req.params.id, status: 'approved' })
      .populate('members.user', 'name email')
      .populate('createdBy', 'name');
    if (!club) return res.status(404).json({ error: 'Club not found or not approved' });
    res.json(club);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch club details' });
  }
});

// POST to submit a join request to a club
app.post('/api/clubs/:id/join', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ error: 'Club not found.' });

    const isMember = club.members.some(m => m.user.equals(req.user.id));
    const hasPendingRequest = club.joinRequests.some(r => r.user.equals(req.user.id) && r.status === 'pending');

    if (isMember) return res.status(400).json({ error: 'You are already a member of this club.' });
    if (hasPendingRequest) return res.status(400).json({ error: 'You already have a pending join request.' });

    club.joinRequests.push({ user: req.user.id });
    await club.save();
    res.json({ message: 'Join request submitted.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to submit join request.' });
  }
});

// --- Admin Dynamic Routes ---

// GET a single club's details for admin
app.get('/api/admin/clubs/:id', auth, admin, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id).populate('createdBy', 'name').populate('members.user', 'name email');
    if (!club) return res.status(404).json({ error: 'Club not found' });
    res.json(club);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch club details' });
  }
});

// PUT to update a club (admin only)
app.put('/api/admin/clubs/:id', auth, admin, async (req, res) => {
  try {
    const club = await Club.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!club) return res.status(404).json({ error: 'Club not found' });
    res.json(club);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE a club and its associated tasks
app.delete('/api/admin/clubs/:id', auth, admin, async (req, res) => {
  try {
    const club = await Club.findByIdAndDelete(req.params.id);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    await Task.deleteMany({ club: req.params.id });
    res.json({ message: 'Club and associated tasks deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete club' });
  }
});

// MongoDB connection and server start
// ========== NOTIFICATIONS ========== //
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.notifications || []);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});
app.post('/api/notifications/:id/read', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const notification = user.notifications.id(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    notification.read = true;
    await user.save();
    res.json({ message: 'Notification marked as read' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// ========== AUDIT LOGS ========== //
// Systemwide audit logs (system admin only)
app.get('/api/admin/audit-logs', auth, admin, async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(500).lean();
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});
// Club activity logs (club admin/owner or system admin)
app.get('/api/clubs/:clubId/logs', auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const member = club.members.find(m => m.user.toString() === req.user.id);
    const isClubAdmin = member && (member.role === 'admin' || member.role === 'owner');
    if (!isClubAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view club logs' });
    }
    res.json(club.clubLogs || []);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch club logs' });
  }
});
const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  details: { type: Object },
  createdAt: { type: Date, default: Date.now }
});
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Example: Add stub log in club approval
// (Repeat similar for SOP, user role changes, etc. as needed)
// In club approval endpoint:
// await AuditLog.create({ user: req.user.id, action: 'approve_club', details: { clubId: club._id } });

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });
