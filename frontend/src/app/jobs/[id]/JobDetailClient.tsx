'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { jobsApi, usersApi } from '@/lib/api';
import { Job, JobStatus, User } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  ChevronLeft, Calendar, MapPin, User2, AlignLeft, CheckCircle,
  AlertCircle, Settings, X, Image as ImageIcon, Navigation,
} from 'lucide-react';

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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

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

  const handleAssignTechnician = async (technicianId: string) => {
    if (!technicianId) return;

    const tech = technicians.find((t) => t.id === technicianId);
    const previousJob = job;

    // Optimistic update
    setJob((prev) => ({
      ...prev,
      status: JobStatus.ASSIGNED,
      assignedTechnician: tech || prev.assignedTechnician,
    }));
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await jobsApi.assignTechnician(job.id, technicianId);
      if (res.success) setJob(res.data);
    } catch (err: unknown) {
      setJob(previousJob);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setActionError(axiosErr?.response?.data?.message || 'Failed to assign technician');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassignTechnician = async () => {
    if (!confirm('Unassign technician from this job?')) return;

    const previousJob = job;
    setJob((prev) => ({
      ...prev,
      status: JobStatus.PENDING,
      assignedTechnician: null,
    }));
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await jobsApi.unassignTechnician(job.id);
      if (res.success) setJob(res.data);
    } catch (err: unknown) {
      setJob(previousJob);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setActionError(axiosErr?.response?.data?.message || 'Failed to unassign technician');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelJob = async () => {
    const trimmedReason = cancelReason.trim();
    if (trimmedReason.length < 5) {
      setActionError('Reason must be at least 5 characters long');
      return;
    }

    const previousJob = job;
    setJob((prev) => ({
      ...prev,
      status: JobStatus.CANCELLED,
      cancelReason: trimmedReason,
    }));
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await jobsApi.cancelJob(job.id, trimmedReason);
      if (res.success) {
        setJob(res.data);
        setShowCancelModal(false);
        setCancelReason('');
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

  const isTerminal =
    job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED;
  const canCancel =
    job.status !== JobStatus.COMPLETED && job.status !== JobStatus.CANCELLED;

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#0f1117' }} className="animate-fadeIn">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none', color: '#8b92a9',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 24, padding: 0,
          }}
        >
          <ChevronLeft size={16} /> Back to Jobs
        </button>

        <div style={{
          background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: 32, marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <StatusBadge status={job.status} size="md" />
            <div style={{ fontSize: 12, color: '#8b92a9' }}>ID: {job.id}</div>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f0f2f8', marginBottom: 8 }}>{job.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, color: '#8b92a9', fontSize: 13, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} /> {formatDate(job.scheduledDate)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} /> {job.address}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Navigation size={14} /> {job.latitude.toFixed(5)}, {job.longitude.toFixed(5)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
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
                      <a key={i} href={photo} target="_blank" rel="noopener noreferrer">
                        <img
                          src={photo}
                          alt={`Completion photo ${i + 1}`}
                          style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                      </a>
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

              {actionError && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 12px', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <AlertCircle size={14} />
                  <span>{actionError}</span>
                </div>
              )}

              {!isTerminal && (
                <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#c5cae0', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={14} color="#6366f1" /> Assigned Technician
                  </label>

                  {job.assignedTechnician ? (
                    <div>
                      <div style={{ marginBottom: 12, padding: '12px', background: '#0f1117', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)' }}>
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
                      <button
                        onClick={handleUnassignTechnician}
                        disabled={actionLoading}
                        style={{
                          width: '100%', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                          color: '#f87171', background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.2)', cursor: actionLoading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Unassign
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <select
                        value={selectedTechnicianId}
                        onChange={(e) => setSelectedTechnicianId(e.target.value)}
                        disabled={actionLoading || techLoading}
                        onClick={() => technicians.length === 0 && fetchTechnicians()}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 6, fontSize: 12,
                          background: '#0f1117', border: '1px solid rgba(99,102,241,0.3)',
                          color: '#c5cae0', cursor: actionLoading || techLoading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <option value="">
                          {techLoading ? 'Loading technicians...' : 'Select technician to assign...'}
                        </option>
                        {technicians.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.firstName} {tech.lastName} ({tech.email})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (selectedTechnicianId) {
                            handleAssignTechnician(selectedTechnicianId);
                            setSelectedTechnicianId('');
                          }
                        }}
                        disabled={actionLoading || !selectedTechnicianId}
                        style={{
                          padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                          color: selectedTechnicianId ? 'white' : '#8b92a9',
                          background: selectedTechnicianId ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(139,146,169,0.2)',
                          border: 'none', cursor: (actionLoading || !selectedTechnicianId) ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Assign
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isTerminal && (
                <p style={{ fontSize: 12, color: '#8b92a9', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {job.status === JobStatus.COMPLETED
                    ? 'This job is completed. Assignment changes are no longer available.'
                    : 'This job is cancelled. Assignment changes are no longer available.'}
                </p>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#c5cae0', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} color="#f87171" /> Cancel Job
                </label>
                {job.cancelReason && (
                  <p style={{ fontSize: 12, color: '#8b92a9', marginBottom: 10 }}>Reason: {job.cancelReason}</p>
                )}
                <button
                  onClick={() => setShowCancelModal(true)}
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
                    ? (job.status === JobStatus.COMPLETED ? 'Completed jobs cannot be cancelled' : 'Job Already Cancelled')
                    : 'Cancel Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#1a1d27', borderRadius: 16, padding: 32, maxWidth: 500, width: '90%',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f0f2f8' }}>Cancel Job</h2>
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); setActionError(null); }}
                disabled={actionLoading}
                style={{ background: 'none', border: 'none', color: '#8b92a9', cursor: actionLoading ? 'not-allowed' : 'pointer', padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div style={{
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171', padding: '10px 12px', borderRadius: 8, marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
              }}>
                <AlertCircle size={14} />
                <span>{actionError}</span>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#c5cae0', marginBottom: 8, display: 'block' }}>
                Cancellation Reason <span style={{ color: '#f87171' }}>*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => { setCancelReason(e.target.value); setActionError(null); }}
                placeholder="Enter reason (minimum 5 characters)..."
                disabled={actionLoading}
                style={{
                  width: '100%', padding: '12px', borderRadius: 8,
                  background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)',
                  color: '#c5cae0', fontSize: 13, fontFamily: 'inherit',
                  resize: 'vertical', minHeight: 100, outline: 'none',
                }}
              />
              <div style={{ fontSize: 11, color: '#8b92a9', marginTop: 6 }}>
                {cancelReason.trim().length}/5 minimum characters required
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); setActionError(null); }}
                disabled={actionLoading}
                style={{
                  flex: 1, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  color: '#c5cae0', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)', cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Dismiss
              </button>
              <button
                onClick={handleCancelJob}
                disabled={actionLoading || cancelReason.trim().length < 5}
                style={{
                  flex: 1, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  color: cancelReason.trim().length < 5 ? '#8b92a9' : 'white',
                  background: cancelReason.trim().length < 5 ? 'rgba(139,146,169,0.2)' : 'linear-gradient(135deg, #f87171, #fb7185)',
                  border: 'none', cursor: (actionLoading || cancelReason.trim().length < 5) ? 'not-allowed' : 'pointer',
                }}
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
