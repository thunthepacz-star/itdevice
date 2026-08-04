import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN') && !session.roles.includes('OFFICER')) {
      return createForbiddenResponse('คุณไม่มีสิทธิ์ในการเปิดใช้งานเวอร์ชันแผนผัง');
    }

    const { id } = await params;

    const targetPlan = await db.floorPlan.findFirst({
      where: { id, deletedAt: null },
      include: { floor: true, building: true },
    });

    if (!targetPlan) {
      return NextResponse.json({ error: 'ไม่พบแผนผังที่ต้องการเปิดใช้งาน' }, { status: 404 });
    }

    // Transaction: Deactivate all plans on this floor, then Activate target plan
    const activatedPlan = await db.$transaction(async (tx) => {
      await tx.floorPlan.updateMany({
        where: { floorId: targetPlan.floorId, deletedAt: null },
        data: { isActive: false },
      });

      return await tx.floorPlan.update({
        where: { id: targetPlan.id },
        data: { isActive: true },
      });
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'ACTIVATE_FLOOR_PLAN',
        resource: 'FLOOR_PLAN',
        resourceId: id,
        details: `สลับเปิดใช้งานแผนผัง v${targetPlan.version}: ${targetPlan.name} (${targetPlan.floor.name})`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({ success: true, data: activatedPlan });
  } catch (err: any) {
    console.error('PATCH /api/floor-plans/[id]/activate error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสลับ Active Floor Plan' }, { status: 500 });
  }
}
