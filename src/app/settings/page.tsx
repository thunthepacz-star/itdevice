'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, Globe, Clock, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const [siteName, setSiteName] = useState('IT Device Register & 2D/3D Floor Plan System');
  const [hospitalName, setHospitalName] = useState('โรงพยาบาลกรุงเทพคริสเตียน / Hospital Group');
  const [timezone, setTimezone] = useState('Asia/Bangkok');
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          การตั้งค่าระบบ (System Settings)
        </h1>
        <p className="text-sm text-muted-foreground">
          กำหนดค่าชื่อองค์กร โรงพยาบาล โซนเวลาระบบ (Timezone) และพารามิเตอร์ของแอปพลิเคชัน
        </p>
      </div>

      {saved && (
        <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-600 font-semibold">
          บันทึกการตั้งค่าระบบเรียบร้อยแล้ว
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">ข้อมูลองค์กรและระบบ</CardTitle>
          <CardDescription className="text-xs">
            กำหนดค่าการแสดงผลบน Header และป้าย Asset Tag Label
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="space-y-1">
              <Label className="text-[11px]">ชื่อแอปพลิเคชัน (Site Title)</Label>
              <Input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">ชื่อโรงพยาบาล / หน่วยงาน (Organization Name)</Label>
              <Input
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">เขตเวลาของระบบ (Timezone Requirement)*</Label>
              <Input
                value={timezone}
                disabled
                className="h-9 text-xs font-mono bg-accent/30"
              />
              <p className="text-[11px] text-muted-foreground">
                ล็อกเขตเวลาเป็น Asia/Bangkok ตามข้อกำหนดใน ai_prompt.txt
              </p>
            </div>

            <div className="pt-2">
              <Button type="submit" className="gap-2 text-xs">
                <Save className="h-4 w-4" />
                บันทึกการตั้งค่า
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
