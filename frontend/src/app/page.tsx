import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function RootPage() {
  const cookieStore = await cookies();
  const hasToken =
    cookieStore.get('accessToken')?.value ||
    cookieStore.get('refreshToken')?.value;

  if (hasToken) {
    redirect('/jobs');
  } else {
    redirect('/login');
  }
}
