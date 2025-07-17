import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// JWT Authentication Middleware
export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });
    
    if (!user) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Account is blocked' });
    }
    
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
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Admin Authorization Middleware
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Club Owner/Admin Authorization Middleware
export const clubAdmin = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const Club = (await import('../models/Club.js')).default;
    
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const member = club.members.find(m => m.user.toString() === req.user.id);
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ error: 'Club admin access required' });
    }

    req.club = club;
    req.memberRole = member.role;
    next();
  } catch (error) {
    console.error('Club admin middleware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
