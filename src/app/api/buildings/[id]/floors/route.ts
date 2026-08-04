import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { floorSchema } from '@/schemas/building-schema';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    const { id: buildingId } = await params;

    const floors = await db.floor.findMany({
      where: { buildingId, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: {
            floorPlans: { where: { deletedAt: null } },
            devices: { where: { deletedAt: null } },
          },
        },
      },
    });

    return NextResponse.json({ data: floors });
  } catch (err: any) {
    console.error('GET /api/buildings/[id]/floors error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงรายการชั้น' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN') && !session.roles.includes('OFFICER')) {
      return createForbiddenResponse('คุณไม่มีสิทธิ์ในการเพิ่มชั้นของอาคาร');
    }

    const { id: buildingId } = await params;
    const body = await req.json();
    const validation = floorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const data = validation.data;

    // Check building exists
    const building = await db.building.findFirst({
      where: { id: buildingId, deletedAt: null },
    });

    if (!building) {
      return NextResponse.json({ error: 'ไม่พบอาคารที่ต้องการเพิ่มชั้น' }, { status: 404 });
    }

    const floor = await db.floor.create({
      data: {
        ...data,
        buildingId,
        createdBy: session.userId,
      },
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CREATE_FLOOR',
        resource: 'FLOOR',
        resourceId: floor.id,
        details: `เพิ่มชั้นใหม่: ${floor.name} ในอาคาร ${building.name}`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({ success: true, data: floor }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/buildings/[id]/floors error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเพิ่มชั้นของอาคาร' }, { status: 500 });
  }
}
