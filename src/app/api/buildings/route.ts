import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { buildingSchema } from '@/schemas/building-schema';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const isActiveParam = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    const whereCondition: any = {
      deletedAt: null,
      AND: [],
    };

    if (q) {
      whereCondition.AND.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
          { shortName: { contains: q, mode: 'insensitive' } },
          { locationDescription: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (isActiveParam !== null && isActiveParam !== undefined && isActiveParam !== '') {
      whereCondition.AND.push({ isActive: isActiveParam === 'true' });
    }

    const [total, buildings] = await Promise.all([
      db.building.count({ where: whereCondition }),
      db.building.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              floors: { where: { deletedAt: null } },
              devices: { where: { deletedAt: null } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: buildings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('GET /api/buildings error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลอาคาร' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    // Check RBAC permission (Only Admin & Officer can add buildings)
    if (!session.roles.includes('ADMIN') && !session.roles.includes('OFFICER')) {
      return createForbiddenResponse('คุณไม่มีสิทธิ์ในการเพิ่มข้อมูลอาคาร');
    }

    const body = await req.json();
    const validation = buildingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const data = validation.data;

    // Check duplicate code
    const existingCode = await db.building.findFirst({
      where: { code: data.code, deletedAt: null },
    });

    if (existingCode) {
      return NextResponse.json({ error: `รหัสอาคาร ${data.code} มีอยู่ในระบบแล้ว` }, { status: 400 });
    }

    const building = await db.building.create({
      data: {
        ...data,
        createdBy: session.userId,
      },
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CREATE_BUILDING',
        resource: 'BUILDING',
        resourceId: building.id,
        details: `เพิ่มอาคารใหม่: ${building.name} (${building.code})`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({ success: true, data: building }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/buildings error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างข้อมูลอาคาร' }, { status: 500 });
  }
}
