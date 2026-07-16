'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jobsApi, usersApi } from '@/lib/api';
import { Job, User } from '@/types';
import { PageLoader } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ChevronLeft, Calendar, MapPin, User2, AlignLeft, CheckCircle, AlertCircle, Settings, X } from 'lucide-react';

export default function JobDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [techLoading, setTechLoading] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await jobsApi.getJob(id as string);
        if (res.success) {
          setJob(res.data);
        } else {
          setError('Job not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch job details.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const fetchTechnicians = async () => {
    setTechLoading(true);
    try {
      const res = await usersApi.getTechnicians();
      if (res.success) {
        setTechnicians(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch technicians:', err);
    } finally {
      setTechLoading(false);
    }
  };

  const handleAssignTechnician = async (technicianId: string) => {
    if (!technicianId) return;
    
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await jobsApi.assignTechnician(id as string, technicianId);
      if (res.success) {
        setJob(res.data);
      }
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to assign technician');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassignTechnician = async () => {
    if (!confirm('Unassign technician from this job?')) return;
    
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await jobsApi.unassignTechnician(id as string);
      if (res.success) {
        setJob(res.data);
      }
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to unassign technician');
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
    
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await jobsApi.cancelJob(id as string, trimmedReason);
      if (res.success) {
        setJob(res.data);
        setShowCancelModal(false);
        setCancelReason('');
      }
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to cancel job');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40 }}><PageLoader /></div>;
  if (error || !job) return <div style={{ padding: 40, color: '#ef4444' }}>{error || 'Not found'}</div>;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const tech = job.assignedTechnician as User | undefined;

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#0f1117' }} className="animate-fadeIn">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none', color: '#8b92a9',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 24,
            padding: 0
          }}
        >
          <ChevronLeft size={16} /> Back to Jobs
        </button>

        {/* Header */}
        <div style={{
          background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: 32, marginBottom: 24,
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <StatusBadge status={job.status} size="md" />
              <div style={{ fontSize: 12, color: '#8b92a9' }}>ID: {job.id}</div>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f0f2f8', marginBottom: 8 }}>{job.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, color: '#8b92a9', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} /> {formatDate(job.scheduledDate)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} /> {job.address}
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          {/* Left Col - Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{
              background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: 24
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e5f0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlignLeft size={16} color="#6366f1" /> Description
              </h3>
              <p style={{ fontSize: 14, color: '#c5cae0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {job.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Right Col - Customer & Technician */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Customer Details */}
            <div style={{
              background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: 24
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e5f0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User2 size={16} color="#6366f1" /> Customer Details
              </h3>
              <div style={{ fontSize: 14, color: '#c5cae0', fontWeight: 500, marginBottom: 4 }}>{job.customerName}</div>
              <div style={{ fontSize: 13, color: '#8b92a9' }}>{job.customerEmail}</div>
              {job.customerPhone && <div style={{ fontSize: 13, color: '#8b92a9', marginTop: 4 }}>{job.customerPhone}</div>}
            </div>

            {/* Admin Actions Section */}
            <div style={{
              background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: 24
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

              {job?.status !== 'CANCELLED' && (
                <>
                  {/* Assigned Technician Section */}
                  <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#c5cae0', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={14} color="#6366f1" /> Assigned Technician
                    </label>
                    
                    {job?.assignedTechnician ? (
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
                          onClick={() => {
                            if (technicians.length === 0) {
                              fetchTechnicians();
                            }
                          }}
                          style={{
                            flex: 1, padding: '8px 12px', borderRadius: 6, fontSize: 12,
                            background: '#0f1117', border: '1px solid rgba(99,102,241,0.3)',
                            color: '#c5cae0', cursor: actionLoading || techLoading ? 'not-allowed' : 'pointer',
                            opacity: actionLoading || techLoading ? 0.6 : 1,
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
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Assign
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Cancel Job Section */}
              <div style={{ marginTop: job?.status === 'CANCELLED' ? 0 : 0 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#c5cae0', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} color="#f87171" /> Cancel Job
                </label>
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={actionLoading || job.status === 'CANCELLED'}
                  style={{
                    width: '100%', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                    color: '#f87171', background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)', cursor: (actionLoading || job.status === 'CANCELLED') ? 'not-allowed' : 'pointer',
                    opacity: (job.status === 'CANCELLED') ? 0.5 : 1,
                  }}
                >
                  {job.status === 'CANCELLED' ? 'Job Already Cancelled' : 'Cancel Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Job Modal */}
      {showCancelModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1d27', borderRadius: 16, padding: 32, maxWidth: 500, width: '90%',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f0f2f8' }}>Cancel Job</h2>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setActionError(null);
                }}
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
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 12
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
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setActionError(null);
                }}
                placeholder="Enter reason (minimum 5 characters)..."
                disabled={actionLoading}
                style={{
                  width: '100%', padding: '12px', borderRadius: 8,
                  background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)',
                  color: '#c5cae0', fontSize: 13, fontFamily: 'inherit',
                  resize: 'vertical', minHeight: 100,
                  outline: 'none',
                  opacity: actionLoading ? 0.6 : 1,
                  cursor: actionLoading ? 'not-allowed' : 'text',
                }}
                onFocus={(e) => {
                  (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(99,102,241,0.5)';
                }}
                onBlur={(e) => {
                  (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.06)';
                }}
              />
              <div style={{ fontSize: 11, color: '#8b92a9', marginTop: 6 }}>
                {cancelReason.trim().length}/5 minimum characters required
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setActionError(null);
                }}
                disabled={actionLoading}
                style={{
                  flex: 1, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  color: '#c5cae0', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)', cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
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

