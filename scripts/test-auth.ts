import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  hasRole,
  checkLoginRateLimit,
} from '../src/lib/auth';

async function runAuthTests() {
  console.log('🧪 Starting Auth & RBAC Security Verification Tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Test 1: Password Hash & Verification Success
  const plainPass = 'admin123';
  const hashed = await hashPassword(plainPass);
  const isCorrect = await verifyPassword(plainPass, hashed);
  assert(isCorrect, '1. Login Successful - Password Hash & Verification');

  // Test 2: Password Hash Verification Failure (Wrong Password)
  const isWrong = await verifyPassword('wrongpass123', hashed);
  assert(!isWrong, '2. Password Error - Wrong password rejection');

  // Test 3: JWT Session Token Generation & Expiration Verification
  const token = await createSessionToken({
    userId: 'test-admin-uuid',
    email: 'admin@hospital.go.th',
    name: 'Admin User',
    roles: ['ADMIN'],
  });

  const verifiedSession = await verifySessionToken(token);
  assert(
    verifiedSession !== null && verifiedSession.email === 'admin@hospital.go.th',
    '3. Secure Session Token Generation & Verification'
  );

  // Test 4: Invalid/Expired Session Token
  const invalidSession = await verifySessionToken('invalid-jwt-token-string');
  assert(invalidSession === null, '4. Session Expiration & Invalid Token Rejection');

  // Test 5: RBAC Role Check for Admin Only Route
  const adminSession = { userId: 'u1', email: 'a@h.go.th', name: 'A', roles: ['ADMIN'] };
  const officerSession = { userId: 'u2', email: 'o@h.go.th', name: 'O', roles: ['OFFICER'] };
  const viewerSession = { userId: 'u3', email: 'v@h.go.th', name: 'V', roles: ['VIEWER'] };

  assert(hasRole(adminSession, ['ADMIN']), '5a. Admin User has access to Admin routes');
  assert(!hasRole(officerSession, ['ADMIN']), '5b. Officer has no access to Admin routes (403 Forbidden)');
  assert(!hasRole(viewerSession, ['ADMIN']), '5c. Viewer has no access to Admin routes (403 Forbidden)');

  // Test 6: Viewer Device Creation Restriction Check
  const canModifyDevice = (session: any) => hasRole(session, ['ADMIN', 'OFFICER']);
  assert(canModifyDevice(adminSession), '6a. Admin can create/edit Device');
  assert(canModifyDevice(officerSession), '6b. Officer can create/edit Device');
  assert(!canModifyDevice(viewerSession), '6c. Viewer cannot create/edit Device (Read Only Guard)');

  // Test 7: Rate Limiter Protection
  const testEmail = 'hacker@test.com';
  let rateCheck;
  for (let i = 0; i < 5; i++) {
    rateCheck = checkLoginRateLimit(testEmail);
  }
  const blockedCheck = checkLoginRateLimit(testEmail);
  assert(!blockedCheck.allowed, '7. Rate Limiter blocks login after 5 failed attempts');

  console.log(`\n📊 Auth Verification Summary: ${passed} Passed, ${failed} Failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTests().catch((e) => {
  console.error('Test script crash:', e);
  process.exit(1);
});
