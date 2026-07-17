'use server';

import { revalidatePath } from 'next/cache';
import { updateProfile as updateProfileApi, ServerApiError } from '@/lib/server-api';
import { User } from '@/types';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; message: string };

export async function updateProfileAction(data: {
  firstName: string;
  lastName: string;
  email: string;
}): Promise<ActionResult<User>> {
  try {
    const user = await updateProfileApi(data);
    revalidatePath('/profile');
    return { success: true, data: user };
  } catch (err) {
    if (err instanceof ServerApiError) {
      return { success: false, message: err.message };
    }
    return { success: false, message: 'An unexpected error occurred' };
  }
}
