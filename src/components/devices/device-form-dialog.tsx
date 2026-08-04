'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, HardDrive } from 'lucide-react';

interface DeviceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceToEdit?: any;
  deviceTypes: any[];
  buildings: any[];
  onSuccess: () => void;
}

export function DeviceFormDialog({
  open,
  onOpenChange,
  deviceToEdit,
  deviceTypes,
  buildings,
  onSuccess,
}: DeviceFormDialogProps) {
  const [assetCode, setAssetCode] = useState('');
  const [govAssetCode, setGovAssetCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [deviceTypeId, setDeviceTypeId] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [warrantyEndDate, setWarrantyEndDate] = useState('');

  const [floors, setFloors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch floors when building is selected
  useEffect(() => {
    if (buildingId) {
      fetch(`/api/buildings/${buildingId}/floors`)
        .then((res) => res.json())
        .then((data) => setFloors(data.data || []))
        .catch((err) => console.error(err));
    } else {
      setFloors([]);
    }
  }, [buildingId]);

  useEffect(() => {
    if (deviceToEdit) {
      setAssetCode(deviceToEdit.assetCode || '');
      setGovAssetCode(deviceToEdit.govAssetCode || '');
      setDeviceName(deviceToEdit.deviceName || '');
      setDeviceTypeId(deviceToEdit.deviceTypeId || (deviceTypes[0]?.id ?? ''));
      setBrand(deviceToEdit.brand || '');
      setModel(deviceToEdit.model || '');
      setSerialNumber(deviceToEdit.serialNumber || '');
      setBuildingId(deviceToEdit.buildingId || '');
      setFloorId(deviceToEdit.floorId || '');
      setStatus(deviceToEdit.status || 'ACTIVE');
      setResponsiblePerson(deviceToEdit.responsiblePerson || '');
      const primaryNi = deviceToEdit.networkInterfaces?.find((ni: any) => ni.isPrimary);
      setIpAddress(primaryNi?.ipAddress || '');
      setMacAddress(primaryNi?.macAddress || '');
      setPurchasePrice(deviceToEdit.purchasePrice ? String(deviceToEdit.purchasePrice) : '');
      setWarrantyEndDate(
        deviceToEdit.warrantyEndDate
          ? new Date(deviceToEdit.warrantyEndDate).toISOString().split('T')[0]
          : ''
      );
    } else {
      setAssetCode('');
      setGovAssetCode('');
      setDeviceName('');
      setDeviceTypeId(deviceTypes[0]?.id || '');
      setBrand('');
      setModel('');
      setSerialNumber('');
      setBuildingId('');
      setFloorId('');
      setStatus('ACTIVE');
      setResponsiblePerson('');
      setIpAddress('');
      setMacAddress('');
      setPurchasePrice('');
      setWarrantyEndDate('');
    }
    setError(null);
  }, [deviceToEdit, deviceTypes, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = deviceToEdit ? `/api/devices/${deviceToEdit.id}` : '/api/devices';
      const method = deviceToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetCode,
          govAssetCode: govAssetCode || undefined,
          deviceName,
          deviceTypeId,
          brand: brand || undefined,
          model: model || undefined,
          serialNumber: serialNumber || undefined,
          buildingId: buildingId || undefined,
          floorId: floorId || undefined,
          status,
          responsiblePerson: responsiblePerson || undefined,
          ipAddress: ipAddress || undefined,
          macAddress: macAddress || undefined,
          purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
          warrantyEndDate: warrantyEndDate || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการลงทะเบียนครุภัณฑ์');
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            {deviceToEdit ? 'แก้ไขทะเบียนครุภัณฑ์' : 'เพิ่มทะเบียนครุภัณฑ์ใหม่'}
          </DialogTitle>
          <DialogDescription>
            กรอกรายละเอียดสเปกครุภัณฑ์ สถานที่ติดตั้ง การรับประกัน และเครือข่าย
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Codes & Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">รหัสครุภัณฑ์ (Asset Code)*</Label>
              <Input
                required
                placeholder="IT-2026-001"
                value={assetCode}
                disabled={!!deviceToEdit}
                onChange={(e) => setAssetCode(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">รหัสครุภัณฑ์ราชการ (Gov Code)</Label>
              <Input
                placeholder="7440-001-0001"
                value={govAssetCode}
                onChange={(e) => setGovAssetCode(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">ชื่ออุปกรณ์ (Device Name)*</Label>
              <Input
                required
                placeholder="Dell OptiPlex 7090 Tower"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">ประเภทอุปกรณ์ (Device Type)*</Label>
              <Select value={deviceTypeId} onValueChange={(val) => val && setDeviceTypeId(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id} className="text-xs">
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Specs: Brand, Model, Serial Number */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">ยี่ห้อ (Brand)</Label>
              <Input placeholder="Dell / Cisco" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">รุ่น (Model)</Label>
              <Input placeholder="OptiPlex / Catalyst" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Serial Number (S/N)</Label>
              <Input placeholder="CN-0W1234-5678" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
            </div>
          </div>

          {/* Location Selection */}
          <div className="grid grid-cols-2 gap-3 bg-accent/20 p-3 rounded-xl border">
            <div className="space-y-1">
              <Label className="text-[11px]">ประจำอยู่อาคาร:</Label>
              <Select value={buildingId} onValueChange={(val) => val && setBuildingId(val)}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="เลือกอาคาร" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">ชั้น:</Label>
              <Select value={floorId} onValueChange={(val) => val && setFloorId(val)} disabled={floors.length === 0}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder={floors.length === 0 ? 'เลือกชั้น' : 'เลือกชั้น'} />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-xs">
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status & Responsible Person */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">สถานะการใช้งาน (Status)</Label>
              <Select value={status} onValueChange={(val) => val && setStatus(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE" className="text-xs">ACTIVE (พร้อมใช้งาน)</SelectItem>
                  <SelectItem value="IN_USE" className="text-xs">IN_USE (กำลังใช้งาน)</SelectItem>
                  <SelectItem value="IN_REPAIR" className="text-xs">IN_REPAIR (อยู่ระหว่างส่งซ่อม)</SelectItem>
                  <SelectItem value="RETIRED" className="text-xs">RETIRED (จำหน่าย/ปลดระวาง)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">ผู้รับผิดชอบ (Responsible Person)</Label>
              <Input placeholder="นายสมชาย พัสดุ" value={responsiblePerson} onChange={(e) => setResponsiblePerson(e.target.value)} />
            </div>
          </div>

          {/* Network Details */}
          <div className="grid grid-cols-2 gap-3 bg-accent/20 p-3 rounded-xl border">
            <div className="space-y-1">
              <Label className="text-[11px]">IP Address (ถ้ามี)</Label>
              <Input placeholder="192.168.1.100" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">MAC Address (ถ้ามี)</Label>
              <Input placeholder="00:1A:2B:3C:4D:5E" value={macAddress} onChange={(e) => setMacAddress(e.target.value)} />
            </div>
          </div>

          {/* Purchase & Warranty */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">ราคาจัดซื้อ (บาท)</Label>
              <Input type="number" placeholder="25000" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">วันสิ้นสุดประกัน (Warranty End)</Label>
              <Input type="date" value={warrantyEndDate} onChange={(e) => setWarrantyEndDate(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {deviceToEdit ? 'บันทึกแก้ไข' : 'บันทึกครุภัณฑ์ใหม่'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
