'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface FloorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
  floorToEdit?: any;
  onSuccess: () => void;
}

export function FloorFormDialog({
  open,
  onOpenChange,
  buildingId,
  floorToEdit,
  onSuccess,
}: FloorFormDialogProps) {
  const [floorNumber, setFloorNumber] = useState<number>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (floorToEdit) {
      setFloorNumber(floorToEdit.floorNumber || 1);
      setName(floorToEdit.name || '');
      setDescription(floorToEdit.description || '');
      setDisplayOrder(floorToEdit.displayOrder || 1);
    } else {
      setFloorNumber(1);
      setName('');
      setDescription('');
      setDisplayOrder(1);
    }
    setError(null);
  }, [floorToEdit, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = floorToEdit ? `/api/floors/${floorToEdit.id}` : `/api/buildings/${buildingId}/floors`;
      const method = floorToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floorNumber: Number(floorNumber),
          name,
          description,
          displayOrder: Number(displayOrder),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลชั้น');
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
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{floorToEdit ? 'แก้ไขข้อมูลชั้น' : 'เพิ่มชั้นใหม่ในอาคาร'}</DialogTitle>
          <DialogDescription>
            กำหนดลำดับและชื่อของชั้นเพื่อใช้ในแผนผัง 2D/3D
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
              <Label htmlFor="floorNumber" className="text-xs">ลำดับชั้น (Floor Number)*</Label>
              <Input
                id="floorNumber"
                type="number"
                required
                value={floorNumber}
                onChange={(e) => setFloorNumber(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="displayOrder" className="text-xs">ลำดับแสดงผล (Display Order)</Label>
              <Input
                id="displayOrder"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="floorName" className="text-xs">ชื่อชั้น (Floor Name)*</Label>
            <Input
              id="floorName"
              required
              placeholder="ชั้น 1 - เวชระเบียนและต้อนรับ"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="floorDesc" className="text-xs">คำอธิบายแผนกในชั้น</Label>
            <Input
              id="floorDesc"
              placeholder="ห้องตรวจคลินิกอายุรกรรม และจุดคัดกรอง"
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
              {floorToEdit ? 'บันทึกแก้ไข' : 'สร้างชั้นใหม่'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
