'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { canvasToNormalizedPosition, normalizedToCanvasPosition, snapToGrid } from '@/lib/coordinate-converter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  HardDrive,
  MapPin,
  Move,
  Plus,
  MousePointer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid,
  Tag,
  Search,
  CheckCircle2,
  Trash2,
  X,
} from 'lucide-react';

interface Editor2DCanvasProps {
  floorPlan: any;
  devicePositions: any[];
  deviceTypes: any[];
  activeMode: 'SELECT' | 'PAN' | 'ADD_DEVICE' | 'MOVE';
  selectedDeviceTypeId?: string;
  showGrid: boolean;
  snapGrid: boolean;
  showLabels: boolean;
  onSavePosition: (data: {
    deviceId?: string;
    positionX: number;
    positionY: number;
    newDeviceData?: any;
  }) => Promise<void>;
  onDeleteMarker?: (positionId: string) => Promise<void>;
}

export function Editor2DCanvas({
  floorPlan,
  devicePositions,
  deviceTypes,
  activeMode,
  selectedDeviceTypeId,
  showGrid,
  snapGrid,
  showLabels,
  onSavePosition,
  onDeleteMarker,
}: Editor2DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1.0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Hover & Selection
  const [hoveredMarker, setHoveredMarker] = useState<any | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);
  const [mouseCoord, setMouseCoord] = useState({ x: 0, y: 0 });
  const [normCoord, setNormCoord] = useState({ positionX: 0, positionY: 0 });

  // Add Device Workflow Temporary Marker state
  const [tempMarker, setTempMarker] = useState<{ x: number; y: number; normX: number; normY: number } | null>(null);
  const [tempDeviceName, setTempDeviceName] = useState('');
  const [tempAssetCode, setTempAssetCode] = useState('');
  const [tempDeviceTypeId, setTempDeviceTypeId] = useState('');

  // Load Background Floor Plan Image
  useEffect(() => {
    if (!floorPlan?.fileUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = floorPlan.fileUrl;
    img.onload = () => {
      setImage(img);
    };
  }, [floorPlan]);

  // Handle Resize & Fit to Screen
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current || !image) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;

    const scaleX = (cw - 40) / image.width;
    const scaleY = (ch - 40) / image.height;
    const fitScale = Math.min(scaleX, scaleY, 1.5);

    setScale(fitScale);
    setOffset({
      x: (cw - image.width * fitScale) / 2,
      y: (ch - image.height * fitScale) / 2,
    });
  }, [image]);

  useEffect(() => {
    handleFitToScreen();
  }, [image, handleFitToScreen]);

  // Main Canvas Render Loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    canvas.width = width;
    canvas.height = height;

    // Clear Screen
    ctx.clearRect(0, 0, width, height);

    // Draw Background Grid if enabled
    if (showGrid) {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 0.5;
      const gridSize = 20 * scale;
      for (let x = offset.x % gridSize; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = offset.y % gridSize; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Draw Floor Plan Image
    if (image) {
      ctx.drawImage(image, offset.x, offset.y, image.width * scale, image.height * scale);

      // Draw Floor Plan Border
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(offset.x, offset.y, image.width * scale, image.height * scale);
    }

    // Render Markers for existing devices
    if (image) {
      const imgW = image.width * scale;
      const imgH = image.height * scale;

      devicePositions.forEach((pos) => {
        const cx = offset.x + pos.positionX * imgW;
        const cy = offset.y + pos.positionY * imgH;

        const isSelected = selectedMarker?.id === pos.id;
        const isHovered = hoveredMarker?.id === pos.id;

        // Draw Marker Pin Circle
        ctx.beginPath();
        ctx.arc(cx, cy, isSelected ? 14 : 10, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#ec4899' : isHovered ? '#38bdf8' : '#0284c7';
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Inner Dot
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Draw Device Label if enabled
        if (showLabels && pos.device) {
          ctx.font = 'bold 11px sans-serif';
          const label = `${pos.device.assetCode}`;
          const textWidth = ctx.measureText(label).width;

          // Label Box
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.roundRect(cx - textWidth / 2 - 4, cy + 14, textWidth + 8, 16, 4);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, cx - textWidth / 2, cy + 26);
        }
      });

      // Render Temporary Marker for Add Device Workflow
      if (tempMarker) {
        ctx.beginPath();
        ctx.arc(tempMarker.x, tempMarker.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#eab308'; // Amber temporary marker
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }
    }
  }, [image, scale, offset, devicePositions, selectedMarker, hoveredMarker, tempMarker, showGrid, showLabels]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer Event Handlers (Pan, Zoom, Add Marker, Drag Marker)
  function handleMouseDown(e: React.MouseEvent) {
    if (!canvasRef.current || !image) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Pan Mode or Middle Click
    if (activeMode === 'PAN' || e.button === 1) {
      setIsPanning(true);
      setStartPan({ x: clickX - offset.x, y: clickY - offset.y });
      return;
    }

    // Check Marker Click Selection
    const imgW = image.width * scale;
    const imgH = image.height * scale;

    const clickedPos = devicePositions.find((pos) => {
      const cx = offset.x + pos.positionX * imgW;
      const cy = offset.y + pos.positionY * imgH;
      const dist = Math.hypot(clickX - cx, clickY - cy);
      return dist <= 14;
    });

    if (clickedPos) {
      setSelectedMarker(clickedPos);
      return;
    }

    // Add Device Mode: Create Temporary Marker
    if (activeMode === 'ADD_DEVICE') {
      let relativeX = clickX - offset.x;
      let relativeY = clickY - offset.y;

      if (snapGrid) {
        relativeX = snapToGrid(relativeX, 10);
        relativeY = snapToGrid(relativeY, 10);
      }

      const norm = canvasToNormalizedPosition(relativeX, relativeY, imgW, imgH);

      setTempMarker({
        x: offset.x + relativeX,
        y: offset.y + relativeY,
        normX: norm.positionX,
        normY: norm.positionY,
      });

      setTempDeviceTypeId(selectedDeviceTypeId || deviceTypes[0]?.id || '');
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!canvasRef.current || !image) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setMouseCoord({ x: Math.round(mouseX), y: Math.round(mouseY) });

    const imgW = image.width * scale;
    const imgH = image.height * scale;
    const norm = canvasToNormalizedPosition(mouseX - offset.x, mouseY - offset.y, imgW, imgH);
    setNormCoord(norm);

    if (isPanning) {
      setOffset({
        x: mouseX - startPan.x,
        y: mouseY - startPan.y,
      });
      return;
    }

    // Hover Marker Check
    const hovered = devicePositions.find((pos) => {
      const cx = offset.x + pos.positionX * imgW;
      const cy = offset.y + pos.positionY * imgH;
      return Math.hypot(mouseX - cx, mouseY - cy) <= 14;
    });

    setHoveredMarker(hovered || null);
  }

  function handleMouseUp() {
    setIsPanning(false);
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((prev) => Math.max(0.2, Math.min(prev * zoomFactor, 5.0)));
  }

  // Confirm Temporary Marker Addition
  async function handleConfirmAddDevice() {
    if (!tempMarker) return;

    await onSavePosition({
      positionX: tempMarker.normX,
      positionY: tempMarker.normY,
      newDeviceData: {
        assetCode: tempAssetCode || `DEV-${Date.now().toString().slice(-5)}`,
        deviceName: tempDeviceName || 'อุปกรณ์ไอทีใหม่',
        deviceTypeId: tempDeviceTypeId || deviceTypes[0]?.id,
      },
    });

    setTempMarker(null);
    setTempAssetCode('');
    setTempDeviceName('');
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 text-white relative" ref={containerRef}>
      {/* Canvas Area */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`h-full w-full ${
          activeMode === 'ADD_DEVICE'
            ? 'cursor-crosshair'
            : activeMode === 'PAN' || isPanning
            ? 'cursor-grab active:cursor-grabbing'
            : 'cursor-default'
        }`}
      />

      {/* Floating Canvas Controls (Zoom In, Zoom Out, Fit) */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl backdrop-blur-md shadow-xl text-xs z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-300 hover:text-white"
          onClick={() => setScale((s) => Math.min(s * 1.25, 5.0))}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <span className="font-mono text-slate-400 w-12 text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-300 hover:text-white"
          onClick={() => setScale((s) => Math.max(s * 0.8, 0.2))}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-300 hover:text-white"
          onClick={handleFitToScreen}
          title="Fit to Screen"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Floating Status Bar */}
      <div className="absolute bottom-4 right-4 flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl backdrop-blur-md text-[11px] text-slate-400 z-10">
        <span>Mouse: ({mouseCoord.x}, {mouseCoord.y})px</span>
        <span className="font-mono text-primary font-semibold">
          Normalized: ({normCoord.positionX.toFixed(4)}, {normCoord.positionY.toFixed(4)})
        </span>
        <span className="flex items-center gap-1 text-slate-300">
          <HardDrive className="h-3 w-3 text-primary" />
          {devicePositions.length} Markers
        </span>
      </div>

      {/* Property Panel Drawer (Right Side) for Selected Marker or Temporary Marker */}
      {(selectedMarker || tempMarker) && (
        <div className="absolute top-4 right-4 w-80 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md z-20 space-y-4 text-xs">
          {tempMarker ? (
            // Temporary Marker Form
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                  <MapPin className="h-4 w-4" />
                  ยืนยันวางอุปกรณ์ใหม่
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTempMarker(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg font-mono">
                พิกัด: ({tempMarker.normX.toFixed(4)}, {tempMarker.normY.toFixed(4)})
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Asset Code*</Label>
                <Input
                  placeholder="IT-2026-050"
                  value={tempAssetCode}
                  onChange={(e) => setTempAssetCode(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">ชื่ออุปกรณ์*</Label>
                <Input
                  placeholder="PC ประจำจุดรับยา"
                  value={tempDeviceName}
                  onChange={(e) => setTempDeviceName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white h-8"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setTempMarker(null)}>
                  ยกเลิก
                </Button>
                <Button size="sm" onClick={handleConfirmAddDevice} className="gap-1 bg-amber-500 hover:bg-amber-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  บันทึก Marker
                </Button>
              </div>
            </div>
          ) : (
            // Selected Marker Details
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-primary flex items-center gap-1.5 text-sm">
                  <HardDrive className="h-4 w-4" />
                  รายละเอียดอุปกรณ์
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedMarker(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1.5 text-slate-300">
                <div className="font-bold text-sm text-white">{selectedMarker.device?.deviceName}</div>
                <div className="text-xs font-mono text-primary">{selectedMarker.device?.assetCode}</div>
                <div className="text-[11px] text-slate-400">
                  ประเภท: {selectedMarker.device?.deviceType?.name || '-'}
                </div>
                <div className="text-[11px] text-slate-400">
                  S/N: {selectedMarker.device?.serialNumber || '-'}
                </div>
                <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg">
                  พิกัด Normalized: ({selectedMarker.positionX.toFixed(4)}, {selectedMarker.positionY.toFixed(4)})
                </div>
              </div>

              {onDeleteMarker && (
                <div className="pt-2 border-t border-slate-800">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full gap-1 text-xs"
                    onClick={async () => {
                      if (confirm('คุณต้องการถอด Marker อุปกรณ์นี้ออกจากแผนผังใช่หรือไม่?')) {
                        await onDeleteMarker(selectedMarker.id);
                        setSelectedMarker(null);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    ถอด Marker ออกจากผัง
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
