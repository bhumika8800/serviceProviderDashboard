import type { BookingStatus } from '../types';
import { statusLabels } from '../lib/format';

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot" />
      {statusLabels[status]}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`badge ${active ? 'badge-active' : 'badge-inactive'}`}>
      <span className="badge-dot" />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
