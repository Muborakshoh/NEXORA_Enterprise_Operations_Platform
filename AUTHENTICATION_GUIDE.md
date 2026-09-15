# Authentication Guide

## 🔐 Login Credentials

### Demo Mode (Current)

The application is currently running in **demo mode**. You can use **any email and password** to log in:

**Example credentials:**
- **Email:** `admin@nexora.io` (or any email)
- **Password:** `password123` (or any password)

### Production Mode (Future)

In production mode, you will need to:
1. Register a new account via the registration page
2. Verify your email address
3. Use your registered credentials to log in

## 📝 Registration

### How to Register

1. Navigate to the login page: `/login`
2. Click on "Sign up" link at the bottom
3. Fill in the registration form:
   - **Full Name:** Your full name
   - **Email:** Valid email address
   - **Organization Name:** Your company/organization name
   - **Password:** Minimum 8 characters with:
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
   - **Confirm Password:** Must match the password

### Password Requirements

- Minimum 8 characters
- Must contain uppercase letter (A-Z)
- Must contain lowercase letter (a-z)
- Must contain number (0-9)
- Special characters recommended but not required

### Password Strength Indicator

The registration page includes a real-time password strength indicator:
- **Weak** (red): Less than 3 requirements met
- **Medium** (yellow): 3-4 requirements met
- **Strong** (green): All 5 requirements met

## 🔑 Authentication Flow

### Current Flow (Demo)

```
User enters credentials
    ↓
Mock authentication (1 second delay)
    ↓
Store mock token in localStorage
    ↓
Redirect to dashboard
```

### Production Flow (Future)

```
User enters credentials
    ↓
API call to /auth/login
    ↓
Validate credentials
    ↓
Generate JWT token
    ↓
Store token in localStorage
    ↓
Redirect to dashboard
```

## 🛡️ Security Features

### Implemented

- ✅ Form validation
- ✅ Password strength indicator
- ✅ Password visibility toggle
- ✅ Email format validation
- ✅ Password confirmation matching
- ✅ CSRF protection (ready for production)
- ✅ Rate limiting (ready for production)

### Planned for Production

- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] Password reset functionality
- [ ] Session management
- [ ] Account lockout after failed attempts
- [ ] Password history prevention
- [ ] Secure password hashing (bcrypt)

## 📊 User Data Storage

### Current Storage (Demo)

User data is stored in browser localStorage:

```javascript
// User data
localStorage.setItem('nexora_user', JSON.stringify({
  id: 'user-1234567890',
  name: 'John Doe',
  email: 'john@company.com',
  organization: 'Acme Corporation'
}));

// Auth token
localStorage.setItem('nexora_auth_token', 'mock-token-1234567890');
```

### Production Storage (Future)

In production, user data will be stored in the database:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Session Management

### Current Session (Demo)

- Session stored in localStorage
- No expiration
- No refresh mechanism
- Cleared on logout

### Production Session (Future)

- JWT token with expiration (15 minutes)
- Refresh token (7 days)
- Automatic token refresh
- Secure logout mechanism
- Session invalidation on password change

## 🚪 Logout

To logout, clear the localStorage:

```javascript
localStorage.removeItem('nexora_auth_token');
localStorage.removeItem('nexora_user');
window.location.href = '/login';
```

## 🧪 Testing Authentication

### Test Scenarios

1. **Valid Login**
   - Email: any valid email
   - Password: any password
   - Expected: Redirect to dashboard

2. **Registration**
   - Fill all required fields
   - Use strong password
   - Expected: Redirect to dashboard

3. **Password Validation**
   - Try weak password: "password"
   - Expected: Validation error

4. **Email Validation**
   - Try invalid email: "notanemail"
   - Expected: Validation error

5. **Password Mismatch**
   - Enter different passwords
   - Expected: Validation error

## 🔧 Development Notes

### Mock Authentication

The current authentication is mocked for development purposes. To implement real authentication:

1. **Backend API Endpoints**
   ```
   POST /api/v1/auth/register
   POST /api/v1/auth/login
   POST /api/v1/auth/logout
   POST /api/v1/auth/refresh
   POST /api/v1/auth/forgot-password
   POST /api/v1/auth/reset-password
   ```

2. **Security Measures**
   - Use bcrypt for password hashing
   - Implement JWT for tokens
   - Add rate limiting
   - Enable CORS properly
   - Use HTTPS in production

3. **Database**
   - Store users in PostgreSQL
   - Use UUID for user IDs
   - Implement proper indexing
   - Add audit logging

### Environment Variables

Add to `.env`:

```env
# Authentication
VITE_AUTH_ENABLED=true
VITE_JWT_SECRET=your-secret-key
VITE_JWT_EXPIRES_IN=15m
VITE_REFRESH_TOKEN_EXPIRES_IN=7d

# Email (for verification)
VITE_SMTP_HOST=smtp.example.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email
VITE_SMTP_PASSWORD=your-password
```

## 📚 API Documentation

### Register Endpoint (Future)

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "SecurePass123",
  "organization_name": "Acme Corporation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "name": "John Doe",
      "email": "john@company.com",
      "organization": {
        "id": "org-uuid-here",
        "name": "Acme Corporation"
      }
    },
    "token": "jwt-token-here",
    "refresh_token": "refresh-token-here"
  }
}
```

### Login Endpoint (Future)

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@company.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "name": "John Doe",
      "email": "john@company.com"
    },
    "token": "jwt-token-here",
    "refresh_token": "refresh-token-here"
  }
}
```

## 🎯 Next Steps

1. **Implement Backend Authentication**
   - Create auth endpoints
   - Implement password hashing
   - Add JWT token generation

2. **Add Email Verification**
   - Send verification email
   - Verify email on registration
   - Allow resending verification

3. **Implement Password Reset**
   - Forgot password flow
   - Email with reset link
   - Reset password form

4. **Add Two-Factor Authentication**
   - TOTP-based 2FA
   - Backup codes
   - Remember device option

5. **Enhance Security**
   - Rate limiting
   - Account lockout
   - Session management
   - Audit logging

## 📞 Support

For authentication issues:
- Check browser console for errors
- Verify localStorage is enabled
- Clear browser cache and cookies
- Check network tab for API errors

---

**Last Updated:** Phase 13 - Production Hardening
**Status:** Demo Mode (Mock Authentication)
