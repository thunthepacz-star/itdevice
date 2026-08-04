import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          ผู้ใช้งานและสิทธิ์ (Users & Role Permissions)
        </h1>
        <p className="text-sm text-muted-foreground">
          จัดการผู้ใช้งาน กำหนดสิทธิ์ Role-Based Access Control (Admin, Officer, Viewer)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการผู้ใช้งานในระบบ</CardTitle>
          <CardDescription>
            โมดูลการยืนยันตัวตน สิทธิ์การใช้งาน และ RBAC Guard จะพัฒนาใน Step 3
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed bg-accent/30 text-muted-foreground text-sm">
            ระบบจัดการผู้ใช้งานและสิทธิ์จะแสดงที่นี่ใน Step 3
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
