import { HttpException } from '@nestjs/common';
import { ErrorCodeDetail } from './error-code.enum';

export class AppException extends HttpException {
  constructor(
    public readonly errorCode: ErrorCodeDetail,
    customMessage?: string,
  ) {
    super(
      {
        code: errorCode.code,
        message: customMessage || errorCode.message,
      },
      errorCode.statusCode,
    );
  }
}
