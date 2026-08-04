import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import Papa from 'papaparse';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    if (!session.roles.includes('ADMIN') && !session.roles.includes('OFFICER')) {
      return createForbiddenResponse('คุณไม่มีสิทธิ์ในการนำเข้าข้อมูลครุภัณฑ์');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์ CSV สำหรับนำเข้า' }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ error: 'รูปแบบไฟล์ CSV ไม่ถูกต้อง' }, { status: 400 });
    }

    const rows = parsed.data as Record<string, string>[];
    const defaultType = await db.deviceType.findFirst({ where: { isActive: true } });

    if (!defaultType) {
      return NextResponse.json({ error: 'ไม่พบประเภทอุปกรณ์ในระบบ' }, { status: 400 });
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const assetCode = row['Asset Code'] || row['assetCode'] || row['รหัสครุภัณฑ์'];
      const deviceName = row['Device Name'] || row['deviceName'] || row['ชื่ออุปกรณ์'];

      if (!assetCode || !deviceName) {
        skippedCount++;
        errors.push(`แถวที่ ${i + 1}: ขาด Asset Code หรือ Device Name`);
        continue;
      }

      // Check duplicate Asset Code
      const existing = await db.device.findFirst({
        where: { assetCode: assetCode.trim(), deletedAt: null },
      });

      if (existing) {
        skippedCount++;
        errors.push(`แถวที่ ${i + 1}: รหัส ${assetCode} มีในระบบแล้ว`);
        continue;
      }

      // Try matching device type by name or code
      const typeName = row['Device Type'] || row['deviceType'];
      let matchedType = defaultType;
      if (typeName) {
        const found = await db.deviceType.findFirst({
          where: { OR: [{ name: typeName.trim() }, { code: typeName.trim() }] },
        });
        if (found) matchedType = found;
      }

      await db.device.create({
        data: {
          assetCode: assetCode.trim(),
          govAssetCode: row['Government Asset Code'] || row['govAssetCode'] || null,
          deviceName: deviceName.trim(),
          deviceTypeId: matchedType.id,
          brand: row['Brand'] || row['brand'] || null,
          model: row['Model'] || row['model'] || null,
          serialNumber: row['Serial Number'] || row['serialNumber'] || null,
          status: row['Status'] || 'ACTIVE',
          responsiblePerson: row['Responsible Person'] || row['responsiblePerson'] || null,
          createdBy: session.userId,
        },
      });

      importedCount++;
    }

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'IMPORT_DEVICES',
        resource: 'DEVICE',
        details: `นำเข้าครุภัณฑ์ผ่าน CSV: สำเร็จ ${importedCount} รายการ, ข้าม ${skippedCount} รายการ`,
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      summary: {
        imported: importedCount,
        skipped: skippedCount,
        errors,
      },
    });
  } catch (err: any) {
    console.error('POST /api/devices/import error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการนำเข้าไฟล์ CSV' }, { status: 500 });
  }
}
