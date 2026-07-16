'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api';
import { BRAND } from '@/lib/branding';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { AlertBanner } from '@/components/ui/AlertBanner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<{ title: string; message?: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const res = await authApi.login(data.email, data.password);
      if (res.success) {
        router.push('/jobs');
        router.refresh();
      } else {
        setServerError({
          title: 'Login failed',
          message: res.message || 'Please check your email and password and try again.',
        });
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      const status = axiosErr?.response?.status;
      const msg = axiosErr?.response?.data?.message;

      if (!axiosErr?.response) {
        setServerError({
          title: 'Cannot connect to server',
          message: 'Make sure the backend API is running (npm run start:dev in the backend folder).',
        });
      } else if (status === 401) {
        setServerError({
          title: 'Invalid credentials',
          message: msg || 'The email or password you entered is incorrect.',
        });
      } else if (status === 403) {
        setServerError({
          title: 'Access denied',
          message: msg || 'Only admin accounts can sign in to this panel.',
        });
      } else {
        setServerError({
          title: 'Login failed',
          message: msg || 'Something went wrong. Please try again.',
        });
      }
    }
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    background: 'rgba(15,17,23,0.8)',
    border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
    boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f1117 0%, #1a1d27 50%, #0f1117 100%)' }}
    >
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }}
      />

      <div
        className="animate-fadeIn relative w-full max-w-md mx-4"
        style={{
          padding: '32px',
          maxWidth: '448px',
          borderRadius: '16px',
          background: 'rgba(26, 29, 39, 0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="text-center mb-8">
          <BrandLogo size="lg" showSubtitle subtitle={BRAND.loginSubtitle} />
        </div>

        {serverError && (
          <AlertBanner
            title={serverError.title}
            message={serverError.message}
            variant="error"
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#c5cae0' }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              {...register('email')}
              className="login-input w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 transition-all duration-200 focus:outline-none"
              style={inputStyle(!!errors.email)}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#c5cae0' }}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
                className="login-input w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-gray-600 transition-all duration-200 focus:outline-none"
                style={inputStyle(!!errors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: '#8b92a9' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 mt-2"
            style={{
              background: isSubmitting
                ? 'rgba(99,102,241,0.5)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: isSubmitting ? 'none' : '0 4px 15px rgba(99,102,241,0.4)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Signing in…
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
