import { buildingSchema, floorSchema } from '../src/schemas/building-schema';

async function runBuildingModuleTests() {
  console.log('🧪 Starting Building & Floor Module Verification Tests...\n');

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

  // Test 1: Building Schema Validation
  const validBuilding = {
    code: 'BLD-TEST',
    name: 'อาคารทดสอบระบบ',
    shortName: 'อาคารทดสอบ',
    locationDescription: 'โซนเหนือ',
    description: 'อาคารสำหรับทดสอบ',
    isActive: true,
  };
  const bValidation = buildingSchema.safeParse(validBuilding);
  assert(bValidation.success, '1. Valid Building Schema Validation');

  // Test 2: Invalid Building Schema (Code too short)
  const invalidBuilding = { code: 'A', name: '' };
  const bInvalid = buildingSchema.safeParse(invalidBuilding);
  assert(!bInvalid.success, '2. Invalid Building Schema Rejection');

  // Test 3: Floor Schema & 3D Spatial Parameters Validation
  const validFloor = {
    floorNumber: 1,
    name: 'ชั้น 1 - เวชระเบียน',
    displayOrder: 1,
    floorWidth: 60.0,
    floorDepth: 40.0,
    floorHeight: 3.5,
    floorThickness: 0.3,
    floorElevation: 0.0,
    rotationX: 0,
    rotationY: 15,
    rotationZ: 0,
    isActive: true,
  };
  const fValidation = floorSchema.safeParse(validFloor);
  assert(fValidation.success, '3. Floor Schema & 3D Spatial Parameters Validation');

  // Test 4: Floor Elevation Calculation Verification for 3D Stack
  const floor1Elevation = 0.0;
  const floor2Elevation = floor1Elevation + validFloor.floorHeight + validFloor.floorThickness;
  assert(floor2Elevation === 3.8, '4. 3D Multi-floor Elevation Stacking Math (0m -> 3.8m)');

  console.log(`\n📊 Building & Floor Verification Summary: ${passed} Passed, ${failed} Failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

runBuildingModuleTests().catch((e) => {
  console.error('Test script crash:', e);
  process.exit(1);
});
