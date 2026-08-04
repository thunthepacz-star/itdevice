import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN')) {
      return createForbiddenResponse('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถดู Audit Logs ได้');
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const skip = (page - 1) * limit;

    const whereCondition: any = { AND: [] };

    if (q) {
      whereCondition.AND.push({
        OR: [
          { action: { contains: q, mode: 'insensitive' } },
          { details: { contains: q, mode: 'insensitive' } },
          { ipAddress: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const [total, logs] = await Promise.all([
      db.auditLog.count({ where: whereCondition }),
      db.auditLog.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('GET /api/audit-logs error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึง Audit Log' }, { status: 500 });
  }
}
