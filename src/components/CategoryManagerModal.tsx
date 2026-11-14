import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tags } from 'lucide-react';
import { Modal } from './Modal';
import { ActiveBadge } from './StatusBadge';
import { Spinner } from './Feedback';
import { useToast } from './Toast';
import { createCategory } from '../api/services';
import { getErrorMessage } from '../lib/api';
import type { Category } from '../types';

interface CategoryManagerModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}

export function CategoryManagerModal({
  open,
  onClose,
  categories,
}: CategoryManagerModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: (value: string) => createCategory(value),
    onSuccess: () => {
      toast.push('Category created.');
      setName('');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (mutationError) => {
      const message = getErrorMessage(mutationError);
      setError(message);
      toast.push(message, 'error');
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Enter a category name.');
      return;
    }
    mutation.mutate(name.trim());
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Categories"
      subtitle="Categories organise services in the customer app."
      footer={
        <button type="button" className="button button-secondary" onClick={onClose}>
          Done
        </button>
      }
    >
      <form className="category-create" onSubmit={handleSubmit}>
        <label className="field">
          <span>New category</span>
          <div className="input-button-row">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Home Cleaning"
            />
            <button
              type="submit"
              className="button button-primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Spinner size={16} /> : <Plus size={16} />}
              Add
            </button>
          </div>
        </label>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
      </form>

      {categories.length === 0 ? (
        <div className="category-empty">
          <Tags size={20} />
          <span>No categories yet. Create one above to get started.</span>
        </div>
      ) : (
        <ul className="category-list">
          {categories.map((category) => (
            <li key={category.id}>
              <span>
                <Tags size={15} />
                {category.name}
              </span>
              <ActiveBadge active={category.isActive} />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
