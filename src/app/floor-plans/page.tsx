'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Map,
  Building2,
  Layers,
  Upload,
  History,
  CheckCircle2,
  Loader2,
  HardDrive,
  MousePointer,
  Hand,
  PlusCircle,
  Move,
  Grid,
  Tag,
  RefreshCw,
} from 'lucide-react';
import { FloorPlanUploadDialog } from '@/components/floor-plans/floor-plan-upload-dialog';
import { FloorPlanHistoryDialog } from '@/components/floor-plans/floor-plan-history-dialog';
import { Editor2DCanvas } from '@/components/floor-plans/editor-2d-canvas';

export default function FloorPlansPage() {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');

  const [floors, setFloors] = useState<any[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');

  const [activePlan, setActivePlan] = useState<any | null>(null);
  const [devicePositions, setDevicePositions] = useState<any[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  // Toolbar state
  const [activeMode, setActiveMode] = useState<'SELECT' | 'PAN' | 'ADD_DEVICE' | 'MOVE'>('SELECT');
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState<string>('');
  const [showGrid, setShowGrid] = useState(true);
  const [snapGrid, setSnapGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  // Dialogs
  const [uploadOpen, setUploadOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Fetch Master Data
  useEffect(() => {
    async function loadMasterData() {
      try {
        const [bRes, dtRes] = await Promise.all([
          fetch('/api/buildings?limit=100'),
          fetch('/api/device-types'),
        ]);
        const bData = await bRes.json();
        const dtData = await dtRes.json();

        if (bRes.ok && bData.data.length > 0) {
          setBuildings(bData.data);
          setSelectedBuildingId(bData.data[0].id);
        }
        if (dtRes.ok) {
          setDeviceTypes(dtData.data || []);
          if (dtData.data.length > 0) {
            setSelectedDeviceTypeId(dtData.data[0].id);
          }
        }
      } catch (err) {
        console.error('Load master data error:', err);
      }
    }
    loadMasterData();
  }, []);

  // Fetch Floors when building changes
  const fetchFloors = useCallback(async (bId: string) => {
    try {
      const res = await fetch(`/api/buildings/${bId}/floors`);
      const data = await res.json();
      if (res.ok) {
        setFloors(data.data || []);
        if (data.data.length > 0) {
          setSelectedFloorId(data.data[0].id);
        } else {
          setSelectedFloorId('');
          setActivePlan(null);
          setDevicePositions([]);
        }
      }
    } catch (err) {
      console.error('Fetch floors error:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedBuildingId) {
      fetchFloors(selectedBuildingId);
    }
  }, [selectedBuildingId, fetchFloors]);

  // Fetch Active Floor Plan and Markers when floor changes
  const fetchActivePlan = useCallback(async (fId: string) => {
    if (!fId) return;
    setIsLoadingPlan(true);
    try {
      const res = await fetch(`/api/floors/${fId}/plans`);
      const data = await res.json();
      if (res.ok) {
        const plans = data.data || [];
        const active = plans.find((p: any) => p.isActive) || plans[0] || null;
        setActivePlan(active);

        if (active) {
          // Fetch positions for active floor plan
          const planRes = await fetch(`/api/floor-plans/${active.id}`);
          const planData = await planRes.json();
          if (planRes.ok) {
            setDevicePositions(planData.data.devicePositions || []);
          }
        } else {
          setDevicePositions([]);
        }
      }
    } catch (err) {
      console.error('Fetch active plan error:', err);
    } finally {
      setIsLoadingPlan(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFloorId) {
      fetchActivePlan(selectedFloorId);
    }
  }, [selectedFloorId, fetchActivePlan]);

  const selectedFloor = floors.find((f) => f.id === selectedFloorId);

  // Save Marker Handler
  async function handleSavePosition(data: {
    deviceId?: string;
    positionX: number;
    positionY: number;
    newDeviceData?: any;
  }) {
    if (!activePlan) return;

    try {
      const res = await fetch('/api/device-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floorPlanId: activePlan.id,
          deviceId: data.deviceId,
          positionX: data.positionX,
          positionY: data.positionY,
          newDeviceData: data.newDeviceData,
        }),
      });

      if (res.ok) {
        fetchActivePlan(selectedFloorId);
      } else {
        const errData = await res.json();
        alert(errData.error || 'ไม่สามารถบันทึกตำแหน่งบนแผนผังได้');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกตำแหน่งอุปกรณ์');
    }
  }

  // Delete Marker Handler
  async function handleDeleteMarker(positionId: string) {
    try {
      const res = await fetch(`/api/device-positions/${positionId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchActivePlan(selectedFloorId);
      } else {
        const errData = await res.json();
        alert(errData.error || 'ไม่สามารถถอด Marker ได้');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการถอด Marker');
    }
  }

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-6rem)]">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            2D Floor Plan Editor (ระบบแผนผังและพิกัด Normalized Coordinates)
          </h1>
          <p className="text-xs text-muted-foreground">
            วาง ลาก ย้าย Marker อุปกรณ์บนแผนผังระบบ 2D Canvas พร้อม Snap-to-Grid และพิกัด 0.0-1.0
          </p>
        </div>

        {selectedFloor && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)} className="gap-1.5 text-xs">
              <History className="h-3.5 w-3.5" />
              ประวัติเวอร์ชัน
            </Button>

            <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-1.5 text-xs shadow-sm">
              <Upload className="h-3.5 w-3.5" />
              อัปโหลดแผนผังใหม่
            </Button>
          </div>
        )}
      </div>

      {/* Editor Toolbar */}
      <Card className="bg-accent/30 shrink-0">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Building & Floor Dropdowns */}
            <div className="flex items-center gap-2">
              <div className="w-48">
                <Select value={selectedBuildingId} onValueChange={(val) => val && setSelectedBuildingId(val)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="เลือกอาคาร" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-48">
                <Select value={selectedFloorId} onValueChange={(val) => val && setSelectedFloorId(val)} disabled={floors.length === 0}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="เลือกชั้น" />
                  </SelectTrigger>
                  <SelectContent>
                    {floors.map((f) => (
                      <SelectItem key={f.id} value={f.id} className="text-xs">
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Center: Mode Action Buttons (Select, Pan, Add Device, Move) */}
            <div className="flex items-center gap-1 bg-background border p-1 rounded-lg">
              <Button
                variant={activeMode === 'SELECT' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1"
                onClick={() => setActiveMode('SELECT')}
              >
                <MousePointer className="h-3.5 w-3.5" />
                Select
              </Button>

              <Button
                variant={activeMode === 'PAN' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1"
                onClick={() => setActiveMode('PAN')}
              >
                <Hand className="h-3.5 w-3.5" />
                Pan Hand
              </Button>

              <Button
                variant={activeMode === 'ADD_DEVICE' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => setActiveMode('ADD_DEVICE')}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add Marker
              </Button>
            </div>

            {/* Right: Canvas Toggles (Show Grid, Snap Grid, Show Label) */}
            <div className="flex items-center gap-2">
              {activeMode === 'ADD_DEVICE' && (
                <div className="w-44">
                  <Select value={selectedDeviceTypeId} onValueChange={(val) => val && setSelectedDeviceTypeId(val)}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceTypes.map((dt) => (
                        <SelectItem key={dt.id} value={dt.id} className="text-xs">
                          {dt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                variant={showGrid ? 'secondary' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid className="h-3.5 w-3.5" />
                Grid
              </Button>

              <Button
                variant={showLabels ? 'secondary' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => setShowLabels(!showLabels)}
              >
                <Tag className="h-3.5 w-3.5" />
                Labels
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main 2D Canvas View Container */}
      <div className="flex-1 rounded-2xl border overflow-hidden relative bg-slate-950">
        {isLoadingPlan ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs">กำลังโหลด 2D Canvas Engine...</span>
          </div>
        ) : !activePlan ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center text-slate-400">
            <Map className="h-12 w-12 text-slate-600 mb-1" />
            <div className="font-bold text-white text-base">
              ยังไม่มีแผนผัง Active สำหรับ {selectedFloor?.name || 'ชั้นที่เลือก'}
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              อัปโหลดภาพแผนผังประจำชั้นเพื่อเริ่มวางตำแหน่งครุภัณฑ์คอมพิวเตอร์และอุปกรณ์เครือข่าย
            </p>
            {selectedFloor && (
              <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-2 text-xs shadow-md mt-1">
                <Upload className="h-4 w-4" />
                อัปโหลดไฟล์แผนผัง (PNG/JPG/PDF)
              </Button>
            )}
          </div>
        ) : (
          <Editor2DCanvas
            floorPlan={activePlan}
            devicePositions={devicePositions}
            deviceTypes={deviceTypes}
            activeMode={activeMode}
            selectedDeviceTypeId={selectedDeviceTypeId}
            showGrid={showGrid}
            snapGrid={snapGrid}
            showLabels={showLabels}
            onSavePosition={handleSavePosition}
            onDeleteMarker={handleDeleteMarker}
          />
        )}
      </div>

      {/* Dialog Modals */}
      {selectedFloor && (
        <FloorPlanUploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          floor={selectedFloor}
          onSuccess={() => fetchActivePlan(selectedFloorId)}
        />
      )}

      {selectedFloor && (
        <FloorPlanHistoryDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          floor={selectedFloor}
          onSuccess={() => fetchActivePlan(selectedFloorId)}
        />
      )}
    </div>
  );
}
