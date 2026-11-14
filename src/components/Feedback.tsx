import type { ReactNode } from 'react';
import { Inbox, Loader2, RefreshCw } from 'lucide-react';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

export function Spinner({ size = 18 }: { size?: number }) {
  return <Loader2 className="spin" size={size} />;
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="state-panel">
      <Spinner size={26} />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="state-panel state-empty">
      <span className="state-icon">
        <Inbox size={24} />
      </span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state-panel state-error">
      <strong>Could not load data</strong>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="button button-secondary button-sm" onClick={onRetry}>
          <RefreshCw size={15} />
          Try again
        </button>
      )}
    </div>
  );
}
