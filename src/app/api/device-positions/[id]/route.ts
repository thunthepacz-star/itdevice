import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN') && !session.roles.includes('OFFICER')) {
      return createForbiddenResponse('คุณไม่มีสิทธิ์ในการถอด Marker อุปกรณ์ออกจากแผนผัง');
    }

    const { id } = await params;

    const position = await db.devicePosition.findFirst({
      where: { id },
      include: { device: true },
    });

    if (!position) {
      return NextResponse.json({ error: 'ไม่พบตำแหน่งอุปกรณ์ที่ต้องการลบ' }, { status: 404 });
    }

    await db.devicePosition.update({
      where: { id },
      data: { isCurrent: false, effectiveTo: new Date() },
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'REMOVE_DEVICE_MARKER',
        resource: 'DEVICE_POSITION',
        resourceId: id,
        details: `ถอด Marker ของอุปกรณ์ ${position.device?.assetCode || id} ออกจากแผนผัง`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({ success: true, message: 'ถอด Marker ออกจากแผนผังเรียบร้อยแล้ว' });
  } catch (err: any) {
    console.error('DELETE /api/device-positions/[id] error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการถอด Marker' }, { status: 500 });
  }
}
