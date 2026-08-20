import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TASK_ACTIVITY_KEY,
  TaskActivityOptions,
} from './task-activity.decorator';
import { AuthenticatedRequest } from '../type/authenticated.request';

@Injectable()
export class TaskActivityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TaskActivityInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<TaskActivityOptions>(
      TASK_ACTIVITY_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return next.handle().pipe(
      tap({
        next: async (result) => {
          try {
            await this.logActivity(request, result, options);
          } catch (error) {
            this.logger.error('Failed to log task activity:', error);
          }
        },
      }),
    );
  }

  private async logActivity(
    request: AuthenticatedRequest,
    result: any,
    options: TaskActivityOptions,
  ) {
    const userId = request.user?.id;
    if (!userId) {
      this.logger.warn(
        'Cannot log task activity: User is not authenticated in request',
      );
      return;
    }

    let taskId: number | undefined;

    if (typeof options.taskId === 'function') {
      taskId = await options.taskId(request, result);
    } else if (typeof options.taskId === 'number') {
      taskId = options.taskId;
    } else {
      // Auto-extract taskId from request params, query, body, or handler result
      const rawTaskId =
        request.params?.taskId ??
        request.params?.id ??
        request.body?.taskId ??
        request.query?.taskId ??
        result?.taskId ??
        result?.id ??
        result?.result?.taskId ??
        result?.result?.id;

      if (rawTaskId !== undefined && rawTaskId !== null) {
        taskId = Number(rawTaskId);
      }
    }

    if (!taskId || isNaN(taskId)) {
      this.logger.warn(
        `Cannot log task activity: taskId could not be resolved for action "${
          typeof options.action === 'string' ? options.action : 'dynamic'
        }"`,
      );
      return;
    }

    let action: string;
    if (typeof options.action === 'function') {
      action = await options.action(request, result);
    } else {
      action = options.action;
    }

    if (!action) {
      return;
    }

    await this.prisma.taskActivity.create({
      data: {
        taskId,
        userId,
        action,
      },
    });
  }
}
