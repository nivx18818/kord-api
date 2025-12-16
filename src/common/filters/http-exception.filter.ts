import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from 'generated/prisma';

import { ErrorCode } from '../constants/error-codes';

interface ErrorResponse {
  code: number;
  errors?: Record<string, unknown> | unknown[];
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
    };

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        if ('code' in exceptionResponse && 'message' in exceptionResponse) {
          errorResponse = exceptionResponse as ErrorResponse;
        } else if ('message' in exceptionResponse) {
          const message = exceptionResponse.message;

          if (Array.isArray(message)) {
            errorResponse = {
              code: ErrorCode.VALIDATION_ERROR,
              errors: this.transformValidationErrors(message),
              message: 'Validation failed',
            };
          } else if (typeof message === 'string') {
            errorResponse = {
              code: this.getErrorCodeFromStatus(statusCode),
              message,
            };
          }
        }
      } else if (typeof exceptionResponse === 'string') {
        errorResponse = {
          code: this.getErrorCodeFromStatus(statusCode),
          message: exceptionResponse,
        };
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      statusCode = prismaError.statusCode;
      errorResponse = {
        code: prismaError.code,
        message: prismaError.message,
      };
    } else if (exception instanceof Error) {
      console.error('Unexpected error:', exception);

      errorResponse = {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message:
          process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : exception.message,
      };
    }

    response.status(statusCode).json(errorResponse);
  }

  private getErrorCodeFromStatus(status: HttpStatus): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.CONFLICT:
        return ErrorCode.EMAIL_ALREADY_EXISTS;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.USER_NOT_FOUND;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }

  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
    code: ErrorCode;
    message: string;
    statusCode: HttpStatus;
  } {
    switch (error.code) {
      case 'P1001':
      case 'P1002':
        return {
          code: ErrorCode.DATABASE_ERROR,
          message: 'Database connection failed',
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        };

      case 'P2002': {
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || 'Field';

        let code: ErrorCode;
        let message: string;

        if (field === 'email') {
          code = ErrorCode.EMAIL_ALREADY_EXISTS;
          message = 'Email already registered';
        } else if (field === 'username') {
          code = ErrorCode.USERNAME_ALREADY_EXISTS;
          message = 'Username already taken';
        } else if (field === 'servername') {
          code = ErrorCode.SERVERNAME_ALREADY_EXISTS;
          message = 'Server name already taken';
        } else {
          code = ErrorCode.VALIDATION_ERROR;
          message = `${field} already exists`;
        }

        return {
          code,
          message,
          statusCode: HttpStatus.CONFLICT,
        };
      }

      // Foreign key constraint failed
      case 'P2003':
        return {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid reference to related resource',
          statusCode: HttpStatus.BAD_REQUEST,
        };

      case 'P2025':
        return {
          code: ErrorCode.USER_NOT_FOUND,
          message: 'Resource not found',
          statusCode: HttpStatus.NOT_FOUND,
        };

      default:
        console.error('Unhandled Prisma error:', error);
        return {
          code: ErrorCode.DATABASE_ERROR,
          message: 'Database operation failed',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
    }
  }

  private transformValidationErrors(
    errors: unknown[],
  ): Record<string, unknown[]> {
    const transformed: Record<string, unknown[]> = {};

    for (const error of errors) {
      if (typeof error === 'object' && error !== null && 'property' in error) {
        const field = (error as { property: string }).property;
        const constraints = (error as { constraints?: Record<string, string> })
          .constraints;

        if (constraints) {
          transformed[field] = Object.entries(constraints).map(
            ([code, message]) => ({
              code: code.toUpperCase(),
              message,
            }),
          );
        }
      }
    }

    return transformed;
  }
}
