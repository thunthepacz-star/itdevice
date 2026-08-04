'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, CheckCircle2, Trash2, ExternalLink, Loader2, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloorPlanHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floor: any;
  onSuccess: () => void;
}

export function FloorPlanHistoryDialog({
  open,
  onOpenChange,
  floor,
  onSuccess,
}: FloorPlanHistoryDialogProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVersionHistory = useCallback(async () => {
    if (!floor) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/floors/${floor.id}/plans`);
      const data = await res.json();
      if (res.ok) {
        setPlans(data.data || []);
      }
    } catch (err) {
      console.error('Fetch version history error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [floor]);

  useEffect(() => {
    if (open && floor) {
      fetchVersionHistory();
    }
  }, [open, floor, fetchVersionHistory]);

  async function handleActivate(planId: string, version: number) {
    if (!confirm(`คุณต้องการสลับเปิดใช้งานแผนผัง v${version} สำหรับ ${floor.name} ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/floor-plans/${planId}/activate`, { method: 'PATCH' });
      if (res.ok) {
        fetchVersionHistory();
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || 'ไม่สามารถเปิดใช้งานแผนผังได้');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการสลับแผนผัง');
    }
  }

  async function handleDelete(planId: string, version: number) {
    if (!confirm(`คุณต้องการลบเวอร์ชันแผนผัง v${version} ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/floor-plans/${planId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchVersionHistory();
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || 'ไม่สามารถลบแผนผังได้');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบแผนผัง');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            ประวัติเวอร์ชันแผนผัง ({floor?.name})
          </DialogTitle>
          <DialogDescription>
            รายการแผนผังทั้งหมดของชั้น สามารถสลับ Active Version ได้เพียง 1 รายการ
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : plans.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
            ยังไม่มีประวัติการอัปโหลดแผนผังสำหรับชั้นนี้
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  plan.isActive
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'bg-background hover:border-accent'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      v{plan.version} - {plan.name}
                    </span>
                    {plan.isActive ? (
                      <Badge variant="default" className="bg-emerald-600 gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> Active Plan
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Archived
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                    <span>ประเภท: {plan.mimeType}</span>
                    <span>ขนาด: {plan.originalWidth}x{plan.originalHeight}px</span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3 text-primary" />
                      {plan._count?.devicePositions ?? 0} อุปกรณ์
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={plan.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 text-xs gap-1')}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    ดูรูป
                  </a>

                  {!plan.isActive && (
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleActivate(plan.id, plan.version)}
                    >
                      เปิดใช้งาน
                    </Button>
                  )}

                  {!plan.isActive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(plan.id, plan.version)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
