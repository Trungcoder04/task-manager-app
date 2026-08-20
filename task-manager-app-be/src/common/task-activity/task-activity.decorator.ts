import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { AuthenticatedRequest } from '../type/authenticated.request';
import { TaskActivityInterceptor } from './task-activity.interceptor';

export const TASK_ACTIVITY_KEY = 'TASK_ACTIVITY_KEY';

export type ActionGenerator = (
  req: AuthenticatedRequest,
  result: any,
) => string | Promise<string>;

export type TaskIdExtractor = (
  req: AuthenticatedRequest,
  result: any,
) => number | undefined | Promise<number | undefined>;

export interface TaskActivityOptions {
  action: string | ActionGenerator;
  taskId?: number | TaskIdExtractor;
}

export function TaskActivity(optionsOrAction: string | TaskActivityOptions) {
  const options: TaskActivityOptions =
    typeof optionsOrAction === 'string'
      ? { action: optionsOrAction }
      : optionsOrAction;

  return applyDecorators(
    SetMetadata(TASK_ACTIVITY_KEY, options),
    UseInterceptors(TaskActivityInterceptor),
  );
}
