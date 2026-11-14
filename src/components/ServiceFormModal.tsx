import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { Modal } from './Modal';
import { Spinner } from './Feedback';
import { useToast } from './Toast';
import { createService, updateService } from '../api/services';
import { getErrorMessage } from '../lib/api';
import type { Category, Service } from '../types';

interface ServiceFormModalProps {
  open: boolean;
  onClose: () => void;
  service: Service | null;
  categories: Category[];
}

interface FormState {
  categoryId: string;
  name: string;
  description: string;
  price: string;
  durationMins: string;
  images: string;
  tags: string;
  isActive: boolean;
}

const emptyForm: FormState = {
  categoryId: '',
  name: '',
  description: '',
  price: '',
  durationMins: '60',
  images: '',
  tags: '',
  isActive: true,
};

export function ServiceFormModal({
  open,
  onClose,
  service,
  categories,
}: ServiceFormModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (service) {
      setForm({
        categoryId: service.categoryId,
        name: service.name,
        description: service.description,
        price: String(service.price),
        durationMins: String(service.durationMins),
        images: (service.images || []).join('\n'),
        tags: (service.tags || []).join(', '),
        isActive: service.isActive,
      });
    } else {
      setForm({
        ...emptyForm,
        categoryId:
          categories.find((category) => category.isActive)?.id ??
          categories[0]?.id ??
          '',
      });
    }
  }, [open, service, categories]);

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof createService>[0]) =>
      service ? updateService(service.id, payload) : createService(payload),
    onSuccess: () => {
      toast.push(service ? 'Service updated.' : 'Service created.');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      onClose();
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

    if (!form.categoryId) {
      setError('Choose a category for this service.');
      return;
    }
    if (!form.name.trim() || !form.description.trim()) {
      setError('Name and description are required.');
      return;
    }
    const price = Number(form.price);
    const durationMins = Number(form.durationMins);
    if (Number.isNaN(price) || price < 0) {
      setError('Price must be a valid non-negative number.');
      return;
    }
    if (!Number.isInteger(durationMins) || durationMins < 1) {
      setError('Duration must be a whole number of at least 1 minute.');
      return;
    }

    mutation.mutate({
      categoryId: form.categoryId,
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      durationMins,
      images: form.images
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      ...(service ? { isActive: form.isActive } : {}),
    });
  };

  const activeCategories = categories.filter(
    (category) => category.isActive || category.id === service?.categoryId,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={service ? 'Edit service' : 'Add service'}
      subtitle={
        service
          ? 'Update pricing, details, and availability.'
          : 'Create a new offering for customers to book.'
      }
      size="lg"
      footer={
        <>
          <button type="button" className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="service-form"
            className="button button-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Spinner size={16} /> : <Save size={16} />}
            {service ? 'Save changes' : 'Create service'}
          </button>
        </>
      }
    >
      <form id="service-form" onSubmit={handleSubmit} className="form-stack">
        <div className="form-grid">
          <label className="field">
            <span>Category</span>
            <select
              value={form.categoryId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  categoryId: event.target.value,
                }))
              }
              required
            >
              <option value="">Select a category</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {!category.isActive ? ' (inactive)' : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Service name</span>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="e.g. Deep home cleaning"
              required
            />
          </label>
        </div>

        <label className="field">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            rows={3}
            placeholder="Describe what is included in this service…"
            required
          />
        </label>

        <div className="form-grid">
          <label className="field">
            <span>Price (INR)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({ ...current, price: event.target.value }))
              }
              placeholder="499"
              required
            />
          </label>
          <label className="field">
            <span>Duration (minutes)</span>
            <input
              type="number"
              min={1}
              step={1}
              value={form.durationMins}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  durationMins: event.target.value,
                }))
              }
              required
            />
          </label>
        </div>

        <label className="field">
          <span>Image URLs</span>
          <textarea
            value={form.images}
            onChange={(event) =>
              setForm((current) => ({ ...current, images: event.target.value }))
            }
            rows={2}
            placeholder="One image URL per line (optional)"
          />
        </label>

        <label className="field">
          <span>Tags</span>
          <input
            value={form.tags}
            onChange={(event) =>
              setForm((current) => ({ ...current, tags: event.target.value }))
            }
            placeholder="cleaning, home, deep (comma separated)"
          />
        </label>

        {service && (
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            Service is active and bookable
          </label>
        )}

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
