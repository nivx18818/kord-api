/**
 * 5-digit error codes for Kord API
 * Pattern: [HTTP_STATUS][CATEGORY][SEQUENCE]
 */

export enum ErrorCode {
  ALREADY_HAS_ROLE = 40905,
  ALREADY_MEMBER_OF_SERVER = 40904,
  ALREADY_REACTED = 40906,
  ATTACHMENT_NOT_FOUND = 40407,
  CANNOT_MESSAGE_USER = 40306,
  CHANNEL_ACCESS_DENIED = 40303,
  CHANNEL_ALREADY_EXISTS = 40907,
  CHANNEL_NOT_FOUND = 40403,
  DATABASE_ERROR = 50002,
  // 409 - Conflict (Resource Already Exists / State Conflicts)
  EMAIL_ALREADY_EXISTS = 40901,

  EXTERNAL_SERVICE_ERROR = 50003,
  // 403 - Forbidden (Authorization/Permission Errors)
  FORBIDDEN = 40301,
  // 500 - Internal Server Error
  INTERNAL_SERVER_ERROR = 50001,
  INVALID_CHANNEL_TYPE = 40007,
  INVALID_CURSOR = 40009,

  INVALID_DATE_OF_BIRTH = 40005,
  INVALID_EMAIL = 40002,
  INVALID_MESSAGE_CONTENT = 40008,
  INVALID_PAGINATION_PARAMS = 40010,
  INVALID_PASSWORD = 40004,
  INVALID_TOKEN = 40102,
  INVALID_USERNAME = 40003,
  INVITE_NOT_FOUND = 40409,

  MEMBERSHIP_NOT_FOUND = 40408,
  MESSAGE_NOT_FOUND = 40404,
  MISSING_AUTHENTICATION = 40105,
  MISSING_PERMISSIONS = 40302,
  MISSING_REQUIRED_FIELD = 40006,
  NOT_MEMBER_OF_SERVER = 40305,
  PROFILE_NOT_FOUND = 40406,
  // 429 - Rate Limit
  RATE_LIMIT_EXCEEDED = 42901,
  REFRESH_TOKEN_INVALID = 40104,

  ROLE_NOT_FOUND = 40405,
  SERVER_ACCESS_DENIED = 40304,
  SERVER_NOT_FOUND = 40402,
  SERVERNAME_ALREADY_EXISTS = 40903,
  TOKEN_EXPIRED = 40103,
  TOO_MANY_MESSAGES = 42902,
  TOO_MANY_REQUESTS = 42903,
  UNAUTHORIZED = 40101,
  USER_BLOCKED = 40307,
  USER_MUTED = 40308,
  USER_NOT_FOUND = 40401,
  USERNAME_ALREADY_EXISTS = 40902,
  VALIDATION_ERROR = 40001,
}

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.ALREADY_HAS_ROLE]: 'User already has this role',
  [ErrorCode.ALREADY_MEMBER_OF_SERVER]: 'Already a member of this server',
  [ErrorCode.ALREADY_REACTED]: 'You have already reacted with this emoji',
  [ErrorCode.ATTACHMENT_NOT_FOUND]: 'Attachment not found',
  [ErrorCode.CANNOT_MESSAGE_USER]: 'You cannot message this user',
  [ErrorCode.CHANNEL_ACCESS_DENIED]: 'You do not have access to this channel',
  [ErrorCode.CHANNEL_ALREADY_EXISTS]: 'Channel already exists',
  [ErrorCode.CHANNEL_NOT_FOUND]: 'Channel not found',
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  // 409 - Conflict
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'Email already registered',

  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service is unavailable',
  [ErrorCode.FORBIDDEN]: 'Access denied',
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred',
  [ErrorCode.INVALID_CHANNEL_TYPE]: 'Invalid channel type',
  [ErrorCode.INVALID_CURSOR]: 'Invalid pagination cursor',
  [ErrorCode.INVALID_DATE_OF_BIRTH]: 'Invalid date of birth',
  [ErrorCode.INVALID_EMAIL]: 'Invalid email format',
  [ErrorCode.INVALID_MESSAGE_CONTENT]: 'Invalid message content',
  [ErrorCode.INVALID_PAGINATION_PARAMS]: 'Invalid pagination parameters',
  [ErrorCode.INVALID_PASSWORD]: 'Invalid password format',
  [ErrorCode.INVALID_TOKEN]: 'Invalid authentication token',
  [ErrorCode.INVALID_USERNAME]: 'Invalid username format',
  [ErrorCode.INVITE_NOT_FOUND]: 'Invite not found',
  [ErrorCode.MEMBERSHIP_NOT_FOUND]: 'Membership not found',
  [ErrorCode.MESSAGE_NOT_FOUND]: 'Message not found',
  [ErrorCode.MISSING_AUTHENTICATION]: 'Missing authentication credentials',
  [ErrorCode.MISSING_PERMISSIONS]: 'Missing required permissions',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCode.NOT_MEMBER_OF_SERVER]: 'You are not a member of this server',
  [ErrorCode.PROFILE_NOT_FOUND]: 'Profile not found',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ErrorCode.REFRESH_TOKEN_INVALID]: 'Invalid or expired refresh token',
  [ErrorCode.ROLE_NOT_FOUND]: 'Role not found',
  [ErrorCode.SERVER_ACCESS_DENIED]: 'You do not have access to this server',
  [ErrorCode.SERVER_NOT_FOUND]: 'Server not found',
  [ErrorCode.SERVERNAME_ALREADY_EXISTS]: 'Server name already taken',
  [ErrorCode.TOKEN_EXPIRED]: 'Authentication token has expired',
  [ErrorCode.TOO_MANY_MESSAGES]: 'Too many messages sent',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests',
  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.USER_BLOCKED]: 'You have been blocked by this user',
  [ErrorCode.USER_MUTED]: 'You have been muted in this channel',
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.USERNAME_ALREADY_EXISTS]: 'Username already taken',
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
};

export function getErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] || ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR];
}
