# Memberships API

Server membership management endpoints for handling user-server relationships and role assignments.

## Base URL

```
/api/v1/memberships
```

## Endpoints

### Create Membership

Add a user to a server (join server).

**Endpoint:** `POST /memberships`

**Authentication:** Required (JWT)

**Request Body:**

```json
{
  "userId": 5,
  "serverId": 1,
  "roleId": 3 // Optional: Assign a role immediately
}
```

**Validation Rules:**

- `userId`: Required integer
- `serverId`: Required integer
- `roleId`: Optional integer

**Success Response (201 Created):**

```json
{
  "userId": 5,
  "serverId": 1,
  "roleId": 3,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

_400 Bad Request - Already Member:_

```json
{
  "code": 40904,
  "message": "Already a member of this server"
}
```

_404 Not Found - User/Server Not Found:_

```json
{
  "code": 40401,
  "message": "User not found"
}
```

---

### Get All Memberships

Retrieve all memberships (admin view).

**Endpoint:** `GET /memberships`

**Authentication:** Required (JWT)

**Example Request:**

```
GET /memberships
```

**Success Response (200 OK):**

```json
[
  {
    "userId": 1,
    "serverId": 1,
    "roleId": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "user": {
      "id": 1,
      "username": "johndoe",
      "name": "John Doe",
      "profile": {
        "avatar": "https://example.com/avatars/johndoe.jpg"
      }
    },
    "server": {
      "id": 1,
      "name": "My Awesome Server",
      "servername": "awesome-server"
    },
    "role": {
      "id": 1,
      "name": "Admin",
      "permissions": {
        "manageChannels": true,
        "manageRoles": true
      }
    }
  },
  {
    "userId": 5,
    "serverId": 1,
    "roleId": 3,
    "createdAt": "2024-01-16T14:20:00.000Z",
    "user": {
      "id": 5,
      "username": "alice",
      "name": "Alice Smith"
    },
    "server": {
      "id": 1,
      "name": "My Awesome Server",
      "servername": "awesome-server"
    },
    "role": {
      "id": 3,
      "name": "Member"
    }
  }
]
```

---

### Get Membership by Composite ID

Retrieve a specific membership.

**Endpoint:** `GET /memberships/:userId/:serverId`

**Authentication:** Required (JWT)

**Path Parameters:**

- `userId`: User ID
- `serverId`: Server ID

**Example Request:**

```
GET /memberships/5/1
```

**Success Response (200 OK):**

```json
{
  "userId": 5,
  "serverId": 1,
  "roleId": 3,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "user": {
    "id": 5,
    "username": "alice",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "profile": {
      "avatar": "https://example.com/avatars/alice.jpg",
      "bio": "Software developer"
    }
  },
  "server": {
    "id": 1,
    "name": "My Awesome Server",
    "servername": "awesome-server",
    "createdAt": "2024-01-10T08:00:00.000Z"
  },
  "role": {
    "id": 3,
    "name": "Member",
    "permissions": {
      "viewChannels": true,
      "sendMessages": true,
      "addReactions": true
    }
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "code": 40408,
  "message": "Membership not found"
}
```

---

### Update Membership

Update a member's role assignment.

**Endpoint:** `PATCH /memberships/:userId/:serverId`

**Authentication:** Required (JWT)

**Path Parameters:**

- `userId`: User ID
- `serverId`: Server ID

**Request Body:**

```json
{
  "roleId": 2
}
```

**Success Response (200 OK):**

```json
{
  "userId": 5,
  "serverId": 1,
  "roleId": 2,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T16:00:00.000Z"
}
```

**Notes:**

- Set `roleId` to `null` to remove role assignment
- Only users with `MANAGE_ROLES` permission can update memberships
- Cannot modify own membership role

---

### Delete Membership (Leave/Kick)

Remove a user from a server.

**Endpoint:** `DELETE /memberships/:userId/:serverId`

**Authentication:** Required (JWT)

**Path Parameters:**

- `userId`: User ID
- `serverId`: Server ID

**Example Request:**

```
DELETE /memberships/5/1
```

**Success Response (200 OK):**

```json
{
  "message": "Membership deleted successfully"
}
```

**Notes:**

- Users can leave servers they're members of
- Users with `KICK_MEMBERS` permission can remove others
- Server owner cannot be removed (implement in application logic)

---

## Common Use Cases

### Get Server Members

To get all members of a server, query memberships by server:

```javascript
// Server members are typically included when fetching server details
const server = await getServer(serverId);
const members = server.members; // Array of memberships with user data
```

### Get User's Servers

To get all servers a user is a member of:

```javascript
// User's servers are available via the users endpoint
const servers = await getUserServers(userId);
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

// Create membership (join server)
async function joinServer(userId, serverId, roleId = null) {
  const response = await api.post('/memberships', {
    userId,
    serverId,
    roleId,
  });
  return response.data;
}

// Get membership details
async function getMembership(userId, serverId) {
  const response = await api.get(`/memberships/${userId}/${serverId}`);
  return response.data;
}

// Update member role
async function updateMemberRole(userId, serverId, roleId) {
  const response = await api.patch(`/memberships/${userId}/${serverId}`, {
    roleId,
  });
  return response.data;
}

// Remove member (kick) or leave server
async function leaveServer(userId, serverId) {
  const response = await api.delete(`/memberships/${userId}/${serverId}`);
  return response.data;
}

// Get all memberships
async function getAllMemberships() {
  const response = await api.get('/memberships');
  return response.data;
}
```

### Usage in React Component

```jsx
import { useState, useEffect } from 'react';
import {
  getMembership,
  updateMemberRole,
  leaveServer,
} from './api/memberships';

function ServerMemberList({
  serverId,
  members,
  currentUserId,
  currentUserRole,
}) {
  const [memberList, setMemberList] = useState(members);

  const canManageRoles = currentUserRole?.permissions?.manageRoles;
  const canKickMembers = currentUserRole?.permissions?.kickMembers;

  const handleRoleChange = async (userId, newRoleId) => {
    try {
      await updateMemberRole(userId, serverId, newRoleId);
      // Refresh member list
      setMemberList(
        memberList.map((m) =>
          m.userId === userId ? { ...m, roleId: newRoleId } : m,
        ),
      );
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update member role. Check your permissions.');
    }
  };

  const handleKickMember = async (userId) => {
    if (!confirm('Remove this member from the server?')) return;

    try {
      await leaveServer(userId, serverId);
      setMemberList(memberList.filter((m) => m.userId !== userId));
    } catch (error) {
      console.error('Error kicking member:', error);
      alert('Failed to remove member. Check your permissions.');
    }
  };

  const handleLeaveServer = async () => {
    if (!confirm('Leave this server?')) return;

    try {
      await leaveServer(currentUserId, serverId);
      // Redirect to server list or home
      window.location.href = '/servers';
    } catch (error) {
      console.error('Error leaving server:', error);
      alert('Failed to leave server.');
    }
  };

  return (
    <div className="member-list">
      <h2>Server Members ({memberList.length})</h2>

      {memberList.map((member) => (
        <div key={member.userId} className="member-item">
          <img
            src={member.user.profile?.avatar || '/default-avatar.png'}
            alt={member.user.username}
          />
          <div className="member-info">
            <strong>{member.user.name || member.user.username}</strong>
            <span>@{member.user.username}</span>
            {member.role && (
              <span className="role-badge">{member.role.name}</span>
            )}
          </div>

          <div className="member-actions">
            {canManageRoles && member.userId !== currentUserId && (
              <RoleSelector
                currentRoleId={member.roleId}
                serverId={serverId}
                onChange={(roleId) => handleRoleChange(member.userId, roleId)}
              />
            )}

            {canKickMembers && member.userId !== currentUserId && (
              <button
                onClick={() => handleKickMember(member.userId)}
                className="kick-btn"
              >
                Kick
              </button>
            )}
          </div>
        </div>
      ))}

      <button onClick={handleLeaveServer} className="leave-server-btn">
        Leave Server
      </button>
    </div>
  );
}
```

### Role Selector Component

```jsx
import { useState, useEffect } from 'react';
import { getServerRoles } from './api/roles';

function RoleSelector({ currentRoleId, serverId, onChange }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const data = await getServerRoles(serverId);
        setRoles(data);
      } catch (error) {
        console.error('Error fetching roles:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, [serverId]);

  if (loading) return <span>Loading...</span>;

  return (
    <select
      value={currentRoleId || ''}
      onChange={(e) =>
        onChange(e.target.value ? parseInt(e.target.value) : null)
      }
    >
      <option value="">No Role</option>
      {roles.map((role) => (
        <option key={role.id} value={role.id}>
          {role.name}
        </option>
      ))}
    </select>
  );
}
```

### Member Card Component

```jsx
function MemberCard({ member, canManageRoles, canKick, onRoleChange, onKick }) {
  return (
    <div className="member-card">
      <div className="member-avatar">
        <img
          src={member.user.profile?.avatar || '/default-avatar.png'}
          alt={member.user.username}
        />
        {member.user.online && <span className="online-indicator" />}
      </div>

      <div className="member-details">
        <h4>{member.user.name || member.user.username}</h4>
        <p className="username">@{member.user.username}</p>

        {member.role && (
          <div
            className="role-badge"
            style={{ backgroundColor: member.role.color }}
          >
            {member.role.name}
          </div>
        )}

        <p className="member-since">
          Member since {new Date(member.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="member-actions">
        {canManageRoles && <button onClick={onRoleChange}>Change Role</button>}
        {canKick && (
          <button onClick={onKick} className="danger">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
```

### Join Server with Invite

```jsx
import { redeemInvite } from './api/servers';
import { joinServer } from './api/memberships';

async function handleJoinServer(inviteCode, userId) {
  try {
    // Method 1: Using invite redemption (recommended)
    const result = await redeemInvite(inviteCode, userId);
    console.log('Joined server:', result.server);
    return result;

    // Method 2: Direct membership creation (if you have serverId)
    // const membership = await joinServer(userId, serverId);
    // return membership;
  } catch (error) {
    if (error.response?.status === 404) {
      alert('Invalid or expired invite code');
    } else if (error.response?.status === 400) {
      alert('You are already a member of this server');
    } else {
      console.error('Error joining server:', error);
      alert('Failed to join server');
    }
  }
}
```

## Notes

- Memberships use a composite primary key (userId + serverId)
- One user can only be a member of a server once
- Members without a role have no permissions by default
- Deleting a membership removes all user's server-specific data
- Server creators should automatically receive an admin role
- Implement server ownership checks in your application
- Consider adding a `banned` status for kicked users
- Role changes are immediate - no confirmation needed
- Members can always leave servers voluntarily
- Cascade deletes occur when user or server is deleted
