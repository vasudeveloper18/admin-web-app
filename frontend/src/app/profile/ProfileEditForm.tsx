'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { AdminPageCard } from '@/components/layout/AdminPageCard';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { User } from '@/types';
import { updateProfileAction } from './actions';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(80),
  lastName: z.string().min(1, 'Last name is required').max(80),
  email: z.string().email('Enter a valid email'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  user: User;
}

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setSubmitError(null);
    setSuccessMessage(null);

    const result = await updateProfileAction(data);
    if (result.success) {
      setSuccessMessage('Your profile has been updated.');
      router.refresh();
    } else {
      setSubmitError(result.message);
    }
  };

  return (
    <div className="page-container animate-fadeIn">
      <div className="page-inner page-inner--full">
        <AdminPageCard
          title="Edit Profile"
          className="admin-page-card--form"
          actions={
            <button
              type="button"
              onClick={() => router.push('/jobs')}
              className="admin-page-card__btn admin-page-card__btn--secondary"
            >
              <ArrowLeft size={15} />
              Back
            </button>
          }
        >
          {submitError && (
            <div className="admin-page-card__alert">
              <AlertBanner title="Could not save profile" message={submitError} variant="error" />
            </div>
          )}
          {successMessage && (
            <div className="admin-page-card__alert">
              <AlertBanner title="Profile saved" message={successMessage} variant="success" />
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="admin-page-card__body profile-edit-form"
            noValidate
          >
            <div className="profile-edit-form__name-row">
              <div className="form-field">
                <label className="form-label" htmlFor="firstName">
                  First name *
                </label>
                <input id="firstName" className="form-input" {...register('firstName')} />
                {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="lastName">
                  Last name *
                </label>
                <input id="lastName" className="form-input" {...register('lastName')} />
                {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="email">
                Email *
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div className="form-actions">
              <button type="submit" disabled={isSubmitting} className="btn-submit">
                {isSubmitting ? (
                  <span className="btn-submit__loading">
                    <span className="data-table-spinner" />
                    Saving…
                  </span>
                ) : (
                  'Save changes'
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
