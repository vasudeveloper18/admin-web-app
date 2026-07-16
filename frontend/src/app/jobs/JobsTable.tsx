'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  PlusCircle, ChevronUp, ChevronDown,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Calendar, MapPin, ArrowUpDown,
} from 'lucide-react';
import { usersApi } from '@/lib/api';
import { Job, JobStatus, PaginatedJobs, User } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { AdminPageCard } from '@/components/layout/AdminPageCard';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: JobStatus.PENDING, label: 'Pending' },
  { value: JobStatus.ASSIGNED, label: 'Assigned' },
  { value: JobStatus.IN_PROGRESS, label: 'In Progress' },
  { value: JobStatus.COMPLETED, label: 'Completed' },
  { value: JobStatus.CANCELLED, label: 'Cancelled' },
];

interface JobsTableProps {
  initialData: PaginatedJobs;
}

export function JobsTable({ initialData }: JobsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const page = Number(searchParams.get('page') || '1');
  const limit = Number(searchParams.get('limit') || '10');
  const status = (searchParams.get('status') || '') as JobStatus | '';
  const technician = searchParams.get('technician') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'scheduledDate';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  const [jobs, setJobs] = useState<Job[]>(initialData.jobs);
  const [total, setTotal] = useState(initialData.total);
  const [pages, setPages] = useState(initialData.pages);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [searchInput, setSearchInput] = useState(search);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const skipSearchDebounce = useRef(false);

  useEffect(() => {
    setJobs(initialData.jobs);
    setTotal(initialData.total);
    setPages(initialData.pages);
  }, [initialData]);

  useEffect(() => {
    usersApi.getTechnicians().then((res) => {
      if (res.success) setTechnicians(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (skipSearchDebounce.current) {
      skipSearchDebounce.current = false;
      return;
    }
    if (searchInput === search) return;

    const timer = setTimeout(() => {
      navigateWithParams((params) => {
        if (searchInput.trim() === '') {
          params.delete('search');
        } else {
          params.set('search', searchInput.trim());
        }
        params.set('page', '1');
      });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const navigateWithParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    startTransition(() => {
      router.push(`/jobs?${params.toString()}`);
    });
  };

  const updateParam = (key: string, value: string) => {
    navigateWithParams((params) => {
      if (value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      if (key !== 'page') params.set('page', '1');
    });
  };

  const updateDateRange = (start: string, end: string) => {
    navigateWithParams((params) => {
      if (start) params.set('startDate', start);
      else params.delete('startDate');
      if (end) params.set('endDate', end);
      else params.delete('endDate');
      params.set('page', '1');
    });
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      updateParam('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      navigateWithParams((params) => {
        params.set('sortBy', field);
        params.set('sortOrder', 'desc');
        params.set('page', '1');
      });
    }
  };

  const goToPage = (p: number) => updateParam('page', String(p));

  const clearFilters = () => {
    skipSearchDebounce.current = true;
    setSearchInput('');
    startTransition(() => router.push('/jobs'));
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown size={13} className="sort-icon--inactive" />;
    return sortOrder === 'asc'
      ? <ChevronUp size={13} className="sort-icon--active" />
      : <ChevronDown size={13} className="sort-icon--active" />;
  };

  const hasAdvancedFilters = status || technician || startDate || endDate;
  const hasFilters = hasAdvancedFilters || search;
  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  useEffect(() => {
    if (hasAdvancedFilters) setFiltersOpen(true);
  }, [hasAdvancedFilters]);

  return (
    <div className="page-container animate-fadeIn">
      <div className="page-inner page-inner--full">
        <AdminPageCard
          title={`All Jobs (${total})`}
          loading={isPending}
          actions={
            <>
              <Link href="/jobs/new" className="admin-page-card__btn admin-page-card__btn--primary">
                <PlusCircle size={15} />
                New Job
              </Link>
              <button
                type="button"
                className={`admin-page-card__btn admin-page-card__btn--primary${filtersOpen ? ' admin-page-card__btn--active' : ''}`}
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
              >
                Advanced Search
                <ChevronDown size={15} className={`admin-page-card__btn-chevron${filtersOpen ? ' admin-page-card__btn-chevron--open' : ''}`} />
              </button>
            </>
          }
        >
          {isPending && (
            <div className="data-table-overlay">
              <span className="data-table-spinner" />
              <span>Updating results…</span>
            </div>
          )}

          {filtersOpen && (
            <div className="jobs-list-card__filters">
              <div className="jobs-list-card__filters-grid">
                <DateRangeFilter
                  startDate={startDate}
                  endDate={endDate}
                  onChange={updateDateRange}
                />

                <div className="filter-group">
                  <label className="filter-label">Status</label>
                  <select
                    value={status}
                    onChange={(e) => updateParam('status', e.target.value)}
                    className="filter-input filter-select"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Technician</label>
                  <select
                    value={technician}
                    onChange={(e) => updateParam('technician', e.target.value)}
                    className="filter-input filter-select"
                  >
                    <option value="">All Technicians</option>
                    <option value="unassigned">Unassigned</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {hasAdvancedFilters && (
                <div className="jobs-list-card__filters-footer">
                  <button type="button" onClick={clearFilters} className="jobs-list-card__btn-clear">
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="jobs-list-card__toolbar">
            <div className="jobs-list-card__toolbar-left">
              <span className="jobs-list-card__toolbar-label">Show</span>
              <select
                value={String(limit)}
                onChange={(e) => updateParam('limit', e.target.value)}
                className="jobs-list-card__toolbar-select"
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="jobs-list-card__toolbar-label">entries</span>
            </div>

            <div className="jobs-list-card__toolbar-right">
              <span className="jobs-list-card__toolbar-label">Search:</span>
              <div className="jobs-list-card__search-wrap">
                <input
                  type="text"
                  placeholder="Search jobs, customers…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="jobs-list-card__search-input"
                />
              </div>
            </div>
          </div>

          <div className="data-table-scroll">
            <table className="data-table data-table--listing">
              <thead>
                <tr>
                  {[
                    { key: 'title', label: 'Job' },
                    { key: 'status', label: 'Status' },
                    { key: null, label: 'Customer' },
                    { key: null, label: 'Technician' },
                    { key: 'scheduledDate', label: 'Scheduled' },
                    { key: null, label: 'Location' },
                  ].map(({ key, label }) => (
                    <th
                      key={label}
                      onClick={() => key && toggleSort(key)}
                      className={key ? 'data-table__th--sortable' : undefined}
                    >
                      <span className="data-table__th-content">
                        {label}
                        {key && <SortIcon field={key} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="data-table__empty">
                        <p className="data-table__empty-title">No records found</p>
                        {hasFilters && (
                          <button type="button" onClick={clearFilters} className="btn-link">
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr
                      key={job.id}
                      className="data-table__row"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    >
                      <td className="data-table__cell data-table__cell--title">
                        <div className="data-table__title">{job.title}</div>
                        {job.description && (
                          <div className="data-table__subtitle">{job.description}</div>
                        )}
                      </td>
                      <td className="data-table__cell">
                        <StatusBadge status={job.status} size="sm" />
                      </td>
                      <td className="data-table__cell">
                        <div className="data-table__primary">{job.customerName}</div>
                        <div className="data-table__secondary">{job.customerEmail}</div>
                      </td>
                      <td className="data-table__cell">
                        {job.assignedTechnician ? (
                          <div className="data-table__tech">
                            <span className="data-table__tech-avatar">
                              {(job.assignedTechnician as User).firstName[0]}
                              {(job.assignedTechnician as User).lastName[0]}
                            </span>
                            <span className="data-table__primary">
                              {(job.assignedTechnician as User).firstName}{' '}
                              {(job.assignedTechnician as User).lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="data-table__unassigned">Unassigned</span>
                        )}
                      </td>
                      <td className="data-table__cell">
                        <div className="data-table__date">
                          <Calendar size={13} />
                          {formatDate(job.scheduledDate)}
                        </div>
                      </td>
                      <td className="data-table__cell data-table__cell--location">
                        <div className="data-table__location">
                          <MapPin size={13} />
                          <span>{job.address}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="jobs-list-card__footer">
            <span className="jobs-list-card__footer-info">
              {total > 0
                ? `Showing ${showingFrom}–${showingTo} of ${total} entries`
                : 'No matching jobs'}
            </span>

            {pages > 1 && (
              <div className="data-table-pagination__controls">
                {[
                  { icon: ChevronsLeft, action: () => goToPage(1), disabled: page === 1, label: 'First' },
                  { icon: ChevronLeft, action: () => goToPage(page - 1), disabled: page === 1, label: 'Prev' },
                  { icon: ChevronRight, action: () => goToPage(page + 1), disabled: page === pages, label: 'Next' },
                  { icon: ChevronsRight, action: () => goToPage(pages), disabled: page === pages, label: 'Last' },
                ].map(({ icon: Icon, action, disabled, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={action}
                    disabled={disabled || isPending}
                    aria-label={label}
                    className="pagination-btn"
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </AdminPageCard>
      </div>
    </div>
  );
}
