import { db } from '@/lib/db';

export interface MoveDeviceInput {
  deviceId: string;
  floorPlanId: string;
  positionX: number;
  positionY: number;
  positionZ?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  markerScale?: number;
  placementType?: string;
  elevationFromFloor?: number;
  toBuildingId?: string;
  toFloorId?: string;
  toRoomId?: string;
  reason?: string;
  movedByUserId?: string;
}

/**
 * Transactional Device Relocation Handler
 * Ensures atomic updates across DevicePosition (old vs new) and AssetMovement history.
 */
export async function relocateDeviceTransaction(input: MoveDeviceInput) {
  return await db.$transaction(async (tx) => {
    // 1. Fetch current active device position
    const currentPosition = await tx.devicePosition.findFirst({
      where: {
        deviceId: input.deviceId,
        isCurrent: true,
      },
    });

    const now = new Date();

    // 2. Mark previous position as non-current
    if (currentPosition) {
      await tx.devicePosition.update({
        where: { id: currentPosition.id },
        data: {
          isCurrent: false,
          effectiveTo: now,
        },
      });
    }

    // 3. Create new active DevicePosition record
    const newPosition = await tx.devicePosition.create({
      data: {
        deviceId: input.deviceId,
        floorPlanId: input.floorPlanId,
        positionX: input.positionX,
        positionY: input.positionY,
        positionZ: input.positionZ ?? 0.0,
        rotationX: input.rotationX ?? 0.0,
        rotationY: input.rotationY ?? 0.0,
        rotationZ: input.rotationZ ?? 0.0,
        markerScale: input.markerScale ?? 1.0,
        placementType: input.placementType ?? 'FLOOR',
        elevationFromFloor: input.elevationFromFloor ?? 0.0,
        effectiveFrom: now,
        isCurrent: true,
        createdBy: input.movedByUserId,
      },
    });

    // 4. Get device location prior to movement
    const device = await tx.device.findUnique({
      where: { id: input.deviceId },
    });

    // 5. Update Device location fields
    await tx.device.update({
      where: { id: input.deviceId },
      data: {
        buildingId: input.toBuildingId ?? device?.buildingId,
        floorId: input.toFloorId ?? device?.floorId,
        roomId: input.toRoomId ?? device?.roomId,
        updatedBy: input.movedByUserId,
      },
    });

    // 6. Record Asset Movement History (Immutable)
    const movement = await tx.assetMovement.create({
      data: {
        deviceId: input.deviceId,
        fromBuildingId: device?.buildingId,
        fromFloorId: device?.floorId,
        fromRoomId: device?.roomId,
        toBuildingId: input.toBuildingId ?? device?.buildingId,
        toFloorId: input.toFloorId ?? device?.floorId,
        toRoomId: input.toRoomId ?? device?.roomId,
        movementType: 'RELOCATION',
        reason: input.reason || 'ย้ายตำแหน่งบนแผนผังอุปกรณ์',
        movedBy: input.movedByUserId,
        movedAt: now,
      },
    });

    // 7. Record Audit Log
    await tx.auditLog.create({
      data: {
        userId: input.movedByUserId,
        action: 'UPDATE_DEVICE_POSITION',
        resource: 'DEVICE_POSITION',
        resourceId: newPosition.id,
        details: `ย้ายตำแหน่งอุปกรณ์ ${device?.assetCode || input.deviceId} ไปยังพิกัด (${input.positionX.toFixed(4)}, ${input.positionY.toFixed(4)})`,
      },
    });

    return { newPosition, movement };
  });
}
