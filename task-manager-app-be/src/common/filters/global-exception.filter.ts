import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode, ErrorCodeKey } from '../errors/error-code.enum';
import { AppException } from '../errors/app.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let code: number = ErrorCode.UNCATEGORIZED_EXCEPTION.code;
    let message: string = ErrorCode.UNCATEGORIZED_EXCEPTION.message;
    let statusCode = HttpStatus.BAD_REQUEST;

    if (exception instanceof AppException) {
      const errResponse = exception.getResponse() as {
        code: number;
        message: string;
      };
      code = errResponse.code;
      message = errResponse.message;
      statusCode = exception.getStatus();
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (
        exception instanceof BadRequestException &&
        typeof res === 'object' &&
        res !== null &&
        'message' in res
      ) {
        const resObj = res as Record<string, unknown>;
        const validationMessages = resObj.message;
        const firstMessage = Array.isArray(validationMessages)
          ? String(validationMessages[0])
          : String(validationMessages);

        let enumKey = firstMessage;
        let dynamicMin: string | null = null;

        if (firstMessage && firstMessage.includes(':')) {
          const parts = firstMessage.split(':');
          enumKey = parts[0];
          dynamicMin = parts[1];
        }

        // Check if the validation message is one of our ErrorCode keys
        if (enumKey in ErrorCode) {
          const key = enumKey as ErrorCodeKey;
          const errorDetail = ErrorCode[key];
          code = errorDetail.code;
          message = errorDetail.message;
          statusCode = errorDetail.statusCode;

          // Map attributes like {min} dynamically
          if (dynamicMin !== null) {
            message = message.replace('{min}', dynamicMin);
          } else {
            // fallback defaults
            if (key === 'USERNAME_INVALID') {
              message = message.replace('{min}', '4');
            } else if (key === 'INVALID_PASSWORD') {
              message = message.replace('{min}', '6');
            }
          }
        } else {
          // Default validation error code (INVALID_KEY)
          code = ErrorCode.INVALID_KEY.code;
          message = firstMessage || ErrorCode.INVALID_KEY.message;
          statusCode = ErrorCode.INVALID_KEY.statusCode;
        }
      } else {
        // Map other HTTP exceptions to standard ErrorCodes
        if (statusCode === HttpStatus.UNAUTHORIZED) {
          code = ErrorCode.UNAUTHENTICATED.code;
          message = ErrorCode.UNAUTHENTICATED.message;
        } else if (statusCode === HttpStatus.FORBIDDEN) {
          code = ErrorCode.UNAUTHORIZED.code;
          message = ErrorCode.UNAUTHORIZED.message;
        } else if (statusCode === HttpStatus.NOT_FOUND) {
          code = ErrorCode.USER_NOT_EXISTED.code;
          message = ErrorCode.USER_NOT_EXISTED.message;
        } else {
          code = ErrorCode.UNCATEGORIZED_EXCEPTION.code;
          let resMessage = '';
          if (typeof res === 'string') {
            resMessage = res;
          } else if (res && typeof res === 'object' && 'message' in res) {
            resMessage = String((res as Record<string, unknown>).message);
          }
          message =
            resMessage ||
            exception.message ||
            ErrorCode.UNCATEGORIZED_EXCEPTION.message;
        }
      }
    } else {
      console.error(exception);
      statusCode = HttpStatus.BAD_REQUEST;
      code = ErrorCode.UNCATEGORIZED_EXCEPTION.code;
      message = ErrorCode.UNCATEGORIZED_EXCEPTION.message;
    }

    response.status(statusCode).json({
      code,
      message,
    });
  }
}
