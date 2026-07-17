'use client';

import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { createJobAction } from '@/app/jobs/actions';
import { useState } from 'react';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AdminPageCard } from '@/components/layout/AdminPageCard';

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
    clearErrors,
    watch,
    formState: { errors, isSubmitting, submitCount },
    reset,
  } = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      address: '',
      latitude: 0,
      longitude: 0,
    },
  });

  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const coordinatesSet = latitude !== 0 && longitude !== 0;

  const addressError = submitCount > 0
    ? (errors.address?.message || errors.latitude?.message || errors.longitude?.message)
    : undefined;

  const onSubmit = async (data: JobForm) => {
    setServerError(null);
    try {
      const res = await createJobAction({
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
      if (!res.success) {
        setServerError(res.message);
        return;
      }
      reset();
      router.push(`/jobs/${res.data.id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(axiosErr?.response?.data?.message || 'Failed to create job.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-inner page-inner--full">
        <AdminPageCard
          title="Create New Job"
          className="admin-page-card--form"
          actions={
            <button type="button" onClick={() => router.push('/jobs')} className="admin-page-card__btn admin-page-card__btn--secondary">
              <ArrowLeft size={15} />
              Back
            </button>
          }
        >
          {serverError && (
            <div className="admin-page-card__alert">
              <AlertBanner title="Could not create job" message={serverError} variant="error" />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="admin-page-card__body">
            <div className="form-field">
              <label className="form-label">Job Title *</label>
              <input {...register('title')} placeholder="e.g. HVAC Maintenance" className="form-input" />
              {errors.title && <p className="form-error">{errors.title.message}</p>}
            </div>

            <div className="form-field">
              <label className="form-label">Description</label>
              <textarea {...register('description')} rows={3} placeholder="Optional notes…" className="form-input form-textarea" />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Customer Name *</label>
                <input {...register('customerName')} placeholder="John Doe" className="form-input" />
                {errors.customerName && <p className="form-error">{errors.customerName.message}</p>}
              </div>
              <div className="form-field">
                <label className="form-label">Phone *</label>
                <input {...register('customerPhone')} placeholder="617-555-0101" className="form-input" />
                {errors.customerPhone && <p className="form-error">{errors.customerPhone.message}</p>}
              </div>
              <div className="form-field">
                <label className="form-label">Email *</label>
                <input {...register('customerEmail')} placeholder="john@example.com" className="form-input" />
                {errors.customerEmail && <p className="form-error">{errors.customerEmail.message}</p>}
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Address *</label>
              <input type="hidden" {...register('latitude', { valueAsNumber: true })} />
              <input type="hidden" {...register('longitude', { valueAsNumber: true })} />
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <AddressAutocomplete
                    value={field.value}
                    disabled={isSubmitting}
                    error={addressError}
                    coordinatesSet={coordinatesSet}
                    onChange={(selection) => {
                      field.onChange(selection.address);
                      setValue('latitude', selection.latitude, { shouldValidate: false, shouldDirty: true });
                      setValue('longitude', selection.longitude, { shouldValidate: false, shouldDirty: true });
                      if (selection.latitude !== 0 && selection.longitude !== 0) {
                        clearErrors(['latitude', 'longitude', 'address']);
                      }
                    }}
                  />
                )}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Scheduled Date & Time *</label>
              <input {...register('scheduledDate')} type="datetime-local" className="form-input" />
              {errors.scheduledDate && <p className="form-error">{errors.scheduledDate.message}</p>}
            </div>

            <div className="form-actions">
              <button type="submit" disabled={isSubmitting} className="btn-submit">
                {isSubmitting ? (
                  <span className="btn-submit__loading">
                    <span className="data-table-spinner" />
                    Creating…
                  </span>
                ) : (
                  'Create Job'
                )}
              </button>
              <button
                type="button"
                className="btn-cancel"
                disabled={isSubmitting}
                onClick={() => router.push('/jobs')}
              >
                Cancel
              </button>
            </div>
          </form>
        </AdminPageCard>
      </div>
    </div>
  );
}
