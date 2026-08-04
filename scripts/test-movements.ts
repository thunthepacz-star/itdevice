import { normalizedToWorldPosition, worldToNormalizedPosition } from '../src/lib/coordinate-converter';

async function runMovementsTests() {
  console.log('🧪 Starting Step 10 & Step 12: Movements & 3D Spatial Verification Tests...\n');

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

  // 1. Test 3D Spatial Pin Conversion Math for Multi-Floor View
  const floorWidth = 60.0;
  const floorDepth = 40.0;
  const floorElev = 8.0; // Floor 2 elevation at 8m

  const pinWorldPos = normalizedToWorldPosition(0.8, 0.2, 1.0, floorWidth, floorDepth, floorElev);
  assert(pinWorldPos.x === 18.0, '1. 3D Pin World X position calculation (0.8 -> 18.0m)');
  assert(pinWorldPos.z === -12.0, '2. 3D Pin World Z position calculation (0.2 -> -12.0m)');
  assert(pinWorldPos.y === 9.0, '3. 3D Pin World Y height with 1m pin offset (8m + 1m = 9.0m)');

  // 2. Test Reverse Conversion
  const normReverted = worldToNormalizedPosition(pinWorldPos.x, pinWorldPos.y - 1.0, pinWorldPos.z, floorWidth, floorDepth, floorElev);
  assert(normReverted.positionX === 0.8, '4. Reverse 3D World X -> Normalized positionX (18.0m -> 0.8)');
  assert(normReverted.positionY === 0.2, '5. Reverse 3D World Z -> Normalized positionY (-12.0m -> 0.2)');

  console.log(`\n📊 Movements & 3D Spatial Verification Summary: ${passed} Passed, ${failed} Failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

runMovementsTests().catch((e) => {
  console.error('Test script crash:', e);
  process.exit(1);
});
