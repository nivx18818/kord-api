import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { ErrorCode, getErrorMessage } from '../constants/error-codes';

export class AlreadyHasRoleException extends ConflictException {
  constructor(userId: number, roleId: number) {
    super({
      code: ErrorCode.ALREADY_HAS_ROLE,
      message: `${getErrorMessage(ErrorCode.ALREADY_HAS_ROLE)}: user ${userId}, role ${roleId}`,
    });
  }
}

// ============================================================================
// 400 - Bad Request (Validation Errors)
// ============================================================================

export class AlreadyMemberOfServerException extends ConflictException {
  constructor(userId: number, serverId: number) {
    super({
      code: ErrorCode.ALREADY_MEMBER_OF_SERVER,
      message: `${getErrorMessage(ErrorCode.ALREADY_MEMBER_OF_SERVER)}: user ${userId} in server ${serverId}`,
    });
  }
}

export class AlreadyReactedException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.ALREADY_REACTED,
      message: getErrorMessage(ErrorCode.ALREADY_REACTED),
    });
  }
}

export class AttachmentNotFoundException extends NotFoundException {
  constructor(identifier: number | string) {
    super({
      code: ErrorCode.ATTACHMENT_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.ATTACHMENT_NOT_FOUND)}: ${identifier}`,
    });
  }
}

export class CannotMessageUserException extends ForbiddenException {
  constructor() {
    super({
      code: ErrorCode.CANNOT_MESSAGE_USER,
      message: getErrorMessage(ErrorCode.CANNOT_MESSAGE_USER),
    });
  }
}

export class ChannelAccessDeniedException extends ForbiddenException {
  constructor() {
    super({
      code: ErrorCode.CHANNEL_ACCESS_DENIED,
      message: getErrorMessage(ErrorCode.CHANNEL_ACCESS_DENIED),
    });
  }
}

export class ChannelAlreadyExistsException extends ConflictException {
  constructor(channelName: string) {
    super({
      code: ErrorCode.CHANNEL_ALREADY_EXISTS,
      message: `${getErrorMessage(ErrorCode.CHANNEL_ALREADY_EXISTS)}: ${channelName}`,
    });
  }
}

export class ChannelNotFoundException extends NotFoundException {
  constructor(identifier: number | string) {
    super({
      code: ErrorCode.CHANNEL_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.CHANNEL_NOT_FOUND)}: ${identifier}`,
    });
  }
}

export class DatabaseErrorException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.DATABASE_ERROR,
        message: getErrorMessage(ErrorCode.DATABASE_ERROR),
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class EmailAlreadyExistsException extends ConflictException {
  constructor(email: string) {
    super({
      code: ErrorCode.EMAIL_ALREADY_EXISTS,
      message: `${getErrorMessage(ErrorCode.EMAIL_ALREADY_EXISTS)}: ${email}`,
    });
  }
}

export class ExternalServiceErrorException extends HttpException {
  constructor(serviceName?: string) {
    const message = serviceName
      ? `${getErrorMessage(ErrorCode.EXTERNAL_SERVICE_ERROR)}: ${serviceName}`
      : getErrorMessage(ErrorCode.EXTERNAL_SERVICE_ERROR);

    super(
      {
        code: ErrorCode.EXTERNAL_SERVICE_ERROR,
        message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

// ============================================================================
// 401 - Unauthorized (Authentication Errors)
// ============================================================================

export class InternalServerErrorException extends HttpException {
  constructor(message?: string) {
    super(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: message || getErrorMessage(ErrorCode.INTERNAL_SERVER_ERROR),
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class InvalidChannelTypeException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.INVALID_CHANNEL_TYPE,
      message: getErrorMessage(ErrorCode.INVALID_CHANNEL_TYPE),
    });
  }
}

export class InvalidCursorException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.INVALID_PAGINATION_CURSOR,
      message: getErrorMessage(ErrorCode.INVALID_PAGINATION_CURSOR),
    });
  }
}

export class InvalidDateOfBirthException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.INVALID_DATE_OF_BIRTH,
      message: getErrorMessage(ErrorCode.INVALID_DATE_OF_BIRTH),
    });
  }
}

export class InvalidEmailException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.INVALID_EMAIL,
      message: getErrorMessage(ErrorCode.INVALID_EMAIL),
    });
  }
}

// ============================================================================
// 403 - Forbidden (Authorization/Permission Errors)
// ============================================================================

export class InvalidMessageContentException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.INVALID_MESSAGE_CONTENT,
      message: getErrorMessage(ErrorCode.INVALID_MESSAGE_CONTENT),
    });
  }
}

export class InvalidPaginationParamsException extends BadRequestException {
  constructor(message?: string) {
    super({
      code: ErrorCode.INVALID_PAGINATION_PARAMS,
      message: message || getErrorMessage(ErrorCode.INVALID_PAGINATION_PARAMS),
    });
  }
}

export class InvalidPasswordException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.INVALID_PASSWORD,
      message: getErrorMessage(ErrorCode.INVALID_PASSWORD),
    });
  }
}

export class InvalidTokenException extends UnauthorizedException {
  constructor() {
    super({
      code: ErrorCode.INVALID_ACCESS_TOKEN,
      message: getErrorMessage(ErrorCode.INVALID_ACCESS_TOKEN),
    });
  }
}

export class InvalidUsernameException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.INVALID_USERNAME,
      message: getErrorMessage(ErrorCode.INVALID_USERNAME),
    });
  }
}

export class InviteNotFoundException extends NotFoundException {
  constructor(code: string) {
    super({
      code: ErrorCode.INVITE_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.INVITE_NOT_FOUND)}: ${code}`,
    });
  }
}

/**
 * Base Kord Exception with error code support
 */
export abstract class KordException extends HttpException {
  constructor(
    public readonly errorCode: ErrorCode,
    statusCode: HttpStatus,
    message?: string,
  ) {
    super(
      {
        code: errorCode,
        message: message || getErrorMessage(errorCode),
      },
      statusCode,
    );
  }
}

export class KordForbiddenException extends ForbiddenException {
  constructor(message?: string) {
    super({
      code: ErrorCode.FORBIDDEN,
      message: message || getErrorMessage(ErrorCode.FORBIDDEN),
    });
  }
}

// ============================================================================
// 404 - Not Found
// ============================================================================

export class KordUnauthorizedException extends UnauthorizedException {
  constructor(message?: string) {
    super({
      code: ErrorCode.UNAUTHORIZED,
      message: message || getErrorMessage(ErrorCode.UNAUTHORIZED),
    });
  }
}

export class MembershipNotFoundException extends NotFoundException {
  constructor(userId: number, serverId: number) {
    super({
      code: ErrorCode.MEMBERSHIP_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.MEMBERSHIP_NOT_FOUND)}: user ${userId} in server ${serverId}`,
    });
  }
}

export class MessageNotFoundException extends NotFoundException {
  constructor(identifier: number | string) {
    super({
      code: ErrorCode.MESSAGE_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.MESSAGE_NOT_FOUND)}: ${identifier}`,
    });
  }
}

export class MissingAuthenticationException extends UnauthorizedException {
  constructor() {
    super({
      code: ErrorCode.MISSING_AUTHENTICATION,
      message: getErrorMessage(ErrorCode.MISSING_AUTHENTICATION),
    });
  }
}

export class MissingPermissionsException extends ForbiddenException {
  constructor(permissions?: string[]) {
    const message = permissions
      ? `${getErrorMessage(ErrorCode.MISSING_PERMISSIONS)}: ${permissions.join(', ')}`
      : getErrorMessage(ErrorCode.MISSING_PERMISSIONS);

    super({
      code: ErrorCode.MISSING_PERMISSIONS,
      message,
    });
  }
}

export class MissingRequiredFieldException extends BadRequestException {
  constructor(fieldName: string) {
    super({
      code: ErrorCode.MISSING_REQUIRED_FIELD,
      message: `${getErrorMessage(ErrorCode.MISSING_REQUIRED_FIELD)}: ${fieldName}`,
    });
  }
}

export class NotMemberOfServerException extends ForbiddenException {
  constructor() {
    super({
      code: ErrorCode.NOT_MEMBER_OF_SERVER,
      message: getErrorMessage(ErrorCode.NOT_MEMBER_OF_SERVER),
    });
  }
}

export class ProfileNotFoundException extends NotFoundException {
  constructor(userId: number) {
    super({
      code: ErrorCode.PROFILE_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.PROFILE_NOT_FOUND)} for user: ${userId}`,
    });
  }
}

export class RateLimitExceededException extends HttpException {
  constructor(retryAfter?: number) {
    super(
      {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: getErrorMessage(ErrorCode.RATE_LIMIT_EXCEEDED),
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

// ============================================================================
// 409 - Conflict
// ============================================================================

export class RefreshTokenInvalidException extends UnauthorizedException {
  constructor() {
    super({
      code: ErrorCode.INVALID_REFRESH_TOKEN,
      message: getErrorMessage(ErrorCode.INVALID_REFRESH_TOKEN),
    });
  }
}

export class RoleNotFoundException extends NotFoundException {
  constructor(identifier: number | string) {
    super({
      code: ErrorCode.ROLE_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.ROLE_NOT_FOUND)}: ${identifier}`,
    });
  }
}

export class ServerAccessDeniedException extends ForbiddenException {
  constructor() {
    super({
      code: ErrorCode.SERVER_ACCESS_DENIED,
      message: getErrorMessage(ErrorCode.SERVER_ACCESS_DENIED),
    });
  }
}

export class ServernameAlreadyExistsException extends ConflictException {
  constructor(servername: string) {
    super({
      code: ErrorCode.SERVERNAME_ALREADY_EXISTS,
      message: `${getErrorMessage(ErrorCode.SERVERNAME_ALREADY_EXISTS)}: ${servername}`,
    });
  }
}

export class ServerNotFoundException extends NotFoundException {
  constructor(identifier: number | string) {
    super({
      code: ErrorCode.SERVER_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.SERVER_NOT_FOUND)}: ${identifier}`,
    });
  }
}

export class TokenExpiredException extends UnauthorizedException {
  constructor() {
    super({
      code: ErrorCode.ACCESS_TOKEN_EXPIRED,
      message: getErrorMessage(ErrorCode.ACCESS_TOKEN_EXPIRED),
    });
  }
}

export class TooManyMessagesException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.TOO_MANY_MESSAGES,
        message: getErrorMessage(ErrorCode.TOO_MANY_MESSAGES),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

// ============================================================================
// 429 - Rate Limit
// ============================================================================

export class TooManyRequestsException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.TOO_MANY_REQUESTS,
        message: getErrorMessage(ErrorCode.TOO_MANY_REQUESTS),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class UserBlockedException extends ForbiddenException {
  constructor() {
    super({
      code: ErrorCode.USER_BLOCKED,
      message: getErrorMessage(ErrorCode.USER_BLOCKED),
    });
  }
}

export class UserMutedException extends ForbiddenException {
  constructor() {
    super({
      code: ErrorCode.USER_MUTED,
      message: getErrorMessage(ErrorCode.USER_MUTED),
    });
  }
}

// ============================================================================
// 500 - Internal Server Error
// ============================================================================

export class UsernameAlreadyExistsException extends ConflictException {
  constructor(username: string) {
    super({
      code: ErrorCode.USERNAME_ALREADY_EXISTS,
      message: `${getErrorMessage(ErrorCode.USERNAME_ALREADY_EXISTS)}: ${username}`,
    });
  }
}

export class UserNotFoundException extends NotFoundException {
  constructor(identifier: number | string) {
    super({
      code: ErrorCode.USER_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.USER_NOT_FOUND)}: ${identifier}`,
    });
  }
}

export class ValidationException extends KordException {
  constructor(errors?: Record<string, unknown>) {
    super(ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    if (errors) {
      this.getResponse()['errors'] = errors;
    }
  }
}
