# Login & Register - OTP Based Authentication

## Overview

The Mobitez authentication system uses **mobile number + OTP** for both login and registration.

### Key Features
- **Phone number only** - No email or password required
- OTP sent via MSG91 SMS service
- Smart registration flow - automatically logs in existing users
- 5-minute OTP expiry
- 30-second resend cooldown

---

## File Structure

| File | Location | Purpose |
|------|----------|---------|
| `auth.js` | `/public/js/auth.js` | Core authentication functions |
| `login.js` | `/public/js/login.js` | Login page handler |
| `signup.js` | `/public/js/signup.js` | Signup page handler (smart flow) |
| `login.html` | `/public/login.html` | Login page UI |
| `signup.html` | `/public/signup.html` | Signup page UI |
| `login.css` | `/public/css/login.css` | Styling |

---

## Authentication Flows

### Login Flow (Existing Users Only)

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User enters phone number                                     │
│           │                                                      │
│           ▼                                                      │
│  2. POST /api/auth/login                                         │
│           │                                                      │
│           ▼                                                      │
│  3. Check if user exists                                         │
│           │                                                      │
│     ┌─────┴─────┐                                                │
│     │           │                                                │
│  NOT EXISTS   EXISTS                                             │
│     │           │                                                │
│     ▼           ▼                                                │
│   Error:      OTP sent                                           │
│  "Not        │                                                   │
│  registered" │                                                   │
│              ▼                                                   │
│  4. User enters 6-digit OTP                                      │
│           │                                                      │
│           ▼                                                      │
│  5. POST /api/auth/verify-otp                                    │
│           │                                                      │
│           ▼                                                      │
│  6. JWT Token → Login success → Redirect home                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Signup Flow (Smart - Login or Register)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SMART SIGNUP FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User enters phone number                                     │
│           │                                                      │
│           ▼                                                      │
│  2. POST /api/auth/register (try to register)                    │
│           │                                                      │
│           ▼                                                      │
│  3. Check if mobile already registered                           │
│           │                                                      │
│     ┌─────┴─────┐                                                │
│     │           │                                                │
│  ALREADY      NOT                                                │
│  EXISTS     REGISTERED                                           │
│     │           │                                                │
│     ▼           ▼                                                │
│  Send LOGIN   Send REGISTER                                      │
│  OTP          OTP                                                │
│     │           │                                                │
│     └─────┬─────┘                                                │
│           │                                                      │
│           ▼                                                      │
│  4. User enters 6-digit OTP                                      │
│           │                                                      │
│           ▼                                                      │
│  5. POST /api/auth/verify-otp                                    │
│           │                                                      │
│           ▼                                                      │
│     ┌─────┴─────┐                                                │
│     │           │                                                │
│   LOGIN      REGISTER                                            │
│  (existing)  (new user)                                          │
│     │           │                                                │
│     └─────┬─────┘                                                │
│           │                                                      │
│           ▼                                                      │
│  6. JWT Token → Success → Redirect home                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Send OTP for login (user must exist) |
| `/api/auth/register` | POST | Send OTP for registration (new user) |
| `/api/auth/verify-otp` | POST | Verify OTP and get JWT token |
| `/api/auth/resend-otp` | POST | Resend OTP |
| `/api/auth/check-mobile` | POST | Check if mobile is registered |
| `/api/auth/logout` | POST | Logout (invalidate token) |

---

## Core Functions (auth.js)

### OTP Functions

```javascript
// Send OTP for login (existing users)
await sendLoginOTP('9876543210')

// Send OTP for registration (new users)
await sendRegisterOTP('9876543210', 'John Doe')

// Verify OTP and complete auth
await verifyOTP('9876543210', '123456', 'John Doe')

// Resend OTP
await resendOTP('9876543210', 'login') // or 'register'

// Check if mobile is registered
await checkMobile('9876543210')
```

### Auth State Functions

```javascript
isAuthenticated()    // Check if logged in
getAuthToken()       // Get JWT token
getAuthUser()        // Get user object
setAuth(token, user) // Store auth data
clearAuth()          // Clear auth data
logout()             // Logout and redirect
```

### Validation Functions

```javascript
isValidMobile('9876543210')  // true for valid Indian mobile
isValidOTP('123456')         // true for 6-digit OTP
formatMobile('9876543210')   // "98765 43210"
```

---

## UI Components

### Login Page (`login.html`)

**Step 1 - Phone Input:**
- Phone input with +91 prefix
- Send OTP button

**Step 2 - OTP Verification:**
- 6 individual digit inputs
- Countdown timer (5 minutes)
- Resend button (30s cooldown)
- Verify & Login button

### Signup Page (`signup.html`)

**Step 1 - Phone Input:**
- Phone input with +91 prefix
- Continue button

**Step 2 - OTP Verification:**
- Same as login
- Shows action info (Login vs Register)
- Smart button text based on action

---

## Response Examples

### Send Login OTP Success
```json
{
    "success": true,
    "message": "OTP sent successfully",
    "data": {
        "mobile": "9876543210",
        "otp": "123456",
        "otp_expires_in": 300,
        "is_registered": true
    }
}
```

### Send Login OTP - Not Registered
```json
{
    "success": false,
    "message": "Mobile number not registered. Please register first.",
    "data": {
        "mobile": "9876543210",
        "is_registered": false
    }
}
```

### Send Register OTP - Already Registered
```json
{
    "success": false,
    "message": "Mobile number already registered. Please login instead.",
    "data": {
        "mobile": "9876543210",
        "is_registered": true
    }
}
```

### Verify OTP Success (Login)
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "phone": "9876543210"
        },
        "token": "eyJ0eXAiOiJKV1...",
        "is_new_user": false
    }
}
```

### Verify OTP Success (Registration)
```json
{
    "success": true,
    "message": "Registration successful",
    "data": {
        "user": {
            "id": 2,
            "name": "New User",
            "phone": "9876543210"
        },
        "token": "eyJ0eXAiOiJKV1...",
        "is_new_user": true
    }
}
```

---

## Error Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created (new user) |
| 400 | Bad Request (invalid/expired OTP) |
| 401 | Unauthorized (invalid token) |
| 404 | Not Found (mobile not registered for login) |
| 409 | Conflict (mobile already registered) |

---

## Security Notes

1. **OTP in Response**: Returned for testing; remove in production when MSG91 is configured
2. **OTP Expiry**: 5 minutes (300 seconds)
3. **Resend Cooldown**: 30 seconds between resend attempts
4. **Token Storage**: localStorage (consider httpOnly cookies for production)
5. **Mobile Validation**: Only Indian mobile numbers (starting with 6-9, 10 digits)
