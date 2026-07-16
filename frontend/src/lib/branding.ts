export const BRAND = {
  applicationName: 'FieldOps',
  adminPanelTitle: 'FieldOps Admin',
  browserTitle: 'FieldOps Admin',
  apiTitle: 'FieldOps API',
  tagline: 'Field job dispatch & management',
  loginSubtitle: 'Sign in to the admin dashboard',
} as const;

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
