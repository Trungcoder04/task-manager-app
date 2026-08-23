import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Icon } from '../common/Icon';
import { ConfirmModal } from '../common/ConfirmModal';
import { Label, CreateLabelRequest } from '../../types/label.types';

interface LabelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  labels: Label[];
  onCreateLabel: (data: CreateLabelRequest) => Promise<unknown>;
  onDeleteLabel: (id: number) => Promise<void>;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#ec4899', // Pink
];

export const LabelManagerModal: React.FC<LabelManagerModalProps> = ({
  isOpen,
  onClose,
  projectId,
  labels,
  onCreateLabel,
  onDeleteLabel,
}) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [deletingLabel, setDeletingLabel] = useState<Label | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await onCreateLabel({
        projectId,
        name: name.trim().toUpperCase(),
        colorCode: selectedColor,
      });
      setName('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quản lý Nhãn (Labels / Tags)"
      maxWidth="480px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Create Label Form */}
        <form
          onSubmit={handleCreate}
          style={{
            background: 'var(--bg-surface-secondary)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Tạo nhãn dán mới</span>
          <input
            type="text"
            className="form-input"
            placeholder="Tên nhãn (Ví dụ: BUG, BACKEND, URGENT)..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
          />

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
              Chọn màu sắc:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: color,
                    border: selectedColor === color ? '2px solid white' : 'none',
                    outline: selectedColor === color ? `2px solid ${color}` : 'none',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon="plus"
              disabled={!name.trim() || isLoading}
              isLoading={isLoading}
            >
              Thêm nhãn
            </Button>
          </div>
        </form>

        {/* Existing Labels List */}
        <div>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '0.75rem' }}>
            Danh sách nhãn hiện tại ({labels.length})
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {labels.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '1rem' }}>
                Chưa có nhãn nào được tạo cho dự án này.
              </div>
            ) : (
              labels.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.875rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span
                    className="label-chip"
                    style={{
                      backgroundColor: `${l.colorCode || '#6366f1'}1f`,
                      color: l.colorCode || '#6366f1',
                      border: `1px solid ${l.colorCode || '#6366f1'}4d`,
                    }}
                  >
                    {l.name}
                  </span>

                  <button
                    className="btn btn-ghost btn-icon"
                    style={{ color: 'var(--priority-high)' }}
                    onClick={() => setDeletingLabel(l)}
                    title="Xóa nhãn"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deletingLabel !== null}
        onClose={() => setDeletingLabel(null)}
        onConfirm={async () => {
          if (deletingLabel) {
            await onDeleteLabel(deletingLabel.id);
          }
        }}
        title="Xóa nhãn dán"
        message={`Bạn có chắc chắn muốn xóa nhãn "${deletingLabel?.name}"? Nhãn này sẽ bị gỡ khỏi tất cả các công việc liên quan.`}
        confirmText="Xóa nhãn"
      />
    </Modal>
  );
};
