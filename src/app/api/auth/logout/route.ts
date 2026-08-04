import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    if (session) {
      await db.auditLog.create({
        data: {
          userId: session.userId,
          action: 'LOGOUT',
          resource: 'AUTH',
          details: `ออกจากระบบสำหรับผู้ใช้ ${session.name}`,
          ipAddress: clientIp,
        },
      });
    }

    await clearSessionCookie();

    return NextResponse.json({ success: true, message: 'ออกจากระบบเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการออกจากระบบ' }, { status: 500 });
  }
}
