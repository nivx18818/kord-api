# Channels API

Channel management endpoints for creating text/voice channels, managing DMs, and handling channel access control.

## Base URL

```
/api/v1/channels
```

## Channel Types

- `TEXT`: Text-based channel for messages
- `VOICE`: Voice channel for audio communication

## Channel Status

- `PUBLIC`: Visible and accessible to all server members
- `RESTRICT`: Visible but requires specific permissions to access
- `PRIVATE`: Hidden from members without specific permissions

## Endpoints

### Create Channel

Create a new channel in a server.

**Endpoint:** `POST /channels`

**Authentication:** Required (JWT)

**Required Permission:** `MANAGE_CHANNELS`

**Request Body:**

```json
{
  "name": "general-chat",
  "serverId": 1,
  "type": "TEXT", // Optional, default: TEXT
  "status": "PUBLIC", // Optional, default: PUBLIC
  "isDM": false // Optional, default: false
}
```

**Success Response (201 Created):**

```json
{
  "id": 1,
  "name": "general-chat",
  "serverId": 1,
  "type": "TEXT",
  "status": "PUBLIC",
  "isDM": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### Get All Channels

Retrieve all channels (primarily for admin purposes).

**Endpoint:** `GET /channels`

**Authentication:** Required (JWT)

**Example Request:**

```
GET /channels
```

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "general-chat",
    "serverId": 1,
    "type": "TEXT",
    "status": "PUBLIC",
    "isDM": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": 2,
    "name": "voice-lounge",
    "serverId": 1,
    "type": "VOICE",
    "status": "PUBLIC",
    "isDM": false,
    "createdAt": "2024-01-15T11:00:00.000Z"
  }
]
```

---

### Get Channel by ID

Retrieve detailed information about a specific channel.

**Endpoint:** `GET /channels/:id`

**Authentication:** Required (JWT)

**Required Permission:** `VIEW_CHANNELS`

**Path Parameters:**

- `id`: Channel ID

**Example Request:**

```
GET /channels/1
```

**Success Response (200 OK):**

```json
{
  "id": 1,
  "name": "general-chat",
  "serverId": 1,
  "type": "TEXT",
  "status": "PUBLIC",
  "isDM": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "server": {
    "id": 1,
    "name": "My Server",
    "servername": "my-server"
  },
  "messages": [
    {
      "id": 1,
      "content": { "text": "Hello world!" },
      "userId": 1,
      "channelId": 1,
      "createdAt": "2024-01-15T10:35:00.000Z"
    }
  ],
  "participants": [
    {
      "userId": 1,
      "channelId": 1,
      "user": {
        "id": 1,
        "username": "johndoe"
      }
    }
  ]
}
```

---

### Update Channel

Update channel settings.

**Endpoint:** `PATCH /channels/:id`

**Authentication:** Required (JWT)

**Required Permission:** `MANAGE_CHANNELS`

**Path Parameters:**

- `id`: Channel ID

**Request Body:**

```json
{
  "name": "updated-channel-name",
  "status": "RESTRICT"
}
```

**Success Response (200 OK):**

```json
{
  "id": 1,
  "name": "updated-channel-name",
  "serverId": 1,
  "type": "TEXT",
  "status": "RESTRICT",
  "isDM": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T14:45:00.000Z"
}
```

---

### Delete Channel

Delete a channel and all associated messages.

**Endpoint:** `DELETE /channels/:id`

**Authentication:** Required (JWT)

**Required Permission:** `MANAGE_CHANNELS`

**Path Parameters:**

- `id`: Channel ID

**Example Request:**

```
DELETE /channels/1
```

**Success Response (200 OK):**

```json
{
  "message": "Channel deleted successfully"
}
```

---

## Direct Messages (DMs)

### Find or Create DM Channel

Get an existing DM channel between two users or create one if it doesn't exist.

**Endpoint:** `POST /channels/dm`

**Authentication:** Required (JWT)

**Request Body:**

```json
{
  "user1Id": 1,
  "user2Id": 5,
  "serverId": 1
}
```

**Success Response (200 OK or 201 Created):**

```json
{
  "id": 10,
  "name": "dm-1-5",
  "serverId": 1,
  "type": "TEXT",
  "status": "PRIVATE",
  "isDM": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "participants": [
    {
      "userId": 1,
      "channelId": 10,
      "user": {
        "id": 1,
        "username": "johndoe",
        "name": "John Doe"
      }
    },
    {
      "userId": 5,
      "channelId": 10,
      "user": {
        "id": 5,
        "username": "alice",
        "name": "Alice Smith"
      }
    }
  ]
}
```

---

### Get User's DM Channels

Retrieve all DM channels for a specific user.

**Endpoint:** `GET /channels/user/:userId/dms`

**Authentication:** Required (JWT)

**Path Parameters:**

- `userId`: User ID

**Example Request:**

```
GET /channels/user/1/dms
```

**Success Response (200 OK):**

```json
[
  {
    "id": 10,
    "name": "dm-1-5",
    "serverId": 1,
    "type": "TEXT",
    "status": "PRIVATE",
    "isDM": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "participants": [
      {
        "userId": 5,
        "user": {
          "id": 5,
          "username": "alice",
          "name": "Alice Smith",
          "profile": {
            "avatar": "https://example.com/avatars/alice.jpg"
          }
        }
      }
    ],
    "lastMessage": {
      "id": 150,
      "content": { "text": "Hey, how are you?" },
      "createdAt": "2024-01-20T09:15:00.000Z",
      "user": {
        "id": 5,
        "username": "alice"
      }
    }
  },
  {
    "id": 11,
    "name": "dm-1-7",
    "serverId": 1,
    "type": "TEXT",
    "status": "PRIVATE",
    "isDM": true,
    "createdAt": "2024-01-16T14:20:00.000Z",
    "participants": [
      {
        "userId": 7,
        "user": {
          "id": 7,
          "username": "bob",
          "name": "Bob Johnson"
        }
      }
    ]
  }
]
```

---

## Channel Participants

### Add Participant

Add a user to a channel (for private/DM channels).

**Endpoint:** `POST /channels/:id/participants`

**Authentication:** Required (JWT)

**Path Parameters:**

- `id`: Channel ID

**Request Body:**

```json
{
  "userId": 5
}
```

**Success Response (201 Created):**

```json
{
  "userId": 5,
  "channelId": 10,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### Remove Participant

Remove a user from a channel.

**Endpoint:** `DELETE /channels/:id/participants/:userId`

**Authentication:** Required (JWT)

**Path Parameters:**

- `id`: Channel ID
- `userId`: User ID to remove

**Example Request:**

```
DELETE /channels/10/participants/5
```

**Success Response (200 OK):**

```json
{
  "message": "Participant removed successfully"
}
```

---

## Channel Blocking

### Block DM Channel

Block a DM channel to prevent receiving messages.

**Endpoint:** `POST /channels/:id/block`

**Authentication:** Required (JWT)

**Path Parameters:**

- `id`: Channel ID

**Request Body:**

```json
{
  "userId": 1
}
```

**Success Response (201 Created):**

```json
{
  "id": 1,
  "userId": 1,
  "channelId": 10,
  "createdAt": "2024-01-18T12:00:00.000Z",
  "updatedAt": "2024-01-18T12:00:00.000Z"
}
```

---

### Unblock DM Channel

Unblock a previously blocked DM channel.

**Endpoint:** `DELETE /channels/:id/block/:userId`

**Authentication:** Required (JWT)

**Path Parameters:**

- `id`: Channel ID
- `userId`: User ID

**Example Request:**

```
DELETE /channels/10/block/1
```

**Success Response (200 OK):**

```json
{
  "message": "Channel unblocked successfully"
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

// Create channel
async function createChannel(serverId, name, type = 'TEXT', status = 'PUBLIC') {
  const response = await api.post('/channels', {
    serverId,
    name,
    type,
    status,
  });
  return response.data;
}

// Get channel details
async function getChannel(channelId) {
  const response = await api.get(`/channels/${channelId}`);
  return response.data;
}

// Update channel
async function updateChannel(channelId, updates) {
  const response = await api.patch(`/channels/${channelId}`, updates);
  return response.data;
}

// Delete channel
async function deleteChannel(channelId) {
  const response = await api.delete(`/channels/${channelId}`);
  return response.data;
}

// Find or create DM
async function findOrCreateDM(user1Id, user2Id, serverId) {
  const response = await api.post('/channels/dm', {
    user1Id,
    user2Id,
    serverId,
  });
  return response.data;
}

// Get user's DMs
async function getUserDMs(userId) {
  const response = await api.get(`/channels/user/${userId}/dms`);
  return response.data;
}

// Block DM
async function blockDM(channelId, userId) {
  const response = await api.post(`/channels/${channelId}/block`, {
    userId,
  });
  return response.data;
}

// Unblock DM
async function unblockDM(channelId, userId) {
  const response = await api.delete(`/channels/${channelId}/block/${userId}`);
  return response.data;
}
```

### Usage in React Component

```jsx
import { useState, useEffect } from 'react';
import { getUserDMs, findOrCreateDM } from './api/channels';

function DirectMessages({ currentUserId, serverId }) {
  const [dms, setDms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDMs() {
      try {
        const data = await getUserDMs(currentUserId);
        setDms(data);
      } catch (error) {
        console.error('Error fetching DMs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDMs();
  }, [currentUserId]);

  const handleStartDM = async (otherUserId) => {
    try {
      const dm = await findOrCreateDM(currentUserId, otherUserId, serverId);
      // Navigate to DM or update state
      console.log('DM channel:', dm);
    } catch (error) {
      console.error('Error creating DM:', error);
    }
  };

  if (loading) return <div>Loading DMs...</div>;

  return (
    <div>
      <h2>Direct Messages</h2>
      <ul>
        {dms.map((dm) => {
          const otherUser = dm.participants.find(
            (p) => p.userId !== currentUserId,
          );
          return (
            <li key={dm.id}>
              <img
                src={otherUser?.user.profile?.avatar}
                alt={otherUser?.user.username}
              />
              <div>
                <h4>{otherUser?.user.name || otherUser?.user.username}</h4>
                {dm.lastMessage && <p>{dm.lastMessage.content.text}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

### Channel List Component

```jsx
import { useState, useEffect } from 'react';
import { getChannel } from './api/channels';

function ChannelList({ serverId, channels }) {
  const [selectedChannel, setSelectedChannel] = useState(null);

  const handleChannelClick = async (channelId) => {
    try {
      const channel = await getChannel(channelId);
      setSelectedChannel(channel);
    } catch (error) {
      if (error.response?.status === 403) {
        alert('You do not have permission to view this channel');
      }
    }
  };

  return (
    <div className="channel-list">
      {channels
        .filter((ch) => ch.type === 'TEXT')
        .map((channel) => (
          <div
            key={channel.id}
            onClick={() => handleChannelClick(channel.id)}
            className={selectedChannel?.id === channel.id ? 'active' : ''}
          >
            # {channel.name}
            {channel.status === 'PRIVATE' && '🔒'}
          </div>
        ))}

      <h3>Voice Channels</h3>
      {channels
        .filter((ch) => ch.type === 'VOICE')
        .map((channel) => (
          <div key={channel.id}>🔊 {channel.name}</div>
        ))}
    </div>
  );
}
```

## Notes

- DM channels are special channels with `isDM: true` and `status: PRIVATE`
- DM channel names are automatically generated as `dm-{user1Id}-{user2Id}`
- Blocking a DM prevents receiving notifications but doesn't delete messages
- Channel deletion cascades to all messages and participants
- Voice channel functionality requires WebSocket connection (see WebSocket docs)
- Public channels are visible to all server members
- Private channels only appear to members with explicit access
- Restricted channels are visible but require permissions to enter
