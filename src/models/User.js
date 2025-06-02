// src/models/User.js
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.passwordHash = userData.password_hash;
    this.role = userData.role;
    this.isActive = userData.is_active;
    this.createdAt = userData.created_at;
    this.updatedAt = userData.updated_at;
  }

  // Create a new user
  static async create({ email, password, role = 'user' }) {
    try {
      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const query = `
        INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING id, email, role, is_active, created_at, updated_at
      `;
      
      const values = [email.toLowerCase().trim(), passwordHash, role];
      const result = await pool.query(query, values);
      
      return new User({
        ...result.rows[0],
        password_hash: passwordHash
      });
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
      const result = await pool.query(query, [email.toLowerCase().trim()]);
      
      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
      const result = await pool.query(query, [id]);
      
      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.passwordHash);
    } catch (error) {
      throw error;
    }
  }

  // Update last login
  async updateLastLogin() {
    try {
      const query = `
        UPDATE users 
        SET updated_at = NOW() 
        WHERE id = $1
      `;
      await pool.query(query, [this.id]);
    } catch (error) {
      throw error;
    }
  }

  // Get user data without sensitive information
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Get all users (admin only)
  static async findAll(limit = 50, offset = 0) {
    try {
      const query = `
        SELECT id, email, role, is_active, created_at, updated_at
        FROM users 
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;
      const result = await pool.query(query, [limit, offset]);
      
      return result.rows.map(row => new User({...row, password_hash: ''}));
    } catch (error) {
      throw error;
    }
  }

  // Get user count
  static async getCount() {
    try {
      const query = 'SELECT COUNT(*) as count FROM users WHERE is_active = true';
      const result = await pool.query(query);
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // Create admin user
  static async createAdmin(email, password) {
    try {
      // Check if admin already exists
      const existingAdmin = await User.findByEmail(email);
      if (existingAdmin) {
        throw new Error('Admin user already exists');
      }

      // Create admin user with 'admin' role
      const admin = await User.create({
        email,
        password,
        role: 'admin'
      });

      return admin;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;