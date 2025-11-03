---
description: 'Implement Cookie-Based Auth Phase 4 – WebSocket Authentication for Kord API'
# prettier-ignore
tools: ['edit/createFile', 'edit/createDirectory', 'edit/editFiles', 'search', 'runCommands', 'runTasks', 'context7/*', 'upstash/context7/*', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'githubRepo', 'extensions', 'todos']
---

## Task: Implement Cookie-Based Auth Phase 4 – WebSocket Authentication

Secure Socket.IO WebSocket connections using cookie-based JWT authentication.

### Context

**Prerequisites**: Phases 1-3 completed (cookie infrastructure, JWT strategy, controller updates)

**Current State**:

- `MessagesGateway` has no authentication
- Anyone can connect to WebSocket
- No user context in WebSocket events
- Security vulnerability for real-time features

**Target State**:

- WebSocket connections authenticated on handshake
- JWT extracted from cookies automatically sent by Socket.IO
- User context stored in socket data for authorization
- Unauthorized connections rejected immediately

### Phase 4 Objectives

1. Create WebSocket cookie extractor utility
2. Update MessagesGateway to validate JWT on connection
3. Store user context in socket data
4. Update event handlers to use authenticated user
5. Configure CORS for WebSocket with credentials

### Step-by-Step Instructions

#### Step 4.1: Create WebSocket Cookie Extractor

**File**: `src/modules/messages/utils/ws-cookie-extractor.ts` (NEW FILE)

**Action**: Create utility to extract JWT from Socket.IO handshake cookies

**Implementation**:

```typescript
import { Socket } from 'socket.io';
import { COOKIE_NAMES } from '@/common/constants/cookie-config';

/**
 * Extracts JWT access token from Socket.IO handshake cookies.
 * Socket.IO automatically includes cookies in the handshake.
 *
 * @param socket - Socket.IO socket instance
 * @returns JWT token string or null if not found
 */
export const extractTokenFromSocket = (socket: Socket): string | null => {
  const cookieHeader = socket.handshake.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  // Parse cookie string into key-value pairs
  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return cookies[COOKIE_NAMES.ACCESS_TOKEN] || null;
};
```

**Key Features**:

- Parses raw cookie header from Socket.IO handshake
- Extracts access token cookie by name
- Returns null if cookie not found
- Handles malformed cookie strings gracefully

#### Step 4.2: Update MessagesGateway - Add Imports

**File**: `src/modules/messages/messages.gateway.ts`

**Action**: Add necessary imports for authentication

**Add these imports**:

```typescript
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { extractTokenFromSocket } from './utils/ws-cookie-extractor';
```

**Update existing imports**:
Ensure these are imported:

```typescript
import { UseFilters } from '@nestjs/common';
import { WsExceptionFilter } from '@/common/filters/ws-exception.filter';
```

#### Step 4.3: Update Gateway Configuration

**File**: `src/modules/messages/messages.gateway.ts`

**Current**:

```typescript
@UseFilters(new WsExceptionFilter())
@WebSocketGateway()
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private typingTimeouts = new Map<string, NodeJS.Timeout>();

  // ...
}
```

**Updated**:

```typescript
@UseFilters(new WsExceptionFilter())
@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true, // Enable credentials (cookies)
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private typingTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(private readonly jwtService: JwtService) {}

  // ...
}
```

**Key Changes**:

- Added CORS configuration with `credentials: true`
- Added `origin` from environment variable
- Injected `JwtService` via constructor for token verification

#### Step 4.4: Update handleConnection Method

**File**: `src/modules/messages/messages.gateway.ts`

**Current**:

```typescript
handleConnection(client: Socket) {
  console.log(`Client connected: ${client.id}`);
}
```

**Updated**:

```typescript
async handleConnection(client: Socket) {
  try {
    // Extract JWT from cookies
    const token = extractTokenFromSocket(client);

    if (!token) {
      console.log('WebSocket connection rejected: No token provided');
      throw new WsException('Unauthorized');
    }

    // Verify JWT
    const payload = this.jwtService.verify<{
      email: string;
      sub: number;
      username: string;
    }>(token, {
      secret: process.env.JWT_ACCESS_SECRET,
    });

    // Store user info in socket data for later use
    client.data.user = {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
    };

    console.log(`Client connected: ${client.id} (User: ${payload.username})`);
  } catch (error) {
    console.error('WebSocket authentication failed:', error);
    client.emit('error', { message: 'Authentication failed' });
    client.disconnect();
  }
}
```

**Key Features**:

- Extracts token from socket handshake cookies
- Verifies JWT with same secret as HTTP authentication
- Stores user context in `client.data.user` for event handlers
- Disconnects immediately if authentication fails
- Emits error message before disconnecting
- Logs connection with username for debugging

**Important**: The `handleConnection` method must be async to await verification.

#### Step 4.5: Update Event Handlers to Use Authenticated User

**File**: `src/modules/messages/messages.gateway.ts`

**Action**: Modify event handlers to check authentication and use user context

**Update join-channel handler**:

```typescript
@SubscribeMessage('join-channel')
handleJoinChannel(
  @MessageBody() data: { channelId: number },
  @ConnectedSocket() client: Socket,
) {
  // Access authenticated user from socket data
  const user = client.data.user;

  if (!user) {
    throw new WsException('Unauthorized');
  }

  const room = `channel-${data.channelId}`;
  void client.join(room);

  console.log(`User ${user.username} joined channel ${data.channelId}`);

  return { data: { channelId: data.channelId }, event: 'joined-channel' };
}
```

**Update leave-channel handler**:

```typescript
@SubscribeMessage('leave-channel')
handleLeaveChannel(
  @MessageBody() data: { channelId: number },
  @ConnectedSocket() client: Socket,
) {
  const user = client.data.user;

  if (!user) {
    throw new WsException('Unauthorized');
  }

  const room = `channel-${data.channelId}`;
  void client.leave(room);

  console.log(`User ${user.username} left channel ${data.channelId}`);

  return { data: { channelId: data.channelId }, event: 'left-channel' };
}
```

**Update typing handler**:

```typescript
@SubscribeMessage('typing')
handleTyping(
  @MessageBody() data: TypingPayload,
  @ConnectedSocket() client: Socket,
) {
  const user = client.data.user;

  if (!user) {
    throw new WsException('Unauthorized');
  }

  const room = `channel-${data.channelId}`;
  const key = `${user.id}-${data.channelId}`;

  // Clear existing timeout
  if (this.typingTimeouts.has(key)) {
    clearTimeout(this.typingTimeouts.get(key));
  }

  // Broadcast typing event with authenticated user data
  void client.to(room).emit('user-typing', {
    channelId: data.channelId,
    userId: user.id,
    username: user.username,
  });

  // Set timeout to clear typing after 3 seconds
  const timeout = setTimeout(() => {
    void client.to(room).emit('user-stopped-typing', {
      channelId: data.channelId,
      userId: user.id,
    });
    this.typingTimeouts.delete(key);
  }, 3000);

  this.typingTimeouts.set(key, timeout);
}
```

**Key Changes**:

- All handlers check for `client.data.user`
- Throw `WsException` if user not authenticated
- Use actual user ID and username from token (not from client payload)
- Log actions with authenticated username

**Security Benefit**: Client cannot spoof user ID or username since it comes from verified JWT.

#### Step 4.6: Update MessagesModule - Import JwtModule

**File**: `src/modules/messages/messages.module.ts`

**Current**:

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesGateway],
})
export class MessagesModule {}
```

**Updated**:

```typescript
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION as any },
    }),
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesGateway],
})
export class MessagesModule {}
```

**Reason**: Gateway needs JwtService to verify tokens, so JwtModule must be imported.

#### Step 4.7: Add Type Definition for Socket Data (Optional)

**File**: `src/modules/messages/types/socket-data.type.ts` (NEW FILE)

**Action**: Create type definition for socket data (improves type safety)

**Implementation**:

```typescript
export interface SocketData {
  user?: {
    id: number;
    email: string;
    username: string;
  };
}
```

**Usage in MessagesGateway**:

```typescript
import { Socket } from 'socket.io';
import { SocketData } from './types/socket-data.type';

type AuthenticatedSocket = Socket & { data: SocketData };

// Use in handlers
@SubscribeMessage('join-channel')
handleJoinChannel(
  @MessageBody() data: { channelId: number },
  @ConnectedSocket() client: AuthenticatedSocket,
) {
  const user = client.data.user; // Now type-safe!
  // ...
}
```

### Testing Phase 4

#### 1. Build Verification

```bash
npm run build
```

#### 2. Start Application

```bash
npm run start:dev
```

#### 3. WebSocket Connection Testing

**Test with Socket.IO Client** (Node.js):

```javascript
const io = require('socket.io-client');

// First, login to get cookies
const axios = require('axios');
axios
  .post(
    'http://localhost:3001/api/v1/auth/login',
    {
      usernameOrEmail: 'test@example.com',
      password: 'Password123!',
    },
    {
      withCredentials: true, // Important!
    },
  )
  .then((response) => {
    // Extract cookies from response
    const cookies = response.headers['set-cookie'];

    // Connect with cookies
    const socket = io('http://localhost:3001', {
      withCredentials: true,
      extraHeaders: {
        cookie: cookies.join('; '),
      },
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');

      // Test joining channel
      socket.emit('join-channel', { channelId: 1 });
    });

    socket.on('joined-channel', (data) => {
      console.log('Joined channel:', data);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });
  });
```

**Test Authentication Failure**:

```javascript
// Try connecting without cookies
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected (should not happen)');
});

socket.on('disconnect', () => {
  console.log('Disconnected (expected)');
});

socket.on('error', (error) => {
  console.error('Authentication failed (expected):', error);
});
```

#### 4. Check Server Logs

Expected successful connection log:

```
Client connected: ABC123 (User: testuser)
User testuser joined channel 1
```

Expected failed connection log:

```
WebSocket connection rejected: No token provided
WebSocket authentication failed: [error details]
```

### Expected Outcomes

- [x] WebSocket connections require authentication
- [x] JWT extracted from cookies automatically
- [x] Unauthorized connections rejected immediately
- [x] User context available in all event handlers
- [x] User ID and username from JWT (not client payload)
- [x] CORS configured with credentials
- [x] JwtModule imported in MessagesModule
- [x] Build succeeds without errors

### Files Modified/Created

**Created**:

- `src/modules/messages/utils/ws-cookie-extractor.ts` - Token extraction
- `src/modules/messages/types/socket-data.type.ts` - Type definitions (optional)

**Modified**:

- `src/modules/messages/messages.gateway.ts` - Authentication logic
- `src/modules/messages/messages.module.ts` - Import JwtModule

### Common Issues & Solutions

**Issue**: Client connects but immediately disconnects
**Solution**: Check that cookies are being sent with WebSocket handshake (`withCredentials: true`)

**Issue**: "JwtService is not defined" error
**Solution**: Ensure JwtModule is imported in MessagesModule

**Issue**: Token verification fails with valid token
**Solution**: Verify JWT_ACCESS_SECRET matches between HTTP and WebSocket verification

**Issue**: CORS errors in browser
**Solution**: Ensure gateway CORS configuration includes correct origin and `credentials: true`

**Issue**: Socket.data.user is undefined in handlers
**Solution**: Check that handleConnection completes successfully before events are emitted

### Security Checklist

- [x] Authentication required for all connections
- [x] JWT verified using same secret as HTTP auth
- [x] User context from JWT (not client payload)
- [x] Unauthorized connections rejected immediately
- [x] User authentication checked in all event handlers
- [x] CORS configured with specific origin (not wildcard)
- [x] Credentials enabled in CORS

### Advanced: Permission Checks in WebSocket Events

**Optional Enhancement**: Add permission checks for channel access

```typescript
@SubscribeMessage('join-channel')
async handleJoinChannel(
  @MessageBody() data: { channelId: number },
  @ConnectedSocket() client: Socket,
) {
  const user = client.data.user;

  if (!user) {
    throw new WsException('Unauthorized');
  }

  // Check if user has access to channel (optional but recommended)
  const hasAccess = await this.checkChannelAccess(user.id, data.channelId);

  if (!hasAccess) {
    throw new WsException('Forbidden: No access to this channel');
  }

  const room = `channel-${data.channelId}`;
  void client.join(room);

  return { data: { channelId: data.channelId }, event: 'joined-channel' };
}

private async checkChannelAccess(userId: number, channelId: number): Promise<boolean> {
  // Implementation: Check if user is member of server that owns channel
  // This would require injecting ChannelsService or PrismaService
  return true; // Simplified for now
}
```

### Next Steps

After completing Phase 4, proceed to **Phase 5: Testing Updates** to:

1. Update Bruno test collection for cookie-based auth
2. Update E2E tests to handle cookies
3. Verify all protected endpoints work correctly
4. Test WebSocket authentication flows

### References

- Main implementation plan: `docs/plan/cookie-auth-implementation.md`
- Previous phases: `.github/prompts/cookie-auth-phase-1.prompt.md` through `cookie-auth-phase-3.prompt.md`
- Socket.IO Authentication: https://socket.io/docs/v4/middlewares/
