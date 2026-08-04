'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench, Plus, Search, RefreshCw, Loader2, Calendar, HardDrive, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function MaintenancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function fetchMaintenance() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/maintenance?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (res.ok) setRecords(data.data || []);
    } catch (err) {
      console.error('Fetch maintenance error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMaintenance();
  }, [searchQuery]);

  const pendingCount = records.filter((r) => r.status === 'PENDING').length;
  const inProgressCount = records.filter((r) => r.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            การซ่อมบำรุงและแจ้งซ่อม (Maintenance Records)
          </h1>
          <p className="text-sm text-muted-foreground">
            บันทึกประวัติการส่งซ่อม บำรุงรักษาป้องกัน (Preventive) การเคลมประกัน และติดตามสถานะ
          </p>
        </div>

        <Button size="sm" onClick={fetchMaintenance} className="gap-1 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          รีเฟรช
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-600 font-semibold">รอดำเนินการ (Pending)</div>
              <div className="text-2xl font-bold text-amber-700">{pendingCount} รายการ</div>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-600 font-semibold">กำลังซ่อมบำรุง (In Progress)</div>
              <div className="text-2xl font-bold text-blue-700">{inProgressCount} รายการ</div>
            </div>
            <Wrench className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-600 font-semibold">เสร็จสิ้นแล้ว (Completed)</div>
              <div className="text-2xl font-bold text-emerald-700">
                {records.filter((r) => r.status === 'COMPLETED').length} รายการ
              </div>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="bg-accent/30">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="ค้นหา Asset Code, หัวข้อการซ่อม..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs bg-background"
            />
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">รายการประวัติซ่อมบำรุง</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 w-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex h-40 w-full items-center justify-center text-xs text-muted-foreground">
              ไม่พบรายการซ่อมบำรุงในระบบ
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-xs bg-accent/40">
                  <TableHead>วัน-เวลาบันทึก</TableHead>
                  <TableHead>ครุภัณฑ์ / Asset Code</TableHead>
                  <TableHead>หัวข้อการแจ้งซ่อม</TableHead>
                  <TableHead>ประเภทการซ่อม</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {records.map((r) => (
                  <TableRow key={r.id} className="hover:bg-accent/30 transition-colors">
                    <TableCell className="whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-primary font-mono">{r.device?.assetCode}</div>
                      <div className="text-[11px]">{r.device?.deviceName}</div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{r.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {r.maintenanceType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          r.status === 'COMPLETED'
                            ? 'default'
                            : r.status === 'IN_PROGRESS'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-[10px]"
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
