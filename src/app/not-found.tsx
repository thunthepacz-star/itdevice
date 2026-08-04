import React from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { FileQuestion, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotFound() {
  return (
    <div className="flex h-[calc(100vh-8rem)] w-full flex-col items-center justify-center p-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">404 - ไม่พบหน้านี้</h1>
      <p className="max-w-md text-sm text-muted-foreground mb-6">
        ขออภัย ไม่พบหน้าที่คุณต้องการค้นหา หรือหน้าที่คุณระบุถูกย้ายไปยังตำแหน่งอื่นแล้ว
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'default' }), 'gap-2')}>
          <Home className="h-4 w-4" />
          กลับไปหน้า Dashboard
        </Link>
      </div>
    </div>
  );
}
