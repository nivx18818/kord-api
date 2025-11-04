# Users API

User management endpoints for creating, reading, updating, and deleting user accounts, as well as managing user profiles and muting functionality.

## Base URL

```
/api/v1/users
```

## Endpoints

### Create User

Create a new user account (alternative to registration endpoint).

**Endpoint:** `POST /users`

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

**Success Response (201 Created):**

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "name": "John Doe",
  "dateOfBirth": "1995-06-15T00:00:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### Get All Users

Retrieve a paginated list of all users with offset-based pagination.

**Endpoint:** `GET /users`

**Authentication:** Optional

**Query Parameters:**

- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, min: 1, max: 100)

**Example Request:**

```
GET /users?page=1&limit=20
```

**Success Response (200 OK):**

```json
{
  "items": [
    {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "name": "John Doe",
      "dateOfBirth": "1995-06-15T00:00:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "profile": {
        "userId": 1,
        "bio": "Software developer",
        "avatar": "https://example.com/avatars/johndoe.jpg",
        "banner": null,
        "xTwitter": "johndoe",
        "github": "johndoe",
        "linkedin": null,
        "facebook": null,
        "website": "https://johndoe.dev"
      }
    },
    {
      "id": 2,
      "username": "janedoe",
      "email": "jane@example.com",
      "name": "Jane Doe",
      "dateOfBirth": "1998-03-22T00:00:00.000Z",
      "createdAt": "2024-01-16T14:20:00.000Z",
      "updatedAt": "2024-01-16T14:20:00.000Z",
      "profile": null
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 45,
  "totalPages": 3,
  "hasMore": true
}
```

**Response Fields:**

- `items`: Array of user objects (includes profile if exists)
- `page`: Current page number
- `limit`: Items per page
- `total`: Total number of users
- `totalPages`: Total number of pages
- `hasMore`: Boolean indicating if more pages exist

---

### Get User by ID

Retrieve a specific user by their ID.

**Endpoint:** `GET /users/:id`

**Authentication:** Optional

**Path Parameters:**

- `id`: User ID

**Example Request:**

```
GET /users/1
```

**Success Response (200 OK):**

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "name": "John Doe",
  "dateOfBirth": "1995-06-15T00:00:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "profile": {
    "userId": 1,
    "bio": "Software developer and coffee enthusiast",
    "avatar": "https://example.com/avatars/johndoe.jpg",
    "banner": "https://example.com/banners/johndoe.jpg",
    "xTwitter": "johndoe",
    "github": "johndoe",
    "linkedin": "johndoe",
    "website": "https://johndoe.dev"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "code": 40401,
  "message": "User not found"
}
```

---

### Get User's Servers

Retrieve all servers that a user is a member of.

**Endpoint:** `GET /users/:id/servers`

**Authentication:** Optional

**Path Parameters:**

- `id`: User ID

**Example Request:**

```
GET /users/1/servers
```

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "My Awesome Server",
    "servername": "awesome-server",
    "createdAt": "2024-01-10T08:00:00.000Z",
    "membership": {
      "userId": 1,
      "serverId": 1,
      "roleId": 2,
      "createdAt": "2024-01-10T09:00:00.000Z"
    }
  },
  {
    "id": 3,
    "name": "Gaming Community",
    "servername": "gaming-hub",
    "createdAt": "2024-01-12T15:30:00.000Z",
    "membership": {
      "userId": 1,
      "serverId": 3,
      "roleId": 5,
      "createdAt": "2024-01-13T10:00:00.000Z"
    }
  }
]
```

---

### Update User

Update user information.

**Endpoint:** `PATCH /users/:id`

**Authentication:** Required (JWT)

**Path Parameters:**

- `id`: User ID

**Request Body:**

```json
{
  "name": "John Updated Doe",
  "email": "john.new@example.com"
}
```

**Updatable Fields:**

- `name`: String (optional)
- `username`: String (must be unique)
- `email`: String (must be unique, valid email)
- `password`: String (minimum 8 characters)
- `dateOfBirth`: ISO 8601 date string

**Success Response (200 OK):**

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john.new@example.com",
  "name": "John Updated Doe",
  "dateOfBirth": "1995-06-15T00:00:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T16:45:00.000Z"
}
```

**Error Responses:**

_401 Unauthorized:_

```json
{
  "code": 40101,
  "message": "Authentication required"
}
```

_409 Conflict - Duplicate Email/Username:_

```json
{
  "code": 40901,
  "message": "Email already registered"
}
```

---

### Delete User

Delete a user account.

**Endpoint:** `DELETE /users/:id`

**Authentication:** Required (JWT)

**Path Parameters:**

- `id`: User ID

**Example Request:**

```
DELETE /users/1
```

**Success Response (200 OK):**

```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**

_401 Unauthorized:_

```json
{
  "code": 40101,
  "message": "Authentication required"
}
```

_404 Not Found:_

```json
{
  "code": 40401,
  "message": "User not found"
}
```

---

### Get Muted Users

Retrieve all users that the current user has muted.

**Endpoint:** `GET /users/:id/muted`

**Authentication:** Required (JWT)

**Path Parameters:**

- `id`: User ID (must match authenticated user)

**Example Request:**

```
GET /users/1/muted
```

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "userId": 1,
    "targetId": 5,
    "reason": "Spam messages",
    "createdAt": "2024-01-18T12:00:00.000Z",
    "target": {
      "id": 5,
      "username": "spammer123",
      "name": "Spam User"
    }
  },
  {
    "id": 2,
    "userId": 1,
    "targetId": 8,
    "reason": null,
    "createdAt": "2024-01-19T09:30:00.000Z",
    "target": {
      "id": 8,
      "username": "annoying_user",
      "name": "Annoying Person"
    }
  }
]
```

---

### Mute User

Mute another user to hide their messages.

**Endpoint:** `POST /users/:id/mute`

**Authentication:** Required (JWT)

**Path Parameters:**

- `id`: Current user's ID

**Request Body:**

```json
{
  "targetId": 5,
  "reason": "Spam messages" // Optional
}
```

**Success Response (200 OK):**

```json
{
  "id": 1,
  "userId": 1,
  "targetId": 5,
  "reason": "Spam messages",
  "createdAt": "2024-01-18T12:00:00.000Z",
  "updatedAt": "2024-01-18T12:00:00.000Z"
}
```

**Error Responses:**

_400 Bad Request - Already Muted:_

```json
{
  "code": 40001,
  "message": "User already muted"
}
```

_404 Not Found - Target User Not Found:_

```json
{
  "code": 40401,
  "message": "User not found"
}
```

---

### Unmute User

Remove a user from the muted list.

**Endpoint:** `DELETE /users/:id/mute/:targetId`

**Authentication:** Required (JWT)

**Path Parameters:**

- `id`: Current user's ID
- `targetId`: ID of the user to unmute

**Example Request:**

```
DELETE /users/1/mute/5
```

**Success Response (200 OK):**

```json
{
  "message": "User unmuted successfully"
}
```

**Error Responses:**

_404 Not Found - Mute Not Found:_

```json
{
  "code": 40401,
  "message": "User not found"
}
```

---

## Frontend Integration Examples

### React with Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true,
});

// Get all users with pagination
async function getUsers(page = 1, limit = 10) {
  const response = await api.get('/users', {
    params: { page, limit },
  });
  return response.data;
}

// Get user by ID
async function getUserById(userId) {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

// Get user's servers
async function getUserServers(userId) {
  const response = await api.get(`/users/${userId}/servers`);
  return response.data;
}

// Update user
async function updateUser(userId, updates) {
  const response = await api.patch(`/users/${userId}`, updates);
  return response.data;
}

// Delete user
async function deleteUser(userId) {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
}

// Mute user
async function muteUser(userId, targetId, reason) {
  const response = await api.post(`/users/${userId}/mute`, {
    targetId,
    reason,
  });
  return response.data;
}

// Unmute user
async function unmuteUser(userId, targetId) {
  const response = await api.delete(`/users/${userId}/mute/${targetId}`);
  return response.data;
}

// Get muted users
async function getMutedUsers(userId) {
  const response = await api.get(`/users/${userId}/muted`);
  return response.data;
}
```

### Usage in React Component

```jsx
import { useState, useEffect } from 'react';
import { getUserById, muteUser, getMutedUsers } from './api/users';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [mutedUsers, setMutedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [userData, mutedData] = await Promise.all([
          getUserById(userId),
          getMutedUsers(userId),
        ]);
        setUser(userData);
        setMutedUsers(mutedData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  const handleMuteUser = async (targetId, reason) => {
    try {
      await muteUser(userId, targetId, reason);
      const updated = await getMutedUsers(userId);
      setMutedUsers(updated);
    } catch (error) {
      console.error('Error muting user:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user.name || user.username}</h1>
      <p>@{user.username}</p>
      <p>{user.email}</p>
      {user.profile && (
        <div>
          <p>{user.profile.bio}</p>
          <img src={user.profile.avatar} alt="Avatar" />
        </div>
      )}

      <h2>Muted Users</h2>
      <ul>
        {mutedUsers.map((mute) => (
          <li key={mute.id}>
            {mute.target.username}
            {mute.reason && ` - ${mute.reason}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Notes

- Password field is never returned in responses for security
- Date of birth is stored as a Date type but returned in ISO 8601 format
- User deletion cascades to all related records (messages, memberships, etc.)
- Muting is a client-side feature - messages from muted users are still returned by the API
- Users can only update/delete their own accounts (enforced by JWT authentication)
