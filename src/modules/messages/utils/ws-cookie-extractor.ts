import { Socket } from 'socket.io';

import { COOKIE_NAMES } from '@/common/constants/cookie-config';

/**
 * Extracts JWT access token from Socket.IO handshake cookies.
 * Socket.IO automatically includes cookies in the handshake.
 *
 * @param socket - Socket.IO socket instance
 * @returns JWT token string or null if not found
 */
export const extractTokenFromSocket = (socket: Socket): null | string => {
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
