import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { saveUploadedFile, getInitialImageDimensions } from '@/lib/storage';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    const { id: floorId } = await params;

    const plans = await db.floorPlan.findMany({
      where: { floorId, deletedAt: null },
      orderBy: { version: 'desc' },
      include: {
        _count: {
          select: {
            devicePositions: { where: { isCurrent: true } },
          },
        },
      },
    });

    return NextResponse.json({ data: plans });
  } catch (err: any) {
    console.error('GET /api/floors/[id]/plans error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงรายการแผนผัง' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN') && !session.roles.includes('OFFICER')) {
      return createForbiddenResponse('คุณไม่มีสิทธิ์ในการอัปโหลดแผนผังอุปกรณ์');
    }

    const { id: floorId } = await params;

    // Check floor & building existence
    const floor = await db.floor.findFirst({
      where: { id: floorId, deletedAt: null },
      include: { building: true },
    });

    if (!floor) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลชั้นที่ต้องการอัปโหลดแผนผัง' }, { status: 404 });
    }

    // Parse Multipart Form Data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const name = (formData.get('name') as string) || `แผนผัง ${floor.name}`;
    const activate = formData.get('activate') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์แผนผังที่ต้องการอัปโหลด' }, { status: 400 });
    }

    // Save File securely
    const uploadResult = await saveUploadedFile(file);
    const dimensions = getInitialImageDimensions(uploadResult.mimeType);

    // Determine Version number (max version + 1)
    const lastVersionPlan = await db.floorPlan.findFirst({
      where: { floorId, deletedAt: null },
      orderBy: { version: 'desc' },
    });

    const newVersion = (lastVersionPlan?.version || 0) + 1;
    const shouldActivate = activate || !lastVersionPlan; // Automatically activate if first version

    // Transaction to create new plan & ensure ONLY 1 active plan per floor
    const newFloorPlan = await db.$transaction(async (tx) => {
      if (shouldActivate) {
        await tx.floorPlan.updateMany({
          where: { floorId, deletedAt: null },
          data: { isActive: false },
        });
      }

      return await tx.floorPlan.create({
        data: {
          buildingId: floor.buildingId,
          floorId: floor.id,
          name,
          version: newVersion,
          fileUrl: uploadResult.fileUrl,
          mimeType: uploadResult.mimeType,
          originalWidth: dimensions.width,
          originalHeight: dimensions.height,
          isActive: shouldActivate,
          uploadedBy: session.userId,
        },
      });
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPLOAD_FLOOR_PLAN',
        resource: 'FLOOR_PLAN',
        resourceId: newFloorPlan.id,
        details: `อัปโหลดแผนผัง v${newVersion}: ${newFloorPlan.name} (${uploadResult.mimeType}, Active: ${shouldActivate})`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({ success: true, data: newFloorPlan }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/floors/[id]/plans error:', err);
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาดในการอัปโหลดแผนผัง' }, { status: 500 });
  }
}
