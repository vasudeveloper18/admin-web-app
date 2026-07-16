import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchJob, ServerApiError } from '@/lib/server-api';
import { JobDetailClient } from './JobDetailClient';

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const job = await fetchJob(id);
    return { title: job.title };
  } catch {
    return { title: 'Job Details' };
  }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;

  try {
    const job = await fetchJob(id);
    return <JobDetailClient initialJob={job} />;
  } catch (err) {
    if (err instanceof ServerApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }
}
