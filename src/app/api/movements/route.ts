import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const skip = (page - 1) * limit;

    const whereCondition: any = {
      AND: [],
    };

    if (q) {
      whereCondition.AND.push({
        OR: [
          { device: { assetCode: { contains: q, mode: 'insensitive' } } },
          { device: { deviceName: { contains: q, mode: 'insensitive' } } },
          { reason: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const [total, movements] = await Promise.all([
      db.assetMovement.count({ where: whereCondition }),
      db.assetMovement.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { movedAt: 'desc' },
        include: {
          device: {
            include: { deviceType: true },
          },
          fromBuilding: true,
          fromFloor: true,
          toBuilding: true,
          toFloor: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('GET /api/movements error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงประวัติการย้ายอุปกรณ์' }, { status: 500 });
  }
}
