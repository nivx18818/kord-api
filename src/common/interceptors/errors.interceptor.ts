import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error) => {
        // Handle specific error types
        if (error instanceof UnauthorizedException) {
          return throwError(
            () =>
              new UnauthorizedException({
                error: 'Unauthorized',
                message: error.message || 'Authentication required',
                statusCode: 401,
              }),
          );
        }

        if (error instanceof ForbiddenException) {
          return throwError(
            () =>
              new ForbiddenException({
                error: 'Forbidden',
                message: error.message || 'Access denied',
                statusCode: 403,
              }),
          );
        }

        // Re-throw HttpExceptions as-is
        if (error instanceof HttpException) {
          return throwError(() => error);
        }

        // Handle unexpected errors
        return throwError(
          () =>
            new HttpException(
              {
                error: 'Internal Server Error',
                message: 'An unexpected error occurred',
                statusCode: 500,
              },
              500,
            ),
        );
      }),
    );
  }
}
