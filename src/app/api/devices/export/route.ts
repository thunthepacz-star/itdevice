import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse } from '@/lib/auth';
import Papa from 'papaparse';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    const whereCondition: any = {
      deletedAt: null,
      AND: [],
    };

    if (q) {
      whereCondition.AND.push({
        OR: [
          { assetCode: { contains: q, mode: 'insensitive' } },
          { deviceName: { contains: q, mode: 'insensitive' } },
          { serialNumber: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const devices = await db.device.findMany({
      where: whereCondition,
      orderBy: { assetCode: 'asc' },
      include: {
        deviceType: true,
        building: true,
        floor: true,
        room: true,
        department: true,
        networkInterfaces: true,
      },
    });

    const isViewer = !session.roles.includes('ADMIN') && !session.roles.includes('OFFICER');

    const csvRows = devices.map((d) => {
      const primaryNi = d.networkInterfaces.find((ni) => ni.isPrimary) || d.networkInterfaces[0];
      return {
        'Asset Code': d.assetCode,
        'Government Asset Code': d.govAssetCode || '',
        'Device Name': d.deviceName,
        'Device Type': d.deviceType.name,
        'Brand': d.brand || '',
        'Model': d.model || '',
        'Serial Number': d.serialNumber || '',
        'Status': d.status,
        'Building': d.building?.name || '',
        'Floor': d.floor?.name || '',
        'Room': d.room?.name || '',
        'Department': d.department?.name || '',
        'Responsible Person': d.responsiblePerson || '',
        'IP Address': isViewer ? 'Hidden' : primaryNi?.ipAddress || '',
        'MAC Address': isViewer ? 'Hidden' : primaryNi?.macAddress || '',
        'Purchase Price': d.purchasePrice || 0,
        'Warranty End Date': d.warrantyEndDate ? d.warrantyEndDate.toISOString().split('T')[0] : '',
      };
    });

    const csvString = Papa.unparse(csvRows);

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="IT_Asset_Register_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (err: any) {
    console.error('GET /api/devices/export error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการส่งออกไฟล์ CSV' }, { status: 500 });
  }
}
