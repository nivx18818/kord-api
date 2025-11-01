import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { ErrorCode } from '../constants/error-codes';

interface WsErrorResponse {
  code: number;
  event: 'error';
  message: string;
}

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    let errorResponse: WsErrorResponse = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      event: 'error',
      message: 'An unexpected error occurred',
    };

    if (exception instanceof WsException) {
      const error = exception.getError();

      if (typeof error === 'object' && error !== null) {
        if ('code' in error && 'message' in error) {
          errorResponse = {
            ...error,
            event: 'error',
          } as WsErrorResponse;
        } else if ('message' in error) {
          errorResponse = {
            code: ErrorCode.VALIDATION_ERROR,
            event: 'error',
            message: String(error.message),
          };
        }
      } else if (typeof error === 'string') {
        errorResponse = {
          code: ErrorCode.VALIDATION_ERROR,
          event: 'error',
          message: error,
        };
      }
    } else if (exception instanceof Error) {
      console.error('WebSocket error:', exception);

      errorResponse = {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        event: 'error',
        message:
          process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : exception.message,
      };
    }

    client.emit('error', errorResponse);
  }
}
