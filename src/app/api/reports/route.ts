import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    const [totalDevices, devicesByType, devicesByStatus, devicesByBuilding] = await Promise.all([
      db.device.count({ where: { deletedAt: null } }),
      db.deviceType.findMany({
        where: { isActive: true },
        include: { _count: { select: { devices: { where: { deletedAt: null } } } } },
      }),
      db.device.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { status: true },
      }),
      db.building.findMany({
        where: { deletedAt: null },
        include: { _count: { select: { devices: { where: { deletedAt: null } } } } },
      }),
    ]);

    return NextResponse.json({
      data: {
        totalDevices,
        devicesByType: devicesByType.map((dt) => ({ name: dt.name, count: dt._count.devices })),
        devicesByStatus: devicesByStatus.map((ds) => ({ status: ds.status, count: ds._count.status })),
        devicesByBuilding: devicesByBuilding.map((b) => ({ name: b.name, count: b._count.devices })),
      },
    });
  } catch (err: any) {
    console.error('GET /api/reports error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงรายงานสรุป' }, { status: 500 });
  }
}
