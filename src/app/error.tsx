'use client';

import React, { useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled System Error:', error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full flex-col items-center justify-center p-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">เกิดข้อผิดพลาดในระบบ</h2>
      <p className="max-w-md text-sm text-muted-foreground mb-6">
        {error.message || 'ระบบไม่สามารถประมวลผลคำขอได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          ลองใหม่อีกครั้ง
        </Button>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}>
          <Home className="h-4 w-4" />
          กลับหน้าหลัก Dashboard
        </Link>
      </div>
    </div>
  );
}
