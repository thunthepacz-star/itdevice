import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'dev-secret-key-it-device-register-2026'
);

const COOKIE_NAME = 'it_device_session';

// Protected paths requirement
const ADMIN_ONLY_PATHS = ['/users', '/settings', '/audit-logs'];
const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public static files and public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/health') ||
    pathname === '/login' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/uploads')
  ) {
    return NextResponse.next();
  }

  // 2. Extract Session Cookie
  const token = req.cookies.get(COOKIE_NAME)?.value;

  // Redirect unauthenticated requests to /login
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: '401 Unauthorized: กรุณาเข้าสู่ระบบก่อนใช้งาน', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Verify JWT Session Token
  let userSession: { userId: string; email: string; name: string; roles: string[] } | null = null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    userSession = {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      roles: (payload.roles as string[]) || [],
    };
  } catch {
    // Expired or invalid session
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: '401 Unauthorized: Session หมดอายุ กรุณาเข้าสู่ระบบใหม่', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', 'SessionExpired');
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(COOKIE_NAME, '', { maxAge: 0 });
    return response;
  }

  // 4. Role-based Route Protection (RBAC)
  const isReqAdminPath = ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path));
  const isAdmin = userSession.roles.includes('ADMIN');
  const isOfficer = userSession.roles.includes('OFFICER');

  // Admin-only paths check
  if (isReqAdminPath && !isAdmin) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: '403 Forbidden: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเข้าถึงส่วนนี้ได้', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }
    const forbiddenUrl = new URL('/dashboard', req.url);
    forbiddenUrl.searchParams.set('error', 'AccessDenied');
    return NextResponse.redirect(forbiddenUrl);
  }

  // Viewer role modification restriction on API routes (POST, PATCH, PUT, DELETE)
  const isWriteMethod = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method);
  const isViewerOnly = !isAdmin && !isOfficer && userSession.roles.includes('VIEWER');

  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/logout') && isWriteMethod && isViewerOnly) {
    return NextResponse.json(
      { error: '403 Forbidden: บัญชีของคุณมีสิทธิ์เฉพาะการรับชม (Viewer) ไม่สามารถแก้ไขข้อมูลได้', code: 'READ_ONLY' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
