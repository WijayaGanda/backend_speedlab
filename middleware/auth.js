const jwt = require('jsonwebtoken');
const User = require('../model/UserModel');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Middleware untuk verifikasi JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token tidak ditemukan' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User tidak ditemukan' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Akun tidak aktif' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Token tidak valid atau kadaluarsa' 
    });
  }
};

// Middleware untuk cek role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Akses ditolak. Anda tidak memiliki izin' 
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize, JWT_SECRET };
