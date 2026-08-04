import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { updateFloorSchema } from '@/schemas/building-schema';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    const { id } = await params;

    const floor = await db.floor.findFirst({
      where: { id, deletedAt: null },
      include: {
        building: true,
        floorPlans: {
          where: { deletedAt: null },
          orderBy: { version: 'desc' },
        },
        _count: {
          select: {
            devices: { where: { deletedAt: null } },
            rooms: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!floor) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลชั้นที่ต้องการ' }, { status: 404 });
    }

    return NextResponse.json({ data: floor });
  } catch (err: any) {
    console.error('GET /api/floors/[id] error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลชั้น' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN') && !session.roles.includes('OFFICER')) {
      return createForbiddenResponse('คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลชั้น');
    }

    const { id } = await params;
    const body = await req.json();
    const validation = updateFloorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const existingFloor = await db.floor.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingFloor) {
      return NextResponse.json({ error: 'ไม่พบชั้นที่ต้องการแก้ไข' }, { status: 404 });
    }

    const updated = await db.floor.update({
      where: { id },
      data: {
        ...validation.data,
        updatedBy: session.userId,
      },
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPDATE_FLOOR',
        resource: 'FLOOR',
        resourceId: id,
        details: `แก้ไขข้อมูลชั้นและ 3D Spatial: ${updated.name} (Elevation: ${updated.floorElevation}m, RotY: ${updated.rotationY}°)`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('PATCH /api/floors/[id] error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการปรับปรุงข้อมูลชั้น' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN')) {
      return createForbiddenResponse('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบชั้นได้');
    }

    const { id } = await params;

    const floor = await db.floor.findFirst({
      where: { id, deletedAt: null },
    });

    if (!floor) {
      return NextResponse.json({ error: 'ไม่พบชั้นที่ต้องการลบ' }, { status: 404 });
    }

    await db.floor.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, updatedBy: session.userId },
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'DELETE_FLOOR',
        resource: 'FLOOR',
        resourceId: id,
        details: `ลบชั้น (Soft Delete): ${floor.name}`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({ success: true, message: 'ลบข้อมูลชั้นเรียบร้อยแล้ว' });
  } catch (err: any) {
    console.error('DELETE /api/floors/[id] error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบชั้น' }, { status: 500 });
  }
}
