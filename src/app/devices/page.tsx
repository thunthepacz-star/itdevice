'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  HardDrive,
  Plus,
  Search,
  Pencil,
  Trash2,
  QrCode,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Wifi,
} from 'lucide-react';
import { DeviceFormDialog } from '@/components/devices/device-form-dialog';
import { DeviceQRDialog } from '@/components/devices/device-qr-dialog';

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Master Data
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);

  // Dialog States
  const [deviceFormOpen, setDeviceFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any | null>(null);

  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrDevice, setQrDevice] = useState<any | null>(null);

  // Fetch Master Data
  useEffect(() => {
    async function loadMasterData() {
      try {
        const [dtRes, bRes] = await Promise.all([
          fetch('/api/device-types'),
          fetch('/api/buildings?limit=100'),
        ]);
        const dtData = await dtRes.json();
        const bData = await bRes.json();

        if (dtRes.ok) setDeviceTypes(dtData.data || []);
        if (bRes.ok) setBuildings(bData.data || []);
      } catch (err) {
        console.error('Load master data error:', err);
      }
    }
    loadMasterData();
  }, []);

  // Fetch Devices List
  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/api/devices?q=${encodeURIComponent(searchQuery)}&page=${pagination.page}&limit=${pagination.limit}`;
      if (selectedType !== 'ALL') url += `&deviceTypeId=${selectedType}`;
      if (selectedStatus !== 'ALL') url += `&status=${selectedStatus}`;
      if (selectedBuilding !== 'ALL') url += `&buildingId=${selectedBuilding}`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setDevices(data.data || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Fetch devices error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedType, selectedStatus, selectedBuilding, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  async function handleDeleteDevice(id: string, name: string, code: string) {
    if (!confirm(`คุณต้องการลบทะเบียนครุภัณฑ์ "${name}" (${code}) ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/devices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDevices();
      } else {
        const data = await res.json();
        alert(data.error || 'ไม่สามารถลบครุภัณฑ์ได้');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบครุภัณฑ์');
    }
  }

  function handleExportCSV() {
    window.open(`/api/devices/export?q=${encodeURIComponent(searchQuery)}`, '_blank');
  }

  async function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/devices/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert(`นำเข้าสำเร็จ ${data.summary.imported} รายการ (ข้าม ${data.summary.skipped} รายการ)`);
        fetchDevices();
      } else {
        alert(data.error || 'การนำเข้า CSV ล้มเหลว');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการนำเข้าไฟล์ CSV');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-primary" />
            ทะเบียนครุภัณฑ์ IT (IT Asset Register)
          </h1>
          <p className="text-sm text-muted-foreground">
            จัดการทะเบียนครุภัณฑ์ สเปกอุปกรณ์ ค้นหา สร้าง QR Code และส่งออกข้อมูล CSV/Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Import CSV */}
          <label htmlFor="csv-import" className="cursor-pointer">
            <input
              type="file"
              id="csv-import"
              accept=".csv"
              className="hidden"
              onChange={handleImportCSV}
            />
            <span className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1 text-xs cursor-pointer')}>
              <Upload className="h-3.5 w-3.5" />
              นำเข้า CSV
            </span>
          </label>

          {/* Export CSV */}
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1 text-xs">
            <Download className="h-3.5 w-3.5" />
            ส่งออก CSV
          </Button>

          {/* Add Device */}
          <Button
            size="sm"
            onClick={() => {
              setEditingDevice(null);
              setDeviceFormOpen(true);
            }}
            className="gap-1 text-xs shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            ลงทะเบียนครุภัณฑ์ใหม่
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="bg-accent/30">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ค้นหา Asset Code, S/N, ชื่อ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs bg-background"
              />
            </div>

            {/* Filter Device Type */}
            <Select value={selectedType} onValueChange={(val) => val && setSelectedType(val)}>
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="ประเภทอุปกรณ์ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">ทุกประเภทอุปกรณ์</SelectItem>
                {deviceTypes.map((dt) => (
                  <SelectItem key={dt.id} value={dt.id} className="text-xs">
                    {dt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Status */}
            <Select value={selectedStatus} onValueChange={(val) => val && setSelectedStatus(val)}>
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="สถานะทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">ทุกสถานะ</SelectItem>
                <SelectItem value="ACTIVE" className="text-xs">ACTIVE (พร้อมใช้งาน)</SelectItem>
                <SelectItem value="IN_USE" className="text-xs">IN_USE (กำลังใช้งาน)</SelectItem>
                <SelectItem value="IN_REPAIR" className="text-xs">IN_REPAIR (ส่งซ่อม)</SelectItem>
                <SelectItem value="RETIRED" className="text-xs">RETIRED (ปลดระวาง)</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Building */}
            <Select value={selectedBuilding} onValueChange={(val) => val && setSelectedBuilding(val)}>
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="อาคารทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">ทุกอาคาร</SelectItem>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Devices Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">รายการทะเบียนครุภัณฑ์</CardTitle>
              <CardDescription className="text-xs">
                ค้นพบรวมทั้งสิ้น {pagination.total} รายการ
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchDevices} title="รีเฟรช">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 w-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : devices.length === 0 ? (
            <div className="flex h-40 w-full items-center justify-center text-xs text-muted-foreground">
              ไม่พบทะเบียนครุภัณฑ์ตรงตามเงื่อนไข
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-xs bg-accent/40">
                  <TableHead>Asset Code / ชื่อครุภัณฑ์</TableHead>
                  <TableHead>ประเภท / สเปก</TableHead>
                  <TableHead>สถานที่ติดตั้ง</TableHead>
                  <TableHead>เครือข่าย IP / MAC</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {devices.map((d) => {
                  const primaryNi = d.networkInterfaces?.find((ni: any) => ni.isPrimary) || d.networkInterfaces?.[0];
                  return (
                    <TableRow key={d.id} className="hover:bg-accent/30 transition-colors">
                      <TableCell>
                        <div className="font-bold text-primary font-mono">{d.assetCode}</div>
                        <div className="font-semibold text-foreground">{d.deviceName}</div>
                        <div className="text-[11px] text-muted-foreground">S/N: {d.serialNumber || '-'}</div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {d.deviceType?.name}
                        </Badge>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {d.brand || ''} {d.model || ''}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 font-medium text-foreground">
                          <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{d.building?.name || 'ยังไม่ระบุ'}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {d.floor?.name || ''} {d.room?.name || ''}
                        </div>
                      </TableCell>

                      <TableCell>
                        {primaryNi?.ipAddress ? (
                          <div className="flex items-center gap-1 text-emerald-600 font-mono text-[11px]">
                            <Wifi className="h-3 w-3" />
                            <span>{primaryNi.ipAddress}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">-</span>
                        )}
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {primaryNi?.macAddress || ''}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={
                            d.status === 'ACTIVE'
                              ? 'default'
                              : d.status === 'IN_USE'
                              ? 'secondary'
                              : 'destructive'
                          }
                          className="text-[10px]"
                        >
                          {d.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setQrDevice(d);
                            setQrDialogOpen(true);
                          }}
                          title="แสดง QR Code"
                        >
                          <QrCode className="h-3.5 w-3.5 text-purple-500" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingDevice(d);
                            setDeviceFormOpen(true);
                          }}
                          title="แก้ไขข้อมูล"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteDevice(d.id, d.deviceName, d.assetCode)}
                          title="ลบครุภัณฑ์"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

      {/* Dialog Modals */}
      <DeviceFormDialog
        open={deviceFormOpen}
        onOpenChange={setDeviceFormOpen}
        deviceToEdit={editingDevice}
        deviceTypes={deviceTypes}
        buildings={buildings}
        onSuccess={fetchDevices}
      />

      <DeviceQRDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        device={qrDevice}
      />
    </div>
  );
}
