# Roles & Permissions API

Role management endpoints for creating and managing server roles with customizable permission sets.

## Base URL

```
/api/v1/roles
```

## Permission System

Roles use a JSON-based permission system where each permission is a key-value pair:

```json
{
  "viewChannels": true,
  "manageChannels": true,
  "sendMessages": true,
  "editMessages": false,
  "deleteMessages": true,
  "manageRoles": false,
  "kickMembers": true,
  "banMembers": false
}
```

## Available Permissions

| Permission       | Key               | Description                       |
| ---------------- | ----------------- | --------------------------------- |
| View Channels    | `viewChannels`    | View channels in the server       |
| Manage Channels  | `manageChannels`  | Create, edit, and delete channels |
| Manage Servers   | `manageServers`   | Edit server settings              |
| Manage Roles     | `manageRoles`     | Create and manage roles           |
| Manage Invites   | `manageInvites`   | Create, view, and delete invites  |
| Kick Members     | `kickMembers`     | Remove members from server        |
| Ban Members      | `banMembers`      | Ban members from server           |
| Send Messages    | `sendMessages`    | Send messages in channels         |
| Edit Messages    | `editMessages`    | Edit own messages                 |
| Delete Messages  | `deleteMessages`  | Delete any messages               |
| Add Reactions    | `addReactions`    | Add emoji reactions               |
| Manage Reactions | `manageReactions` | Remove others' reactions          |
| Connect Voice    | `connectVoice`    | Join voice channels               |
| Mute Members     | `muteMembers`     | Mute members in voice             |
| Deafen Members   | `deafenMembers`   | Deafen members in voice           |

## Endpoints

### Create Role

Create a new role in a server.

**Endpoint:** `POST /roles`

**Authentication:** Required (JWT)

**Request Body:**

```json
{
  "name": "Moderator",
  "serverId": 1,
  "permissions": {
    "viewChannels": true,
    "sendMessages": true,
    "deleteMessages": true,
    "kickMembers": true,
    "manageChannels": false,
    "manageRoles": false,
    "banMembers": false
  }
}
```

**Validation Rules:**

- `name`: Required string
- `serverId`: Required integer
- `permissions`: Required object (JSON)

**Success Response (201 Created):**

```json
{
  "id": 1,
  "name": "Moderator",
  "serverId": 1,
  "permissions": {
    "viewChannels": true,
    "sendMessages": true,
    "deleteMessages": true,
    "kickMembers": true,
    "manageChannels": false,
    "manageRoles": false,
    "banMembers": false
  }
}
```

---

### Get All Roles

Retrieve roles, optionally filtered by server.

**Endpoint:** `GET /roles`

**Authentication:** Required (JWT)

**Query Parameters:**

- `serverId` (optional): Filter by server ID

**Example Requests:**

```
GET /roles
GET /roles?serverId=1
```

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "Admin",
    "serverId": 1,
    "permissions": {
      "viewChannels": true,
      "manageChannels": true,
      "manageServers": true,
      "manageRoles": true,
      "kickMembers": true,
      "banMembers": true,
      "deleteMessages": true
    }
  },
  {
    "id": 2,
    "name": "Moderator",
    "serverId": 1,
    "permissions": {
      "viewChannels": true,
      "sendMessages": true,
      "deleteMessages": true,
      "kickMembers": true
    }
  },
  {
    "id": 3,
    "name": "Member",
    "serverId": 1,
    "permissions": {
      "viewChannels": true,
      "sendMessages": true,
      "addReactions": true
    }
  }
]
```

---

### Get Role by ID

Retrieve detailed information about a specific role.

**Endpoint:** `GET /roles/:id`

**Authentication:** Required (JWT)

**Path Parameters:**

- `id`: Role ID

**Example Request:**

```
GET /roles/1
```

**Success Response (200 OK):**

```json
{
  "id": 1,
  "name": "Admin",
  "serverId": 1,
  "permissions": {
    "viewChannels": true,
    "manageChannels": true,
    "manageServers": true,
    "manageRoles": true,
    "manageInvites": true,
    "kickMembers": true,
    "banMembers": true,
    "sendMessages": true,
    "editMessages": true,
    "deleteMessages": true,
    "addReactions": true,
    "manageReactions": true,
    "connectVoice": true,
    "muteMembers": true,
    "deafenMembers": true
  },
  "server": {
    "id": 1,
    "name": "My Awesome Server",
    "servername": "awesome-server"
  },
  "users": [
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
  ]
}
```

**Error Response (404 Not Found):**

```json
{
  "code": 40405,
  "message": "Role not found"
}
```

---

### Update Role

Update role name or permissions.

**Endpoint:** `PATCH /roles/:id`

**Authentication:** Required (JWT)

**Path Parameters:**

- `id`: Role ID

**Request Body:**

```json
{
  "name": "Senior Moderator",
  "permissions": {
    "viewChannels": true,
    "sendMessages": true,
    "deleteMessages": true,
    "kickMembers": true,
    "banMembers": true,
    "manageChannels": true
  }
}
```

**Success Response (200 OK):**

```json
{
  "id": 2,
  "name": "Senior Moderator",
  "serverId": 1,
  "permissions": {
    "viewChannels": true,
    "sendMessages": true,
    "deleteMessages": true,
    "kickMembers": true,
    "banMembers": true,
    "manageChannels": true
  }
}
```

**Notes:**

- Partial updates are supported (only send fields you want to change)
- Updating permissions replaces the entire permissions object

---

### Delete Role

Delete a role from a server.

**Endpoint:** `DELETE /roles/:id`

**Authentication:** Required (JWT)

**Path Parameters:**

- `id`: Role ID

**Example Request:**

```
DELETE /roles/2
```

**Success Response (200 OK):**

```json
{
  "message": "Role deleted successfully"
}
```

**Notes:**

- Deleting a role removes it from all members who have it
- Members retain server access but lose role-specific permissions
- Consider reassigning members before deletion

---

### Assign Multiple Roles to User

Assign one or more roles to a user in a server. This replaces all existing roles for the user.

**Endpoint:** `POST /servers/:serverId/members/:userId/roles`

**Authentication:** Required (JWT)

**Path Parameters:**

- `serverId`: Server ID
- `userId`: User ID

**Request Body:**

```json
{
  "roleIds": [1, 2, 3]
}
```

**Validation Rules:**

- `roleIds`: Required array of integers
- All role IDs must exist and belong to the specified server
- User must be a member of the server

**Success Response (200 OK):**

```json
{
  "message": "Roles assigned successfully",
  "userId": 1,
  "serverId": 1,
  "roles": [
    {
      "id": 1,
      "name": "Admin",
      "permissions": {
        "viewChannels": true,
        "manageChannels": true,
        "manageServers": true
      }
    },
    {
      "id": 2,
      "name": "Moderator",
      "permissions": {
        "viewChannels": true,
        "kickMembers": true
      }
    }
  ]
}
```

**Error Responses:**

**400 Bad Request:**

```json
{
  "code": 40001,
  "message": "roleIds must be an array of valid role IDs"
}
```

**404 Not Found:**

```json
{
  "code": 40404,
  "message": "User is not a member of this server"
}
```

```json
{
  "code": 40405,
  "message": "One or more roles not found or don't belong to this server"
}
```

**Notes:**

- This endpoint replaces all existing roles for the user
- To add roles without removing existing ones, first fetch current roles and include them in the request
- Empty array `[]` removes all roles from the user
- Requires `manageRoles` permission

---

### Remove Specific Roles from User

Remove one or more roles from a user in a server.

**Endpoint:** `DELETE /servers/:serverId/members/:userId/roles`

**Authentication:** Required (JWT)

**Path Parameters:**

- `serverId`: Server ID
- `userId`: User ID

**Request Body:**

```json
{
  "roleIds": [1, 2]
}
```

**Validation Rules:**

- `roleIds`: Required array of integers
- User must be a member of the server

**Success Response (200 OK):**

```json
{
  "message": "Roles removed successfully",
  "userId": 1,
  "serverId": 1,
  "removedRoleIds": [1, 2],
  "remainingRoles": [
    {
      "id": 3,
      "name": "Member",
      "permissions": {
        "viewChannels": true,
        "sendMessages": true
      }
    }
  ]
}
```

**Error Responses:**

**400 Bad Request:**

```json
{
  "code": 40001,
  "message": "roleIds must be an array of valid role IDs"
}
```

**404 Not Found:**

```json
{
  "code": 40404,
  "message": "User is not a member of this server"
}
```

**Notes:**

- Only removes specified roles, keeping any other roles the user has
- If a role ID doesn't exist on the user, it's silently ignored
- Requires `manageRoles` permission

---

### Remove All Roles from User

Remove all roles from a user in a server.

**Endpoint:** `DELETE /servers/:serverId/members/:userId/roles/all`

**Authentication:** Required (JWT)

**Path Parameters:**

- `serverId`: Server ID
- `userId`: User ID

**Example Request:**

```
DELETE /servers/1/members/5/roles/all
```

**Success Response (200 OK):**

```json
{
  "message": "All roles removed successfully",
  "userId": 5,
  "serverId": 1
}
```

**Error Response (404 Not Found):**

```json
{
  "code": 40404,
  "message": "User is not a member of this server"
}
```

**Notes:**

- User retains membership but loses all role-specific permissions
- Consider assigning a default "Member" role instead of leaving users with no roles
- Requires `manageRoles` permission

---

### Get User's Roles in Server

Retrieve all roles assigned to a specific user in a server.

**Endpoint:** `GET /roles/users/:userId/servers/:serverId`

**Authentication:** Required (JWT)

**Path Parameters:**

- `userId`: User ID
- `serverId`: Server ID

**Example Request:**

```
GET /roles/users/1/servers/1
```

**Success Response (200 OK):**

```json
{
  "userId": 1,
  "serverId": 1,
  "user": {
    "id": 1,
    "username": "johndoe",
    "name": "John Doe"
  },
  "server": {
    "id": 1,
    "name": "My Awesome Server",
    "servername": "awesome-server"
  },
  "roles": [
    {
      "id": 1,
      "name": "Admin",
      "permissions": {
        "viewChannels": true,
        "manageChannels": true,
        "manageServers": true,
        "manageRoles": true,
        "kickMembers": true,
        "banMembers": true
      }
    },
    {
      "id": 2,
      "name": "Moderator",
      "permissions": {
        "viewChannels": true,
        "kickMembers": true,
        "deleteMessages": true
      }
    }
  ]
}
```

**Error Response (404 Not Found):**

```json
{
  "code": 40404,
  "message": "User is not a member of this server"
}
```

**Notes:**

- Returns all roles the user has in the specified server
- `effectivePermissions` shows the combined permissions from all roles (OR operation)
- If user has no roles, `roles` array will be empty
- Any permission granted by at least one role is included in effective permissions

---

## Frontend Integration Examples

### React with Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true,
});

// Create role
async function createRole(serverId, name, permissions) {
  const response = await api.post('/roles', {
    serverId,
    name,
    permissions,
  });
  return response.data;
}

// Get server roles
async function getServerRoles(serverId) {
  const response = await api.get('/roles', {
    params: { serverId },
  });
  return response.data;
}

// Get role details
async function getRole(roleId) {
  const response = await api.get(`/roles/${roleId}`);
  return response.data;
}

// Update role
async function updateRole(roleId, updates) {
  const response = await api.patch(`/roles/${roleId}`, updates);
  return response.data;
}

// Delete role
async function deleteRole(roleId) {
  const response = await api.delete(`/roles/${roleId}`);
  return response.data;
}

// Assign multiple roles to user
async function assignRoles(serverId, userId, roleIds) {
  const response = await api.post(
    `/servers/${serverId}/members/${userId}/roles`,
    { roleIds },
  );
  return response.data;
}

// Remove specific roles from user
async function removeRoles(serverId, userId, roleIds) {
  const response = await api.delete(
    `/servers/${serverId}/members/${userId}/roles`,
    { data: { roleIds } },
  );
  return response.data;
}

// Remove all roles from user
async function removeAllRoles(serverId, userId) {
  const response = await api.delete(
    `/servers/${serverId}/members/${userId}/roles/all`,
  );
  return response.data;
}

// Get user's roles in server
async function getUserRoles(userId, serverId) {
  const response = await api.get(`/roles/users/${userId}/servers/${serverId}`);
  return response.data;
}

// Helper: Create default roles for new server
async function createDefaultRoles(serverId) {
  const adminRole = await createRole(serverId, 'Admin', {
    viewChannels: true,
    manageChannels: true,
    manageServers: true,
    manageRoles: true,
    manageInvites: true,
    kickMembers: true,
    banMembers: true,
    sendMessages: true,
    editMessages: true,
    deleteMessages: true,
    addReactions: true,
    manageReactions: true,
    connectVoice: true,
    muteMembers: true,
    deafenMembers: true,
  });

  const memberRole = await createRole(serverId, 'Member', {
    viewChannels: true,
    sendMessages: true,
    addReactions: true,
    connectVoice: true,
  });

  return { adminRole, memberRole };
}
```

### Usage in React Component

```jsx
import { useState, useEffect } from 'react';
import {
  getServerRoles,
  createRole,
  updateRole,
  deleteRole,
} from './api/roles';

function RoleManager({ serverId }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, [serverId]);

  const fetchRoles = async () => {
    try {
      const data = await getServerRoles(serverId);
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    const name = prompt('Role name:');
    if (!name) return;

    try {
      const newRole = await createRole(serverId, name, {
        viewChannels: true,
        sendMessages: true,
      });
      setRoles([...roles, newRole]);
    } catch (error) {
      console.error('Error creating role:', error);
      alert('Failed to create role');
    }
  };

  const handleUpdateRole = async (roleId, updates) => {
    try {
      const updated = await updateRole(roleId, updates);
      setRoles(roles.map((r) => (r.id === roleId ? updated : r)));
      setEditingRole(null);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm('Delete this role? Members will lose these permissions.')) {
      return;
    }

    try {
      await deleteRole(roleId);
      setRoles(roles.filter((r) => r.id !== roleId));
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Failed to delete role');
    }
  };

  if (loading) return <div>Loading roles...</div>;

  return (
    <div className="role-manager">
      <h2>Server Roles</h2>

      <button onClick={handleCreateRole}>Create New Role</button>

      <div className="roles-list">
        {roles.map((role) => (
          <div key={role.id} className="role-card">
            <h3>{role.name}</h3>

            <div className="permissions">
              <h4>Permissions:</h4>
              <ul>
                {Object.entries(role.permissions).map(
                  ([key, value]) =>
                    value && <li key={key}>{formatPermission(key)}</li>,
                )}
              </ul>
            </div>

            <div className="actions">
              <button onClick={() => setEditingRole(role)}>Edit</button>
              <button onClick={() => handleDeleteRole(role.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editingRole && (
        <RoleEditor
          role={editingRole}
          onSave={(updates) => handleUpdateRole(editingRole.id, updates)}
          onCancel={() => setEditingRole(null)}
        />
      )}
    </div>
  );
}

function formatPermission(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
}
```

### Role Editor Component

```jsx
import { useState } from 'react';

const PERMISSIONS = [
  { key: 'viewChannels', label: 'View Channels', category: 'General' },
  { key: 'manageChannels', label: 'Manage Channels', category: 'General' },
  { key: 'manageServers', label: 'Manage Server', category: 'General' },
  { key: 'manageRoles', label: 'Manage Roles', category: 'General' },
  { key: 'manageInvites', label: 'Manage Invites', category: 'General' },
  { key: 'kickMembers', label: 'Kick Members', category: 'Moderation' },
  { key: 'banMembers', label: 'Ban Members', category: 'Moderation' },
  { key: 'sendMessages', label: 'Send Messages', category: 'Text' },
  { key: 'editMessages', label: 'Edit Messages', category: 'Text' },
  { key: 'deleteMessages', label: 'Delete Messages', category: 'Text' },
  { key: 'addReactions', label: 'Add Reactions', category: 'Text' },
  { key: 'manageReactions', label: 'Manage Reactions', category: 'Text' },
  { key: 'connectVoice', label: 'Connect to Voice', category: 'Voice' },
  { key: 'muteMembers', label: 'Mute Members', category: 'Voice' },
  { key: 'deafenMembers', label: 'Deafen Members', category: 'Voice' },
];

function RoleEditor({ role, onSave, onCancel }) {
  const [name, setName] = useState(role.name);
  const [permissions, setPermissions] = useState(role.permissions);

  const handleTogglePermission = (key) => {
    setPermissions({
      ...permissions,
      [key]: !permissions[key],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, permissions });
  };

  const grouped = PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  return (
    <div className="role-editor-modal">
      <form onSubmit={handleSubmit}>
        <h2>Edit Role</h2>

        <label>
          Role Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <div className="permissions-editor">
          {Object.entries(grouped).map(([category, perms]) => (
            <div key={category} className="permission-category">
              <h3>{category}</h3>
              {perms.map((perm) => (
                <label key={perm.key}>
                  <input
                    type="checkbox"
                    checked={!!permissions[perm.key]}
                    onChange={() => handleTogglePermission(perm.key)}
                  />
                  {perm.label}
                </label>
              ))}
            </div>
          ))}
        </div>

        <div className="actions">
          <button type="submit">Save Changes</button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
```

## Permission Checking

### Multiple Roles Permission Check

When a user has multiple roles, their effective permissions are the union (OR operation) of all their role permissions:

```javascript
function calculateEffectivePermissions(roles) {
  const effectivePermissions = {};

  roles.forEach((role) => {
    Object.entries(role.permissions).forEach(([key, value]) => {
      // If any role grants a permission, it's granted
      if (value === true) {
        effectivePermissions[key] = true;
      }
    });
  });

  return effectivePermissions;
}

// Usage
const userRoles = await getUserRoles(userId, serverId);
const effective = calculateEffectivePermissions(userRoles.roles);

if (effective.manageChannels) {
  // User has this permission from at least one role
}
```

### Client-Side Permission Check

```javascript
function hasPermission(user, serverId, permission) {
  const membership = user.memberships?.find((m) => m.serverId === serverId);
  if (!membership) return false;

  // Check all roles the user has
  const roles = membership.roles || [];
  return roles.some((role) => role.permissions[permission] === true);
}

// Usage
if (hasPermission(currentUser, serverId, 'manageChannels')) {
  // Show channel management UI
}
```

### Permission Helper Hook

```javascript
import { useMemo } from 'react';

function usePermissions(user, serverId) {
  return useMemo(() => {
    const membership = user?.memberships?.find((m) => m.serverId === serverId);
    const roles = membership?.roles || [];

    // Calculate effective permissions from all roles
    const effectivePermissions = {};
    roles.forEach((role) => {
      Object.entries(role.permissions || {}).forEach(([key, value]) => {
        if (value === true) {
          effectivePermissions[key] = true;
        }
      });
    });

    return {
      can: (permission) => effectivePermissions[permission] === true,
      canAny: (...perms) => perms.some((p) => effectivePermissions[p] === true),
      canAll: (...perms) =>
        perms.every((p) => effectivePermissions[p] === true),
      permissions: effectivePermissions,
      roles,
    };
  }, [user, serverId]);
}

// Usage in component
function ChannelHeader({ channel, currentUser, serverId }) {
  const { can, roles } = usePermissions(currentUser, serverId);

  return (
    <div className="channel-header">
      <h2>{channel.name}</h2>
      {can('manageChannels') && <button>Edit Channel</button>}
      <div className="user-roles">
        {roles.map((role) => (
          <span key={role.id} className="role-badge">
            {role.name}
          </span>
        ))}
      </div>
    </div>
  );
}
```

### Member Role Management Component

```jsx
import { useState, useEffect } from 'react';
import {
  getUserRoles,
  assignRoles,
  removeRoles,
  removeAllRoles,
} from './api/roles';

function MemberRoleManager({ member, serverId, availableRoles, onUpdate }) {
  const [userRoles, setUserRoles] = useState([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRoles();
  }, [member.id, serverId]);

  const fetchUserRoles = async () => {
    try {
      const data = await getUserRoles(member.id, serverId);
      setUserRoles(data.roles);
      setSelectedRoleIds(data.roles.map((r) => r.id));
    } catch (error) {
      console.error('Error fetching user roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = (roleId) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await assignRoles(serverId, member.id, selectedRoleIds);
      await fetchUserRoles();
      onUpdate?.();
    } catch (error) {
      console.error('Error assigning roles:', error);
      alert('Failed to update roles');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAll = async () => {
    if (!confirm('Remove all roles from this member?')) return;

    try {
      setLoading(true);
      await removeAllRoles(serverId, member.id);
      await fetchUserRoles();
      onUpdate?.();
    } catch (error) {
      console.error('Error removing roles:', error);
      alert('Failed to remove roles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="member-role-manager">
      <h3>Manage Roles for {member.username}</h3>

      <div className="current-roles">
        <h4>Current Roles:</h4>
        {userRoles.length > 0 ? (
          <div className="role-badges">
            {userRoles.map((role) => (
              <span key={role.id} className="role-badge">
                {role.name}
              </span>
            ))}
          </div>
        ) : (
          <p>No roles assigned</p>
        )}
      </div>

      <div className="role-selector">
        <h4>Select Roles:</h4>
        {availableRoles.map((role) => (
          <label key={role.id}>
            <input
              type="checkbox"
              checked={selectedRoleIds.includes(role.id)}
              onChange={() => handleToggleRole(role.id)}
            />
            {role.name}
          </label>
        ))}
      </div>

      <div className="actions">
        <button onClick={handleSave} disabled={loading}>
          Save Changes
        </button>
        <button
          onClick={handleRemoveAll}
          disabled={loading || userRoles.length === 0}
          className="danger"
        >
          Remove All Roles
        </button>
      </div>
    </div>
  );
}
```

## Notes

- **Multiple Roles Support**: Users can now have multiple roles simultaneously, with effective permissions calculated as the union of all role permissions
- **Permission Resolution**: If any role grants a permission, the user has that permission (OR operation)
- Permissions are checked server-side on every protected endpoint
- Default permissions should be set when creating roles
- Consider creating default "Admin" and "Member" roles when creating servers
- Permissions are stored as JSON for flexibility and easy extension
- Users without any roles have no permissions by default
- Update the entire permissions object when making changes to a role
- Consider permission presets (templates) for common role types
- When managing roles, use the assign endpoint to replace all roles at once, or the remove endpoint to selectively remove specific roles
- The `effectivePermissions` field in the GET user roles endpoint shows the combined permissions from all roles
