import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { ErrorCode } from './common/constants/error-codes';
import { getValidationCode } from './common/constants/validation-codes';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        const formattedErrors: Record<
          string,
          Array<{ code: string; message: string }>
        > = {};

        errors.forEach((error) => {
          const fieldErrors: Array<{ code: string; message: string }> = [];

          if (error.constraints) {
            Object.entries(error.constraints).forEach(
              ([constraintKey, message]) => {
                fieldErrors.push({
                  code: getValidationCode(constraintKey),
                  message: message,
                });
              },
            );
          }

          formattedErrors[error.property] = fieldErrors;
        });

        return new BadRequestException({
          code: ErrorCode.VALIDATION_ERROR,
          errors: formattedErrors,
          message: 'Validation failed',
        });
      },
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
