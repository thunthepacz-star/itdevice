'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Printer, Loader2 } from 'lucide-react';

interface DeviceQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: any;
}

export function DeviceQRDialog({
  open,
  onOpenChange,
  device,
}: DeviceQRDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQRCode = useCallback(async () => {
    if (!device) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/qr`);
      const data = await res.json();
      if (res.ok) {
        setQrDataUrl(data.qrDataUrl);
      }
    } catch (err) {
      console.error('Fetch QR code error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [device]);

  useEffect(() => {
    if (open && device) {
      fetchQRCode();
    }
  }, [open, device, fetchQRCode]);

  function handlePrint() {
    window.print();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            คิวอาร์โค้ดครุภัณฑ์ (Asset Label)
          </DialogTitle>
          <DialogDescription>
            ใช้สแกนเพื่อเข้าถึงข้อมูลตำแหน่งครุภัณฑ์บนแผนผัง 2D/3D
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 text-slate-900 text-center space-y-3">
          <div className="font-bold text-sm text-slate-900">
            {device?.deviceName}
          </div>
          <div className="text-xs font-mono text-slate-600 font-semibold bg-slate-100 px-3 py-1 rounded-md">
            Asset Code: {device?.assetCode}
          </div>

          {isLoading ? (
            <div className="flex h-48 w-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            qrDataUrl && (
              <img
                src={qrDataUrl}
                alt={`QR Code ${device?.assetCode}`}
                className="w-48 h-48 object-contain border p-2 rounded-lg"
              />
            )
          )}

          <div className="text-[11px] text-slate-500">
            {device?.building?.name || 'ไม่ระบุอาคาร'} • {device?.floor?.name || ''}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ปิด
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            พิมพ์ป้ายคิวอาร์โค้ด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
