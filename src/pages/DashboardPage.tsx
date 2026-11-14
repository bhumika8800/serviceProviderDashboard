import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  CircleHelp,
  IndianRupee,
  MessageSquareWarning,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { getAdminStats, listAdminBookings } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
} from '../components/Feedback';
import { StatusBadge } from '../components/StatusBadge';
import { getErrorMessage } from '../lib/api';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  fullName,
  shortId,
  statusOrder,
} from '../lib/format';

export function DashboardPage() {
  const { user } = useAuth();

  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await getAdminStats()).data,
  });

  const recentQuery = useQuery({
    queryKey: ['admin-bookings', 'recent'],
    queryFn: async () => (await listAdminBookings({ page: 1, limit: 5 })).data,
  });

  const stats = statsQuery.data;
  const recent = recentQuery.data ?? [];
  const totalBookings = stats
    ? Object.values(stats.bookingsByStatus).reduce((sum, count) => sum + count, 0)
    : 0;

  return (
    <>
      <PageHeader
        title={`Hello, ${fullName(user?.firstName, user?.lastName)}`}
        subtitle={`Here is what is happening across ServiceHub on ${formatDate(
          new Date().toISOString(),
        )}.`}
        actions={
          <>
            <Link to="/bookings/new" className="button button-primary">
              <CalendarPlus size={17} />
              New booking
            </Link>
            <Link to="/services" className="button button-secondary">
              <Wrench size={17} />
              Manage services
            </Link>
          </>
        }
      />

      {statsQuery.isLoading ? (
        <LoadingState label="Loading dashboard…" />
      ) : statsQuery.isError ? (
        <ErrorState
          message={getErrorMessage(statsQuery.error)}
          onRetry={() => statsQuery.refetch()}
        />
      ) : stats ? (
        <>
          <section className="stat-grid">
            <article className="stat-card">
              <span className="stat-icon stat-icon-indigo">
                <Users size={20} />
              </span>
              <div>
                <span className="stat-label">Total users</span>
                <strong>{stats.totalUsers}</strong>
              </div>
            </article>
            <article className="stat-card">
              <span className="stat-icon stat-icon-emerald">
                <UserCheck size={20} />
              </span>
              <div>
                <span className="stat-label">Active accounts</span>
                <strong>{stats.activeUsers}</strong>
              </div>
            </article>
            <article className="stat-card">
              <span className="stat-icon stat-icon-sky">
                <Wrench size={20} />
              </span>
              <div>
                <span className="stat-label">Active services</span>
                <strong>{stats.totalServices}</strong>
              </div>
            </article>
            <article className="stat-card">
              <span className="stat-icon stat-icon-violet">
                <IndianRupee size={20} />
              </span>
              <div>
                <span className="stat-label">Total revenue</span>
                <strong>{formatCurrency(stats.totalRevenue)}</strong>
              </div>
            </article>
            <article className="stat-card">
              <span className="stat-icon stat-icon-amber">
                <MessageSquareWarning size={20} />
              </span>
              <div>
                <span className="stat-label">Open complaints</span>
                <strong>{stats.openComplaints}</strong>
              </div>
            </article>
            <article className="stat-card">
              <span className="stat-icon stat-icon-slate">
                <CircleHelp size={20} />
              </span>
              <div>
                <span className="stat-label">Open queries</span>
                <strong>{stats.openQueries}</strong>
              </div>
            </article>
          </section>

          <div className="dashboard-grid">
            <section className="card">
              <div className="card-header">
                <div>
                  <h2>Bookings by status</h2>
                  <p>
                    {totalBookings}{' '}
                    {totalBookings === 1 ? 'booking' : 'bookings'} created in total
                  </p>
                </div>
                <Link to="/bookings" className="text-link">
                  View all <ArrowUpRight size={14} />
                </Link>
              </div>
              <div className="status-breakdown">
                {statusOrder.map((status) => {
                  const count = stats.bookingsByStatus[status] ?? 0;
                  const percent = totalBookings
                    ? Math.round((count / totalBookings) * 100)
                    : 0;
                  return (
                    <div key={status} className="status-row">
                      <div className="status-row-head">
                        <StatusBadge status={status} />
                        <span>
                          {count} · {percent}%
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className={`progress-fill progress-${status}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="card quick-actions-card">
              <div className="card-header">
                <div>
                  <h2>Quick actions</h2>
                  <p>Jump straight to the common tasks</p>
                </div>
              </div>
              <div className="quick-actions">
                <Link to="/bookings/new" className="quick-action">
                  <span className="quick-action-icon">
                    <CalendarPlus size={19} />
                  </span>
                  <div>
                    <strong>Create a booking</strong>
                    <span>Schedule a service for a customer</span>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
                <Link to="/bookings" className="quick-action">
                  <span className="quick-action-icon">
                    <CalendarDays size={19} />
                  </span>
                  <div>
                    <strong>Update bookings</strong>
                    <span>Confirm, start, or complete jobs</span>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
                <Link to="/services" className="quick-action">
                  <span className="quick-action-icon">
                    <Wrench size={19} />
                  </span>
                  <div>
                    <strong>Manage catalogue</strong>
                    <span>Add services and edit pricing</span>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </section>
          </div>

          <section className="card">
            <div className="card-header">
              <div>
                <h2>Recent bookings</h2>
                <p>The five most recently created bookings</p>
              </div>
              <Link to="/bookings" className="text-link">
                View all <ArrowUpRight size={14} />
              </Link>
            </div>
            {recentQuery.isLoading ? (
              <LoadingState label="Loading recent bookings…" />
            ) : recentQuery.isError ? (
              <ErrorState
                message={getErrorMessage(recentQuery.error)}
                onRetry={() => recentQuery.refetch()}
              />
            ) : recent.length === 0 ? (
              <EmptyState
                title="No bookings yet"
                description="Create the first booking to see it here."
                action={
                  <Link to="/bookings/new" className="button button-primary button-sm">
                    <CalendarPlus size={15} /> Create booking
                  </Link>
                }
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Booking</th>
                      <th>Service</th>
                      <th>Scheduled</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((booking) => (
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
                            User {shortId(booking.userId)}
                          </span>
                        </td>
                        <td>{formatDateTime(booking.bookingDate)}</td>
                        <td>{formatCurrency(booking.totalAmount)}</td>
                        <td>
                          <StatusBadge status={booking.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
