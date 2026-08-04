'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, FileText, Loader2, RefreshCw, HardDrive, Building2, Layers } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchReports() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (res.ok) setReportData(data.data);
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  function handleExportPDF() {
    if (!reportData) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('IT Asset Register - Summary Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated At: ${new Date().toLocaleString('th-TH')}`, 14, 28);
    doc.text(`Total Registered Assets: ${reportData.totalDevices} units`, 14, 34);

    doc.setFontSize(12);
    doc.text('Devices Distribution by Type:', 14, 46);
    let y = 54;
    reportData.devicesByType?.forEach((dt: any) => {
      doc.setFontSize(10);
      doc.text(`- ${dt.name}: ${dt.count} units`, 18, y);
      y += 6;
    });

    doc.save(`IT_Asset_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            รายงานสรุปและสถิติครุภัณฑ์ (Reports & Analytics)
          </h1>
          <p className="text-sm text-muted-foreground">
            รายงานสรุปการกระจายตัวครุภัณฑ์ตามหมวดหมู่ อาคาร สถานะการใช้งาน และส่งออกรายงานเป็น PDF
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1 text-xs">
            <FileText className="h-3.5 w-3.5 text-rose-500" />
            ส่งออก PDF
          </Button>
          <Button size="sm" onClick={fetchReports} className="gap-1 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            รีเฟรช
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Distribution by Building */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                จํานวนครุภัณฑ์จำแนกตามอาคาร
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportData?.devicesByBuilding?.map((b: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{b.name}</span>
                    <span>{b.count} รายการ</span>
                  </div>
                  <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${reportData.totalDevices ? (b.count / reportData.totalDevices) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Distribution by Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-primary" />
                จํานวนครุภัณฑ์จำแนกตามประเภทอุปกรณ์
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportData?.devicesByType?.map((dt: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{dt.name}</span>
                    <span>{dt.count} รายการ</span>
                  </div>
                  <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width: `${reportData.totalDevices ? (dt.count / reportData.totalDevices) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
