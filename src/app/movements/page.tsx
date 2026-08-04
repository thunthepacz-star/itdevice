'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoveRight, History, Search, RefreshCw, Loader2, Building2, User, Calendar, HardDrive, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchMovements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/movements?q=${encodeURIComponent(searchQuery)}&page=${pagination.page}&limit=${pagination.limit}`);
      const data = await res.json();
      if (res.ok) {
        setMovements(data.data || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Fetch movements error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            ประวัติการย้ายสถานที่อุปกรณ์ (Asset Movement Log)
          </h1>
          <p className="text-sm text-muted-foreground">
            บันทึกประวัติการย้ายอาคาร ชั้น พิกัดแผนผัง 2D/3D ของครุภัณฑ์คอมพิวเตอร์และอุปกรณ์ไอที
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchMovements} className="gap-1 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          รีเฟรช
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="bg-accent/30">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="ค้นหา Asset Code, ชื่ออุปกรณ์, สาเหตุการย้าย..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs bg-background"
            />
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">รายการประวัติการย้ายครุภัณฑ์</CardTitle>
          <CardDescription className="text-xs">
            พบประวัติการย้ายรวมทั้งสิ้น {pagination.total} รายการ
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 w-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : movements.length === 0 ? (
            <div className="flex h-40 w-full items-center justify-center text-xs text-muted-foreground">
              ยังไม่มีประวัติการย้ายครุภัณฑ์ในระบบ
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-xs bg-accent/40">
                  <TableHead>วัน-เวลาที่ย้าย</TableHead>
                  <TableHead>อุปกรณ์ / Asset Code</TableHead>
                  <TableHead>สถานที่เดิม</TableHead>
                  <TableHead className="text-center">ปลายทาง</TableHead>
                  <TableHead>พิกัด (Norm X, Y)</TableHead>
                  <TableHead>ผู้ย้าย / เหตุผล</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {movements.map((m) => (
                  <TableRow key={m.id} className="hover:bg-accent/30 transition-colors">
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                        {new Date(m.movedAt).toLocaleString('th-TH')}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-primary font-mono">{m.device?.assetCode}</div>
                      <div className="font-medium text-foreground">{m.device?.deviceName}</div>
                    </TableCell>

                    <TableCell>
                      <div className="text-muted-foreground text-[11px]">
                        {m.fromBuilding?.name || 'ไม่ระบุอาคาร'} • {m.fromFloor?.name || ''}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <MoveRight className="h-4 w-4 text-emerald-500 shrink-0" />
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[11px]">
                          {m.toBuilding?.name || 'ไม่ระบุ'} • {m.toFloor?.name || ''}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      ({m.toPositionX.toFixed(4)}, {m.toPositionY.toFixed(4)})
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 font-medium text-foreground">
                        <User className="h-3.5 w-3.5 text-primary shrink-0" />
                        {m.user?.name || m.user?.email || 'ระบบ'}
                      </div>
                      <div className="text-[11px] text-muted-foreground italic">
                        {m.reason || 'ย้ายตำแหน่งติดตั้ง'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
            <span>หน้า {pagination.page} จาก {pagination.totalPages}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
