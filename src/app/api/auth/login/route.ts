import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  checkLoginRateLimit,
  resetLoginRateLimit,
} from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Rate Limiting Check
    const rateCheck = checkLoginRateLimit(email);
    if (!rateCheck.allowed) {
      await db.auditLog.create({
        data: {
          action: 'LOGIN_BLOCKED',
          resource: 'AUTH',
          details: `พยายามเข้าสู่ระบบเกินจำนวนครั้งที่กำหนด (${email})`,
          ipAddress: clientIp,
        },
      });

      return NextResponse.json(
        {
          error: `พยายามเข้าสู่ระบบผิดพลาดเกิน 5 ครั้ง กรุณาลองใหม่อีกครั้งในอีก ${rateCheck.retryAfterSec} วินาที`,
        },
        { status: 429 }
      );
    }

    // Find User in DB
    const user = await db.user.findFirst({
      where: { email, deletedAt: null },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const passwordMatch = user
      ? await verifyPassword(password, user.passwordHash)
      : false;

    if (!user || !user.isActive || !passwordMatch) {
      await db.auditLog.create({
        data: {
          userId: user?.id,
          action: 'LOGIN_FAILED',
          resource: 'AUTH',
          details: `เข้าสู่ระบบไม่สำเร็จสำหรับอีเมล ${email}`,
          ipAddress: clientIp,
        },
      });

      return NextResponse.json(
        { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ' },
        { status: 401 }
      );
    }

    // Extract User Roles
    const userRoles = user.roles.map((ur) => ur.role.code);

    // Create Session Token & Cookie
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      roles: userRoles,
    });

    await setSessionCookie(token);
    resetLoginRateLimit(email);

    // Record Audit Log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        resource: 'AUTH',
        details: `เข้าสู่ระบบสำเร็จสำหรับ ${user.name} (${userRoles.join(', ')})`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: userRoles,
      },
    });
  } catch (err: unknown) {
    console.error('Login error:', err);
    const message = err instanceof Error ? err.message : '';
    const code = err && typeof err === 'object' && 'code' in err ? err.code : undefined;
    
    const isDbError =
      message.includes('database') ||
      message.includes('relation') ||
      message.includes('connect') ||
      message.includes('Prisma') ||
      code === 'P1001' ||
      code === 'P2021';

    const errorMsg = isDbError
      ? 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาติดต่อผู้ดูแลระบบ'
      : 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง';

    return NextResponse.json(
      { error: errorMsg },
      { status: isDbError ? 503 : 500 }
    );
  }
}
