# Authentication API

The authentication system uses cookie-based JWT tokens for secure, stateless authentication.

## Base URL

```
/api/v1/auth
```

## Authentication Flow

1. **Register/Login** → Receive access & refresh tokens in HTTP-only cookies
2. **Make API Requests** → Access token automatically sent with requests
3. **Token Expires** → Automatically refresh using refresh token
4. **Logout** → Clear tokens and invalidate refresh token

## Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Authentication:** None

**Request Body:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "dateOfBirth": "1995-06-15",
  "name": "John Doe" // Optional
}
```

**Validation Rules:**

- `username`: Required, alphanumeric with underscores/periods only (`/^[a-zA-Z0-9_.]+$/`)
- `email`: Required, valid email format
- `password`: Required, minimum 8 characters
- `dateOfBirth`: Required, ISO 8601 date string (YYYY-MM-DD)
- `name`: Optional string

**Success Response (201 Created):**

```json
{
  "message": "Registration successful"
}
```

**Cookies Set:**

- `accessToken` - 15 minute expiry
- `refreshToken` - 7 day expiry (path: `/api/v1/auth/refresh`)

**Error Responses:**

_409 Conflict - Duplicate Username:_

```json
{
  "code": 40902,
  "message": "Username already taken"
}
```

_409 Conflict - Duplicate Email:_

```json
{
  "code": 40901,
  "message": "Email already registered"
}
```

_400 Bad Request - Validation Error:_

```json
{
  "code": 40001,
  "message": "Validation failed",
  "errors": {
    "email": [
      {
        "code": "IS_EMAIL",
        "message": "email must be an email"
      }
    ],
    "password": [
      {
        "code": "MIN_LENGTH",
        "message": "password must be longer than or equal to 8 characters"
      }
    ]
  }
}
```

---

### Login

Authenticate an existing user.

**Endpoint:** `POST /auth/login`

**Authentication:** None

**Request Body:**

```json
{
  "usernameOrEmail": "johndoe", // can be username or email
  "password": "SecurePass123"
}
```

**Validation Rules:**

- `usernameOrEmail`: Required string (username or email)
- `password`: Required, minimum 8 characters

**Success Response (200 OK):**

```json
{
  "message": "Login successful"
}
```

**Cookies Set:**

- `accessToken` - 15 minute expiry
- `refreshToken` - 7 day expiry (path: `/api/v1/auth/refresh`)

**Error Responses:**

_401 Unauthorized - Invalid Credentials:_

```json
{
  "code": 40101,
  "message": "Invalid credentials"
}
```

---

### Get Current User

Get the authenticated user's profile information.

**Endpoint:** `GET /auth/me`

**Authentication:** Required (JWT)

**Request Headers:**

```
Cookie: accessToken=<jwt_token>
```

**Success Response (200 OK):**

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "iat": 1635724800,
  "exp": 1635725700
}
```

**Error Responses:**

_401 Unauthorized - Missing Token:_

```json
{
  "code": 40105,
  "message": "Missing authentication credentials"
}
```

_401 Unauthorized - Invalid Token:_

```json
{
  "code": 40102,
  "message": "Invalid authentication token"
}
```

---

### Refresh Access Token

Obtain a new access token using the refresh token.

**Endpoint:** `POST /auth/refresh`

**Authentication:** Refresh Token Required

**Request Headers:**

```
Cookie: refreshToken=<refresh_jwt_token>
```

**Success Response (200 OK):**

```json
{
  "message": "Token refreshed"
}
```

**Cookies Set:**

- `accessToken` - New 15 minute expiry
- `refreshToken` - New 7 day expiry

**Error Responses:**

_401 Unauthorized - Missing/Invalid Refresh Token:_

```json
{
  "code": 40104,
  "message": "Invalid or expired refresh token"
}
```

---

### Logout

Invalidate the refresh token and clear cookies.

**Endpoint:** `POST /auth/logout`

**Authentication:** Required (JWT)

**Request Headers:**

```
Cookie: accessToken=<jwt_token>; refreshToken=<refresh_jwt_token>
```

**Success Response (200 OK):**

```json
{
  "message": "Logout successful"
}
```

**Cookies Cleared:**

- `accessToken`
- `refreshToken`

---

### Check Email Availability

Check if an email address is available for registration.

**Endpoint:** `GET /auth/check-email`

**Authentication:** None

**Query Parameters:**

- `email` (required): Email address to check

**Example Request:**

```
GET /auth/check-email?email=john@example.com
```

**Success Response (200 OK):**

```json
{
  "available": true
}
```

or

```json
{
  "available": false
}
```

---

## Frontend Integration Examples

### React with Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true, // Important: Send cookies with requests
});

// Register
async function register(userData) {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}

// Login
async function login(credentials) {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}

// Get current user
async function getCurrentUser() {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}

// Logout
async function logout() {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
}

// Axios interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
```

### Fetch API

```javascript
const API_BASE = 'http://localhost:3000/api/v1';

async function register(userData) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: Include cookies
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
}

async function makeAuthenticatedRequest(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Handle token expiration
  if (response.status === 401) {
    const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      // Retry original request
      return fetch(`${API_BASE}${url}`, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    } else {
      // Redirect to login
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
}
```

## Important Notes

1. **CORS Configuration**: Ensure your frontend URL is configured in the `FRONTEND_URL` environment variable
2. **Cookies**: Always use `withCredentials: true` (Axios) or `credentials: 'include'` (Fetch)
3. **Token Refresh**: Implement automatic token refresh on 401 responses
4. **Security**: Never store tokens in localStorage or sessionStorage - they're managed via HTTP-only cookies
5. **Path Restrictions**: The refresh token cookie is restricted to `/api/v1/auth/refresh` path for security
