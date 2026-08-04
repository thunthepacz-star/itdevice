import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'dev-secret-key-it-device-register-2026'
);

const COOKIE_NAME = 'it_device_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in ms

export interface UserSessionPayload {
  userId: string;
  email: string;
  name: string;
  roles: string[]; // e.g. ["ADMIN"], ["OFFICER"], ["VIEWER"]
  exp?: number;
}

// -------------------------------------------------------------
// Password Hashing
// -------------------------------------------------------------
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return await compare(password, passwordHash);
}

// -------------------------------------------------------------
// JWT Session Token Management
// -------------------------------------------------------------
export async function createSessionToken(payload: UserSessionPayload): Promise<string> {
  return await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    roles: payload.roles,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      roles: (payload.roles as string[]) || [],
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// Cookie Helper
// -------------------------------------------------------------
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60, // 8 hours
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function getSession(): Promise<UserSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

// -------------------------------------------------------------
// Login Rate Limiter (In-Memory for On-premise)
// -------------------------------------------------------------
const rateLimitMap = new Map<string, { attempts: number; resetTime: number }>();

export function checkLoginRateLimit(ipOrEmail: string): { allowed: boolean; remainingAttempts: number; retryAfterSec?: number } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const record = rateLimitMap.get(ipOrEmail);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ipOrEmail, { attempts: 1, resetTime: now + windowMs });
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  if (record.attempts >= maxAttempts) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSec };
  }

  record.attempts += 1;
  return { allowed: true, remainingAttempts: maxAttempts - record.attempts };
}

export function resetLoginRateLimit(ipOrEmail: string): void {
  rateLimitMap.delete(ipOrEmail);
}

// -------------------------------------------------------------
// RBAC Permission Check Helpers
// -------------------------------------------------------------
export function hasRole(session: UserSessionPayload | null, allowedRoles: string[]): boolean {
  if (!session) return false;
  return session.roles.some((r) => allowedRoles.includes(r));
}

export function createForbiddenResponse(message = '403 Forbidden: คุณไม่มีสิทธิ์เข้าถึงทรัพยากรนี้'): NextResponse {
  return NextResponse.json({ error: message, code: 'FORBIDDEN' }, { status: 403 });
}

export function createUnauthorizedResponse(message = '401 Unauthorized: กรุณาเข้าสู่ระบบก่อนใช้งาน'): NextResponse {
  return NextResponse.json({ error: message, code: 'UNAUTHORIZED' }, { status: 401 });
}
