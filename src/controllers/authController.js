// src/controllers/authController.js
const User = require('../models/User');
const JWTUtils = require('../utils/jwtUtils');

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { email, password, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create new user in Auth Service
      const user = await User.create({ email, password, role });

      // 🔥 Create user in User Service (for all users)
      try {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
        const userServiceResponse = await fetch(`${userServiceUrl}/api/users/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth_user_id: user.id,
            email: user.email,
            role: user.role
          })
        });

        if (!userServiceResponse.ok) {
          const errorData = await userServiceResponse.json();
          console.error('Failed to create user in User Service:', errorData);
        } else {
          console.log(`✅ User ${user.email} created successfully in User Service`);
        }
      } catch (userServiceError) {
        console.error('Error calling User Service:', userServiceError.message);
      }

      // 🔥 NEW: Create therapist in Therapist Service (for psychiatrists only)
      if (user.role === 'psychiatrist') {
        try {
          const therapistServiceUrl = process.env.THERAPIST_SERVICE_URL || 'http://localhost:3003';
          const therapistServiceResponse = await fetch(`${therapistServiceUrl}/api/therapists/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              auth_user_id: user.id,
              email: user.email,
              verification_status: 'pending'
            })
          });

          if (!therapistServiceResponse.ok) {
            const errorData = await therapistServiceResponse.json();
            console.error('Failed to create therapist in Therapist Service:', errorData);
          } else {
            console.log(`✅ Therapist ${user.email} created successfully in Therapist Service`);
          }
        } catch (therapistServiceError) {
          console.error('Error calling Therapist Service:', therapistServiceError.message);
        }
      }

      // Generate tokens
      const accessToken = JWTUtils.generateAccessToken(user);
      const refreshToken = JWTUtils.generateRefreshToken(user);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.toJSON(),
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
          }
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      await user.updateLastLogin();

      // 🔥 Ensure user exists in User Service (backup)
      try {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
        const checkUserResponse = await fetch(`${userServiceUrl}/api/users/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth_user_id: user.id,
            email: user.email,
            role: user.role
          })
        });

        if (checkUserResponse.status === 409) {
          console.log(`User ${user.email} already exists in User Service`);
        } else if (checkUserResponse.ok) {
          console.log(`✅ User ${user.email} created in User Service during login`);
        }
      } catch (userServiceError) {
        console.error('Error checking User Service:', userServiceError.message);
      }

      // 🔥 NEW: Ensure therapist exists in Therapist Service (backup for psychiatrists)
      if (user.role === 'psychiatrist') {
        try {
          const therapistServiceUrl = process.env.THERAPIST_SERVICE_URL || 'http://localhost:3003';
          const checkTherapistResponse = await fetch(`${therapistServiceUrl}/api/therapists/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              auth_user_id: user.id,
              email: user.email,
              verification_status: 'pending'
            })
          });

          if (checkTherapistResponse.status === 409) {
            console.log(`Therapist ${user.email} already exists in Therapist Service`);
          } else if (checkTherapistResponse.ok) {
            console.log(`✅ Therapist ${user.email} created in Therapist Service during login`);
          }
        } catch (therapistServiceError) {
          console.error('Error checking Therapist Service:', therapistServiceError.message);
        }
      }

      // Generate tokens
      const accessToken = JWTUtils.generateAccessToken(user);
      const refreshToken = JWTUtils.generateRefreshToken(user);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Refresh access token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = JWTUtils.verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Find user
      const user = await User.findById(decoded.sub);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate new access token
      const newAccessToken = JWTUtils.generateAccessToken(user);
      const newRefreshToken = JWTUtils.generateRefreshToken(user);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
          }
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
  }

  // Verify token
  static async verifyToken(req, res) {
    try {
      // Token is already verified by middleware
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Token verification failed'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile'
      });
    }
  }

  // Logout (client-side token invalidation)
  static async logout(req, res) {
    try {
      // In a stateless JWT system, logout is typically handled client-side
      // by removing the token from storage. This endpoint confirms logout.
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
}

module.exports = AuthController;