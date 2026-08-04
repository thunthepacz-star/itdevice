import { deviceSchema, ipAddressRegex, macAddressRegex } from '../src/schemas/device-schema';

async function runDeviceModuleTests() {
  console.log('🧪 Starting Device Register Module Verification Tests...\n');

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

  // Test 1: Valid Device Schema Validation
  const validDevice = {
    assetCode: 'IT-2026-999',
    govAssetCode: '7440-001-0099',
    deviceName: 'Dell OptiPlex 7090 Test',
    deviceTypeId: 'dt-uuid-1',
    brand: 'Dell',
    model: 'OptiPlex',
    serialNumber: 'SN-TEST-999',
    status: 'ACTIVE',
    ipAddress: '192.168.1.150',
    macAddress: '00:1A:2B:3C:4D:5E',
    warrantyStartDate: '2026-01-01',
    warrantyEndDate: '2029-01-01',
  };

  const dValidation = deviceSchema.safeParse(validDevice);
  assert(dValidation.success, '1. Valid Device Schema & Network IP/MAC Validation');

  // Test 2: Invalid IP Address Validation
  const invalidIpDevice = { ...validDevice, ipAddress: '999.999.999.999' };
  const dInvalidIp = deviceSchema.safeParse(invalidIpDevice);
  assert(!dInvalidIp.success, '2. Invalid IP Address Rejection Check');

  // Test 3: Invalid MAC Address Validation
  const invalidMacDevice = { ...validDevice, macAddress: 'INVALID-MAC' };
  const dInvalidMac = deviceSchema.safeParse(invalidMacDevice);
  assert(!dInvalidMac.success, '3. Invalid MAC Address Rejection Check');

  // Test 4: Invalid Warranty End Date (End before Start)
  const invalidWarrantyDevice = {
    ...validDevice,
    warrantyStartDate: '2026-05-01',
    warrantyEndDate: '2025-01-01',
  };
  const dInvalidWarranty = deviceSchema.safeParse(invalidWarrantyDevice);
  assert(!dInvalidWarranty.success, '4. Invalid Warranty Date Rejection Check (End < Start)');

  // Test 5: IP & MAC Regex Helper Functions
  assert(ipAddressRegex.test('10.0.0.1'), '5a. IP Regex valid format check');
  assert(macAddressRegex.test('AA:BB:CC:DD:EE:FF'), '5b. MAC Regex valid format check');

  console.log(`\n📊 Device Register Verification Summary: ${passed} Passed, ${failed} Failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

runDeviceModuleTests().catch((e) => {
  console.error('Test script crash:', e);
  process.exit(1);
});
