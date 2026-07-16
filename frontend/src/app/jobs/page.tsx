'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search, SlidersHorizontal, PlusCircle, ChevronUp, ChevronDown,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, AlertCircle,
  Calendar, User2, MapPin, ArrowUpDown,
} from 'lucide-react';
import { jobsApi, usersApi } from '@/lib/api';
import { Job, JobStatus, JobsQueryParams, User } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageLoader } from '@/components/ui/Spinner';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: JobStatus.PENDING, label: 'Pending' },
  { value: JobStatus.ASSIGNED, label: 'Assigned' },
  { value: JobStatus.IN_PROGRESS, label: 'In Progress' },
  { value: JobStatus.COMPLETED, label: 'Completed' },
  { value: JobStatus.CANCELLED, label: 'Cancelled' },
];

const SORT_FIELDS = [
  { value: 'scheduledDate', label: 'Scheduled Date' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'title', label: 'Title' },
  { value: 'status', label: 'Status' },
];

export default function JobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ─── State ──────────────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Derive params from URL ──────────────────────────────────────────────────
  const page = Number(searchParams.get('page') || '1');
  const limit = Number(searchParams.get('limit') || '10');
  const status = (searchParams.get('status') || '') as JobStatus | '';
  const technician = searchParams.get('technician') || '';
  const startDate = searchParams.get('startDate') || '';
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'scheduledDate';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  // Local search input (debounced before pushing to URL)
  const [searchInput, setSearchInput] = useState(search);

  // ─── Fetch technicians once ──────────────────────────────────────────────────
  useEffect(() => {
    usersApi.getTechnicians().then((res) => {
      if (res.success) setTechnicians(res.data);
    }).catch(() => {});
  }, []);

  // ─── Fetch jobs when URL params change ──────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: JobsQueryParams = {
        page, limit, sortBy, sortOrder,
        ...(status && { status }),
        ...(technician && { technician }),
        ...(startDate && { startDate }),
        ...(search && { search }),
      };
      const res = await jobsApi.getJobs(params);
      if (res.success) {
        setJobs(res.data.jobs);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, technician, startDate, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ─── Debounce search input ───────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput.trim() === '') {
        params.delete('search');
      } else {
        params.set('search', searchInput.trim());
      }
      params.set('page', '1');
      router.push(`/jobs?${params.toString()}`);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // ─── URL param helpers ───────────────────────────────────────────────────────
  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === '' || value === '1' && key === 'page') {
      if (key !== 'page') params.delete(key);
      else params.set(key, value);
    } else {
      params.set(key, value);
    }
    if (key !== 'page') params.set('page', '1');
    router.push(`/jobs?${params.toString()}`);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      updateParam('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set('sortBy', field);
      params.set('sortOrder', 'desc');
      params.set('page', '1');
      router.push(`/jobs?${params.toString()}`);
    }
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`/jobs?${params.toString()}`);
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown size={13} style={{ opacity: 0.35 }} />;
    return sortOrder === 'asc'
      ? <ChevronUp size={13} style={{ color: '#6366f1' }} />
      : <ChevronDown size={13} style={{ color: '#6366f1' }} />;
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#0f1117' }} className="animate-fadeIn">
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f2f8', marginBottom: 4 }}>Jobs</h1>
          <p style={{ fontSize: 13, color: '#8b92a9' }}>
            {total > 0 ? `${total} total job${total !== 1 ? 's' : ''}` : 'No jobs found'}
          </p>
        </div>
        <Link
          href="/jobs/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            color: 'white', textDecoration: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
            transition: 'all 0.2s ease',
          }}
        >
          <PlusCircle size={16} />
          New Job
        </Link>
      </div>

      {/* Filters */}
      <div style={{
        background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: '16px 20px', marginBottom: 20,
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8b92a9', pointerEvents: 'none' }} />
          <input
            id="search-input"
            type="text"
            placeholder="Search jobs, customers…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px', borderRadius: 9,
              background: 'rgba(15,17,23,0.8)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#f0f2f8', fontSize: 13, outline: 'none',
            }}
          />
        </div>
        {/* Status filter */}
        <select
          id="status-filter"
          value={status}
          onChange={(e) => updateParam('status', e.target.value)}
          style={{ ...selectStyle, minWidth: 150 }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {/* Technician filter */}
        <select
          id="technician-filter"
          value={technician}
          onChange={(e) => updateParam('technician', e.target.value)}
          style={{ ...selectStyle, minWidth: 160 }}
        >
          <option value="">All Technicians</option>
          <option value="unassigned">Unassigned</option>
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
          ))}
        </select>
        {/* Date filter - single date */}
        <input
          id="scheduled-date"
          type="date"
          value={startDate}
          onChange={(e) => updateParam('startDate', e.target.value)}
          style={{ ...selectStyle, minWidth: 150 }}
        />
        {/* Clear Filters button */}
        {(status || technician || startDate || search) && (
          <button
            onClick={() => {
              setSearchInput('');
              router.push('/jobs');
            }}
            style={{
              padding: '9px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
              color: '#f87171', background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', minWidth: 'fit-content',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{
        background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        {loading ? (
          <PageLoader />
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <AlertCircle size={36} color="#ef4444" style={{ marginBottom: 12 }} />
            <p style={{ color: '#f87171', fontSize: 14 }}>{error}</p>
            <button onClick={fetchJobs} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13 }}>
              Retry
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15,17,23,0.4)' }}>
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
                      style={{
                        padding: '12px 16px', textAlign: 'left',
                        fontSize: 11, fontWeight: 700, color: '#4b5280',
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        cursor: key ? 'pointer' : 'default',
                        userSelect: 'none', whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
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
                    <td colSpan={6} style={{ padding: 60, textAlign: 'center' }}>
                      <SlidersHorizontal size={36} color="#4b5280" style={{ marginBottom: 12, display: 'inline-block' }} />
                      <p style={{ color: '#8b92a9', fontSize: 14, margin: 0 }}>No records found</p>
                    </td>
                  </tr>
                ) : (
                  jobs.map((job, i) => (
                    <tr
                      key={job.id}
                      style={{
                        borderBottom: i < jobs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        transition: 'background 0.15s ease',
                        cursor: 'pointer',
                      }}
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px', maxWidth: 240 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e5f0', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {job.title}
                        </div>
                        {job.description && (
                          <div style={{ fontSize: 11, color: '#8b92a9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {job.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <StatusBadge status={job.status} size="sm" />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 13, color: '#c5cae0', fontWeight: 500 }}>{job.customerName}</div>
                        <div style={{ fontSize: 11, color: '#8b92a9', marginTop: 2 }}>{job.customerEmail}</div>
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        {job.assignedTechnician ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{
                              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 700, color: 'white',
                            }}>
                              {(job.assignedTechnician as User).firstName[0]}
                              {(job.assignedTechnician as User).lastName[0]}
                            </div>
                            <div>
                              <div style={{ fontSize: 12, color: '#c5cae0', fontWeight: 500 }}>
                                {(job.assignedTechnician as User).firstName} {(job.assignedTechnician as User).lastName}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#4b5280', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={13} color="#8b92a9" />
                          <span style={{ fontSize: 13, color: '#c5cae0' }}>{formatDate(job.scheduledDate)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', maxWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <MapPin size={13} color="#8b92a9" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#8b92a9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {job.address}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && pages > 1 && (
          <div style={{
            padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ fontSize: 12, color: '#8b92a9' }}>
              Page {page} of {pages} · {total} total
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { icon: ChevronsLeft, action: () => goToPage(1), disabled: page === 1, label: 'First' },
                { icon: ChevronLeft, action: () => goToPage(page - 1), disabled: page === 1, label: 'Prev' },
                { icon: ChevronRight, action: () => goToPage(page + 1), disabled: page === pages, label: 'Next' },
                { icon: ChevronsRight, action: () => goToPage(pages), disabled: page === pages, label: 'Last' },
              ].map(({ icon: Icon, action, disabled, label }) => (
                <button
                  key={label}
                  onClick={action}
                  disabled={disabled}
                  aria-label={label}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: disabled ? 'rgba(75,82,128,0.2)' : 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    color: disabled ? '#4b5280' : '#a5b4fc',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.25)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.12)';
                    }
                  }}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '9px 12px',
  borderRadius: 9,
  background: 'rgba(15,17,23,0.8)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#c5cae0',
  fontSize: 13,
  outline: 'none',
  cursor: 'pointer',
};
