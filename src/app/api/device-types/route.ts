import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    const deviceTypes = await db.deviceType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: deviceTypes });
  } catch (err: any) {
    console.error('GET /api/device-types error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงประเภทอุปกรณ์' }, { status: 500 });
  }
}
