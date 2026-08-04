import React from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  HardDrive,
  Building2,
  Map,
  Network,
  Wrench,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Server,
} from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      title: 'ครุภัณฑ์ทั้งหมด',
      value: '1,420',
      description: 'อุปกรณ์ IT ในระบบทั้งหมด',
      icon: HardDrive,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      title: 'อาคารและชั้น',
      value: '5 อาคาร / 28 ชั้น',
      description: 'พร้อมแผนผัง Active 28 รายการ',
      icon: Building2,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      title: 'อุปกรณ์เครือข่าย',
      value: '184',
      description: 'Switch, Router, AP, NVR',
      icon: Network,
      color: 'text-purple-500 bg-purple-500/10',
    },
    {
      title: 'การซ่อมบำรุงที่ค้างอยู่',
      value: '12',
      description: 'รออะไหล่และอยู่ระหว่างดำเนินการ',
      icon: Wrench,
      color: 'text-amber-500 bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            ระบบทะเบียนครุภัณฑ์ IT และแผนผังอุปกรณ์ 2D/3D
          </h1>
          <p className="text-sm text-muted-foreground">
            ยินดีต้อนรับสู่ระบบบริหารจัดการตำแหน่งและทะเบียนครุภัณฑ์ไอที (On-premise System)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/floor-plans" className={cn(buttonVariants({ variant: 'default' }), 'gap-2')}>
            <Map className="h-4 w-4" />
            เปิดแผนผังอุปกรณ์ 2D/3D
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-xl ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Action Cards & System Info */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Floor Plan Editor Shortcut */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Map className="h-5 w-5 text-primary" />
                  แผนผังอุปกรณ์ 2D Canvas & 3D Spatial
                </CardTitle>
                <CardDescription className="mt-1">
                  ดูและระบุตำแหน่งครุภัณฑ์คอมพิวเตอร์และอุปกรณ์เครือข่ายบนแผนผังอาคาร
                </CardDescription>
              </div>
              <Link href="/floor-plans" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}>
                เข้าสู่ระบบแผนผัง
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-4 rounded-xl border bg-accent/30 space-y-2">
                <div className="flex items-center justify-between font-semibold text-sm">
                  <span>2D Interactive Floor Plan</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">React Konva</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ลาก วาง ย้าย ปรับตำแหน่งครุภัณฑ์ พร้อม Snap-to-Grid และระบบ พิกัด Normalized Position (0-1)
                </p>
              </div>
              <div className="p-4 rounded-xl border bg-accent/30 space-y-2">
                <div className="flex items-center justify-between font-semibold text-sm">
                  <span>3D Building Spatial View</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-medium">Three.js / R3F</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  แสดงผลอาคาร 3D แบบ Multi-Floor, Elevation ความสูงของชั้น และ Marker สามมิติ real-time
                </p>
              </div>
            </div>

            {/* Buildings Summary list */}
            <div className="border rounded-xl p-4 bg-background">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                รายการอาคารหลักในระบบ (Sample Data)
              </div>
              <div className="grid gap-2 sm:grid-cols-3 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-lg border bg-accent/20">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-foreground truncate">อาคารผู้ป่วยนอก (OPD)</div>
                    <div className="text-muted-foreground">7 ชั้น • 420 อุปกรณ์</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg border bg-accent/20">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-foreground truncate">อาคารผู้ป่วยใน (IPD)</div>
                    <div className="text-muted-foreground">10 ชั้น • 650 อุปกรณ์</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg border bg-accent/20">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-foreground truncate">อาคารอำนวยการ</div>
                    <div className="text-muted-foreground">5 ชั้น • 350 อุปกรณ์</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              สถานะระบบ On-premise
            </CardTitle>
            <CardDescription>การเชื่อมต่อและบริการย่อยในระบบ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Next.js Web Server</span>
                <span className="flex items-center gap-1 font-medium text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                </span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">PostgreSQL Database</span>
                <span className="flex items-center gap-1 font-medium text-amber-600">
                  <Clock className="h-3.5 w-3.5" /> Pending Step 2
                </span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Timezone Config</span>
                <span className="font-medium text-foreground">Asia/Bangkok</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">File Storage Mode</span>
                <span className="font-medium text-foreground">Local Storage</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Strict TypeScript</span>
                <span className="font-medium text-emerald-600">Enabled</span>
              </div>
            </div>

            <div className="pt-2 border-t text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">ขั้นตอนปัจจุบัน:</p>
              <p className="text-primary font-medium">Step 1: Project Foundation Complete</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
