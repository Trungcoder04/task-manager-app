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
  onChange: (filters: TaskFilterOptions) => void;
  onOpenLabelManager: () => void;
}

export const TaskFilter: React.FC<TaskFilterProps> = ({
  filters,
  labels,
  members,
  onChange,
  onOpenLabelManager,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
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

        {/* Priority Filter */}
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filters.priority || 'ALL'}
          onChange={handlePriorityChange}
        >
          <option value="ALL">Độ ưu tiên</option>
          <option value={3}>🔴 Cao</option>
          <option value={2}>🟡 Trung bình</option>
          <option value={1}>🟢 Thấp</option>
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
              👤 {m.fullName}
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
              🏷️ {l.name}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <Button
        variant="secondary"
        size="sm"
        icon="tag"
        onClick={onOpenLabelManager}
      >
        Quản lý Nhãn ({labels.length})
      </Button>
    </div>
  );
};
