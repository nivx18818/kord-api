# Frontend Integration Guide

Complete guide for integrating Kord API into your Next.js frontend application.

## Table of Contents

- [Quick Start](#quick-start)
- [Next.js Setup](#nextjs-setup)
- [Authentication Setup](#authentication-setup)
- [API Client Configuration](#api-client-configuration)
- [Common Patterns](#common-patterns)
- [Server Components vs Client Components](#server-components-vs-client-components)
- [Real-time Updates](#real-time-updates)
- [Error Handling](#error-handling)
- [State Management](#state-management)
- [TypeScript Support](#typescript-support)
- [Best Practices](#best-practices)

## Quick Start

### Installation

```bash
# Create a new Next.js app with TypeScript
npx create-next-app@latest kord-frontend --typescript --tailwind --app

cd kord-frontend

# Install dependencies
npm install axios socket.io-client

# Using yarn
yarn add axios socket.io-client
```

### Basic Setup

1. Configure environment variables
2. Create an API client
3. Set up authentication
4. Configure WebSocket connection
5. Implement state management

## Next.js Setup

### Environment Variables

Create a `.env.local` file in your Next.js project root:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3000

# Only use NEXT_PUBLIC_ prefix for variables needed in the browser
# Server-only variables don't need the prefix
```

**Important:** Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Authentication Setup

### Cookie-Based Authentication

Kord uses HTTP-only cookies for secure authentication. This means tokens are automatically included in requests and cannot be accessed by JavaScript.

**Important Configuration:**

- Always set `withCredentials: true` (Axios) or `credentials: 'include'` (Fetch)
- CORS must be properly configured on the backend
- Frontend URL must match the `FRONTEND_URL` environment variable

### Creating an Authenticated API Client

```typescript
// lib/api/client.ts
import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not defined in environment variables',
  );
}

export const apiClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true, // Critical for cookie-based auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatic token refresh on 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        await apiClient.post('/auth/refresh');
        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
```

**Note:** Check for `typeof window !== 'undefined'` before redirecting to ensure code works in both server and client environments.

## API Client Configuration

### Organizing API Calls

Structure your API calls by domain in the `lib` directory (Next.js convention):

```
lib/
  api/
    client.ts          # Base API client
    auth.ts            # Authentication endpoints
    users.ts           # User endpoints
    servers.ts         # Server endpoints
    channels.ts        # Channel endpoints
    messages.ts        # Message endpoints
    reactions.ts       # Reaction endpoints
    roles.ts           # Role endpoints
```

### Example: Authentication API

```typescript
// lib/api/auth.ts
import { apiClient } from './client';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
  name?: string;
}

interface LoginCredentials {
  identifier: string; // username or email
  password: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  register: async (userData: RegisterData): Promise<User> => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<{ user: User }> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  checkEmailAvailability: async (
    email: string,
  ): Promise<{ available: boolean }> => {
    const response = await apiClient.get('/auth/check-email', {
      params: { email },
    });
    return response.data;
  },
};
```

### Example: Messages API

```typescript
// lib/api/messages.ts
import { apiClient } from './client';

interface MessageContent {
  text?: string;
  embeds?: any[];
  edited?: boolean;
  [key: string]: any;
}

interface Message {
  id: number;
  channelId: number;
  userId: number;
  content: MessageContent;
  parentMessageId?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface PaginatedMessages {
  items: Message[];
  limit: number;
  hasMore: boolean;
  before?: string; // ISO 8601 timestamp
  after?: string; // ISO 8601 timestamp
}

export const messagesApi = {
  send: async (
    channelId: number,
    userId: number,
    content: MessageContent,
    parentMessageId?: number,
  ): Promise<Message> => {
    const response = await apiClient.post('/messages', {
      channelId,
      userId,
      content,
      parentMessageId,
    });
    return response.data;
  },

  getMessages: async (
    channelId: number,
    limit: number = 50,
    after?: string, // ISO 8601 timestamp for cursor pagination
  ): Promise<PaginatedMessages> => {
    const response = await apiClient.get('/messages', {
      params: {
        channelId,
        limit,
        ...(after && { after }),
      },
    });
    return response.data;
  },

  getMessage: async (messageId: number): Promise<Message> => {
    const response = await apiClient.get(`/messages/${messageId}`);
    return response.data;
  },

  update: async (
    messageId: number,
    content: MessageContent,
  ): Promise<Message> => {
    const response = await apiClient.patch(`/messages/${messageId}`, {
      content: { ...content, edited: true },
    });
    return response.data;
  },

  delete: async (messageId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/messages/${messageId}`);
    return response.data;
  },
};
```

## Common Patterns

### Authentication Flow

In Next.js App Router, use Context API for client-side auth state:

```tsx
// lib/contexts/AuthContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { authApi } from '../api/auth';

interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
}

interface LoginCredentials {
  identifier: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    await authApi.login(credentials);
    await checkAuth();
  };

  const register = async (userData: RegisterData) => {
    await authApi.register(userData);
    await checkAuth();
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

Wrap your app with the AuthProvider in the root layout:

```tsx
// app/layout.tsx
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### Protected Routes with Proxy

Next.js App Router uses proxy for route protection:

```typescript
// proxy.ts (in project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Check for auth cookie
  const accessToken = request.cookies.get('accessToken');

  // Protected routes
  const protectedPaths = ['/servers', '/channels', '/messages', '/profile'];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isProtectedPath && !accessToken) {
    // Redirect to login if accessing protected route without auth
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect away from auth pages if already logged in
  const authPaths = ['/login', '/register'];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isAuthPath && accessToken) {
    return NextResponse.redirect(new URL('/servers', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

Alternatively, create a client component wrapper for protected pages:

```tsx
// components/ProtectedRoute.tsx
'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return children;
}
```

Usage in a page:

```tsx
// app/servers/page.tsx
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ServersPage() {
  return (
    <ProtectedRoute>
      <div>
        <h1>My Servers</h1>
        {/* Server content */}
      </div>
    </ProtectedRoute>
  );
}
```

### Pagination Hook

```typescript
// lib/hooks/usePagination.ts
'use client';

import { useState, useCallback } from 'react';

interface CursorPaginatedResponse<T> {
  items: T[];
  limit: number;
  hasMore: boolean;
  before?: string;
  after?: string;
}

type FetchFunction<T> = (...args: any[]) => Promise<CursorPaginatedResponse<T>>;

export function usePagination<T extends { createdAt: string }>(
  fetchFunction: FetchFunction<T>,
  initialLimit: number = 50,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [after, setAfter] = useState<string | undefined>(undefined);

  const loadMore = useCallback(
    async (...args: any[]) => {
      if (loading || !hasMore) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetchFunction(...args, initialLimit, after);

        setData((prev) => [...prev, ...response.items]);
        setHasMore(response.hasMore);
        setAfter(response.after);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('Pagination error:', error);
      } finally {
        setLoading(false);
      }
    },
    [after, loading, hasMore, fetchFunction, initialLimit],
  );

  const reset = useCallback(() => {
    setData([]);
    setHasMore(true);
    setError(null);
    setAfter(undefined);
  }, []);

  return { data, loading, hasMore, error, loadMore, reset, setData };
}
```

### Infinite Scroll Messages

```jsx
// components/MessageList.jsx
'use client';

import { useEffect, useRef } from 'react';
import { messagesApi } from '@/lib/api/messages';
import { usePagination } from '@/lib/hooks/usePagination';

export default function MessageList({ channelId }) {
  const scrollRef = useRef(null);
  const {
    data: messages,
    loading,
    hasMore,
    loadMore,
    setData,
  } = usePagination(messagesApi.getMessages);

  useEffect(() => {
    // Load initial messages
    loadMore(channelId);
  }, [channelId]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (container.scrollTop === 0 && hasMore && !loading) {
      loadMore(channelId);
    }
  };

  const handleNewMessage = (message) => {
    setData((prev) => [...prev, message]);
    // Scroll to bottom
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="message-list">
      {loading && <div>Loading more...</div>}

      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
}
```

## Server Components vs Client Components

Next.js App Router uses React Server Components by default. Understanding when to use Server vs Client Components is crucial.

### Server Components (Default)

Server Components run only on the server and can:

- Directly access backend resources (databases, APIs)
- Keep sensitive data secure (API keys, tokens)
- Reduce client bundle size
- Improve initial page load

```jsx
// app/servers/[serverId]/page.jsx
// This is a Server Component by default
import { serversApi } from '@/lib/api/servers';

export default async function ServerPage({ params }) {
  // Fetch data directly on the server
  const server = await serversApi.getById(params.serverId);

  return (
    <div>
      <h1>{server.name}</h1>
      {/* Render static content */}
    </div>
  );
}
```

### Client Components

Use Client Components when you need:

- Interactivity (onClick, onChange, etc.)
- React hooks (useState, useEffect, useContext)
- Browser APIs (localStorage, window, etc.)
- WebSocket connections

Add `'use client'` at the top of the file:

```jsx
// components/MessageInput.jsx
'use client';

import { useState } from 'react';

export function MessageInput({ onSend }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(text);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
      />
      <button type="submit">Send</button>
    </form>
  );
}
```

### Best Practices

1. **Use Server Components by default** - Only opt into Client Components when necessary
2. **Move Client Components to the leaves** - Keep interactive components small and nested
3. **Pass Server Component data to Client Components** - Fetch on server, render on client

```jsx
// app/channels/[channelId]/page.jsx
// Server Component
import { messagesApi } from '@/lib/api/messages';
import { MessageList } from '@/components/MessageList';

export default async function ChannelPage({ params }) {
  // Fetch initial data on server
  const initialMessages = await messagesApi.getMessages(params.channelId);

  return (
    <div>
      {/* Pass data to Client Component */}
      <MessageList
        channelId={params.channelId}
        initialMessages={initialMessages.data}
      />
    </div>
  );
}
```

```tsx
// components/MessageList.tsx
// Client Component for interactivity
'use client';

import { useState, useEffect } from 'react';
import { socketService } from '@/lib/services/socket';

interface Message {
  id: number;
  channelId: number;
  userId: number;
  content: {
    text?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

interface MessageListProps {
  channelId: number;
  initialMessages: Message[];
}

export function MessageList({ channelId, initialMessages }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  useEffect(() => {
    socketService.connect();
    socketService.joinChannel(channelId);

    socketService.onMessageCreated((message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketService.leaveChannel(channelId);
      socketService.removeAllListeners();
    };
  }, [channelId]);

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content.text}</div>
      ))}
    </div>
  );
}
```

## Real-time Updates

### WebSocket Setup

```typescript
// lib/services/socket.ts
'use client';

import { io, Socket } from 'socket.io-client';

const socketUrl = process.env.NEXT_PUBLIC_WS_URL;

if (!socketUrl) {
  throw new Error('NEXT_PUBLIC_WS_URL is not defined in environment variables');
}

type MessageCallback = (message: any) => void;
type TypingCallback = (data: any) => void;
type ReactionCallback = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, any> = new Map();

  connect(): void {
    // Only connect on client-side
    if (typeof window === 'undefined') return;
    if (this.socket?.connected) return;

    this.socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Channel events
  joinChannel(channelId: number): void {
    this.socket?.emit('joinChannel', { channelId });
  }

  leaveChannel(channelId: number): void {
    this.socket?.emit('leaveChannel', { channelId });
  }

  // Message events
  onMessageCreated(callback: MessageCallback): void {
    this.socket?.on('messageCreated', callback);
    this.listeners.set('messageCreated', callback);
  }

  onMessageUpdated(callback: MessageCallback): void {
    this.socket?.on('messageUpdated', callback);
    this.listeners.set('messageUpdated', callback);
  }

  onMessageDeleted(callback: (data: { messageId: number }) => void): void {
    this.socket?.on('messageDeleted', callback);
    this.listeners.set('messageDeleted', callback);
  }

  // Reaction events
  onReactionAdded(callback: ReactionCallback): void {
    this.socket?.on('reactionAdded', callback);
    this.listeners.set('reactionAdded', callback);
  }

  onReactionRemoved(callback: ReactionCallback): void {
    this.socket?.on('reactionRemoved', callback);
    this.listeners.set('reactionRemoved', callback);
  }

  // Typing events
  startTyping(channelId: number, userId: number): void {
    this.socket?.emit('typing', { channelId, userId, isTyping: true });
  }

  stopTyping(channelId: number, userId: number): void {
    this.socket?.emit('typing', { channelId, userId, isTyping: false });
  }

  onTyping(callback: TypingCallback): void {
    this.socket?.on('userTyping', callback);
    this.listeners.set('userTyping', callback);
  }

  // Cleanup
  removeAllListeners(): void {
    this.listeners.forEach((callback, event) => {
      this.socket?.off(event, callback);
    });
    this.listeners.clear();
  }
}

export const socketService = new SocketService();
```

### Using WebSocket in Components

```tsx
// app/channels/[channelId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { socketService } from '@/lib/services/socket';
import { messagesApi } from '@/lib/api/messages';

interface Message {
  id: number;
  channelId: number;
  userId: number;
  content: any;
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  params: {
    channelId: string;
  };
}

export default function ChannelPage({ params }: PageProps) {
  const channelId = parseInt(params.channelId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    // Connect socket
    socketService.connect();
    socketService.joinChannel(channelId);

    // Load initial messages
    loadMessages();

    // Set up event listeners
    socketService.onMessageCreated((message: Message) => {
      if (message.channelId === channelId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socketService.onMessageUpdated((message: Message) => {
      if (message.channelId === channelId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? message : m)),
        );
      }
    });

    socketService.onMessageDeleted(({ messageId }: { messageId: number }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    // Cleanup
    return () => {
      socketService.leaveChannel(channelId);
      socketService.removeAllListeners();
    };
  }, [channelId]);

  const loadMessages = async () => {
    try {
      const response = await messagesApi.getMessages(channelId);
      setMessages(response.items);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentUserId) return;

    try {
      await messagesApi.send(channelId, currentUserId, { text: content });
      // Message will be added via WebSocket event
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div>
      <MessageList messages={messages} />
      <MessageInput onSend={sendMessage} />
    </div>
  );
}
```

## Error Handling

### Global Error Handler

```typescript
// lib/utils/errorHandler.ts
export class ApiError extends Error {
  public statusCode: number;
  public errors: any[];

  constructor(message: string, statusCode: number, errors: any[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'ApiError';
  }
}

interface ErrorResponse {
  message?: string;
  errors?: any[];
}

interface AxiosError {
  response?: {
    status: number;
    data: ErrorResponse;
  };
  request?: any;
  message?: string;
}

export function handleApiError(error: AxiosError): ApiError {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return new ApiError(
          data.message ?? 'Invalid request',
          400,
          data.errors,
        );
      case 401:
        return new ApiError('Unauthorized - Please log in', 401);
      case 403:
        return new ApiError('Forbidden - Insufficient permissions', 403);
      case 404:
        return new ApiError('Resource not found', 404);
      case 409:
        return new ApiError(data.message ?? 'Conflict', 409);
      case 500:
        return new ApiError('Server error - Please try again later', 500);
      default:
        return new ApiError(data.message ?? 'An error occurred', status);
    }
  } else if (error.request) {
    // Request made but no response
    return new ApiError('Network error - Please check your connection', 0);
  } else {
    // Something else happened
    return new ApiError(error.message ?? 'An unexpected error occurred', 0);
  }
}
```

### Error Handling in Components

```tsx
// components/LoginForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { handleApiError, ApiError } from '@/lib/utils/errorHandler';
import { authApi } from '@/lib/api/auth';

export function LoginForm() {
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const credentials = {
      identifier: formData.get('identifier') as string,
      password: formData.get('password') as string,
    };

    try {
      await authApi.login(credentials);
      // Success - redirect or update state
    } catch (err) {
      const apiError = handleApiError(err as any);
      setError(apiError);

      // Show validation errors
      if (apiError.errors?.length > 0) {
        apiError.errors.forEach((e) => console.error(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error.message}</div>}

      <input
        type="text"
        name="identifier"
        placeholder="Username or Email"
        required
      />
      <input type="password" name="password" placeholder="Password" required />

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## State Management

### Using Context API

```tsx
// lib/contexts/ServerContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { serversApi } from '../api/servers';
import { useAuth } from './AuthContext';

interface Server {
  id: number;
  name: string;
  servername: string;
  createdAt: string;
  updatedAt: string;
}

interface ServerContextType {
  servers: Server[];
  currentServer: Server | null;
  loading: boolean;
  createServer: (name: string, servername: string) => Promise<Server>;
  selectServer: (serverId: number) => void;
  refreshServers: () => Promise<void>;
}

const ServerContext = createContext<ServerContextType | null>(null);

export function ServerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [currentServer, setCurrentServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserServers();
    }
  }, [user]);

  const loadUserServers = async () => {
    if (!user) return;

    try {
      const data = await serversApi.getUserServers(user.id);
      setServers(data);
    } catch (error) {
      console.error('Error loading servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const createServer = async (
    name: string,
    servername: string,
  ): Promise<Server> => {
    const newServer = await serversApi.create(name, servername);
    setServers((prev) => [...prev, newServer]);
    return newServer;
  };

  const selectServer = (serverId: number): void => {
    const server = servers.find((s) => s.id === serverId);
    setCurrentServer(server ?? null);
  };

  return (
    <ServerContext.Provider
      value={{
        servers,
        currentServer,
        loading,
        createServer,
        selectServer,
        refreshServers: loadUserServers,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
}

export const useServers = () => {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServers must be used within a ServerProvider');
  }
  return context;
};
```

### Using with React Query (Optional)

```typescript
// lib/hooks/useMessages.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tantml:query';
import { messagesApi } from '../api/messages';

interface Message {
  id: number;
  channelId: number;
  userId: number;
  content: any;
  createdAt: string;
  updatedAt: string;
}

interface MessageContent {
  text?: string;
  [key: string]: any;
}

export function useMessages(channelId: number) {
  return useQuery({
    queryKey: ['messages', channelId],
    queryFn: () => messagesApi.getMessages(channelId),
    enabled: !!channelId,
  });
}

interface SendMessageParams {
  channelId: number;
  userId: number;
  content: MessageContent;
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ channelId, userId, content }: SendMessageParams) =>
      messagesApi.send(channelId, userId, content),
    onSuccess: (data, variables) => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({
        queryKey: ['messages', variables.channelId],
      });
    },
  });
}
```

## TypeScript Support

### Type Definitions

```typescript
// lib/types/index.ts
export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
}

export interface UserProfile {
  userId: number;
  bio?: string;
  avatar?: string;
  banner?: string;
  xTwitter?: string;
  github?: string;
  linkedin?: string;
  facebook?: string;
  website?: string;
}

export interface Server {
  id: number;
  name: string;
  servername: string;
  createdAt: string;
  updatedAt: string;
  channels?: Channel[];
  members?: Membership[];
  roles?: Role[];
}

export interface Channel {
  id: number;
  name: string;
  serverId: number;
  type: 'TEXT' | 'VOICE';
  status: 'PUBLIC' | 'RESTRICT' | 'PRIVATE';
  isDM: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  content: Record<string, any>;
  userId: number;
  channelId: number;
  parentMessageId?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  user: User;
  attachments?: Attachment[];
  reacts?: Reaction[];
  replies?: Message[];
}

export interface Reaction {
  messageId: number;
  userId: number;
  emoji: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Role {
  id: number;
  name: string;
  serverId: number;
  permissions: Record<string, boolean>;
}

export interface Membership {
  userId: number;
  serverId: number;
  roleId?: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  server?: Server;
  role?: Role;
}

export interface Attachment {
  id: number;
  url: string;
  type?: string;
  size?: number;
  messageId: number;
  createdAt: string;
  updatedAt: string;
}
```

### Typed API Client

```typescript
// lib/api/messages.ts
import { apiClient } from './client';
import type { Message } from '../types';

export const messagesApi = {
  send: async (
    channelId: number,
    userId: number,
    content: Record<string, any>,
    parentMessageId?: number,
  ): Promise<Message> => {
    const response = await apiClient.post('/messages', {
      channelId,
      userId,
      content,
      parentMessageId,
    });
    return response.data;
  },

  getMessages: async (
    channelId: number,
    limit: number = 50,
    before?: number,
  ): Promise<{ data: Message[]; meta: any }> => {
    const response = await apiClient.get('/messages', {
      params: {
        channelId,
        limit,
        ...(before && { before }),
      },
    });
    return response.data;
  },

  delete: async (messageId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/messages/${messageId}`);
    return response.data;
  },
};
```

## Best Practices

### 1. Token Refresh

Always implement automatic token refresh to provide seamless user experience:

```javascript
// Handled by interceptor in the API client
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await apiClient.post('/auth/refresh');
      return apiClient(error.config);
    }
    return Promise.reject(error);
  },
);
```

### 2. Optimistic Updates

Update UI immediately for better UX, rollback on error:

```javascript
const handleSendMessage = async (content) => {
  const optimisticMessage = {
    id: Date.now(), // Temporary ID
    content: { text: content },
    userId: currentUserId,
    channelId,
    createdAt: new Date().toISOString(),
    user: currentUser,
    pending: true,
  };

  // Add optimistic message
  setMessages((prev) => [...prev, optimisticMessage]);

  try {
    const message = await messagesApi.send(channelId, currentUserId, {
      text: content,
    });
    // Replace optimistic with real message
    setMessages((prev) =>
      prev.map((m) => (m.id === optimisticMessage.id ? message : m)),
    );
  } catch (error) {
    // Remove optimistic message on error
    setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
    alert('Failed to send message');
  }
};
```

### 3. Debouncing

Debounce expensive operations like search or typing indicators:

```javascript
import { useCallback, useRef } from 'react';

function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  );
}

// Usage
const debouncedTyping = useDebounce((channelId, userId) => {
  socketService.startTyping(channelId, userId);
}, 300);
```

### 4. Error Boundaries

Wrap components in error boundaries for graceful error handling:

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 5. Loading States

Always provide feedback during async operations:

```jsx
function DataDisplay() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getData();
      setData(result);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} retry={fetchData} />;
  if (!data) return <EmptyState />;

  return <DataView data={data} />;
}
```

### 6. Cleanup

Always cleanup subscriptions and listeners:

```javascript
useEffect(() => {
  const controller = new AbortController();

  async function loadData() {
    try {
      const data = await fetch(url, { signal: controller.signal });
      // Handle data
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error);
      }
    }
  }

  loadData();

  return () => {
    controller.abort(); // Cancel pending requests
  };
}, [url]);
```

---

## Next Steps

1. Review the [API Documentation](../api/) for detailed endpoint information
2. Check out example implementations in the `bruno/` directory
3. Set up proper error logging and monitoring
4. Implement analytics tracking for user actions
5. Add offline support with service workers
6. Optimize bundle size with code splitting
7. Set up E2E testing with Playwright or Cypress

## Support

- API Issues: [GitHub Issues](https://github.com/nivx18818/kord-api/issues)
- Documentation: [README](../../README.md)
- Test Examples: See `bruno/` collection
