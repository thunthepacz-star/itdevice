import { NextResponse } from 'next/server';
import { getSession, createUnauthorizedResponse } from '@/lib/auth';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      roles: session.roles,
    },
  });
}
