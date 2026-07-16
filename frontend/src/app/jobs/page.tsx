import type { Metadata } from 'next';
import { fetchJobs } from '@/lib/server-api';
import { JobsTable } from './JobsTable';
import { JobStatus } from '@/types';

export const metadata: Metadata = {
  title: 'Jobs',
};

interface JobsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;

  const page = Number(params.page || '1');
  const limit = Number(params.limit || '10');
  const status = (params.status || '') as JobStatus | '';
  const technician = (params.technician || '') as string;
  const startDate = (params.startDate || '') as string;
  const endDate = (params.endDate || '') as string;
  const search = (params.search || '') as string;
  const sortBy = (params.sortBy || 'scheduledDate') as string;
  const sortOrder = (params.sortOrder || 'desc') as 'asc' | 'desc';

  const initialData = await fetchJobs({
    page,
    limit,
    sortBy,
    sortOrder,
    ...(status && { status }),
    ...(technician && { technician }),
    ...(startDate && { startDate: `${startDate}T00:00:00.000Z` }),
    ...(endDate && { endDate: `${endDate}T23:59:59.999Z` }),
    ...(search && { search }),
  });

  return <JobsTable initialData={initialData} />;
}
