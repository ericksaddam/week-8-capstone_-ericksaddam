import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// JWT Authentication Middleware
export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('Auth middleware - Token check:', {
      hasToken: !!token,
      tokenStart: token ? token.substring(0, 20) + '...' : 'none',
      path: req.path,
      method: req.method
    });
    
    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ error: 'No token provided, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });
    
    console.log('Auth middleware - User lookup:', {
      decodedUserId: decoded.userId,
      userFound: !!user,
      userBlocked: user?.isBlocked
    });
    
    if (!user) {
      console.log('Auth middleware - User not found');
      return res.status(401).json({ error: 'Token is not valid' });
    }

    if (user.isBlocked) {
      console.log('Auth middleware - User is blocked');
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
    
    console.log('Auth middleware - Success:', {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role
    });
    
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
