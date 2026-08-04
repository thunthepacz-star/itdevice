import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';

    const whereCondition: any = { AND: [] };

    if (q) {
      whereCondition.AND.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { device: { assetCode: { contains: q, mode: 'insensitive' } } },
          { device: { deviceName: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    if (status) whereCondition.AND.push({ status });

    const records = await db.maintenanceRecord.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: {
        device: {
          include: { building: true, floor: true, deviceType: true },
        },
      },
    });

    return NextResponse.json({ data: records });
  } catch (err: any) {
    console.error('GET /api/maintenance error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการซ่อมบำรุง' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN') && !session.roles.includes('OFFICER')) {
      return createForbiddenResponse('คุณไม่มีสิทธิ์ในการบันทึกการซ่อมบำรุง');
    }

    const body = await req.json();
    const { deviceId, title, description, maintenanceType, cost, vendor, status } = body;

    if (!deviceId || !title) {
      return NextResponse.json({ error: 'กรุณาระบุ Device ID และหัวข้อการซ่อมบำรุง' }, { status: 400 });
    }

    const newRecord = await db.$transaction(async (tx) => {
      const created = await tx.maintenanceRecord.create({
        data: {
          deviceId,
          title,
          description,
          maintenanceType: maintenanceType || 'CORRECTIVE',
          status: status || 'PENDING',
          cost: cost ? Number(cost) : undefined,
          vendor,
          createdBy: session.userId,
        },
      });

      // Update Device status to IN_REPAIR if creating a repair ticket
      if (status === 'IN_PROGRESS' || maintenanceType === 'CORRECTIVE') {
        await tx.device.update({
          where: { id: deviceId },
          data: { status: 'IN_REPAIR' },
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/maintenance error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างรายการซ่อมบำรุง' }, { status: 500 });
  }
}
