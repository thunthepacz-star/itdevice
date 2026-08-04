export interface NormalizedPoint {
  positionX: number; // 0.0 - 1.0
  positionY: number; // 0.0 - 1.0
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface World3DPoint {
  x: number;
  y: number;
  z: number;
}

/**
 * Converts screen/canvas relative pointer coordinates into Normalized Coordinates (0.0 to 1.0)
 */
export function canvasToNormalizedPosition(
  pointerX: number,
  pointerY: number,
  displayedWidth: number,
  displayedHeight: number
): NormalizedPoint {
  if (displayedWidth <= 0 || displayedHeight <= 0) {
    return { positionX: 0, positionY: 0 };
  }

  const posX = Math.max(0, Math.min(1, pointerX / displayedWidth));
  const posY = Math.max(0, Math.min(1, pointerY / displayedHeight));

  // Round to 6 decimal places to prevent floating point drift
  return {
    positionX: Number(posX.toFixed(6)),
    positionY: Number(posY.toFixed(6)),
  };
}

/**
 * Converts Normalized Coordinates (0.0 to 1.0) into Screen/Canvas pixel coordinates
 */
export function normalizedToCanvasPosition(
  normX: number,
  normY: number,
  displayedWidth: number,
  displayedHeight: number
): CanvasPoint {
  return {
    x: normX * displayedWidth,
    y: normY * displayedHeight,
  };
}

/**
 * Converts Normalized Coordinates (0.0 to 1.0) into 3D Spatial World Coordinates for Three.js
 */
export function normalizedToWorldPosition(
  normX: number,
  normY: number,
  normZ: number = 0.0,
  floorWidth3D: number = 50.0,
  floorDepth3D: number = 30.0,
  floorElevation: number = 0.0
): World3DPoint {
  const worldX = (normX - 0.5) * floorWidth3D;
  const worldZ = (normY - 0.5) * floorDepth3D;
  const worldY = floorElevation + normZ;

  return {
    x: Number(worldX.toFixed(4)),
    y: Number(worldY.toFixed(4)),
    z: Number(worldZ.toFixed(4)),
  };
}

/**
 * Converts 3D Spatial World Coordinates back into Normalized Coordinates
 */
export function worldToNormalizedPosition(
  worldX: number,
  worldY: number,
  worldZ: number,
  floorWidth3D: number = 50.0,
  floorDepth3D: number = 30.0,
  floorElevation: number = 0.0
): NormalizedPoint & { normZ: number } {
  const normX = worldX / floorWidth3D + 0.5;
  const normY = worldZ / floorDepth3D + 0.5;
  const normZ = worldY - floorElevation;

  return {
    positionX: Number(Math.max(0, Math.min(1, normX)).toFixed(6)),
    positionY: Number(Math.max(0, Math.min(1, normY)).toFixed(6)),
    normZ: Number(normZ.toFixed(4)),
  };
}

/**
 * Snaps pixel coordinate to nearest grid size
 */
export function snapToGrid(val: number, gridSize: number = 10): number {
  return Math.round(val / gridSize) * gridSize;
}
