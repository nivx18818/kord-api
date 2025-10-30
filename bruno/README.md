# Kord API - Bruno Test Collection

This is the Bruno API test collection for the Kord API project. Bruno is a fast and git-friendly API client alternative to Postman.

## Getting Started

### Install Bruno

Download and install Bruno from [usebruno.com](https://www.usebruno.com/)

### Setup Environment

1. Copy the example environment file:

   ```bash
   cp bruno/.env.example bruno/.env
   ```

2. Update the `BASE_URL` in `bruno/.env`:

   ```bash
   BASE_URL=http://localhost:3000/api/v1
   ```

3. Start the API server:
   ```bash
   npm run start:dev
   ```

### Open Collection in Bruno

1. Open Bruno
2. Click "Open Collection"
3. Navigate to the `bruno` folder in this project
4. The collection will load with all folders and tests

## Collection Structure

```
bruno/
├── auth/               # Authentication tests (18 tests)
│   ├── README.md      # Detailed auth test documentation
│   ├── check-email-*.bru
│   ├── register*.bru
│   ├── login-*.bru
│   ├── refresh-token*.bru
│   └── me*.bru
└── users/             # User management tests (12 tests)
    ├── create.bru
    ├── update.bru
    ├── delete.bru
    ├── get-by-id.bru
    ├── duplicate-*.bru
    ├── invalid-*.bru
    └── missing-*.bru
```

## Test Collections

### Auth Module (`auth/`)

Comprehensive tests for authentication and authorization:

- Email availability checking
- User registration with validation
- Login with email or username
- JWT token refresh
- Protected endpoint access
- **18 total tests** covering all auth scenarios

See [auth/README.md](./auth/README.md) for detailed documentation.

### Users Module (`users/`)

Tests for user CRUD operations:

- Create user
- Get user by ID
- Update user
- Delete user
- Validation error handling
- **12 total tests**

## Running Tests

### Run Entire Collection

1. Right-click on the collection root in Bruno
2. Select "Run Collection"
3. All tests will execute sequentially

### Run a Specific Folder

1. Right-click on a folder (e.g., `auth/`)
2. Select "Run Folder"
3. All tests in that folder will execute

### Run Individual Test

1. Click on a test file
2. Click the "Send" button
3. View the response and test results

## Environment Variables

### Pre-configured Variables

- `base_url` - API base URL (from .env file)

### Dynamic Variables (Set by tests)

The auth tests automatically set these variables for reuse:

- `accessToken` - JWT access token
- `refreshToken` - JWT refresh token
- `testUsername` - Test user's username
- `testEmail` - Test user's email
- `testPassword` - Test user's password
- `userId` - Created user ID

These variables are used across tests to maintain state and test flows.

## Best Practices

### Sequential Testing

Some tests depend on previous tests (e.g., login requires registration). Run collections in order for best results.

### Clean State

For the most reliable results:

1. Reset your test database between full collection runs
2. Or use unique timestamps in test data (already implemented)

### Authentication Flow

1. **Register** → Creates user and gets tokens
2. **Login** → Gets new tokens
3. **Refresh** → Rotates tokens
4. **Me** → Uses token to get user info

## Test Features

### Validation Coverage

- ✅ Email format validation
- ✅ Username format validation (letters, numbers, \_, . only)
- ✅ Password requirements (min 8 characters)
- ✅ Date of birth format
- ✅ Required field validation

### Error Handling

- ✅ 400 Bad Request (validation errors)
- ✅ 401 Unauthorized (auth errors)
- ✅ 409 Conflict (duplicates)

### Authentication & Authorization

- ✅ JWT token generation
- ✅ Token refresh mechanism
- ✅ Bearer token authentication
- ✅ Protected endpoint access

### Edge Cases

- ✅ Duplicate email prevention
- ✅ Duplicate username prevention
- ✅ Invalid credentials handling
- ✅ Malformed token handling
- ✅ Missing required fields

## Key Features Tested

### Login with Email or Username

Users can authenticate using either:

```json
{
  "usernameOrEmail": "user@example.com",
  "password": "Password123!"
}
```

or

```json
{
  "usernameOrEmail": "username",
  "password": "Password123!"
}
```

### Username Validation

Usernames are validated to allow only:

- Letters (a-z, A-Z)
- Numbers (0-9)
- Underscores (\_)
- Periods (.)

**Special characters like "@" are NOT allowed** to keep usernames clearly distinct from emails.

## Troubleshooting

### Tests Failing

1. Ensure API server is running: `npm run start:dev`
2. Check environment variables in `bruno/.env`
3. Verify database is accessible
4. Check for port conflicts (default: 3000)

### Environment Variables Not Set

Some tests depend on variables set by earlier tests (like `accessToken`). Run tests in sequence order.

### Connection Errors

- Verify `BASE_URL` matches your running server
- Check firewall settings
- Ensure no port conflicts

## Contributing

When adding new endpoints:

1. Create corresponding Bruno test files
2. Follow naming convention: `action-scenario.bru`
3. Add appropriate test assertions
4. Document in README files
5. Set sequential order (`seq`) appropriately

## Resources

- [Bruno Documentation](https://docs.usebruno.com/)
- [Kord API Documentation](../README.md)
- [Auth Tests Documentation](./auth/README.md)
