'use client';

import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { jobsApi } from '@/lib/api';
import { useState } from 'react';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';

const jobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  customerName: z.string().min(2, 'Name required'),
  customerPhone: z.string().min(5, 'Phone required'),
  customerEmail: z.string().email('Invalid email'),
  address: z.string().min(5, 'Address required'),
  latitude: z.number().refine((v) => v !== 0, 'Please select an address from the suggestions'),
  longitude: z.number().refine((v) => v !== 0, 'Please select an address from the suggestions'),
  scheduledDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
});

type JobForm = z.infer<typeof jobSchema>;

export function NewJobForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      address: '',
      latitude: 0,
      longitude: 0,
    },
  });

  const onSubmit = async (data: JobForm) => {
    setServerError(null);
    try {
      const res = await jobsApi.createJob({
        title: data.title,
        description: data.description,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
      });
      reset();
      router.push(`/jobs/${res.data.id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(axiosErr?.response?.data?.message || 'Failed to create job.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f1117', position: 'relative' }}>
      <button onClick={() => router.back()} style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 4, color: '#8b92a9', fontSize: 13, zIndex: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ padding: '32px', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '1200px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f0f2f8', marginBottom: 20, textAlign: 'center' }}>Create New Job</h2>

          {serverError && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 24 }}>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#c5cae0' }}>Job Title *</label>
              <input {...register('title')} placeholder="e.g. HVAC Maintenance" className="w-full px-4 py-2 rounded-xl bg-opacity-80 bg-[#0f1117] border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1]" />
              {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#c5cae0' }}>Description</label>
              <textarea {...register('description')} rows={3} placeholder="Optional notes…" className="w-full px-4 py-2 rounded-xl bg-opacity-80 bg-[#0f1117] border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1]" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#c5cae0' }}>Customer Name *</label>
                <input {...register('customerName')} placeholder="John Doe" className="w-full px-3 py-2 rounded-xl bg-opacity-80 bg-[#0f1117] border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1]" />
                {errors.customerName && <p className="mt-1 text-xs text-red-400">{errors.customerName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#c5cae0' }}>Phone *</label>
                <input {...register('customerPhone')} placeholder="617-555-0101" className="w-full px-3 py-2 rounded-xl bg-opacity-80 bg-[#0f1117] border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1]" />
                {errors.customerPhone && <p className="mt-1 text-xs text-red-400">{errors.customerPhone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#c5cae0' }}>Email *</label>
                <input {...register('customerEmail')} placeholder="john@example.com" className="w-full px-3 py-2 rounded-xl bg-opacity-80 bg-[#0f1117] border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1]" />
                {errors.customerEmail && <p className="mt-1 text-xs text-red-400">{errors.customerEmail.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#c5cae0' }}>Address *</label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <AddressAutocomplete
                    value={field.value}
                    disabled={isSubmitting}
                    error={errors.address?.message || errors.latitude?.message || errors.longitude?.message}
                    onChange={(selection) => {
                      field.onChange(selection.address);
                      setValue('latitude', selection.latitude, { shouldValidate: true });
                      setValue('longitude', selection.longitude, { shouldValidate: true });
                    }}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#c5cae0' }}>Scheduled Date & Time *</label>
              <input {...register('scheduledDate')} type="datetime-local" className="w-full px-3 py-2 rounded-xl bg-opacity-80 bg-[#0f1117] border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1]" />
              {errors.scheduledDate && <p className="mt-1 text-xs text-red-400">{errors.scheduledDate.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors" style={{ background: isSubmitting ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Creating…</span>
              ) : (
                'Create Job'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
