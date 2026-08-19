import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  code: number;
  message?: string;
  result?: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (
          data &&
          typeof data === 'object' &&
          'code' in data &&
          typeof (data as Record<string, unknown>).code === 'number'
        ) {
          return data as ApiResponse<T>;
        }

        const response: ApiResponse<T> = {
          code: 1000,
        };

        if (data !== undefined && data !== null) {
          response.result = data as T;
        }

        return response;
      }),
    );
  }
}
