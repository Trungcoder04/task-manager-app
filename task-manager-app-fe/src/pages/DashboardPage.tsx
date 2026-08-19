import React from 'react';
import { Project } from '../types/project.types';
import { Task } from '../types/task.types';
import { StatCard } from '../components/dashboard/StatCard';
import { PriorityChart } from '../components/dashboard/PriorityChart';
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks';
import { RecentActivities } from '../components/dashboard/RecentActivities';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';

interface DashboardPageProps {
  project: Project | null;
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  onSelectTask: (task: Task) => void;
  onGoToBoard: () => void;
  onGoToProjects: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  project,
  tasks,
  isLoading,
  error,
  onSelectTask,
  onGoToBoard,
  onGoToProjects,
}) => {
  // 1. Loading State
  if (isLoading) {
    return <LoadingSpinner text="Đang tải dữ liệu tổng quan..." />;
  }

  // 2. Error State
  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--priority-high)', marginBottom: '1rem', fontWeight: 600 }}>
          {error}
        </div>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Thử lại
        </Button>
      </div>
    );
  }

  // 3. Empty State (No Project Selected)
  if (!project) {
    return (
      <EmptyState
        icon="folder"
        title="Chưa chọn Dự án"
        description="Hãy chọn hoặc tạo một dự án mới để xem báo cáo thống kê."
        action={
          <Button variant="primary" icon="plus" onClick={onGoToProjects}>
            Tạo dự án mới
          </Button>
        }
      />
    );
  }

  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((t) => t.status === 1).length;
  const doingTasks = tasks.filter((t) => t.status === 2).length;
  const doneTasks = tasks.filter((t) => t.status === 3).length;

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="dashboard-page">
      {/* Page Title & Project Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            Dashboard: {project.name}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Theo dõi tiến độ, phân bổ công việc và hoạt động của nhóm trong dự án.
          </p>
        </div>

        <Button variant="primary" icon="kanban" onClick={onGoToBoard}>
          Xem Bảng Kanban
        </Button>
      </div>

      {/* Stats Cards Row */}
      <div className="stats-grid">
        <StatCard
          title="Tổng số Tasks"
          value={totalTasks}
          icon="kanban"
          color="var(--primary-500)"
          bgColor="var(--primary-50)"
        />
        <StatCard
          title="Cần thực hiện (TODO)"
          value={todoTasks}
          icon="clock"
          color="var(--status-todo)"
          bgColor="var(--bg-surface-secondary)"
        />
        <StatCard
          title="Đang làm (DOING)"
          value={doingTasks}
          icon="edit"
          color="var(--status-doing)"
          bgColor="rgba(59, 130, 246, 0.12)"
        />
        <StatCard
          title="Đã hoàn thành (DONE)"
          value={doneTasks}
          icon="check"
          color="var(--status-done)"
          bgColor="rgba(16, 185, 129, 0.12)"
        />
      </div>

      {/* Progress Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08))',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700 }}>
            <span>Tiến độ hoàn thành dự án</span>
            <span>{completionRate}%</span>
          </div>
          <div className="progress-track" style={{ height: '0.625rem' }}>
            <div
              className="progress-fill"
              style={{
                width: `${completionRate}%`,
                background: 'linear-gradient(90deg, var(--primary-500), var(--accent-emerald))',
              }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Columns: Priority + Upcoming Deadlines */}
      <div className="dashboard-details-grid">
        <PriorityChart tasks={tasks} />
        <UpcomingTasks tasks={tasks} onSelectTask={onSelectTask} />
      </div>

      {/* Recent Activities Feed */}
      <RecentActivities tasks={tasks} />
    </div>
  );
};
