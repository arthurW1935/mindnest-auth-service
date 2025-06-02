// src/routes/authRoutes.js
const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken, requireRole, authLimiter, adminLimiter } = require('../middleware/authMiddleware');
const { validateRequest, registerSchema, loginSchema, refreshTokenSchema } = require('../validation/authValidation');
const User = require('../models/User');

const router = express.Router();

// Public routes with rate limiting
router.post('/register', 
  authLimiter,
  validateRequest(registerSchema), 
  AuthController.register
);

router.post('/login', 
  authLimiter,
  validateRequest(loginSchema), 
  AuthController.login
);

router.post('/refresh-token',
  authLimiter,
  validateRequest(refreshTokenSchema),
  AuthController.refreshToken
);

// Protected routes
router.get('/verify-token', 
  authLimiter,
  authenticateToken, 
  AuthController.verifyToken
);

router.get('/profile', 
  authenticateToken, 
  AuthController.getProfile
);

router.post('/logout', 
  authenticateToken, 
  AuthController.logout
);

// Admin routes with stricter rate limiting
router.post('/admin/create', 
  adminLimiter,
  authenticateToken,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const admin = await User.createAdmin(email, password);

      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: {
          user: admin.toJSON()
        }
      });
    } catch (error) {
      console.error('Admin creation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create admin user'
      });
    }
  }
);

module.exports = router;