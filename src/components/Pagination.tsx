import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Pagination as PaginationMeta } from '../types';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, total } = pagination;

  if (totalPages <= 1) {
    return (
      <div className="pagination">
        <span className="pagination-summary">
          {total} {total === 1 ? 'result' : 'results'}
        </span>
      </div>
    );
  }

  return (
    <div className="pagination">
      <span className="pagination-summary">
        Page {page} of {totalPages} · {total} results
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="button button-ghost button-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        <button
          type="button"
          className="button button-ghost button-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
