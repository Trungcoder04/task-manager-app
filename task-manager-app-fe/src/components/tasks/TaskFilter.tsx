import React from 'react';
import { TaskFilterOptions } from '../../types/task.types';
import { Label } from '../../types/label.types';
import { User } from '../../types/user.types';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';

interface TaskFilterProps {
  filters: TaskFilterOptions;
  labels: Label[];
  members: User[];
  viewMode: 'board' | 'list';
  onChange: (filters: TaskFilterOptions) => void;
  onOpenLabelManager: () => void;
  onViewModeChange: (mode: 'board' | 'list') => void;
}

export const TaskFilter: React.FC<TaskFilterProps> = ({
  filters,
  labels,
  members,
  viewMode,
  onChange,
  onOpenLabelManager,
  onViewModeChange,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
    onChange({ ...filters, status: val as TaskFilterOptions['status'] });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
    onChange({ ...filters, priority: val as TaskFilterOptions['priority'] });
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
    onChange({ ...filters, assigneeId: val as TaskFilterOptions['assigneeId'] });
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
    onChange({ ...filters, labelId: val as TaskFilterOptions['labelId'] });
  };

  const hasActiveFilters =
    filters.search ||
    (filters.status !== undefined && filters.status !== 'ALL') ||
    filters.priority !== 'ALL' ||
    filters.assigneeId !== 'ALL' ||
    filters.labelId !== 'ALL';

  const resetFilters = () => {
    onChange({
      search: '',
      status: 'ALL',
      priority: 'ALL',
      assigneeId: 'ALL',
      labelId: 'ALL',
    });
  };

  return (
    <div className="board-toolbar">
      <div className="filter-bar">
        {/* Search input */}
        <div className="search-input-wrapper">
          <Icon name="search" size={16} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Tìm kiếm công việc..."
            value={filters.search || ''}
            onChange={handleSearchChange}
          />
        </div>

        {/* Status Filter */}
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filters.status ?? 'ALL'}
          onChange={handleStatusChange}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value={0}>Chờ duyệt</option>
          <option value={1}>Cần làm</option>
          <option value={2}>Đang làm</option>
          <option value={3}>Chờ nghiệm thu</option>
          <option value={4}>Hoàn thành</option>
          <option value={5}>Bị từ chối</option>
        </select>

        {/* Priority Filter */}
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filters.priority || 'ALL'}
          onChange={handlePriorityChange}
        >
          <option value="ALL">Độ ưu tiên</option>
          <option value={3}>Cao</option>
          <option value={2}>Trung bình</option>
          <option value={1}>Thấp</option>
        </select>

        {/* Assignee Filter */}
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filters.assigneeId || 'ALL'}
          onChange={handleAssigneeChange}
        >
          <option value="ALL">Người thực hiện</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </select>

        {/* Label Filter */}
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filters.labelId || 'ALL'}
          onChange={handleLabelChange}
        >
          <option value="ALL">Nhãn dán</option>
          {labels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Right Controls: Label Manager + View Switcher (Uniform position across all projects) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
        <Button
          variant="secondary"
          size="sm"
          icon="tag"
          onClick={onOpenLabelManager}
        >
          Quản lý Nhãn ({labels.length})
        </Button>

        {/* Unified View Switcher */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            backgroundColor: 'var(--bg-surface)',
            padding: '0.2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <button
            onClick={() => onViewModeChange('board')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: viewMode === 'board' ? 700 : 500,
              border: 'none',
              backgroundColor: viewMode === 'board' ? 'var(--primary-600)' : 'transparent',
              color: viewMode === 'board' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Icon name="kanban" size={14} color={viewMode === 'board' ? '#ffffff' : 'var(--text-secondary)'} />
            Bảng Kanban
          </button>

          <button
            onClick={() => onViewModeChange('list')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: viewMode === 'list' ? 700 : 500,
              border: 'none',
              backgroundColor: viewMode === 'list' ? 'var(--primary-600)' : 'transparent',
              color: viewMode === 'list' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Icon name="filter" size={14} color={viewMode === 'list' ? '#ffffff' : 'var(--text-secondary)'} />
            Danh sách
          </button>
        </div>
      </div>
    </div>
  );
};
