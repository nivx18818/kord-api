import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from 'generated/prisma';

import { ErrorCode } from '@/common/constants/error-codes';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    const mockRequest = {
      method: 'POST',
      url: '/api/test',
    };

    mockHost = {
      getType: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('HttpException handling', () => {
    it('should handle HttpException with custom error response', () => {
      const exception = new HttpException(
        {
          code: ErrorCode.USER_NOT_FOUND,
          message: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    });

    it('should handle HttpException with validation errors array', () => {
      const exception = new HttpException(
        {
          message: [
            {
              constraints: {
                isEmail: 'email must be an email',
              },
              property: 'email',
            },
          ],
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: ErrorCode.VALIDATION_ERROR,
        errors: {
          email: [
            {
              code: 'ISEMAIL',
              message: 'email must be an email',
            },
          ],
        },
        message: 'Validation failed',
      });
    });

    it('should handle HttpException with string message', () => {
      const exception = new HttpException(
        'Bad request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Bad request',
      });
    });
  });

  describe('Prisma error handling', () => {
    it('should handle P2002 unique constraint for email', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2002',
          meta: { target: ['email'] },
        },
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: ErrorCode.EMAIL_ALREADY_EXISTS,
        message: 'Email already registered',
      });
    });

    it('should handle P2002 unique constraint for username', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2002',
          meta: { target: ['username'] },
        },
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: ErrorCode.USERNAME_ALREADY_EXISTS,
        message: 'Username already taken',
      });
    });

    it('should handle P2002 unique constraint for servername', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2002',
          meta: { target: ['servername'] },
        },
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: ErrorCode.SERVERNAME_ALREADY_EXISTS,
        message: 'Server name already taken',
      });
    });

    it('should handle P2025 record not found', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          clientVersion: '5.0.0',
          code: 'P2025',
        },
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'Resource not found',
      });
    });

    it('should handle P2003 foreign key constraint', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2003',
        },
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid reference to related resource',
      });
    });

    it('should handle database connection errors', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Connection failed',
        {
          clientVersion: '5.0.0',
          code: 'P1001',
        },
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database connection failed',
      });
    });
  });

  describe('Generic error handling', () => {
    it('should handle generic Error instance', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const exception = new Error('Something went wrong');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Something went wrong',
      });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should hide error message in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const exception = new Error('Internal error details');

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
      });

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });
});
