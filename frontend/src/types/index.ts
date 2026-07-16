// ─── Enums ───────────────────────────────────────────────────────────────────

export enum JobStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  TECHNICIAN = 'TECHNICIAN',
}

// ─── Entities ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  description?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  latitude: number;
  longitude: number;
  location: { type: string; coordinates: [number, number] };
  status: JobStatus;
  assignedTechnician?: User | null;
  completionNotes?: string;
  completionPhotos: string[];
  scheduledDate: string;
  completedDate?: string | null;
  cancelReason?: string;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface PaginatedJobs {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface JobsQueryParams {
  page?: number;
  limit?: number;
  status?: JobStatus | '';
  technician?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
