import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    const { id } = await params;

    const plan = await db.floorPlan.findFirst({
      where: { id, deletedAt: null },
      include: {
        floor: true,
        building: true,
        devicePositions: {
          where: { isCurrent: true },
          include: {
            device: {
              include: { deviceType: true },
            },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลแผนผังที่ต้องการ' }, { status: 404 });
    }

    return NextResponse.json({ data: plan });
  } catch (err: any) {
    console.error('GET /api/floor-plans/[id] error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนผัง' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN') && !session.roles.includes('OFFICER')) {
      return createForbiddenResponse('คุณไม่มีสิทธิ์ในการแก้ไขตั้งค่าแผนผัง');
    }

    const { id } = await params;
    const body = await req.json();

    const plan = await db.floorPlan.findFirst({
      where: { id, deletedAt: null },
    });

    if (!plan) {
      return NextResponse.json({ error: 'ไม่พบแผนผังที่ต้องการแก้ไข' }, { status: 404 });
    }

    const updated = await db.floorPlan.update({
      where: { id },
      data: {
        name: body.name ?? plan.name,
        textureOffsetX: body.textureOffsetX !== undefined ? Number(body.textureOffsetX) : plan.textureOffsetX,
        textureOffsetY: body.textureOffsetY !== undefined ? Number(body.textureOffsetY) : plan.textureOffsetY,
        textureScaleX: body.textureScaleX !== undefined ? Number(body.textureScaleX) : plan.textureScaleX,
        textureScaleY: body.textureScaleY !== undefined ? Number(body.textureScaleY) : plan.textureScaleY,
        textureRotation: body.textureRotation !== undefined ? Number(body.textureRotation) : plan.textureRotation,
        textureOpacity: body.textureOpacity !== undefined ? Number(body.textureOpacity) : plan.textureOpacity,
      },
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPDATE_FLOOR_PLAN',
        resource: 'FLOOR_PLAN',
        resourceId: id,
        details: `ปรับแต่ง Texture & Display Settings ของแผนผัง v${plan.version}`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('PATCH /api/floor-plans/[id] error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการปรับปรุงข้อมูลแผนผัง' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN')) {
      return createForbiddenResponse('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบแผนผังได้');
    }

    const { id } = await params;

    const plan = await db.floorPlan.findFirst({
      where: { id, deletedAt: null },
    });

    if (!plan) {
      return NextResponse.json({ error: 'ไม่พบแผนผังที่ต้องการลบ' }, { status: 404 });
    }

    await db.floorPlan.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'DELETE_FLOOR_PLAN',
        resource: 'FLOOR_PLAN',
        resourceId: id,
        details: `ลบเวอร์ชันแผนผัง (Soft Delete): ${plan.name} v${plan.version}`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({ success: true, message: 'ลบเวอร์ชันแผนผังเรียบร้อยแล้ว' });
  } catch (err: any) {
    console.error('DELETE /api/floor-plans/[id] error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบแผนผัง' }, { status: 500 });
  }
}
