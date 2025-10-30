# Auth API Tests - Bruno Collection

This folder contains comprehensive Bruno API tests for the authentication module.

## Test Coverage

The tests cover all auth endpoints with the following scenarios:

### 1. Email Availability Check

- ✅ `check-email-available.bru` - Check if email is available
- ✅ `check-email-unavailable.bru` - Check registered email returns unavailable

### 2. Registration

- ✅ `register.bru` - Successfully register a new user
- ✅ `register-duplicate-email.bru` - Reject duplicate email (409)
- ✅ `register-duplicate-username.bru` - Reject duplicate username (409)
- ✅ `register-invalid-email.bru` - Reject invalid email format (400)
- ✅ `register-invalid-username.bru` - Reject username with special characters like @ (400)
- ✅ `register-missing-password.bru` - Reject missing password (400)

### 3. Login

- ✅ `login-with-email.bru` - Login using email
- ✅ `login-with-username.bru` - Login using username
- ✅ `login-invalid-email.bru` - Reject non-existent email (401)
- ✅ `login-invalid-username.bru` - Reject non-existent username (401)
- ✅ `login-invalid-password.bru` - Reject wrong password (401)

### 4. Token Refresh

- ✅ `refresh-token.bru` - Successfully refresh access token
- ✅ `refresh-token-invalid.bru` - Reject invalid refresh token (401)

### 5. Get Current User

- ✅ `me.bru` - Get user profile with valid token
- ✅ `me-without-token.bru` - Reject request without token (401)
- ✅ `me-invalid-token.bru` - Reject invalid token (401)

## Running the Tests

### Prerequisites

1. Ensure the API server is running: `npm run start:dev`
2. Set up the environment file: `bruno/.env`
   ```bash
   BASE_URL=http://localhost:3000/api/v1
   ```

### Execution Order

The tests are numbered sequentially (seq 1-18) and should be run in order:

1. **Check email availability** (seq 1)
2. **Register a new user** (seq 2) - This sets up environment variables used by later tests
3. **Check email now unavailable** (seq 3)
4. **Test duplicate scenarios** (seq 4-5)
5. **Test validation errors** (seq 6-8)
6. **Test login flows** (seq 9-13)
7. **Test token refresh** (seq 14-15)
8. **Test authenticated endpoint** (seq 16-18)

### Environment Variables

The `register.bru` test automatically sets the following environment variables for use in subsequent tests:

- `accessToken` - JWT access token
- `refreshToken` - JWT refresh token
- `testUsername` - The registered username
- `testEmail` - The registered email
- `testPassword` - The registration password

These variables are used by the login, refresh, and me tests.

### Running All Tests

In Bruno, you can run the entire auth collection by:

1. Opening the `auth` folder
2. Right-clicking and selecting "Run Collection"

### Running Individual Tests

Click on any test file and click the "Send" button to execute it individually.

## Username Validation Rules

Usernames can only contain:

- Letters (a-z, A-Z)
- Numbers (0-9)
- Underscores (\_)
- Periods (.)

**NO special characters like "@"** are allowed to keep usernames distinct from emails.

## Features Tested

- ✅ Login with email or username
- ✅ Strict username validation (no @ symbol)
- ✅ Email format validation
- ✅ Password requirement validation
- ✅ Duplicate prevention (email and username)
- ✅ JWT token generation and validation
- ✅ Token refresh flow
- ✅ Protected endpoint authentication
