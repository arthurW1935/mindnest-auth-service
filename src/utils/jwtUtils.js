// src/utils/jwtUtils.js
const jwt = require('jsonwebtoken');

class JWTUtils {
  static generateAccessToken(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'mindnest-auth-service',
      audience: 'mindnest-platform'
    });
  }

  static generateRefreshToken(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'refresh'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d', // Refresh tokens last longer
      issuer: 'mindnest-auth-service',
      audience: 'mindnest-platform'
    });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'mindnest-auth-service',
        audience: 'mindnest-platform'
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  static getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded.exp ? new Date(decoded.exp * 1000) : null;
    } catch (error) {
      return null;
    }
  }

  static isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }
}

module.exports = JWTUtils;