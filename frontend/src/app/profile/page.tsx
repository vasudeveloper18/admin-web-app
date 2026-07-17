import type { Metadata } from 'next';
import { fetchMe } from '@/lib/server-api';
import { ProfileEditForm } from './ProfileEditForm';

export const metadata: Metadata = {
  title: 'Edit Profile',
};

export default async function ProfilePage() {
  const user = await fetchMe();

  return <ProfileEditForm user={user} />;
}
