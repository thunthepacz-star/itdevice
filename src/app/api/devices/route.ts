import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { deviceSchema } from '@/schemas/device-schema';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const deviceTypeId = searchParams.get('deviceTypeId') || '';
    const buildingId = searchParams.get('buildingId') || '';
    const floorId = searchParams.get('floorId') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    const whereCondition: any = {
      deletedAt: null,
      AND: [],
    };

    if (q) {
      whereCondition.AND.push({
        OR: [
          { assetCode: { contains: q, mode: 'insensitive' } },
          { govAssetCode: { contains: q, mode: 'insensitive' } },
          { deviceName: { contains: q, mode: 'insensitive' } },
          { serialNumber: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
          { model: { contains: q, mode: 'insensitive' } },
          { responsiblePerson: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (deviceTypeId) whereCondition.AND.push({ deviceTypeId });
    if (buildingId) whereCondition.AND.push({ buildingId });
    if (floorId) whereCondition.AND.push({ floorId });
    if (status) whereCondition.AND.push({ status });

    const [total, devices] = await Promise.all([
      db.device.count({ where: whereCondition }),
      db.device.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          deviceType: true,
          building: true,
          floor: true,
          room: true,
          department: true,
          positions: {
            where: { isCurrent: true },
            include: { floorPlan: true },
          },
          networkInterfaces: true,
        },
      }),
    ]);

    // Privacy Guard for Viewer role: Hide sensitive network details (IP, MAC, Subnet, VLAN) according to prompt spec
    const isViewer = !session.roles.includes('ADMIN') && !session.roles.includes('OFFICER');
    const sanitizedDevices = isViewer
      ? devices.map((d) => ({
          ...d,
          networkInterfaces: d.networkInterfaces.map((ni) => ({
            ...ni,
            ipAddress: '***.***.***.*** (Hidden)',
            macAddress: '**:**:**:**:**:** (Hidden)',
            subnetMask: null,
            gateway: null,
            vlan: null,
          })),
        }))
      : devices;

    return NextResponse.json({
      data: sanitizedDevices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('GET /api/devices error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงทะเบียนครุภัณฑ์' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN') && !session.roles.includes('OFFICER')) {
      return createForbiddenResponse('คุณไม่มีสิทธิ์ในการเพิ่มทะเบียนครุภัณฑ์');
    }

    const body = await req.json();
    const validation = deviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const data = validation.data;

    // 1. Validation: Asset Code Duplicate Check
    const existingAsset = await db.device.findFirst({
      where: { assetCode: data.assetCode, deletedAt: null },
    });

    if (existingAsset) {
      return NextResponse.json(
        { error: `รหัสครุภัณฑ์ ${data.assetCode} มีอยู่ในระบบแล้ว` },
        { status: 400 }
      );
    }

    // 2. Validation: Serial Number Duplicate Check (if provided)
    if (data.serialNumber) {
      const existingSerial = await db.device.findFirst({
        where: { serialNumber: data.serialNumber, deletedAt: null },
      });

      if (existingSerial) {
        return NextResponse.json(
          { error: `Serial Number ${data.serialNumber} ถูกใช้งานโดยครุภัณฑ์อื่นในระบบแล้ว (${existingSerial.assetCode})` },
          { status: 400 }
        );
      }
    }

    // Extract network fields before device creation
    const { ipAddress, macAddress, ...deviceFields } = data;

    // Create Device & optional primary NetworkInterface in a transaction
    const newDevice = await db.$transaction(async (tx) => {
      const created = await tx.device.create({
        data: {
          ...deviceFields,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
          warrantyStartDate: data.warrantyStartDate ? new Date(data.warrantyStartDate) : null,
          warrantyEndDate: data.warrantyEndDate ? new Date(data.warrantyEndDate) : null,
          installDate: data.installDate ? new Date(data.installDate) : null,
          lastInspectionDate: data.lastInspectionDate ? new Date(data.lastInspectionDate) : null,
          nextInspectionDate: data.nextInspectionDate ? new Date(data.nextInspectionDate) : null,
          createdBy: session.userId,
        },
      });

      if (ipAddress || macAddress) {
        await tx.networkInterface.create({
          data: {
            deviceId: created.id,
            name: 'Primary LAN',
            ipAddress,
            macAddress,
            isPrimary: true,
          },
        });
      }

      return created;
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CREATE_DEVICE',
        resource: 'DEVICE',
        resourceId: newDevice.id,
        details: `ลงทะเบียนครุภัณฑ์ใหม่: ${newDevice.deviceName} (${newDevice.assetCode})`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({ success: true, data: newDevice }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/devices error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลงทะเบียนครุภัณฑ์' }, { status: 500 });
  }
}
