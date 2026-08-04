'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  Layers,
  Settings2,
  RefreshCw,
  Loader2,
  Box,
  Eye,
} from 'lucide-react';
import { BuildingFormDialog } from '@/components/buildings/building-form-dialog';
import { FloorFormDialog } from '@/components/buildings/floor-form-dialog';
import { Floor3DSettingsDialog } from '@/components/buildings/floor-3d-settings-dialog';
import { Building3DViewer } from '@/components/3d/building-3d-viewer';

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);
  const [floors, setFloors] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode3D, setViewMode3D] = useState(true);

  // Dialog States
  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<any | null>(null);

  const [floorDialogOpen, setFloorDialogOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<any | null>(null);

  const [floor3DSettingsOpen, setFloor3DSettingsOpen] = useState(false);
  const [target3DFloor, setTarget3DFloor] = useState<any | null>(null);

  // Fetch Buildings List
  const fetchBuildings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/buildings?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (res.ok) {
        setBuildings(data.data || []);
        if (data.data.length > 0 && !selectedBuilding) {
          setSelectedBuilding(data.data[0]);
        }
      }
    } catch (err) {
      console.error('Fetch buildings error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedBuilding]);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  // Fetch Floors and Devices for selected building
  const fetchFloorsAndDevices = useCallback(async () => {
    if (!selectedBuilding) return;
    try {
      const [fRes, dRes] = await Promise.all([
        fetch(`/api/buildings/${selectedBuilding.id}/floors`),
        fetch(`/api/devices?buildingId=${selectedBuilding.id}&limit=200`),
      ]);

      const fData = await fRes.json();
      const dData = await dRes.json();

      if (fRes.ok) setFloors(fData.data || []);
      if (dRes.ok) setDevices(dData.data || []);
    } catch (err) {
      console.error('Fetch floors & devices error:', err);
    }
  }, [selectedBuilding]);

  useEffect(() => {
    fetchFloorsAndDevices();
  }, [fetchFloorsAndDevices]);

  async function handleDeleteBuilding(id: string, name: string) {
    if (!confirm(`คุณต้องการลบอาคาร "${name}" ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/buildings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedBuilding?.id === id) setSelectedBuilding(null);
        fetchBuildings();
      } else {
        const data = await res.json();
        alert(data.error || 'ไม่สามารถลบอาคารได้');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบอาคาร');
    }
  }

  async function handleDeleteFloor(id: string, name: string) {
    if (!confirm(`คุณต้องการลบชั้น "${name}" ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/floors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchFloorsAndDevices();
      } else {
        const data = await res.json();
        alert(data.error || 'ไม่สามารถลบชั้นได้');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบชั้น');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            การจัดการอาคาร ชั้น และ 3D Spatial Viewer
          </h1>
          <p className="text-sm text-muted-foreground">
            จัดการรายชื่ออาคาร โครงสร้างชั้น และจำลองอาคารแบบ 3D Spatial Plane (Three.js)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedBuilding && (
            <Button
              variant={viewMode3D ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode3D(!viewMode3D)}
              className="gap-1 text-xs"
            >
              <Box className="h-3.5 w-3.5" />
              {viewMode3D ? 'โหมดตารางข้อมูล' : 'โหมด 3D Spatial Viewer'}
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => {
              setEditingBuilding(null);
              setBuildingDialogOpen(true);
            }}
            className="gap-1 text-xs shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            เพิ่มอาคารใหม่
          </Button>
        </div>
      </div>

      {/* Main Content Layout */}
      {viewMode3D && selectedBuilding ? (
        // 3D Spatial Viewer Mode
        <div className="h-[calc(100vh-12rem)] space-y-2">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl text-white text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold flex items-center gap-2 text-sm text-primary">
                <Box className="h-5 w-5 text-primary" />
                3D Spatial View
              </span>
              <div className="w-56">
                <Select
                  value={selectedBuilding.id}
                  onValueChange={(val) => {
                    const found = buildings.find((b) => b.id === val);
                    if (found) setSelectedBuilding(found);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-slate-950 border-slate-800 text-white">
                    <SelectValue placeholder="เลือกอาคาร" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {b.name} ({b.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="border-slate-700 text-slate-300 text-[11px]">
                {floors.length} ชั้น • {devices.length} อุปกรณ์
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode3D(false)}
              className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200"
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> สลับเป็นตารางจัดการข้อมูล
            </Button>
          </div>
          <Building3DViewer building={selectedBuilding} floors={floors} devices={devices} />
        </div>
      ) : (
        // Standard Data Table Mode
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Buildings List */}
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">รายชื่ออาคาร</CardTitle>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchBuildings}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="relative pt-2">
                  <Search className="absolute left-2.5 top-4 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="ค้นหาชื่ออาคาร, รหัส..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex h-32 w-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : buildings.length === 0 ? (
                  <div className="flex h-24 w-full items-center justify-center text-xs text-muted-foreground">
                    ไม่พบข้อมูลอาคาร
                  </div>
                ) : (
                  <div className="divide-y max-h-[500px] overflow-y-auto">
                    {buildings.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBuilding(b)}
                        className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                          selectedBuilding?.id === b.id
                            ? 'bg-accent border-l-4 border-l-primary font-medium'
                            : 'hover:bg-accent/50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{b.name}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {b.code}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {b.totalFloors} ชั้น • {b._count?.floors || 0} ชั้นที่บันทึกแล้ว
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingBuilding(b);
                              setBuildingDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBuilding(b.id, b.name);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Floors & 3D Config */}
          <div className="lg:col-span-7 space-y-4">
            {selectedBuilding ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        ชั้นทั้งหมดของ {selectedBuilding.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        กำหนดค่าความสูง Elevation และพิกัด 3D เพื่อแสดงผลใน Three.js Spatial Viewer
                      </CardDescription>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingFloor(null);
                        setFloorDialogOpen(true);
                      }}
                      className="gap-1 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      เพิ่มชั้นใหม่
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {floors.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      ยังไม่มีข้อมูลชั้นสำหรับอาคารนี้ กดปุ่ม &quot;เพิ่มชั้นใหม่&quot; เพื่อเริ่มต้น
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs bg-accent/40">
                          <TableHead>ลำดับชั้น / ชื่อชั้น</TableHead>
                          <TableHead>3D Elevation (ม.)</TableHead>
                          <TableHead>ขนาด (กxย)</TableHead>
                          <TableHead>แผนผัง Active</TableHead>
                          <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {floors.map((f) => {
                          const activePlan = f.plans?.find((p: any) => p.isActive);
                          return (
                            <TableRow key={f.id} className="hover:bg-accent/30">
                              <TableCell className="font-semibold">
                                {f.name} ({f.code})
                              </TableCell>
                              <TableCell className="font-mono text-primary font-bold">
                                {f.elevation} m
                              </TableCell>
                              <TableCell className="text-muted-foreground font-mono">
                                {f.width}x{f.depth} m
                              </TableCell>
                              <TableCell>
                                {activePlan ? (
                                  <Badge variant="default" className="bg-emerald-600 text-[10px]">
                                    v{activePlan.version} Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px]">
                                    ยังไม่มีผัง
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-primary"
                                  onClick={() => {
                                    setTarget3DFloor(f);
                                    setFloor3DSettingsOpen(true);
                                  }}
                                  title="ตั้งค่า 3D Spatial Parameters"
                                >
                                  <Settings2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setEditingFloor(f);
                                    setFloorDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => handleDeleteFloor(f.id, f.name)}
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
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center text-xs text-muted-foreground">
                กรุณาเลือกอาคารทางด้านซ้ายเพื่อดูรายละเอียดชั้น
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Dialog Modals */}
      <BuildingFormDialog
        open={buildingDialogOpen}
        onOpenChange={setBuildingDialogOpen}
        buildingToEdit={editingBuilding}
        onSuccess={fetchBuildings}
      />

      {selectedBuilding && (
        <FloorFormDialog
          open={floorDialogOpen}
          onOpenChange={setFloorDialogOpen}
          buildingId={selectedBuilding.id}
          floorToEdit={editingFloor}
          onSuccess={fetchFloorsAndDevices}
        />
      )}

      <Floor3DSettingsDialog
        open={floor3DSettingsOpen}
        onOpenChange={setFloor3DSettingsOpen}
        floor={target3DFloor}
        onSuccess={fetchFloorsAndDevices}
      />
    </div>
  );
}

function X(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
