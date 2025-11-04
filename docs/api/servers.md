# Servers API

Server management endpoints for creating community spaces, managing server settings, invites, and memberships.

## Base URL

```
/api/v1/servers
```

## Endpoints

### Create Server

Create a new server (community space).

**Endpoint:** `POST /servers`

**Authentication:** Required (JWT)

**Request Body:**

```json
{
  "name": "My Awesome Server",
  "servername": "awesome-server"
}
```

**Validation Rules:**

- `name`: Required string
- `servername`: Required string, must be unique (URL-friendly identifier)

**Success Response (201 Created):**

```json
{
  "id": 1,
  "name": "My Awesome Server",
  "servername": "awesome-server",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

_409 Conflict - Duplicate Servername:_

```json
{
  "code": 40903,
  "message": "Servername already taken"
}
```

---

### Get All Servers

Retrieve servers with optional filtering by user membership and offset-based pagination.

**Endpoint:** `GET /servers`

**Authentication:** Required (JWT)

**Query Parameters:**

- `userId` (optional): Filter servers by user membership
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, min: 1, max: 100)

**Example Requests:**

```
GET /servers?page=1&limit=20
GET /servers?userId=5
```

**Success Response (200 OK):**

_Without userId (paginated):_

```json
{
  "items": [
    {
      "id": 1,
      "name": "My Awesome Server",
      "servername": "awesome-server",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "name": "Gaming Community",
      "servername": "gaming-hub",
      "createdAt": "2024-01-16T12:00:00.000Z",
      "updatedAt": "2024-01-16T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 45,
  "totalPages": 3,
  "hasMore": true
}
```

_With userId (array response, no pagination):_

```json
[
  {
    "id": 1,
    "name": "My Awesome Server",
    "servername": "awesome-server",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "joinedAt": "2024-01-15T11:00:00.000Z",
    "role": {
      "id": 2,
      "serverId": 1,
      "name": "Member",
      "permissions": {
        "VIEW_CHANNELS": true,
        "SEND_MESSAGES": true
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
]
```

---

### Get Server by ID

Retrieve detailed information about a specific server.

**Endpoint:** `GET /servers/:id`

**Authentication:** Required (JWT)

**Required Permission:** `VIEW_CHANNELS`

**Path Parameters:**

- `id`: Server ID

**Example Request:**

```
GET /servers/1
```

**Success Response (200 OK):**

```json
{
  "id": 1,
  "name": "My Awesome Server",
  "servername": "awesome-server",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "channels": [
    {
      "id": 1,
      "name": "general",
      "type": "TEXT",
      "status": "PUBLIC",
      "serverId": 1
    },
    {
      "id": 2,
      "name": "voice-chat",
      "type": "VOICE",
      "status": "PUBLIC",
      "serverId": 1
    }
  ],
  "members": [
    {
      "userId": 1,
      "serverId": 1,
      "roleId": 1,
      "user": {
        "id": 1,
        "username": "johndoe",
        "name": "John Doe"
      }
    }
  ],
  "roles": [
    {
      "id": 1,
      "name": "Admin",
      "serverId": 1,
      "permissions": {
        "manageChannels": true,
        "manageRoles": true,
        "kickMembers": true,
        "banMembers": true
      }
    }
  ]
}
```

**Error Responses:**

_403 Forbidden - Insufficient Permissions:_

```json
{
  "code": 40301,
  "message": "Access denied"
}
```

_404 Not Found:_

```json
{
  "code": 40402,
  "message": "Server not found"
}
```

---

### Update Server

Update server information.

**Endpoint:** `PATCH /servers/:id`

**Authentication:** Required (JWT)

**Required Permission:** `MANAGE_SERVERS`

**Path Parameters:**

- `id`: Server ID

**Request Body:**

```json
{
  "name": "Updated Server Name",
  "servername": "new-servername"
}
```

**Success Response (200 OK):**

```json
{
  "id": 1,
  "name": "Updated Server Name",
  "servername": "new-servername",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T14:45:00.000Z"
}
```

---

### Delete Server

Delete a server and all associated data.

**Endpoint:** `DELETE /servers/:id`

**Authentication:** Required (JWT)

**Required Permission:** `MANAGE_SERVERS`

**Path Parameters:**

- `id`: Server ID

**Example Request:**

```
DELETE /servers/1
```

**Success Response (200 OK):**

```json
{
  "message": "Server deleted successfully"
}
```

---

### Create Server Invite

Generate an invite code for a server.

**Endpoint:** `POST /servers/:id/invites`

**Authentication:** Required (JWT)

**Required Permission:** `MANAGE_INVITES`

**Path Parameters:**

- `id`: Server ID

**Request Body:**

```json
{
  "createdBy": 1,
  "expiresInDays": 7 // Optional, defaults to no expiration
}
```

**Success Response (201 Created):**

```json
{
  "id": 1,
  "code": "abc123xyz",
  "serverId": 1,
  "createdBy": 1,
  "expiresAt": "2024-01-22T10:30:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### Get Server Invites

List all active invites for a server.

**Endpoint:** `GET /servers/:id/invites`

**Authentication:** Required (JWT)

**Required Permission:** `MANAGE_INVITES`

**Path Parameters:**

- `id`: Server ID

**Example Request:**

```
GET /servers/1/invites
```

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "code": "abc123xyz",
    "serverId": 1,
    "createdBy": 1,
    "expiresAt": "2024-01-22T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "creator": {
      "id": 1,
      "username": "johndoe",
      "name": "John Doe"
    }
  },
  {
    "id": 2,
    "code": "xyz789abc",
    "serverId": 1,
    "createdBy": 2,
    "expiresAt": null,
    "createdAt": "2024-01-16T14:20:00.000Z",
    "creator": {
      "id": 2,
      "username": "janedoe",
      "name": "Jane Doe"
    }
  }
]
```

---

### Delete Server Invite

Revoke an invite code.

**Endpoint:** `DELETE /servers/:id/invites/:code`

**Authentication:** Required (JWT)

**Required Permission:** `MANAGE_INVITES`

**Path Parameters:**

- `id`: Server ID
- `code`: Invite code

**Example Request:**

```
DELETE /servers/1/invites/abc123xyz
```

**Success Response (200 OK):**

```json
{
  "message": "Invite deleted successfully"
}
```

---

### Redeem Invite

Join a server using an invite code.

**Endpoint:** `POST /servers/invites/redeem`

**Authentication:** Required (JWT)

**Request Body:**

```json
{
  "code": "abc123xyz",
  "userId": 5
}
```

**Success Response (200 OK):**

```json
{
  "message": "Successfully joined server",
  "membership": {
    "userId": 5,
    "serverId": 1,
    "roleId": null,
    "createdAt": "2024-01-18T09:00:00.000Z"
  },
  "server": {
    "id": 1,
    "name": "My Awesome Server",
    "servername": "awesome-server"
  }
}
```

**Error Responses:**

_404 Not Found - Invalid Invite:_

```json
{
  "code": 40409,
  "message": "Invite not found"
}
```

_400 Bad Request - Already Member:_

```json
{
  "code": 40904,
  "message": "Already a member of this server"
}
```

---

## Permissions Reference

Servers use role-based permissions. The following permissions are available:

| Permission         | Description                       |
| ------------------ | --------------------------------- |
| `VIEW_CHANNELS`    | View channels in the server       |
| `MANAGE_CHANNELS`  | Create, edit, and delete channels |
| `MANAGE_SERVERS`   | Edit server settings              |
| `MANAGE_ROLES`     | Create and manage roles           |
| `MANAGE_INVITES`   | Create, view, and delete invites  |
| `KICK_MEMBERS`     | Remove members from server        |
| `BAN_MEMBERS`      | Ban members from server           |
| `SEND_MESSAGES`    | Send messages in channels         |
| `EDIT_MESSAGES`    | Edit own messages                 |
| `DELETE_MESSAGES`  | Delete any messages               |
| `ADD_REACTIONS`    | Add emoji reactions               |
| `MANAGE_REACTIONS` | Remove others' reactions          |
| `CONNECT_VOICE`    | Join voice channels               |
| `MUTE_MEMBERS`     | Mute members in voice             |
| `DEAFEN_MEMBERS`   | Deafen members in voice           |

---

## Frontend Integration Examples

### React with Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true,
});

// Create server
async function createServer(name, servername) {
  const response = await api.post('/servers', { name, servername });
  return response.data;
}

// Get all servers for a user
async function getUserServers(userId) {
  const response = await api.get('/servers', {
    params: { userId },
  });
  return response.data;
}

// Get server details
async function getServer(serverId) {
  const response = await api.get(`/servers/${serverId}`);
  return response.data;
}

// Update server
async function updateServer(serverId, updates) {
  const response = await api.patch(`/servers/${serverId}`, updates);
  return response.data;
}

// Delete server
async function deleteServer(serverId) {
  const response = await api.delete(`/servers/${serverId}`);
  return response.data;
}

// Create invite
async function createInvite(serverId, createdBy, expiresInDays) {
  const response = await api.post(`/servers/${serverId}/invites`, {
    createdBy,
    expiresInDays,
  });
  return response.data;
}

// Get server invites
async function getServerInvites(serverId) {
  const response = await api.get(`/servers/${serverId}/invites`);
  return response.data;
}

// Redeem invite
async function redeemInvite(code, userId) {
  const response = await api.post('/servers/invites/redeem', {
    code,
    userId,
  });
  return response.data;
}

// Delete invite
async function deleteInvite(serverId, code) {
  const response = await api.delete(`/servers/${serverId}/invites/${code}`);
  return response.data;
}
```

### Usage in React Component

```jsx
import { useState, useEffect } from 'react';
import { getUserServers, createServer, createInvite } from './api/servers';

function ServerList({ userId }) {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServers() {
      try {
        const data = await getUserServers(userId);
        setServers(data);
      } catch (error) {
        console.error('Error fetching servers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchServers();
  }, [userId]);

  const handleCreateServer = async (name, servername) => {
    try {
      const newServer = await createServer(name, servername);
      setServers([...servers, newServer]);
    } catch (error) {
      console.error('Error creating server:', error);
      alert(error.response?.data?.message || 'Failed to create server');
    }
  };

  const handleCreateInvite = async (serverId) => {
    try {
      const invite = await createInvite(serverId, userId, 7);
      alert(`Invite created: ${invite.code}`);
    } catch (error) {
      console.error('Error creating invite:', error);
      alert('Failed to create invite. Check your permissions.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Servers</h1>
      <ul>
        {servers.map((server) => (
          <li key={server.id}>
            <h3>{server.name}</h3>
            <p>@{server.servername}</p>
            <button onClick={() => handleCreateInvite(server.id)}>
              Create Invite
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={() => {
          const name = prompt('Server name:');
          const servername = prompt('Servername (URL-friendly):');
          if (name && servername) handleCreateServer(name, servername);
        }}
      >
        Create New Server
      </button>
    </div>
  );
}
```

## Notes

- Server creator automatically becomes a member with admin role
- Servername must be unique across all servers
- Deleting a server cascades to all channels, messages, memberships, and roles
- Invite codes are randomly generated and must be unique
- Expired invites are automatically filtered out when listing
- Permissions are checked on every protected endpoint using the `RolesGuard`
