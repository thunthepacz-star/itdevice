import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { relocateDeviceTransaction } from '@/lib/transaction-helper';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN') && !session.roles.includes('OFFICER')) {
      return createForbiddenResponse('คุณไม่มีสิทธิ์ในการระบุหรือย้ายตำแหน่งอุปกรณ์');
    }

    const body = await req.json();
    const { positionX, positionY, floorPlanId, deviceId, newDeviceData } = body;

    if (positionX === undefined || positionY === undefined || !floorPlanId) {
      return NextResponse.json({ error: 'ข้อมูลพิกัดหรือ Floor Plan ID ไม่ครบถ้วน' }, { status: 400 });
    }

    const floorPlan = await db.floorPlan.findFirst({
      where: { id: floorPlanId, deletedAt: null },
      include: { floor: true, building: true },
    });

    if (!floorPlan) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลแผนผังที่ระบุ' }, { status: 404 });
    }

    let targetDeviceId = deviceId;

    // If newDeviceData is passed, create the Device first
    if (!targetDeviceId && newDeviceData) {
      // Find or create default device type
      let typeId = newDeviceData.deviceTypeId;
      if (!typeId) {
        const defaultType = await db.deviceType.findFirst({ where: { isActive: true } });
        typeId = defaultType?.id;
      }

      const createdDevice = await db.device.create({
        data: {
          assetCode: newDeviceData.assetCode,
          deviceName: newDeviceData.deviceName,
          deviceTypeId: typeId,
          buildingId: floorPlan.buildingId,
          floorId: floorPlan.floorId,
          createdBy: session.userId,
        },
      });
      targetDeviceId = createdDevice.id;
    }

    if (!targetDeviceId) {
      return NextResponse.json({ error: 'ไม่พบ Device ID สำหรับสร้างตำแหน่ง' }, { status: 400 });
    }

    // Execute Transactional Relocation & History log
    const result = await relocateDeviceTransaction({
      deviceId: targetDeviceId,
      floorPlanId,
      positionX: Number(positionX),
      positionY: Number(positionY),
      toBuildingId: floorPlan.buildingId,
      toFloorId: floorPlan.floorId,
      movedByUserId: session.userId,
    });

    return NextResponse.json({ success: true, data: result.newPosition }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/device-positions error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการบันทึกตำแหน่งอุปกรณ์' }, { status: 500 });
  }
}
