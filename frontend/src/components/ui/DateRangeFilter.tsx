'use client';

import { Calendar, X } from 'lucide-react';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

export function DateRangeFilter({ startDate, endDate, onChange }: DateRangeFilterProps) {
  const hasRange = startDate || endDate;

  return (
    <div className="date-range-filter">
      <label className="filter-label">
        <Calendar size={12} />
        Date Range
      </label>
      <div className="date-range-filter__inputs">
        <input
          type="date"
          value={startDate}
          onChange={(e) => onChange(e.target.value, endDate)}
          className="filter-input date-range-filter__input"
          title="From date"
          aria-label="From date"
        />
        <span className="date-range-filter__sep">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onChange(startDate, e.target.value)}
          className="filter-input date-range-filter__input"
          title="To date"
          aria-label="To date"
          min={startDate || undefined}
        />
        {hasRange && (
          <button
            type="button"
            className="date-range-filter__clear"
            onClick={() => onChange('', '')}
            aria-label="Clear date range"
            title="Clear date range"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
