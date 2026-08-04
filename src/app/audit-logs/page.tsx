'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldAlert, Search, RefreshCw, Loader2, Calendar, User, Globe, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function fetchAuditLogs() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/audit-logs?q=${encodeURIComponent(searchQuery)}&page=${pagination.page}&limit=${pagination.limit}`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.data || []);
        setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Fetch audit logs error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAuditLogs();
  }, [searchQuery, pagination.page, pagination.limit]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Audit Logs (บันทึกกิจกรรมความปลอดภัย)
          </h1>
          <p className="text-sm text-muted-foreground">
            ตรวจสอบกิจกรรมของผู้ใช้งาน การเข้าสู่ระบบ การเพิ่ม แก้ไข ลบ และการปรับเปลี่ยนข้อมูลในระบบ
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchAuditLogs} className="gap-1 text-xs">
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
              placeholder="ค้นหา Action, รายละเอียด, IP Address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs bg-background"
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">รายการ Audit Logs ทั้งหมด</CardTitle>
          <CardDescription className="text-xs">
            พบกิจกรรมรวมทั้งสิ้น {pagination.total} รายการ
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 w-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-40 w-full items-center justify-center text-xs text-muted-foreground">
              ไม่พบรายการ Audit Log
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-xs bg-accent/40">
                  <TableHead>วัน-เวลา (Bangkok Time)</TableHead>
                  <TableHead>ผู้ใช้งาน</TableHead>
                  <TableHead>การกระทำ (Action)</TableHead>
                  <TableHead>รายละเอียดกิจกรรม</TableHead>
                  <TableHead className="text-right">IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-accent/30 transition-colors">
                    <TableCell className="whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString('th-TH')}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <User className="h-3.5 w-3.5 text-primary shrink-0" />
                        {log.user?.name || log.user?.email || 'System'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {log.action}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-foreground">{log.details}</TableCell>

                    <TableCell className="text-right font-mono text-[11px] text-muted-foreground">
                      {log.ipAddress || '127.0.0.1'}
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
