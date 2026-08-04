'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Box, Layers } from 'lucide-react';

interface Floor3DSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floor: any;
  onSuccess: () => void;
}

export function Floor3DSettingsDialog({
  open,
  onOpenChange,
  floor,
  onSuccess,
}: Floor3DSettingsDialogProps) {
  const [floorElevation, setFloorElevation] = useState<number>(0);
  const [floorWidth, setFloorWidth] = useState<number>(50);
  const [floorDepth, setFloorDepth] = useState<number>(30);
  const [floorHeight, setFloorHeight] = useState<number>(3.5);
  const [floorThickness, setFloorThickness] = useState<number>(0.3);
  const [rotationX, setRotationX] = useState<number>(0);
  const [rotationY, setRotationY] = useState<number>(0);
  const [rotationZ, setRotationZ] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (floor) {
      setFloorElevation(floor.floorElevation ?? 0);
      setFloorWidth(floor.floorWidth ?? 50);
      setFloorDepth(floor.floorDepth ?? 30);
      setFloorHeight(floor.floorHeight ?? 3.5);
      setFloorThickness(floor.floorThickness ?? 0.3);
      setRotationX(floor.rotationX ?? 0);
      setRotationY(floor.rotationY ?? 0);
      setRotationZ(floor.rotationZ ?? 0);
    }
    setError(null);
  }, [floor, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/floors/${floor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floorElevation: Number(floorElevation),
          floorWidth: Number(floorWidth),
          floorDepth: Number(floorDepth),
          floorHeight: Number(floorHeight),
          floorThickness: Number(floorThickness),
          rotationX: Number(rotationX),
          rotationY: Number(rotationY),
          rotationZ: Number(rotationZ),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกพารามิเตอร์ 3D');
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
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="h-5 w-5 text-primary" />
            ตั้งค่าพารามิเตอร์ 3D Spatial ({floor?.name})
          </DialogTitle>
          <DialogDescription>
            กำหนดความสูง Elevation ขนาดกว้าง/ยาว และหมุนพิกัด 3D สำหรับ Three.js / React Three Fiber
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border bg-accent/30 p-3 space-y-3">
            <div className="text-xs font-semibold flex items-center gap-1.5 text-primary">
              <Layers className="h-4 w-4" />
              มิติและระยะความสูงจากพื้นดิน (Elevation & Dimensions in Meters)
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Elevation ความสูงชั้น (เมตร)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={floorElevation}
                  onChange={(e) => setFloorElevation(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Floor Height ความสูงเพดาน (เมตร)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={floorHeight}
                  onChange={(e) => setFloorHeight(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Width ความกว้าง (เมตร)</Label>
                <Input
                  type="number"
                  step="1"
                  value={floorWidth}
                  onChange={(e) => setFloorWidth(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Depth ความลึก (เมตร)</Label>
                <Input
                  type="number"
                  step="1"
                  value={floorDepth}
                  onChange={(e) => setFloorDepth(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Thickness แผ่นพื้น (เมตร)</Label>
                <Input
                  type="number"
                  step="0.05"
                  value={floorThickness}
                  onChange={(e) => setFloorThickness(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-accent/30 p-3 space-y-3">
            <div className="text-xs font-semibold text-primary">
              มุมหมุนพิกัด 3D World (3D Rotation Angles in Degrees)
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Rotation X (°)</Label>
                <Input
                  type="number"
                  step="1"
                  value={rotationX}
                  onChange={(e) => setRotationX(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Rotation Y (°)</Label>
                <Input
                  type="number"
                  step="1"
                  value={rotationY}
                  onChange={(e) => setRotationY(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Rotation Z (°)</Label>
                <Input
                  type="number"
                  step="1"
                  value={rotationZ}
                  onChange={(e) => setRotationZ(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              บันทึกพารามิเตอร์ 3D
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
