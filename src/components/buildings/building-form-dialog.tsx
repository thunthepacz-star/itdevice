'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface BuildingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingToEdit?: any;
  onSuccess: () => void;
}

export function BuildingFormDialog({
  open,
  onOpenChange,
  buildingToEdit,
  onSuccess,
}: BuildingFormDialogProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (buildingToEdit) {
      setCode(buildingToEdit.code || '');
      setName(buildingToEdit.name || '');
      setShortName(buildingToEdit.shortName || '');
      setLocationDescription(buildingToEdit.locationDescription || '');
      setDescription(buildingToEdit.description || '');
      setIsActive(buildingToEdit.isActive ?? true);
    } else {
      setCode('');
      setName('');
      setShortName('');
      setLocationDescription('');
      setDescription('');
      setIsActive(true);
    }
    setError(null);
  }, [buildingToEdit, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = buildingToEdit ? `/api/buildings/${buildingToEdit.id}` : '/api/buildings';
      const method = buildingToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name,
          shortName,
          locationDescription,
          description,
          isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{buildingToEdit ? 'แก้ไขข้อมูลอาคาร' : 'เพิ่มอาคารใหม่'}</DialogTitle>
          <DialogDescription>
            กรอกรายละเอียดข้อมูลอาคารสำหรับจัดทำทะเบียนครุภัณฑ์และแผนผัง 2D/3D
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs">รหัสอาคาร (Code)*</Label>
              <Input
                id="code"
                required
                placeholder="BLD-OPD"
                value={code}
                disabled={!!buildingToEdit}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shortName" className="text-xs">ชื่อย่อ (Short Name)</Label>
              <Input
                id="shortName"
                placeholder="อาคาร OPD"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">ชื่ออาคารเต็ม (Building Name)*</Label>
            <Input
              id="name"
              required
              placeholder="อาคารผู้ป่วยนอก (OPD)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="locationDescription" className="text-xs">ตำแหน่งที่ตั้ง (Location)</Label>
            <Input
              id="locationDescription"
              placeholder="โซนหน้า ติดถนนหลักโรงพยาบาล"
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">คำอธิบายเพิ่มเติม</Label>
            <Input
              id="description"
              placeholder="อาคารบริการผู้ป่วยนอกและคลินิกตรวจโรค 7 ชั้น"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {buildingToEdit ? 'บันทึกการแก้ไข' : 'สร้างอาคารใหม่'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
