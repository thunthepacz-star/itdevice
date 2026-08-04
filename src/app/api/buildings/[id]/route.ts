import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { updateBuildingSchema } from '@/schemas/building-schema';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    const { id } = await params;

    const building = await db.building.findFirst({
      where: { id, deletedAt: null },
      include: {
        floors: {
          where: { deletedAt: null },
          orderBy: { displayOrder: 'asc' },
          include: {
            _count: {
              select: {
                floorPlans: { where: { deletedAt: null } },
                devices: { where: { deletedAt: null } },
              },
            },
          },
        },
        _count: {
          select: {
            devices: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!building) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลอาคารที่ต้องการ' }, { status: 404 });
    }

    return NextResponse.json({ data: building });
  } catch (err: any) {
    console.error('GET /api/buildings/[id] error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงรายละเอียดอาคาร' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN') && !session.roles.includes('OFFICER')) {
      return createForbiddenResponse('คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลอาคาร');
    }

    const { id } = await params;
    const body = await req.json();
    const validation = updateBuildingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const existingBuilding = await db.building.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingBuilding) {
      return NextResponse.json({ error: 'ไม่พบอาคารที่ต้องการแก้ไข' }, { status: 404 });
    }

    const updated = await db.building.update({
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
        action: 'UPDATE_BUILDING',
        resource: 'BUILDING',
        resourceId: id,
        details: `แก้ไขข้อมูลอาคาร: ${updated.name} (${updated.code})`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('PATCH /api/buildings/[id] error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการปรับปรุงข้อมูลอาคาร' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN')) {
      return createForbiddenResponse('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบอาคารได้');
    }

    const { id } = await params;

    const building = await db.building.findFirst({
      where: { id, deletedAt: null },
    });

    if (!building) {
      return NextResponse.json({ error: 'ไม่พบอาคารที่ต้องการลบ' }, { status: 404 });
    }

    // Soft delete building and associated floors
    const now = new Date();
    await db.$transaction([
      db.building.update({
        where: { id },
        data: { deletedAt: now, isActive: false, updatedBy: session.userId },
      }),
      db.floor.updateMany({
        where: { buildingId: id, deletedAt: null },
        data: { deletedAt: now, isActive: false, updatedBy: session.userId },
      }),
    ]);

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'DELETE_BUILDING',
        resource: 'BUILDING',
        resourceId: id,
        details: `ลบอาคาร (Soft Delete): ${building.name} (${building.code})`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({ success: true, message: 'ลบข้อมูลอาคารเรียบร้อยแล้ว (Soft Delete)' });
  } catch (err: any) {
    console.error('DELETE /api/buildings/[id] error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบอาคาร' }, { status: 500 });
  }
}
