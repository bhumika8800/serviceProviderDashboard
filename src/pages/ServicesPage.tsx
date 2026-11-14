import { useMemo, useState, type FormEvent } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Star,
  Tags,
  Wrench,
} from 'lucide-react';
import {
  deactivateService,
  listCategories,
  listServices,
  updateService,
} from '../api/services';
import { PageHeader, LoadingState, ErrorState, EmptyState, Spinner } from '../components/Feedback';
import { Pagination } from '../components/Pagination';
import { ActiveBadge } from '../components/StatusBadge';
import { ServiceFormModal } from '../components/ServiceFormModal';
import { CategoryManagerModal } from '../components/CategoryManagerModal';
import { useToast } from '../components/Toast';
import { getErrorMessage } from '../lib/api';
import { formatCurrency } from '../lib/format';
import type { Service } from '../types';

export function ServicesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [visibility, setVisibility] = useState<'active' | 'all'>('active');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const queryClient = useQueryClient();
  const toast = useToast();

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => (await listCategories(true)).data,
  });

  const servicesQuery = useQuery({
    queryKey: ['services', { q, categoryId, visibility, page }],
    queryFn: async () =>
      listServices({
        q: q || undefined,
        categoryId: categoryId || undefined,
        includeInactive: visibility === 'all',
        page,
        limit: 10,
      }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['services'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateService(id, { isActive }),
    onSuccess: (response, variables) => {
      toast.push(
        `${response.data.name} ${variables.isActive ? 'activated' : 'deactivated'}.`,
      );
      invalidate();
    },
    onError: (error) => toast.push(getErrorMessage(error), 'error'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateService(id),
    onSuccess: (response) => {
      toast.push(`${response.data.name} deactivated.`);
      invalidate();
    },
    onError: (error) => toast.push(getErrorMessage(error), 'error'),
  });

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const categoryNames = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => map.set(category.id, category.name));
    return map;
  }, [categories]);

  const services = servicesQuery.data?.data ?? [];
  const pagination = servicesQuery.data?.pagination;

  const openCreate = () => {
    setEditingService(null);
    setFormOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setFormOpen(true);
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setQ(searchInput.trim());
    setPage(1);
  };

  const handleDeactivate = (service: Service) => {
    if (
      window.confirm(
        `Deactivate “${service.name}”? It will no longer appear in the customer app.`,
      )
    ) {
      deactivateMutation.mutate(service.id);
    }
  };

  const resetFilters = () => {
    setSearchInput('');
    setQ('');
    setCategoryId('');
    setVisibility('active');
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Services"
        subtitle="Manage the catalogue, pricing, and availability of every service."
        actions={
          <>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setCategoriesOpen(true)}
            >
              <Tags size={16} />
              Categories
            </button>
            <button type="button" className="button button-primary" onClick={openCreate}>
              <Plus size={17} />
              Add service
            </button>
          </>
        }
      />

      <section className="card">
        <div className="toolbar">
          <form className="search-field" onSubmit={handleSearch}>
            <Search size={16} />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search services by name or description…"
            />
            <button type="submit" className="button button-secondary button-sm">
              Search
            </button>
          </form>

          <div className="toolbar-controls">
            <select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={visibility}
              onChange={(event) => {
                setVisibility(event.target.value as 'active' | 'all');
                setPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="active">Active only</option>
              <option value="all">Include inactive</option>
            </select>
            <button
              type="button"
              className="icon-button"
              onClick={() => servicesQuery.refetch()}
              disabled={servicesQuery.isFetching}
              title="Refresh services"
            >
              <RefreshCw
                size={16}
                className={servicesQuery.isFetching ? 'spin' : undefined}
              />
            </button>
          </div>
        </div>

        {servicesQuery.isLoading ? (
          <LoadingState label="Loading services…" />
        ) : servicesQuery.isError ? (
          <ErrorState
            message={getErrorMessage(servicesQuery.error)}
            onRetry={() => servicesQuery.refetch()}
          />
        ) : services.length === 0 ? (
          <EmptyState
            title="No services found"
            description={
              q || categoryId || visibility === 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Add your first service to start accepting bookings.'
            }
            action={
              q || categoryId || visibility === 'all' ? (
                <button
                  type="button"
                  className="button button-secondary button-sm"
                  onClick={resetFilters}
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  className="button button-primary button-sm"
                  onClick={openCreate}
                >
                  <Plus size={15} /> Add service
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Duration</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => {
                    const busy =
                      (toggleMutation.isPending &&
                        toggleMutation.variables?.id === service.id) ||
                      (deactivateMutation.isPending &&
                        deactivateMutation.variables === service.id);
                    return (
                      <tr key={service.id}>
                        <td>
                          <div className="service-cell">
                            {service.images?.[0] ? (
                              <img
                                src={service.images[0]}
                                alt=""
                                className="service-thumb"
                                loading="lazy"
                              />
                            ) : (
                              <span className="service-thumb service-thumb-empty">
                                <Wrench size={16} />
                              </span>
                            )}
                            <div>
                              <strong>{service.name}</strong>
                              <span className="cell-sub">
                                {service.tags?.length
                                  ? service.tags.slice(0, 3).join(' · ')
                                  : 'No tags'}
                                {service.tags?.length > 3
                                  ? ` +${service.tags.length - 3}`
                                  : ''}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>{categoryNames.get(service.categoryId) ?? '—'}</td>
                        <td>{formatCurrency(service.price)}</td>
                        <td>{service.durationMins} mins</td>
                        <td>
                          <span className="rating-cell">
                            <Star size={13} />
                            {service.avgRating.toFixed(1)}
                            <em>({service.reviewCount})</em>
                          </span>
                        </td>
                        <td>
                          <ActiveBadge active={service.isActive} />
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => openEdit(service)}
                              title="Edit service"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className={`button button-xs ${
                                service.isActive
                                  ? 'button-ghost button-danger'
                                  : 'button-secondary'
                              }`}
                              disabled={busy}
                              onClick={() =>
                                service.isActive
                                  ? handleDeactivate(service)
                                  : toggleMutation.mutate({
                                      id: service.id,
                                      isActive: true,
                                    })
                              }
                            >
                              {busy ? <Spinner size={13} /> : <Power size={13} />}
                              {service.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pagination && (
              <Pagination pagination={pagination} onPageChange={setPage} />
            )}
          </>
        )}
      </section>

      <ServiceFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        service={editingService}
        categories={categories}
      />

      <CategoryManagerModal
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        categories={categories}
      />
    </>
  );
}
