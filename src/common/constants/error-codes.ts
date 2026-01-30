/**
 * 5-digit error codes
 * Pattern: [HTTP_STATUS][CATEGORY][SEQUENCE]
 */

/* eslint-disable perfectionist/sort-enums */
export enum ErrorCode {
  // 400 - Bad Request
  VALIDATION_ERROR = 40000,
  INVALID_EMAIL = 40001,
  INVALID_USERNAME = 40002,
  INVALID_PASSWORD = 40003,
  INVALID_DATE_OF_BIRTH = 40004,
  MISSING_REQUIRED_FIELD = 40005,
  INVALID_CHANNEL_TYPE = 40006,
  INVALID_MESSAGE_CONTENT = 40007,
  INVALID_PAGINATION_CURSOR = 40008,
  INVALID_PAGINATION_PARAMS = 40009,
  // 401 - Unauthorized
  UNAUTHORIZED = 40100,
  INVALID_ACCESS_TOKEN = 40101,
  ACCESS_TOKEN_EXPIRED = 40102,
  INVALID_REFRESH_TOKEN = 40103,
  MISSING_AUTHENTICATION = 40104,
  // 403 - Forbidden
  FORBIDDEN = 40300,
  MISSING_PERMISSIONS = 40301,
  CHANNEL_ACCESS_DENIED = 40302,
  SERVER_ACCESS_DENIED = 40303,
  NOT_MEMBER_OF_SERVER = 40304,
  CANNOT_MESSAGE_USER = 40305,
  USER_BLOCKED = 40306,
  USER_MUTED = 40307,
  // 404 - Not Found
  NOT_FOUND = 40400,
  USER_NOT_FOUND = 40401,
  SERVER_NOT_FOUND = 40402,
  CHANNEL_NOT_FOUND = 40403,
  MESSAGE_NOT_FOUND = 40404,
  ROLE_NOT_FOUND = 40405,
  PROFILE_NOT_FOUND = 40406,
  ATTACHMENT_NOT_FOUND = 40407,
  MEMBERSHIP_NOT_FOUND = 40408,
  INVITE_NOT_FOUND = 40409,
  ROLES_NOT_FOUND = 40410,
  // 409 - Conflict
  CONFLICT = 40900,
  EMAIL_ALREADY_EXISTS = 40901,
  USERNAME_ALREADY_EXISTS = 40902,
  SERVERNAME_ALREADY_EXISTS = 40903,
  ALREADY_MEMBER_OF_SERVER = 40904,
  ALREADY_HAS_ROLE = 40905,
  ALREADY_REACTED = 40906,
  CHANNEL_ALREADY_EXISTS = 40907,
  // 429 - Too Many Requests
  RATE_LIMIT_EXCEEDED = 42900,
  TOO_MANY_MESSAGES = 42901,
  TOO_MANY_REQUESTS = 42902,
  // 500 - Internal Server Error
  INTERNAL_SERVER_ERROR = 50000,
  DATABASE_ERROR = 50001,
  EXTERNAL_SERVICE_ERROR = 50002,
}

/* eslint-disable perfectionist/sort-objects */
export const ErrorMessages: Record<ErrorCode, string> = {
  // 400 - Bad Request
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.INVALID_EMAIL]: 'Invalid email format',
  [ErrorCode.INVALID_USERNAME]: 'Invalid username format',
  [ErrorCode.INVALID_PASSWORD]: 'Invalid password format',
  [ErrorCode.INVALID_DATE_OF_BIRTH]: 'Invalid date of birth',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCode.INVALID_CHANNEL_TYPE]: 'Invalid channel type',
  [ErrorCode.INVALID_MESSAGE_CONTENT]: 'Invalid message content',
  [ErrorCode.INVALID_PAGINATION_CURSOR]: 'Invalid pagination cursor',
  [ErrorCode.INVALID_PAGINATION_PARAMS]: 'Invalid pagination parameters',
  // 401 - Unauthorized
  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.INVALID_ACCESS_TOKEN]: 'Invalid authentication token',
  [ErrorCode.ACCESS_TOKEN_EXPIRED]: 'Authentication token has expired',
  [ErrorCode.INVALID_REFRESH_TOKEN]: 'Invalid or expired refresh token',
  [ErrorCode.MISSING_AUTHENTICATION]: 'Missing authentication credentials',
  // 403 - Forbidden
  [ErrorCode.FORBIDDEN]: 'Access denied',
  [ErrorCode.MISSING_PERMISSIONS]: 'Missing required permissions',
  [ErrorCode.CHANNEL_ACCESS_DENIED]: 'You do not have access to this channel',
  [ErrorCode.SERVER_ACCESS_DENIED]: 'You do not have access to this server',
  [ErrorCode.NOT_MEMBER_OF_SERVER]: 'You are not a member of this server',
  [ErrorCode.CANNOT_MESSAGE_USER]: 'You cannot message this user',
  [ErrorCode.USER_BLOCKED]: 'You have been blocked by this user',
  [ErrorCode.USER_MUTED]: 'You have been muted in this channel',
  // 404 - Not Found
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.SERVER_NOT_FOUND]: 'Server not found',
  [ErrorCode.CHANNEL_NOT_FOUND]: 'Channel not found',
  [ErrorCode.MESSAGE_NOT_FOUND]: 'Message not found',
  [ErrorCode.ROLE_NOT_FOUND]: 'Role not found',
  [ErrorCode.PROFILE_NOT_FOUND]: 'Profile not found',
  [ErrorCode.ATTACHMENT_NOT_FOUND]: 'Attachment not found',
  [ErrorCode.MEMBERSHIP_NOT_FOUND]: 'Membership not found',
  [ErrorCode.INVITE_NOT_FOUND]: 'Invite not found',
  [ErrorCode.ROLES_NOT_FOUND]: 'One or more roles not found',
  // 409 - Conflict
  [ErrorCode.CONFLICT]: 'The resource is in a conflicting state',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'Email already registered',
  [ErrorCode.USERNAME_ALREADY_EXISTS]: 'Username already taken',
  [ErrorCode.SERVERNAME_ALREADY_EXISTS]: 'Servername already taken',
  [ErrorCode.ALREADY_MEMBER_OF_SERVER]: 'Already a member of this server',
  [ErrorCode.ALREADY_HAS_ROLE]: 'User already has this role',
  [ErrorCode.ALREADY_REACTED]: 'You have already reacted with this emoji',
  [ErrorCode.CHANNEL_ALREADY_EXISTS]: 'Channel already exists',
  // 429 - Too Many Requests
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ErrorCode.TOO_MANY_MESSAGES]: 'Too many messages sent',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests',
  // 500 - Internal Server Error
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred',
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service is unavailable',
};

export function getErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] || ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR];
}
