import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { updateDeviceSchema } from '@/schemas/device-schema';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    const { id } = await params;

    const device = await db.device.findFirst({
      where: { id, deletedAt: null },
      include: {
        deviceType: true,
        building: true,
        floor: true,
        room: true,
        department: true,
        ownerDepartment: true,
        positions: {
          where: { isCurrent: true },
          include: { floorPlan: true },
        },
        networkInterfaces: true,
        networkSwitch: {
          include: { ports: true },
        },
        maintenanceRecords: {
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
      },
    });

    if (!device) {
      return NextResponse.json({ error: 'ไม่พบครุภัณฑ์ที่ต้องการ' }, { status: 404 });
    }

    // Privacy filter for Viewer role
    const isViewer = !session.roles.includes('ADMIN') && !session.roles.includes('OFFICER');
    if (isViewer) {
      device.networkInterfaces = device.networkInterfaces.map((ni) => ({
        ...ni,
        ipAddress: '***.***.***.*** (Hidden)',
        macAddress: '**:**:**:**:**:** (Hidden)',
        subnetMask: null,
        gateway: null,
        vlan: null,
      }));
    }

    return NextResponse.json({ data: device });
  } catch (err: any) {
    console.error('GET /api/devices/[id] error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลครุภัณฑ์' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN') && !session.roles.includes('OFFICER')) {
      return createForbiddenResponse('คุณไม่มีสิทธิ์ในการแก้ไขทะเบียนครุภัณฑ์');
    }

    const { id } = await params;
    const body = await req.json();
    const validation = updateDeviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const existingDevice = await db.device.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingDevice) {
      return NextResponse.json({ error: 'ไม่พบครุภัณฑ์ที่ต้องการแก้ไข' }, { status: 404 });
    }

    const data = validation.data;
    const { ipAddress, macAddress, ...deviceFields } = data;

    const updatedDevice = await db.$transaction(async (tx) => {
      const updated = await tx.device.update({
        where: { id },
        data: {
          ...deviceFields,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
          warrantyStartDate: data.warrantyStartDate ? new Date(data.warrantyStartDate) : undefined,
          warrantyEndDate: data.warrantyEndDate ? new Date(data.warrantyEndDate) : undefined,
          installDate: data.installDate ? new Date(data.installDate) : undefined,
          lastInspectionDate: data.lastInspectionDate ? new Date(data.lastInspectionDate) : undefined,
          nextInspectionDate: data.nextInspectionDate ? new Date(data.nextInspectionDate) : undefined,
          updatedBy: session.userId,
        },
      });

      if (ipAddress || macAddress) {
        const primaryNi = await tx.networkInterface.findFirst({
          where: { deviceId: id, isPrimary: true },
        });

        if (primaryNi) {
          await tx.networkInterface.update({
            where: { id: primaryNi.id },
            data: {
              ipAddress: ipAddress ?? primaryNi.ipAddress,
              macAddress: macAddress ?? primaryNi.macAddress,
            },
          });
        } else {
          await tx.networkInterface.create({
            data: {
              deviceId: id,
              name: 'Primary LAN',
              ipAddress,
              macAddress,
              isPrimary: true,
            },
          });
        }
      }

      return updated;
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPDATE_DEVICE',
        resource: 'DEVICE',
        resourceId: id,
        details: `แก้ไขข้อมูลครุภัณฑ์: ${updatedDevice.deviceName} (${updatedDevice.assetCode})`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({ success: true, data: updatedDevice });
  } catch (err: any) {
    console.error('PATCH /api/devices/[id] error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลครุภัณฑ์' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN')) {
      return createForbiddenResponse('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบครุภัณฑ์ได้');
    }

    const { id } = await params;

    const device = await db.device.findFirst({
      where: { id, deletedAt: null },
    });

    if (!device) {
      return NextResponse.json({ error: 'ไม่พบครุภัณฑ์ที่ต้องการลบ' }, { status: 404 });
    }

    await db.device.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'RETIRED', updatedBy: session.userId },
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'DELETE_DEVICE',
        resource: 'DEVICE',
        resourceId: id,
        details: `ลบครุภัณฑ์ (Soft Delete): ${device.deviceName} (${device.assetCode})`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({ success: true, message: 'ลบทะเบียนครุภัณฑ์เรียบร้อยแล้ว' });
  } catch (err: any) {
    console.error('DELETE /api/devices/[id] error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบครุภัณฑ์' }, { status: 500 });
  }
}
