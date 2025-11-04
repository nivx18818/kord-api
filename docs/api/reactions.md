# Reactions API

Emoji reaction endpoints for adding and managing reactions on messages.

## Base URL

```
/api/v1/reactions
```

## Endpoints

### Add Reaction

Add an emoji reaction to a message.

**Endpoint:** `POST /reactions`

**Authentication:** Required (JWT)

**Request Body:**

```json
{
  "messageId": 1,
  "userId": 5,
  "emoji": "👍"
}
```

**Validation Rules:**

- `messageId`: Required positive integer
- `userId`: Required positive integer
- `emoji`: Required non-empty string

**Success Response (201 Created):**

```json
{
  "messageId": 1,
  "userId": 5,
  "emoji": "👍",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

_400 Bad Request - Duplicate Reaction:_

```json
{
  "code": 40906,
  "message": "You have already reacted with this emoji"
}
```

_404 Not Found - Message Not Found:_

```json
{
  "code": 40404,
  "message": "Message not found"
}
```

---

### Get All Reactions

Retrieve all reactions (primarily for admin purposes).

**Endpoint:** `GET /reactions`

**Authentication:** Required (JWT)

**Example Request:**

```
GET /reactions
```

**Success Response (200 OK):**

```json
[
  {
    "messageId": 1,
    "userId": 5,
    "emoji": "👍",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "user": {
      "id": 5,
      "username": "alice",
      "name": "Alice Smith"
    }
  },
  {
    "messageId": 1,
    "userId": 7,
    "emoji": "❤️",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "user": {
      "id": 7,
      "username": "bob",
      "name": "Bob Johnson"
    }
  }
]
```

---

### Get Reaction by Composite ID

Retrieve a specific reaction by message ID and user ID.

**Endpoint:** `GET /reactions/:messageId/:userId`

**Authentication:** Required (JWT)

**Path Parameters:**

- `messageId`: Message ID
- `userId`: User ID

**Example Request:**

```
GET /reactions/1/5
```

**Success Response (200 OK):**

```json
{
  "messageId": 1,
  "userId": 5,
  "emoji": "👍",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "message": {
    "id": 1,
    "content": { "text": "Great message!" },
    "channelId": 1
  },
  "user": {
    "id": 5,
    "username": "alice",
    "name": "Alice Smith"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "code": 40404,
  "message": "Message not found"
}
```

---

### Update Reaction

Change the emoji of an existing reaction.

**Endpoint:** `PATCH /reactions/:messageId/:userId`

**Authentication:** Required (JWT)

**Path Parameters:**

- `messageId`: Message ID
- `userId`: User ID

**Request Body:**

```json
{
  "emoji": "❤️"
}
```

**Success Response (200 OK):**

```json
{
  "messageId": 1,
  "userId": 5,
  "emoji": "❤️",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T14:00:00.000Z"
}
```

**Notes:**

- Users can only update their own reactions
- Changing emoji keeps the same composite key (messageId + userId)

---

### Remove Reaction

Remove a reaction from a message.

**Endpoint:** `DELETE /reactions/:messageId/:userId`

**Authentication:** Required (JWT)

**Path Parameters:**

- `messageId`: Message ID
- `userId`: User ID

**Example Request:**

```
DELETE /reactions/1/5
```

**Success Response (200 OK):**

```json
{
  "message": "Reaction removed successfully"
}
```

**Error Response (404 Not Found):**

```json
{
  "code": 40404,
  "message": "Message not found"
}
```

**Notes:**

- Users can only remove their own reactions
- Users with `MANAGE_REACTIONS` permission can remove any reaction

---

## Getting Reactions for a Message

Reactions are typically included when fetching messages. When you get a message, reactions are included in the response:

```json
{
  "id": 1,
  "content": { "text": "Hello!" },
  "reacts": [
    {
      "emoji": "👍",
      "userId": 5,
      "messageId": 1,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "user": {
        "username": "alice"
      }
    },
    {
      "emoji": "❤️",
      "userId": 7,
      "messageId": 1,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "user": {
        "username": "bob"
      }
    }
  ]
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

// Add reaction
async function addReaction(messageId, userId, emoji) {
  const response = await api.post('/reactions', {
    messageId,
    userId,
    emoji,
  });
  return response.data;
}

// Update reaction (change emoji)
async function updateReaction(messageId, userId, emoji) {
  const response = await api.patch(`/reactions/${messageId}/${userId}`, {
    emoji,
  });
  return response.data;
}

// Remove reaction
async function removeReaction(messageId, userId) {
  const response = await api.delete(`/reactions/${messageId}/${userId}`);
  return response.data;
}

// Toggle reaction (add if doesn't exist, remove if exists)
async function toggleReaction(
  messageId,
  userId,
  emoji,
  existingReactions = [],
) {
  const existingReaction = existingReactions.find(
    (r) => r.userId === userId && r.emoji === emoji,
  );

  if (existingReaction) {
    return removeReaction(messageId, userId);
  } else {
    return addReaction(messageId, userId, emoji);
  }
}
```

### Usage in React Component

```jsx
import { useState } from 'react';
import { addReaction, removeReaction } from './api/reactions';

function Message({ message, currentUserId }) {
  const [reactions, setReactions] = useState(message.reacts || []);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, react) => {
    if (!acc[react.emoji]) {
      acc[react.emoji] = {
        emoji: react.emoji,
        count: 0,
        users: [],
        hasCurrentUser: false,
      };
    }
    acc[react.emoji].count++;
    acc[react.emoji].users.push(react.user.username);
    if (react.userId === currentUserId) {
      acc[react.emoji].hasCurrentUser = true;
    }
    return acc;
  }, {});

  const handleToggleReaction = async (emoji) => {
    const existingReaction = reactions.find(
      (r) => r.userId === currentUserId && r.emoji === emoji,
    );

    try {
      if (existingReaction) {
        // Remove reaction
        await removeReaction(message.id, currentUserId);
        setReactions((prev) =>
          prev.filter(
            (r) => !(r.userId === currentUserId && r.emoji === emoji),
          ),
        );
      } else {
        // Add reaction
        const newReaction = await addReaction(message.id, currentUserId, emoji);
        setReactions((prev) => [
          ...prev,
          {
            ...newReaction,
            user: { username: 'You' },
          },
        ]);
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      alert('Failed to update reaction');
    }
  };

  const handleAddReaction = async (emoji) => {
    try {
      const newReaction = await addReaction(message.id, currentUserId, emoji);
      setReactions((prev) => [
        ...prev,
        {
          ...newReaction,
          user: { username: 'You' },
        },
      ]);
      setShowEmojiPicker(false);
    } catch (error) {
      if (error.response?.status === 400) {
        // Already reacted with this emoji
        handleToggleReaction(emoji);
      } else {
        console.error('Error adding reaction:', error);
      }
    }
  };

  return (
    <div className="message">
      <div className="message-content">
        <p>{message.content.text}</p>
      </div>

      <div className="reactions">
        {Object.values(groupedReactions).map((group) => (
          <button
            key={group.emoji}
            className={`reaction-btn ${group.hasCurrentUser ? 'active' : ''}`}
            onClick={() => handleToggleReaction(group.emoji)}
            title={group.users.join(', ')}
          >
            {group.emoji} {group.count}
          </button>
        ))}

        <button
          className="add-reaction-btn"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          +
        </button>
      </div>

      {showEmojiPicker && (
        <div className="emoji-picker">
          {['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'].map((emoji) => (
            <button key={emoji} onClick={() => handleAddReaction(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Reaction Component

```jsx
function ReactionButton({ emoji, count, hasReacted, usernames, onToggle }) {
  return (
    <button
      className={`reaction ${hasReacted ? 'active' : ''}`}
      onClick={onToggle}
      title={usernames.join(', ')}
    >
      <span className="emoji">{emoji}</span>
      {count > 1 && <span className="count">{count}</span>}
    </button>
  );
}

function ReactionBar({ message, currentUserId }) {
  const [reactions, setReactions] = useState(message.reacts || []);

  const grouped = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = {
        count: 0,
        users: [],
        hasCurrentUser: false,
      };
    }
    acc[r.emoji].count++;
    acc[r.emoji].users.push(r.user.username);
    if (r.userId === currentUserId) {
      acc[r.emoji].hasCurrentUser = true;
    }
    return acc;
  }, {});

  const handleToggle = async (emoji) => {
    try {
      const existing = reactions.find(
        (r) => r.userId === currentUserId && r.emoji === emoji,
      );

      if (existing) {
        await removeReaction(message.id, currentUserId);
        setReactions((prev) =>
          prev.filter(
            (r) => !(r.userId === currentUserId && r.emoji === emoji),
          ),
        );
      } else {
        const newReaction = await addReaction(message.id, currentUserId, emoji);
        setReactions((prev) => [...prev, newReaction]);
      }
    } catch (error) {
      console.error('Reaction error:', error);
    }
  };

  return (
    <div className="reaction-bar">
      {Object.entries(grouped).map(([emoji, data]) => (
        <ReactionButton
          key={emoji}
          emoji={emoji}
          count={data.count}
          hasReacted={data.hasCurrentUser}
          usernames={data.users}
          onToggle={() => handleToggle(emoji)}
        />
      ))}
    </div>
  );
}
```

### Real-time Updates with WebSocket

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  withCredentials: true,
});

// Listen for new reactions
socket.on('reactionAdded', (reaction) => {
  setReactions((prev) => [...prev, reaction]);
});

// Listen for removed reactions
socket.on('reactionRemoved', ({ messageId, userId }) => {
  setReactions((prev) =>
    prev.filter((r) => !(r.messageId === messageId && r.userId === userId)),
  );
});

// Listen for updated reactions
socket.on('reactionUpdated', (reaction) => {
  setReactions((prev) =>
    prev.map((r) =>
      r.messageId === reaction.messageId && r.userId === reaction.userId
        ? reaction
        : r,
    ),
  );
});
```

## Notes

- Each user can only have one reaction per message (composite primary key: messageId + userId)
- To change emoji, either update the existing reaction or remove and re-add
- Reactions are indexed by emoji for efficient filtering
- Emoji can be any Unicode character or emoji string
- Consider using an emoji picker library like `emoji-picker-react` or `emoji-mart`
- Real-time reaction updates enhance user experience
- Group reactions by emoji for cleaner UI display
- Users with `MANAGE_REACTIONS` permission can remove any user's reaction
- Reactions are automatically deleted when the message is deleted
