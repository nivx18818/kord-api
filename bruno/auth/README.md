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

### 6. Logout

- ✅ `logout.bru` - Successfully logout and clear session cookies

## Running the Tests

### Prerequisites

1. Ensure the API server is running: `npm run start:dev`
2. Set up the environment file: `bruno/.env`
   ```bash
   BASE_URL=http://localhost:3000/api/v1
   ```

### Execution Order

To run the complete authentication flow, execute tests in this order:

1. **check-email-available.bru** (seq 1) - Verify email is available
2. **register.bru** (seq 2) - Register new user (sets cookies automatically)
3. **me.bru** (seq 16) - Verify authenticated access works
4. **login-with-email.bru** (seq 9) - Login with email
5. **login-with-username.bru** (seq 10) - Login with username
6. **refresh-token.bru** (seq 14) - Refresh access token
7. **logout.bru** (seq 20) - Logout and clear session
8. **me-without-token.bru** (seq 17) - Verify unauthenticated access fails

### Cookie-Based Authentication

This API uses cookie-based JWT authentication. Bruno automatically handles cookies:

- Cookies are set when you login/register
- Cookies are sent with subsequent requests automatically
- No need to manually manage tokens
- Run logout test to clear cookies between test runs

### Environment Variables

The tests no longer store tokens. They only use:

- `testEmail` - Email for testing
- `testUsername` - Username for testing
- `testPassword` - Password for testing

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
