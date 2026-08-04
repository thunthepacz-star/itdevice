'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, Server, HardDrive, Wifi, RefreshCw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NetworkPage() {
  const [switches, setSwitches] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchNetworkData() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/network');
      const data = await res.json();
      if (res.ok) {
        setSwitches(data.data.switches || []);
        setOutlets(data.data.outlets || []);
      }
    } catch (err) {
      console.error('Fetch network data error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchNetworkData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            อุปกรณ์เครือข่ายและผังสายสัญญาณ (Network Topology)
          </h1>
          <p className="text-sm text-muted-foreground">
            จัดการ Network Switches, Switch Ports (Active/Down/Disabled), LAN Outlets และพอร์ตเชื่อมต่ออุปกรณ์
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchNetworkData} className="gap-1 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          รีเฟรช
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Switches Rack Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              รายการ Network Switches & Port Status Visualizer
            </h2>

            {switches.length === 0 ? (
              <Card className="p-8 text-center text-xs text-muted-foreground">
                ยังไม่มีข้อมูล Network Switch ในระบบ
              </Card>
            ) : (
              switches.map((sw) => {
                const activePortsCount = sw.ports?.filter((p: any) => p.status === 'UP').length || 0;
                return (
                  <Card key={sw.id} className="border-slate-800 bg-slate-950 text-white">
                    <CardHeader className="pb-3 border-b border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                            <Server className="h-4 w-4 text-emerald-400" />
                            {sw.device?.deviceName || 'Network Switch'} ({sw.device?.assetCode})
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-400">
                            Rack: {sw.rackName || 'Main Server Room'} • IP: {sw.ipAddress || '-'} • MAC: {sw.macAddress || '-'}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-xs">
                          Active: {activePortsCount} / {sw.totalPorts} Ports
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                      {/* Port Status Grid (24/48 Ports) */}
                      <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                        {sw.ports?.map((port: any) => (
                          <div
                            key={port.id}
                            className={`p-2 rounded-lg border text-center transition-all ${
                              port.status === 'UP'
                                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                                : port.status === 'DISABLED'
                                ? 'bg-slate-900 border-slate-800 text-slate-500'
                                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                            }`}
                          >
                            <div className="text-[10px] font-mono font-bold">P{port.portNumber}</div>
                            <div className="text-[9px] truncate mt-0.5">
                              {port.connectedInterface?.device?.assetCode || port.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* LAN Outlets Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              เต้ารับสายสัญญาณ LAN Outlets
            </h2>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {outlets.map((ot) => (
                <Card key={ot.id} className="p-3 text-xs space-y-1">
                  <div className="font-bold text-primary flex items-center justify-between">
                    <span>Outlet Code: {ot.outletCode}</span>
                    <Badge variant="secondary" className="text-[10px]">{ot.outletType}</Badge>
                  </div>
                  <div className="text-muted-foreground text-[11px]">
                    {ot.building?.name} • {ot.floor?.name} {ot.room?.name || ''}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
