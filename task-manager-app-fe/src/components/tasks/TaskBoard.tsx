import React from 'react';
import { Task, TaskStatusType } from '../../types/task.types';
import { TaskColumn } from './TaskColumn';

interface TaskBoardProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onMoveTask: (taskId: number, newStatus: TaskStatusType) => void;
  onQuickAdd: (status: TaskStatusType) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onSelectTask,
  onMoveTask,
  onQuickAdd,
}) => {
  const todoTasks = tasks.filter((t) => t.status === 1);
  const doingTasks = tasks.filter((t) => t.status === 2);
  const doneTasks = tasks.filter((t) => t.status === 3);

  return (
    <div className="kanban-grid">
      <TaskColumn
        title="TODO"
        status={1}
        tasks={todoTasks}
        onSelectTask={onSelectTask}
        onDropTask={onMoveTask}
        onQuickAdd={onQuickAdd}
      />
      <TaskColumn
        title="DOING"
        status={2}
        tasks={doingTasks}
        onSelectTask={onSelectTask}
        onDropTask={onMoveTask}
        onQuickAdd={onQuickAdd}
      />
      <TaskColumn
        title="DONE"
        status={3}
        tasks={doneTasks}
        onSelectTask={onSelectTask}
        onDropTask={onMoveTask}
        onQuickAdd={onQuickAdd}
      />
    </div>
  );
};
