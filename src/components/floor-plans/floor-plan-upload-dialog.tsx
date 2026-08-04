'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';

interface FloorPlanUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floor: any;
  onSuccess: () => void;
}

export function FloorPlanUploadDialog({
  open,
  onOpenChange,
  floor,
  onSuccess,
}: FloorPlanUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [planName, setPlanName] = useState('');
  const [activateImmediately, setActivateImmediately] = useState(true);
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!planName) {
        setPlanName(`แผนผัง ${floor?.name || ''}`);
      }
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setError('กรุณาเลือกไฟล์แผนผังก่อนทำการอัปโหลด');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', planName || `แผนผัง ${floor?.name || ''}`);
      formData.append('activate', String(activateImmediately));
      formData.append('pdfPage', String(pdfPage));

      const res = await fetch(`/api/floors/${floor.id}/plans`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
      }

      onSuccess();
      onOpenChange(false);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const isPdf = selectedFile?.type === 'application/pdf' || selectedFile?.name.toLowerCase().endsWith('.pdf');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            อัปโหลดแผนผังใหม่ ({floor?.name})
          </DialogTitle>
          <DialogDescription>
            รองรับไฟล์ PNG, JPG, WebP, SVG หรือ PDF (ระบบรองรับการแปลงหน้า PDF เป็นรูปภาพแผนผัง)
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">ชื่อเวอร์ชันแผนผัง (Plan Name)</Label>
            <Input
              required
              placeholder={`แผนผัง ${floor?.name || ''}`}
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
            />
          </div>

          {/* File Upload Dropzone / Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">เลือกไฟล์แผนผัง (Max 20MB)</Label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 bg-accent/20 hover:bg-accent/40 transition-colors text-center">
              <input
                type="file"
                id="file-upload"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                {selectedFile ? (
                  <>
                    {isPdf ? (
                      <FileText className="h-10 w-10 text-destructive" />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-primary" />
                    )}
                    <span className="font-semibold text-xs text-foreground truncate max-w-[280px]">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'PDF Document'}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground mb-1" />
                    <span className="text-xs font-semibold text-primary">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</span>
                    <span className="text-[11px] text-muted-foreground">PNG, JPG, WebP, SVG, PDF</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* PDF Page Selector if PDF is selected */}
          {isPdf && (
            <div className="rounded-xl border bg-amber-500/10 p-3 space-y-2 text-xs border-amber-500/30">
              <div className="font-semibold text-amber-600 flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                ตรวจพบไฟล์ PDF: เลือกหน้าที่ต้องการแปลงเป็นแผนผัง
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="pdfPage" className="text-xs shrink-0">หมายเลขหน้าที่ต้องการ:</Label>
                <Input
                  id="pdfPage"
                  type="number"
                  min={1}
                  value={pdfPage}
                  onChange={(e) => setPdfPage(Number(e.target.value))}
                  className="h-8 w-24 bg-background"
                />
              </div>
            </div>
          )}

          {/* Activate Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="activate"
              checked={activateImmediately}
              onChange={(e) => setActivateImmediately(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
            />
            <Label htmlFor="activate" className="text-xs cursor-pointer">
              ตั้งค่าให้เป็น Active Floor Plan ทันทีหลังอัปโหลด
            </Label>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading || !selectedFile} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              อัปโหลดและสร้าง Version
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
