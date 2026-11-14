import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarPlus,
  Eye,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { listAdminBookings } from '../api/admin';
import { updateBookingStatus } from '../api/bookings';
import { PageHeader, LoadingState, ErrorState, EmptyState, Spinner } from '../components/Feedback';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { getErrorMessage } from '../lib/api';
import {
  formatCurrency,
  formatDateTime,
  nextStatus,
  nextStatusLabels,
  shortId,
  statusLabels,
  statusOrder,
} from '../lib/format';
import type { Booking, BookingStatus } from '../types';

const filters: Array<{ value: '' | BookingStatus; label: string }> = [
  { value: '', label: 'All' },
  ...statusOrder.map((status) => ({
    value: status,
    label: statusLabels[status],
  })),
];

export function BookingsPage() {
  const [status, setStatus] = useState<'' | BookingStatus>('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Booking | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const bookingsQuery = useQuery({
    queryKey: ['admin-bookings', status, page],
    queryFn: async () =>
      listAdminBookings({
        status: status || undefined,
        page,
        limit: 10,
      }),
    placeholderData: keepPreviousData,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status: next }: { id: string; status: BookingStatus }) =>
      updateBookingStatus(id, next),
    onSuccess: (response) => {
      toast.push(
        `Booking ${shortId(response.data.id)} updated to ${statusLabels[response.data.status]}.`,
      );
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => toast.push(getErrorMessage(error), 'error'),
  });

  const bookings = bookingsQuery.data?.data ?? [];
  const pagination = bookingsQuery.data?.pagination;

  const handleFilter = (value: '' | BookingStatus) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Review every booking, confirm jobs, and keep statuses moving."
        actions={
          <>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => bookingsQuery.refetch()}
              disabled={bookingsQuery.isFetching}
            >
              <RefreshCw
                size={16}
                className={bookingsQuery.isFetching ? 'spin' : undefined}
              />
              Refresh
            </button>
            <Link to="/bookings/new" className="button button-primary">
              <CalendarPlus size={17} />
              Create booking
            </Link>
          </>
        }
      />

      <section className="card">
        <div className="filter-bar">
          <div className="chip-group">
            {filters.map((filter) => (
              <button
                key={filter.value || 'all'}
                type="button"
                className={`chip ${status === filter.value ? 'is-active' : ''}`}
                onClick={() => handleFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <span className="filter-summary">
            {pagination
              ? `${pagination.total} ${
                  pagination.total === 1 ? 'booking' : 'bookings'
                }`
              : ''}
          </span>
        </div>

        {bookingsQuery.isLoading ? (
          <LoadingState label="Loading bookings…" />
        ) : bookingsQuery.isError ? (
          <ErrorState
            message={getErrorMessage(bookingsQuery.error)}
            onRetry={() => bookingsQuery.refetch()}
          />
        ) : bookings.length === 0 ? (
          <EmptyState
            title={status ? `No ${statusLabels[status].toLowerCase()} bookings` : 'No bookings yet'}
            description="Bookings created by customers or the admin console will appear here."
            action={
              <Link to="/bookings/new" className="button button-primary button-sm">
                <CalendarPlus size={15} /> Create booking
              </Link>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Service</th>
                    <th>Customer</th>
                    <th>Scheduled for</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const target = nextStatus[booking.status];
                    const isUpdating =
                      statusMutation.isPending &&
                      statusMutation.variables?.id === booking.id;
                    return (
                      <tr key={booking.id}>
                        <td>
                          <span className="mono">{shortId(booking.id)}</span>
                          <span className="cell-sub">
                            {formatDateTime(booking.createdAt)}
                          </span>
                        </td>
                        <td>
                          <strong>{booking.serviceSnapshot.name}</strong>
                          <span className="cell-sub">
                            {formatCurrency(booking.serviceSnapshot.price)} / unit
                          </span>
                        </td>
                        <td>
                          <span className="mono">{shortId(booking.userId)}</span>
                        </td>
                        <td>{formatDateTime(booking.bookingDate)}</td>
                        <td>{formatCurrency(booking.totalAmount)}</td>
                        <td>
                          <StatusBadge status={booking.status} />
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => setSelected(booking)}
                              title="View booking"
                            >
                              <Eye size={16} />
                            </button>
                            {target && (
                              <button
                                type="button"
                                className="button button-secondary button-xs"
                                disabled={isUpdating}
                                onClick={() =>
                                  statusMutation.mutate({ id: booking.id, status: target })
                                }
                              >
                                {isUpdating ? (
                                  <Spinner size={14} />
                                ) : (
                                  <ArrowRight size={14} />
                                )}
                                {nextStatusLabels[booking.status]}
                              </button>
                            )}
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

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Booking details"
        subtitle={selected ? `Booking ${selected.id}` : undefined}
        size="lg"
        footer={
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setSelected(null)}
          >
            Close
          </button>
        }
      >
        {selected && (
          <div className="detail-grid">
            <div className="detail-item">
              <span>Status</span>
              <StatusBadge status={selected.status} />
            </div>
            <div className="detail-item">
              <span>Total amount</span>
              <strong>{formatCurrency(selected.totalAmount)}</strong>
            </div>
            <div className="detail-item">
              <span>Service</span>
              <strong>{selected.serviceSnapshot.name}</strong>
              <small>{formatCurrency(selected.serviceSnapshot.price)} per unit</small>
            </div>
            <div className="detail-item">
              <span>Customer</span>
              <strong className="mono">{selected.userId}</strong>
            </div>
            <div className="detail-item">
              <span>Scheduled for</span>
              <strong>{formatDateTime(selected.bookingDate)}</strong>
            </div>
            <div className="detail-item">
              <span>Created at</span>
              <strong>{formatDateTime(selected.createdAt)}</strong>
            </div>
            <div className="detail-item detail-item-wide">
              <span>
                <MapPin size={14} /> Service address
              </span>
              <strong>
                {[
                  selected.addressSnapshot.line1,
                  selected.addressSnapshot.line2,
                  selected.addressSnapshot.city,
                  selected.addressSnapshot.state,
                  selected.addressSnapshot.pincode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </strong>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
