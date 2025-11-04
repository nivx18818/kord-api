# Messages API

Message management endpoints for sending, editing, and deleting messages with support for rich content, threading, and attachments.

## Base URL

```
/api/v1/messages
```

## Message Content Structure

Messages use a JSON `content` field to support rich formatting:

```json
{
  "text": "Hello world!",
  "mentions": [1, 5], // Optional: User IDs mentioned
  "embeds": [
    // Optional: Rich embeds
    {
      "title": "Check this out",
      "description": "An interesting link",
      "url": "https://example.com",
      "color": "#5865F2"
    }
  ],
  "replyTo": 42 // Optional: Message ID being replied to
}
```

## Endpoints

### Send Message

Create a new message in a channel.

**Endpoint:** `POST /messages`

**Authentication:** Required (JWT)

**Required Permission:** `SEND_MESSAGES`

**Request Body:**

```json
{
  "content": {
    "text": "Hello everyone!",
    "mentions": [5]
  },
  "userId": 1,
  "channelId": 1,
  "parentMessageId": null // Optional: For threaded replies
}
```

**Validation Rules:**

- `content`: Required object (JSON)
- `userId`: Required integer
- `channelId`: Required integer
- `parentMessageId`: Optional integer (for threads)

**Success Response (201 Created):**

```json
{
  "id": 1,
  "content": {
    "text": "Hello everyone!",
    "mentions": [5]
  },
  "userId": 1,
  "channelId": 1,
  "parentMessageId": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "deletedAt": null,
  "user": {
    "id": 1,
    "username": "johndoe",
    "name": "John Doe",
    "profile": {
      "avatar": "https://example.com/avatars/johndoe.jpg"
    }
  }
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

---

### Get Messages

Retrieve messages from a channel with cursor-based pagination.

**Endpoint:** `GET /messages`

**Authentication:** Required (JWT)

**Required Permission:** `VIEW_CHANNELS`

**Query Parameters:**

- `channelId` (required): Filter by channel ID
- `after` (optional): ISO 8601 timestamp - Get messages older than this time
- `before` (optional): ISO 8601 timestamp - Get messages newer than this time
- `limit` (optional): Number of messages to return (default: 50, max: 100)

**Example Requests:**

```
GET /messages?channelId=1&limit=50
GET /messages?channelId=1&after=2024-01-20T15:45:00.000Z&limit=50
GET /messages?channelId=1&before=2024-01-20T15:30:00.000Z&limit=25
```

**Success Response (200 OK):**

```json
{
  "items": [
    {
      "id": 100,
      "content": {
        "text": "Most recent message"
      },
      "userId": 1,
      "channelId": 1,
      "parentMessageId": null,
      "createdAt": "2024-01-20T15:45:00.000Z",
      "updatedAt": "2024-01-20T15:45:00.000Z",
      "deletedAt": null,
      "user": {
        "id": 1,
        "username": "johndoe",
        "name": "John Doe",
        "profile": {
          "avatar": "https://example.com/avatars/johndoe.jpg"
        }
      },
      "attachments": [],
      "reacts": [
        {
          "emoji": "👍",
          "userId": 5,
          "messageId": 100,
          "createdAt": "2024-01-20T15:46:00.000Z",
          "user": {
            "id": 5,
            "username": "alice"
          }
        }
      ],
      "replies": []
    },
    {
      "id": 99,
      "content": {
        "text": "Previous message"
      },
      "userId": 5,
      "channelId": 1,
      "parentMessageId": null,
      "createdAt": "2024-01-20T15:30:00.000Z",
      "updatedAt": "2024-01-20T15:30:00.000Z",
      "deletedAt": null,
      "user": {
        "id": 5,
        "username": "alice",
        "name": "Alice Smith"
      },
      "channel": {
        "id": 1,
        "name": "general",
        "serverId": 1
      },
      "attachments": [
        {
          "id": 1,
          "url": "https://example.com/files/image.jpg",
          "type": "image/jpeg",
          "size": 245678,
          "messageId": 99,
          "createdAt": "2024-01-20T15:30:00.000Z"
        }
      ],
      "reacts": [],
      "replies": [
        {
          "id": 100,
          "content": { "text": "Reply to this" },
          "parentMessageId": 99,
          "userId": 1,
          "user": {
            "id": 1,
            "username": "johndoe"
          },
          "attachments": [],
          "reacts": []
        }
      ]
    }
  ],
  "limit": 50,
  "hasMore": true,
  "before": "2024-01-20T15:45:00.000Z",
  "after": "2024-01-20T15:30:00.000Z"
}
```

**Response Fields:**

- `items`: Array of message objects
- `limit`: Number of items requested
- `hasMore`: Boolean indicating if more messages exist
- `before`: ISO timestamp of the newest message (for loading newer messages)
- `after`: ISO timestamp of the oldest message (for loading older messages)

---

### Get Message by ID

Retrieve a specific message with full details.

**Endpoint:** `GET /messages/:id`

**Authentication:** Required (JWT)

**Required Permission:** `VIEW_CHANNELS`

**Path Parameters:**

- `id`: Message ID

**Example Request:**

```
GET /messages/1
```

**Success Response (200 OK):**

```json
{
  "id": 1,
  "content": {
    "text": "Hello everyone!",
    "mentions": [5]
  },
  "userId": 1,
  "channelId": 1,
  "parentMessageId": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "deletedAt": null,
  "user": {
    "id": 1,
    "username": "johndoe",
    "name": "John Doe",
    "profile": {
      "avatar": "https://example.com/avatars/johndoe.jpg"
    }
  },
  "channel": {
    "id": 1,
    "name": "general",
    "serverId": 1
  },
  "attachments": [],
  "reacts": [
    {
      "emoji": "👍",
      "userId": 5,
      "messageId": 1,
      "createdAt": "2024-01-15T10:35:00.000Z"
    }
  ],
  "replies": [
    {
      "id": 2,
      "content": { "text": "Great message!" },
      "userId": 5,
      "parentMessageId": 1,
      "createdAt": "2024-01-15T10:40:00.000Z"
    }
  ]
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

### Update Message

Edit an existing message.

**Endpoint:** `PATCH /messages/:id`

**Authentication:** Required (JWT)

**Required Permission:** `EDIT_MESSAGES` (or be the message author)

**Path Parameters:**

- `id`: Message ID

**Request Body:**

```json
{
  "content": {
    "text": "Updated message content",
    "edited": true
  }
}
```

**Success Response (200 OK):**

```json
{
  "id": 1,
  "content": {
    "text": "Updated message content",
    "edited": true
  },
  "userId": 1,
  "channelId": 1,
  "parentMessageId": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T14:00:00.000Z",
  "deletedAt": null
}
```

**Error Responses:**

_403 Forbidden - Not Message Author:_

```json
{
  "code": 40301,
  "message": "Access denied"
}
```

---

### Delete Message

Delete a message (soft delete).

**Endpoint:** `DELETE /messages/:id`

**Authentication:** Required (JWT)

**Required Permission:** Message author or `DELETE_MESSAGES`

**Path Parameters:**

- `id`: Message ID

**Example Request:**

```
DELETE /messages/1
```

**Success Response (200 OK):**

```json
{
  "message": "Message deleted successfully"
}
```

**Notes:**

- Messages are soft-deleted (sets `deletedAt` timestamp)
- Deleted messages can still be retrieved but are marked as deleted
- Users can delete their own messages
- Users with `DELETE_MESSAGES` permission can delete any message

---

## Threading

### Reply to Message

Create a threaded reply by setting `parentMessageId`.

**Request Example:**

```json
{
  "content": {
    "text": "This is a reply"
  },
  "userId": 5,
  "channelId": 1,
  "parentMessageId": 1
}
```

### Get Thread Replies

Thread replies are included in the parent message's `replies` array when fetching messages.

---

## Frontend Integration Examples

### React with Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true,
});

// Send message
async function sendMessage(channelId, userId, content, parentMessageId = null) {
  const response = await api.post('/messages', {
    channelId,
    userId,
    content,
    parentMessageId,
  });
  return response.data;
}

// Get messages with pagination
async function getMessages(channelId, limit = 50, before = null) {
  const response = await api.get('/messages', {
    params: {
      channelId,
      limit,
      ...(before && { before }),
    },
  });
  return response.data;
}

// Get message by ID
async function getMessage(messageId) {
  const response = await api.get(`/messages/${messageId}`);
  return response.data;
}

// Update message
async function updateMessage(messageId, content) {
  const response = await api.patch(`/messages/${messageId}`, {
    content: {
      ...content,
      edited: true,
    },
  });
  return response.data;
}

// Delete message
async function deleteMessage(messageId) {
  const response = await api.delete(`/messages/${messageId}`);
  return response.data;
}

// Send message with mentions
async function sendMessageWithMentions(
  channelId,
  userId,
  text,
  mentionedUserIds,
) {
  const content = {
    text,
    mentions: mentionedUserIds,
  };
  return sendMessage(channelId, userId, content);
}

// Send threaded reply
async function sendReply(channelId, userId, text, parentMessageId) {
  const content = { text };
  return sendMessage(channelId, userId, content, parentMessageId);
}
```

### Usage in React Component

```jsx
import { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage, deleteMessage } from './api/messages';

function MessageList({ channelId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
  }, [channelId]);

  const fetchMessages = async (before = null) => {
    try {
      const data = await getMessages(channelId, 50, before);
      if (before) {
        setMessages((prev) => [...data.data, ...prev]);
      } else {
        setMessages(data.data);
      }
      setHasMore(data.meta.hasMore);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const message = await sendMessage(channelId, currentUserId, {
        text: newMessage,
      });
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Check your permissions.');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return;

    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message.');
    }
  };

  const handleLoadMore = () => {
    if (hasMore && messages.length > 0) {
      fetchMessages(messages[0].id);
    }
  };

  if (loading) return <div>Loading messages...</div>;

  return (
    <div className="message-list">
      {hasMore && <button onClick={handleLoadMore}>Load More Messages</button>}

      {messages.map((message) => (
        <div key={message.id} className="message">
          <img
            src={message.user.profile?.avatar || '/default-avatar.png'}
            alt={message.user.username}
          />
          <div className="message-content">
            <div className="message-header">
              <strong>{message.user.name || message.user.username}</strong>
              <span className="timestamp">
                {new Date(message.createdAt).toLocaleString()}
              </span>
              {message.updatedAt !== message.createdAt && (
                <span className="edited">(edited)</span>
              )}
            </div>

            {message.deletedAt ? (
              <div className="deleted-message">Message deleted</div>
            ) : (
              <>
                <p>{message.content.text}</p>

                {message.attachments?.map((att) => (
                  <div key={att.id} className="attachment">
                    {att.type?.startsWith('image/') ? (
                      <img src={att.url} alt="Attachment" />
                    ) : (
                      <a href={att.url} target="_blank" rel="noopener">
                        📎 {att.url.split('/').pop()}
                      </a>
                    )}
                  </div>
                ))}

                {message.reacts?.length > 0 && (
                  <div className="reactions">
                    {message.reacts.map((react, idx) => (
                      <span key={idx}>{react.emoji}</span>
                    ))}
                  </div>
                )}

                {message.replies?.length > 0 && (
                  <div className="thread-indicator">
                    💬 {message.replies.length} replies
                  </div>
                )}
              </>
            )}

            {message.userId === currentUserId && !message.deletedAt && (
              <button
                onClick={() => handleDeleteMessage(message.id)}
                className="delete-btn"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}

      <div ref={messagesEndRef} />

      <form onSubmit={handleSendMessage} className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

### Real-time Updates with WebSocket

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  withCredentials: true,
  transports: ['websocket'],
});

// Join channel
socket.emit('joinChannel', { channelId: 1 });

// Listen for new messages
socket.on('messageCreated', (message) => {
  setMessages((prev) => [...prev, message]);
});

// Listen for message updates
socket.on('messageUpdated', (message) => {
  setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
});

// Listen for message deletions
socket.on('messageDeleted', ({ messageId }) => {
  setMessages((prev) => prev.filter((m) => m.id !== messageId));
});

// Cleanup
return () => {
  socket.emit('leaveChannel', { channelId: 1 });
  socket.disconnect();
};
```

## Notes

- Messages support rich JSON content for embeds, mentions, and formatting
- Soft delete preserves message history while hiding content
- Threading is achieved via `parentMessageId` - one level deep
- Message pagination uses cursor-based pagination with `before` parameter
- Attachments are managed separately via the Attachments API
- Real-time updates require WebSocket connection
- Message content is stored as JSON for flexibility
- Mentions array contains user IDs for highlighting/notifications
- Maximum message length should be enforced client-side (recommended: 2000 chars)
