import React from 'react';
import { Task } from '../../types/task.types';

interface PriorityChartProps {
  tasks: Task[];
}

export const PriorityChart: React.FC<PriorityChartProps> = ({ tasks }) => {
  const total = tasks.length || 1;
  const high = tasks.filter((t) => t.priority === 3).length;
  const medium = tasks.filter((t) => t.priority === 2).length;
  const low = tasks.filter((t) => t.priority === 1).length;

  const highPct = Math.round((high / total) * 100);
  const mediumPct = Math.round((medium / total) * 100);
  const lowPct = Math.round((low / total) * 100);

  return (
    <div className="dashboard-panel">
      <div className="panel-header">
        <h3 className="panel-title">Phân bổ Mức độ Ưu tiên</h3>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Tổng: {tasks.length} Tasks
        </span>
      </div>

      <div className="priority-bar-wrap">
        <div className="priority-bar-item">
          <div className="priority-bar-labels">
            <span style={{ color: 'var(--priority-high)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              🔴 Ưu tiên Cao (High)
            </span>
            <span>{high} ({highPct}%)</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${highPct}%`, background: 'var(--priority-high)' }}
            />
          </div>
        </div>

        <div className="priority-bar-item">
          <div className="priority-bar-labels">
            <span style={{ color: 'var(--priority-medium)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              🟡 Ưu tiên Trung bình (Medium)
            </span>
            <span>{medium} ({mediumPct}%)</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${mediumPct}%`, background: 'var(--priority-medium)' }}
            />
          </div>
        </div>

        <div className="priority-bar-item">
          <div className="priority-bar-labels">
            <span style={{ color: 'var(--priority-low)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              🟢 Ưu tiên Thấp (Low)
            </span>
            <span>{low} ({lowPct}%)</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${lowPct}%`, background: 'var(--priority-low)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
