'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api';
import {
  assignTechnicianAction,
  unassignTechnicianAction,
  cancelJobAction,
} from '@/app/jobs/actions';
import { Job, JobStatus, User } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  ChevronLeft, Calendar, MapPin, User2, AlignLeft, CheckCircle,
  AlertCircle, Settings, X, Image as ImageIcon, Navigation,
} from 'lucide-react';
import { AdminPageCard } from '@/components/layout/AdminPageCard';
import { resolveCompletionPhotoUrl } from '@/lib/completion-photos';

const CANCEL_REASONS = [
  'Customer cancelled',
  'Weather',
  'Duplicate Job',
  'Other',
] as const;

function CompletionPhotoThumb({ photo, index }: { photo: string; index: number }) {
  const [failed, setFailed] = useState(false);
  const src = resolveCompletionPhotoUrl(photo);

  if (failed) {
    return (
      <div
        style={{
          width: '100%',
          height: 120,
          borderRadius: 10,
          border: '1px dashed rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
          fontSize: 12,
          color: '#8b92a9',
          textAlign: 'center',
        }}
      >
        Photo unavailable (re-upload after deploy or file expired on server)
      </div>
    );
  }

  return (
    <a href={src} target="_blank" rel="noopener noreferrer">
      <img
        src={src}
        alt={`Completion photo ${index + 1}`}
        onError={() => setFailed(true)}
        style={{
          width: '100%',
          height: 120,
          objectFit: 'cover',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      />
    </a>
  );
}

interface JobDetailClientProps {
  initialJob: Job;
}

export function JobDetailClient({ initialJob }: JobDetailClientProps) {
  const router = useRouter();
  const [job, setJob] = useState<Job>(initialJob);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [techLoading, setTechLoading] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonPreset, setCancelReasonPreset] = useState<string>(CANCEL_REASONS[0]);
  const [cancelNotes, setCancelNotes] = useState('');

  const fetchTechnicians = async () => {
    setTechLoading(true);
    try {
      const res = await usersApi.getTechnicians();
      if (res.success) setTechnicians(res.data);
    } catch {
      // Non-blocking
    } finally {
      setTechLoading(false);
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnicianId) return;

    const tech = technicians.find((t) => t.id === selectedTechnicianId);
    const previousJob = job;

    setJob((prev) => ({
      ...prev,
      status: JobStatus.ASSIGNED,
      assignedTechnician: tech || prev.assignedTechnician,
    }));
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await assignTechnicianAction(job.id, selectedTechnicianId);
      if (res.success) {
        setJob(res.data);
        setShowAssignModal(false);
        setSelectedTechnicianId('');
      } else {
        setJob(previousJob);
        setActionError(res.message);
      }
    } catch (err: unknown) {
      setJob(previousJob);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setActionError(axiosErr?.response?.data?.message || 'Failed to assign technician');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassignTechnician = async () => {
    const previousJob = job;
    setJob((prev) => ({
      ...prev,
      status: JobStatus.PENDING,
      assignedTechnician: null,
    }));
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await unassignTechnicianAction(job.id);
      if (res.success) {
        setJob(res.data);
        setShowUnassignModal(false);
      } else {
        setJob(previousJob);
        setActionError(res.message);
      }
    } catch (err: unknown) {
      setJob(previousJob);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setActionError(axiosErr?.response?.data?.message || 'Failed to unassign technician');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelJob = async () => {
    const notes = cancelNotes.trim();
    const reason = cancelReasonPreset === 'Other'
      ? notes
      : notes ? `${cancelReasonPreset}: ${notes}` : cancelReasonPreset;

    if (reason.trim().length < 5) {
      setActionError('Please provide a cancellation reason (minimum 5 characters)');
      return;
    }

    const previousJob = job;
    setJob((prev) => ({
      ...prev,
      status: JobStatus.CANCELLED,
      cancelReason: reason,
    }));
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await cancelJobAction(job.id, reason);
      if (res.success) {
        setJob(res.data);
        setShowCancelModal(false);
        setCancelNotes('');
        setCancelReasonPreset(CANCEL_REASONS[0]);
      } else {
        setJob(previousJob);
        setActionError(res.message);
      }
    } catch (err: unknown) {
      setJob(previousJob);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setActionError(axiosErr?.response?.data?.message || 'Failed to cancel job');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${job.longitude - 0.01}%2C${job.latitude - 0.01}%2C${job.longitude + 0.01}%2C${job.latitude + 0.01}&layer=mapnik&marker=${job.latitude}%2C${job.longitude}`;

  const canAssign = job.status === JobStatus.PENDING;
  const canUnassign = job.status === JobStatus.ASSIGNED;
  const canCancel =
    job.status !== JobStatus.COMPLETED && job.status !== JobStatus.CANCELLED;
  const isTerminal =
    job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED;
  const showAssignedTechnician =
    job.assignedTechnician &&
    (job.status === JobStatus.ASSIGNED ||
      job.status === JobStatus.IN_PROGRESS ||
      job.status === JobStatus.COMPLETED);

  return (
    <div className="page-container animate-fadeIn">
      <div className="page-inner page-inner--full">
        <AdminPageCard
          title={job.title}
          actions={
            <button
              type="button"
              onClick={() => router.push('/jobs')}
              className="admin-page-card__btn admin-page-card__btn--secondary"
            >
              <ChevronLeft size={15} />
              Back to Jobs
            </button>
          }
        >
          <div className="admin-page-card__body admin-page-card__body--detail">
            <div className="job-detail-summary">
              <div className="job-detail-summary__top">
                <StatusBadge status={job.status} size="md" />
                <span className="job-detail-summary__id">ID: {job.id}</span>
              </div>
              <div className="job-detail-summary__meta">
                <div className="job-detail-summary__meta-item">
                  <Calendar size={14} /> {formatDate(job.scheduledDate)}
                </div>
                <div className="job-detail-summary__meta-item">
                  <MapPin size={14} /> {job.address}
                </div>
                <div className="job-detail-summary__meta-item">
                  <Navigation size={14} /> {job.latitude.toFixed(5)}, {job.longitude.toFixed(5)}
                </div>
              </div>
            </div>

        <div className="job-detail-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{
              background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: 24,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e5f0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlignLeft size={16} color="#6366f1" /> Description
              </h3>
              <p style={{ fontSize: 14, color: '#c5cae0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {job.description || 'No description provided.'}
              </p>
            </div>

            <div style={{
              background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: 24, overflow: 'hidden',
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e5f0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} color="#6366f1" /> Location
              </h3>
              <iframe
                title="Job location map"
                src={mapUrl}
                style={{ width: '100%', height: 280, border: 'none', borderRadius: 10 }}
                loading="lazy"
              />
              <a
                href={`https://www.openstreetmap.org/?mlat=${job.latitude}&mlon=${job.longitude}#map=15/${job.latitude}/${job.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 12, fontSize: 12, color: '#a5b4fc', textDecoration: 'none' }}
              >
                Open in OpenStreetMap →
              </a>
            </div>

            {(job.completionPhotos.length > 0 ||
              (job.status === JobStatus.COMPLETED && job.completionNotes)) && (
              <div style={{
                background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: 24,
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e5f0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ImageIcon size={16} color="#6366f1" /> Completion Photos
                </h3>
                {job.completionPhotos.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                    {job.completionPhotos.map((photo, i) => (
                      <CompletionPhotoThumb key={`${photo}-${i}`} photo={photo} index={i} />
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: '#8b92a9', fontStyle: 'italic', margin: 0 }}>
                    No completion photos uploaded.
                  </p>
                )}
                {job.completionNotes && (
                  <p style={{ marginTop: 16, fontSize: 13, color: '#8b92a9', fontStyle: 'italic' }}>
                    Notes: {job.completionNotes}
                  </p>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{
              background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: 24,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e5f0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User2 size={16} color="#6366f1" /> Customer Details
              </h3>
              <div style={{ fontSize: 14, color: '#c5cae0', fontWeight: 500, marginBottom: 4 }}>{job.customerName}</div>
              <div style={{ fontSize: 13, color: '#8b92a9' }}>{job.customerEmail}</div>
              {job.customerPhone && <div style={{ fontSize: 13, color: '#8b92a9', marginTop: 4 }}>{job.customerPhone}</div>}
            </div>

            <div style={{
              background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: 24,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e5f0', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={16} color="#6366f1" /> Admin Actions
              </h3>

              {actionError && !showAssignModal && !showUnassignModal && !showCancelModal && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 12px', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <AlertCircle size={14} />
                  <span>{actionError}</span>
                </div>
              )}

              {isTerminal ? (
                <p style={{ fontSize: 13, color: '#8b92a9', marginBottom: 16 }}>
                  {job.status === JobStatus.COMPLETED
                    ? 'This job is completed. No further admin actions are available.'
                    : 'This job is cancelled. No further admin actions are available.'}
                  {job.cancelledAt && (
                    <span style={{ display: 'block', marginTop: 6, fontSize: 12 }}>
                      Cancelled on {formatDate(job.cancelledAt)}
                    </span>
                  )}
                </p>
              ) : (
                <>
                  {showAssignedTechnician && job.assignedTechnician && (
                    <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: '#c5cae0', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={14} color="#6366f1" /> Assigned Technician
                      </label>
                      <div style={{ padding: '12px', background: '#0f1117', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, color: 'white',
                          }}>
                            {job.assignedTechnician.firstName[0]}{job.assignedTechnician.lastName[0]}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, color: '#c5cae0', fontWeight: 500 }}>
                              {job.assignedTechnician.firstName} {job.assignedTechnician.lastName}
                            </div>
                            <div style={{ fontSize: 11, color: '#8b92a9' }}>{job.assignedTechnician.email}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {canAssign && (
                    <button
                      onClick={() => {
                        setActionError(null);
                        fetchTechnicians();
                        setShowAssignModal(true);
                      }}
                      disabled={actionLoading}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        color: 'white', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer', marginBottom: 12,
                      }}
                    >
                      Assign Technician
                    </button>
                  )}

                  {canUnassign && (
                    <button
                      onClick={() => { setActionError(null); setShowUnassignModal(true); }}
                      disabled={actionLoading}
                      style={{
                        width: '100%', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                        color: '#f87171', background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)', cursor: actionLoading ? 'not-allowed' : 'pointer',
                        marginBottom: 12,
                      }}
                    >
                      Unassign Technician
                    </button>
                  )}

                  {job.status === JobStatus.IN_PROGRESS && (
                    <p style={{ fontSize: 12, color: '#8b92a9', marginBottom: 12, fontStyle: 'italic' }}>
                      Job is in progress. Technician actions are managed from the mobile app.
                    </p>
                  )}
                </>
              )}

              <div style={{ marginTop: isTerminal ? 0 : 8, paddingTop: isTerminal ? 0 : 16, borderTop: isTerminal ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#c5cae0', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} color="#f87171" /> Cancel Job
                </label>
                {job.cancelReason && (
                  <p style={{ fontSize: 12, color: '#8b92a9', marginBottom: 10 }}>Reason: {job.cancelReason}</p>
                )}
                <button
                  onClick={() => { setActionError(null); setShowCancelModal(true); }}
                  disabled={actionLoading || !canCancel}
                  style={{
                    width: '100%', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                    color: '#f87171', background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    cursor: (actionLoading || !canCancel) ? 'not-allowed' : 'pointer',
                    opacity: !canCancel ? 0.5 : 1,
                  }}
                >
                  {!canCancel
                    ? (job.status === JobStatus.COMPLETED ? 'Completed' : 'Cancelled')
                    : 'Cancel Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
          </div>
        </AdminPageCard>
      </div>

      {showAssignModal && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f0f2f8' }}>Assign Technician</h2>
              <button
                onClick={() => { setShowAssignModal(false); setSelectedTechnicianId(''); setActionError(null); }}
                disabled={actionLoading}
                style={modalCloseBtnStyle}
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div style={modalErrorStyle}>
                <AlertCircle size={14} />
                <span>{actionError}</span>
              </div>
            )}

            <p style={{ fontSize: 13, color: '#8b92a9', marginBottom: 16 }}>Select a technician to assign to this job.</p>

            {techLoading ? (
              <p style={{ fontSize: 13, color: '#8b92a9', textAlign: 'center', padding: 20 }}>Loading technicians…</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {technicians.map((tech) => (
                  <label
                    key={tech.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                      borderRadius: 8, cursor: 'pointer',
                      background: selectedTechnicianId === tech.id ? 'rgba(99,102,241,0.12)' : '#0f1117',
                      border: selectedTechnicianId === tech.id ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <input
                      type="radio"
                      name="technician"
                      value={tech.id}
                      checked={selectedTechnicianId === tech.id}
                      onChange={() => setSelectedTechnicianId(tech.id)}
                      style={{ accentColor: '#6366f1' }}
                    />
                    <span style={{ fontSize: 13, color: '#c5cae0' }}>
                      {tech.firstName} {tech.lastName}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setShowAssignModal(false); setSelectedTechnicianId(''); setActionError(null); }}
                disabled={actionLoading}
                style={modalSecondaryBtnStyle}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTechnician}
                disabled={actionLoading || !selectedTechnicianId}
                style={{
                  ...modalPrimaryBtnStyle,
                  opacity: (actionLoading || !selectedTechnicianId) ? 0.5 : 1,
                }}
              >
                {actionLoading ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnassignModal && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f0f2f8' }}>Unassign Technician</h2>
              <button
                onClick={() => { setShowUnassignModal(false); setActionError(null); }}
                disabled={actionLoading}
                style={modalCloseBtnStyle}
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div style={modalErrorStyle}>
                <AlertCircle size={14} />
                <span>{actionError}</span>
              </div>
            )}

            <p style={{ fontSize: 14, color: '#c5cae0', marginBottom: 24 }}>
              Are you sure you want to unassign{' '}
              <strong>{job.assignedTechnician?.firstName} {job.assignedTechnician?.lastName}</strong>?
              The job will return to <strong>PENDING</strong> status.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setShowUnassignModal(false); setActionError(null); }}
                disabled={actionLoading}
                style={modalSecondaryBtnStyle}
              >
                No
              </button>
              <button
                onClick={handleUnassignTechnician}
                disabled={actionLoading}
                style={{
                  ...modalPrimaryBtnStyle,
                  background: 'linear-gradient(135deg, #f87171, #fb7185)',
                }}
              >
                {actionLoading ? 'Unassigning…' : 'Yes, Unassign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f0f2f8' }}>Cancel Job</h2>
              <button
                onClick={() => { setShowCancelModal(false); setCancelNotes(''); setCancelReasonPreset(CANCEL_REASONS[0]); setActionError(null); }}
                disabled={actionLoading}
                style={modalCloseBtnStyle}
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div style={modalErrorStyle}>
                <AlertCircle size={14} />
                <span>{actionError}</span>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#c5cae0', marginBottom: 8, display: 'block' }}>
                Reason <span style={{ color: '#f87171' }}>*</span>
              </label>
              <select
                value={cancelReasonPreset}
                onChange={(e) => { setCancelReasonPreset(e.target.value); setActionError(null); }}
                disabled={actionLoading}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)',
                  color: '#c5cae0', fontSize: 13, outline: 'none',
                }}
              >
                {CANCEL_REASONS.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#c5cae0', marginBottom: 8, display: 'block' }}>
                Notes {cancelReasonPreset === 'Other' && <span style={{ color: '#f87171' }}>*</span>}
              </label>
              <textarea
                value={cancelNotes}
                onChange={(e) => { setCancelNotes(e.target.value); setActionError(null); }}
                placeholder={cancelReasonPreset === 'Other' ? 'Enter cancellation reason…' : 'Optional additional notes…'}
                disabled={actionLoading}
                style={{
                  width: '100%', padding: '12px', borderRadius: 8,
                  background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)',
                  color: '#c5cae0', fontSize: 13, fontFamily: 'inherit',
                  resize: 'vertical', minHeight: 80, outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setShowCancelModal(false); setCancelNotes(''); setCancelReasonPreset(CANCEL_REASONS[0]); setActionError(null); }}
                disabled={actionLoading}
                style={modalSecondaryBtnStyle}
              >
                Dismiss
              </button>
              <button
                onClick={handleCancelJob}
                disabled={actionLoading}
                style={{
                  ...modalPrimaryBtnStyle,
                  background: 'linear-gradient(135deg, #f87171, #fb7185)',
                }}
              >
                {actionLoading ? 'Cancelling…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
};

const modalBoxStyle: React.CSSProperties = {
  background: '#1a1d27', borderRadius: 16, padding: 32, maxWidth: 500, width: '90%',
  border: '1px solid rgba(255,255,255,0.06)',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24,
};

const modalCloseBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#8b92a9', cursor: 'pointer', padding: 0,
};

const modalErrorStyle: React.CSSProperties = {
  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
  color: '#f87171', padding: '10px 12px', borderRadius: 8, marginBottom: 16,
  display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
};

const modalSecondaryBtnStyle: React.CSSProperties = {
  flex: 1, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
  color: '#c5cae0', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
};

const modalPrimaryBtnStyle: React.CSSProperties = {
  flex: 1, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
  color: 'white', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  border: 'none', cursor: 'pointer',
};
