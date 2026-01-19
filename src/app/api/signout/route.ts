import { NextResponse } from 'next/server';
import { deleteCurrentSession } from '@/server/auth';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const sessionCookie = (await cookies()).get('session');
    
    if (sessionCookie) {
      await deleteCurrentSession(sessionCookie.value);
      (await cookies()).delete('session');
    }

    return NextResponse.json({ message: 'Logout successful' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
