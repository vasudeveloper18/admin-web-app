'use server';

import { revalidatePath } from 'next/cache';
import {
  assignTechnician as assignTechnicianApi,
  unassignTechnician as unassignTechnicianApi,
  cancelJob as cancelJobApi,
  createJob as createJobApi,
  ServerApiError,
} from '@/lib/server-api';
import { Job } from '@/types';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; message: string };

function toActionError(err: unknown): ActionResult<never> {
  if (err instanceof ServerApiError) {
    return { success: false, message: err.message };
  }
  return { success: false, message: 'An unexpected error occurred' };
}

export async function createJobAction(data: {
  title: string;
  description?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  latitude: number;
  longitude: number;
  scheduledDate: string;
}): Promise<ActionResult<Job>> {
  try {
    const job = await createJobApi(data);
    revalidatePath('/jobs');
    return { success: true, data: job };
  } catch (err) {
    return toActionError(err);
  }
}

export async function assignTechnicianAction(
  jobId: string,
  technicianId: string
): Promise<ActionResult<Job>> {
  try {
    const job = await assignTechnicianApi(jobId, technicianId);
    revalidatePath('/jobs');
    revalidatePath(`/jobs/${jobId}`);
    return { success: true, data: job };
  } catch (err) {
    return toActionError(err);
  }
}

export async function unassignTechnicianAction(jobId: string): Promise<ActionResult<Job>> {
  try {
    const job = await unassignTechnicianApi(jobId);
    revalidatePath('/jobs');
    revalidatePath(`/jobs/${jobId}`);
    return { success: true, data: job };
  } catch (err) {
    return toActionError(err);
  }
}

export async function cancelJobAction(
  jobId: string,
  reason: string
): Promise<ActionResult<Job>> {
  try {
    const job = await cancelJobApi(jobId, reason);
    revalidatePath('/jobs');
    revalidatePath(`/jobs/${jobId}`);
    return { success: true, data: job };
  } catch (err) {
    return toActionError(err);
  }
}
