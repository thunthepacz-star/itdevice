import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    const switches = await db.networkSwitch.findMany({
      include: {
        device: {
          include: { building: true, floor: true, room: true },
        },
        ports: {
          include: {
            connectedInterface: {
              include: { device: true },
            },
            connectedOutlet: true,
          },
          orderBy: { portNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const outlets = await db.lanOutlet.findMany({
      where: { deletedAt: null },
      include: { building: true, floor: true, room: true },
    });

    return NextResponse.json({
      data: {
        switches,
        outlets,
      },
    });
  } catch (err: any) {
    console.error('GET /api/network error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผังเครือข่าย' }, { status: 500 });
  }
}
