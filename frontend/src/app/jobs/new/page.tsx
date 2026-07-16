import type { Metadata } from 'next';
import { NewJobForm } from './NewJobForm';

export const metadata: Metadata = {
  title: 'Create Job',
};

export default function NewJobPage() {
  return <NewJobForm />;
}
