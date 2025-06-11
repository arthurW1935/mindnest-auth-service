# MindNest Authentication Service

A secure, scalable authentication microservice for the MindNest mental health platform. This service handles user registration, login, JWT token management, and integrates with other MindNest microservices.

## 🚀 Features

- **Secure Authentication**: JWT-based authentication with access and refresh tokens
- **Role-Based Access Control**: Support for `user`, `psychiatrist`, and `admin` roles
- **Password Security**: Bcrypt password hashing with configurable salt rounds
- **Rate Limiting**: Comprehensive rate limiting for API endpoints
- **Input Validation**: Joi-based request validation with detailed error messages
- **Microservice Integration**: Automatic user creation in User Service and Therapist Service
- **Security Headers**: Helmet.js for enhanced security
- **CORS Protection**: Configurable CORS settings for production and development
- **Database Integration**: PostgreSQL with connection pooling
- **Health Monitoring**: Built-in health check endpoint
- **Graceful Shutdown**: Proper signal handling for production deployments

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mindnest-auth-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=mindnest_auth
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=24h

   # Security Configuration
   BCRYPT_ROUNDS=12

   # Microservice URLs (optional)
   USER_SERVICE_URL=http://localhost:3002
   THERAPIST_SERVICE_URL=http://localhost:3003

   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3000,https://mindnest-frontend.vercel.app
   ```

4. **Database Setup**
   - Create a PostgreSQL database named `mindnest_auth`
   - The service will automatically create the required tables on startup

5. **Start the service**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

## 🏗️ Architecture

```
mindnest-auth-service/
├── src/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection and table initialization
│   ├── controllers/
│   │   └── authController.js    # Authentication business logic
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT verification and role-based access
│   ├── models/
│   │   └── User.js             # User data model and database operations
│   ├── routes/
│   │   └── authRoutes.js       # API route definitions
│   ├── utils/
│   │   └── jwtUtils.js         # JWT token generation and verification
│   ├── validation/
│   │   └── authValidation.js   # Request validation schemas
│   └── server.js               # Express server setup and configuration
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Public Endpoints

#### `POST /api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "user"  // Optional: "user" or "psychiatrist"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "24h"
    }
  }
}
```

#### `POST /api/auth/login`
Authenticate user and receive access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "24h"
    }
  }
}
```

#### `POST /api/auth/refresh-token`
Refresh an expired access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "24h"
  }
}
```

### Protected Endpoints

All protected endpoints require the `Authorization` header with a Bearer token:
```
Authorization: Bearer <access_token>
```

#### `GET /api/auth/verify-token`
Verify if the current access token is valid.

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

#### `GET /api/auth/profile`
Get the current user's profile information.

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### `POST /api/auth/logout`
Logout the current user (client-side token invalidation).

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Admin Endpoints

#### `POST /api/auth/admin/create`
Create a new admin user (requires authentication).

**Request Body:**
```json
{
  "email": "admin@mindnest.com",
  "password": "AdminPass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "data": {
    "user": {
      "id": 2,
      "email": "admin@mindnest.com",
      "role": "admin",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Health Check

#### `GET /health`
Check service health status.

**Response:**
```json
{
  "success": true,
  "message": "Auth service is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "mindnest-auth-service",
  "version": "1.0.0"
}
```

## 🔒 Security Features

### Password Requirements
- Minimum 8 characters
- Maximum 128 characters
- Must contain at least:
  - One lowercase letter
  - One uppercase letter
  - One number
  - One special character (!@#$%^&*)

### Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 10 requests per 15 minutes per IP
- **Admin endpoints**: 50 requests per 15 minutes per IP

### JWT Token Security
- Access tokens expire in 24 hours (configurable)
- Refresh tokens expire in 7 days
- Tokens include issuer and audience claims
- Secure token verification with proper error handling

### Database Security
- Password hashing with bcrypt (12 salt rounds by default)
- SQL injection protection through parameterized queries
- Connection pooling for optimal performance
- SSL support for production environments

## 🔗 Microservice Integration

The authentication service automatically integrates with other MindNest microservices:

### User Service Integration
- Creates user records in the User Service during registration
- Ensures user exists in User Service during login (backup mechanism)

### Therapist Service Integration
- Creates therapist records for users with `psychiatrist` role
- Handles therapist verification status management


## 📊 Monitoring

### Health Check
Monitor service health via the `/health` endpoint.

### Logging
The service provides comprehensive logging for:
- Database connections
- Authentication attempts
- Error handling
- Microservice integration status

## 🚀 Deployment

### Production Considerations
1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure SSL for database connections
4. Set up proper CORS origins
5. Configure environment-specific rate limits
6. Set up monitoring and alerting

## 🔄 Version History

- **v1.0.0**: Initial release with core authentication features
  - User registration and login
  - JWT token management
  - Role-based access control
  - Microservice integration
  - Security features and rate limiting 