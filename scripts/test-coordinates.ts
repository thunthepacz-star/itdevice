import {
  canvasToNormalizedPosition,
  normalizedToCanvasPosition,
  normalizedToWorldPosition,
  worldToNormalizedPosition,
  snapToGrid,
} from '../src/lib/coordinate-converter';

async function runCoordinateTests() {
  console.log('🧪 Starting Step 9: Normalized Coordinates Unit Tests...\n');

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

  const imgW = 1600;
  const imgH = 1000;
  const floorW = 50.0;
  const floorD = 30.0;
  const floorElev = 4.0;

  // Test 1: Top-Left Corner (0,0) -> Normalized (0.0, 0.0)
  const topLeftNorm = canvasToNormalizedPosition(0, 0, imgW, imgH);
  assert(topLeftNorm.positionX === 0.0 && topLeftNorm.positionY === 0.0, '1. Top-Left Corner (0,0) -> Norm (0.0, 0.0)');

  // Test 2: Center Point (800, 500) -> Normalized (0.5, 0.5)
  const centerNorm = canvasToNormalizedPosition(800, 500, imgW, imgH);
  assert(centerNorm.positionX === 0.5 && centerNorm.positionY === 0.5, '2. Center Point (800, 500) -> Norm (0.5, 0.5)');

  // Test 3: Bottom-Right Corner (1600, 1000) -> Normalized (1.0, 1.0)
  const bottomRightNorm = canvasToNormalizedPosition(1600, 1000, imgW, imgH);
  assert(bottomRightNorm.positionX === 1.0 && bottomRightNorm.positionY === 1.0, '3. Bottom-Right Corner (1600,1000) -> Norm (1.0, 1.0)');

  // Test 4: Boundary Clamp (Outside Canvas -> Clamped to 0.0 - 1.0)
  const outOfBoundsNorm = canvasToNormalizedPosition(-50, 1200, imgW, imgH);
  assert(outOfBoundsNorm.positionX === 0.0 && outOfBoundsNorm.positionY === 1.0, '4. Boundary Clamp Check (-50, 1200) -> (0.0, 1.0)');

  // Test 5: Round-trip Canvas -> Norm -> Canvas Conversion Consistency
  const origX = 420;
  const origY = 730;
  const n = canvasToNormalizedPosition(origX, origY, imgW, imgH);
  const backCanvas = normalizedToCanvasPosition(n.positionX, n.positionY, imgW, imgH);
  const diffX = Math.abs(origX - backCanvas.x);
  const diffY = Math.abs(origY - backCanvas.y);
  assert(diffX < 0.01 && diffY < 0.01, '5. Round-trip Canvas -> Norm -> Canvas consistency (<0.01px error)');

  // Test 6: 3D Spatial World Conversion (0.5, 0.5) -> Center World (0.0, Elevation, 0.0)
  const worldCenter = normalizedToWorldPosition(0.5, 0.5, 0.0, floorW, floorD, floorElev);
  assert(worldCenter.x === 0.0 && worldCenter.y === 4.0 && worldCenter.z === 0.0, '6. 3D Spatial Center (0.5, 0.5) -> World (0.0, 4.0m, 0.0)');

  // Test 7: Round-trip World -> Norm -> World Consistency
  const wOriginal = { x: 12.5, y: 5.5, z: -7.2 };
  const normConverted = worldToNormalizedPosition(wOriginal.x, wOriginal.y, wOriginal.z, floorW, floorD, floorElev);
  const wReconverted = normalizedToWorldPosition(normConverted.positionX, normConverted.positionY, normConverted.normZ, floorW, floorD, floorElev);
  const wDiffX = Math.abs(wOriginal.x - wReconverted.x);
  const wDiffZ = Math.abs(wOriginal.z - wReconverted.z);
  assert(wDiffX < 0.01 && wDiffZ < 0.01, '7. Round-trip World -> Norm -> World consistency (<0.01m error)');

  // Test 8: Snap to Grid Helper
  const snapped = snapToGrid(24, 10);
  assert(snapped === 20, '8. Snap-to-Grid Math (24 -> 20)');

  console.log(`\n📊 Normalized Coordinates Verification Summary: ${passed} Passed, ${failed} Failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

runCoordinateTests().catch((e) => {
  console.error('Test script crash:', e);
  process.exit(1);
});
