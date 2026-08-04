import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, createUnauthorizedResponse } from '@/lib/auth';
import QRCode from 'qrcode';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return createUnauthorizedResponse();

    const { id } = await params;

    const device = await db.device.findFirst({
      where: { id, deletedAt: null },
    });

    if (!device) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลครุภัณฑ์' }, { status: 404 });
    }

    // QR Payload contains JSON string with asset code and asset detail URL
    const qrData = JSON.stringify({
      assetCode: device.assetCode,
      govAssetCode: device.govAssetCode || undefined,
      name: device.deviceName,
      serialNumber: device.serialNumber || undefined,
      url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/devices?q=${encodeURIComponent(device.assetCode)}`,
    });

    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return NextResponse.json({
      assetCode: device.assetCode,
      deviceName: device.deviceName,
      qrDataUrl,
    });
  } catch (err: any) {
    console.error('GET /api/devices/[id]/qr error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้าง QR Code' }, { status: 500 });
  }
}
