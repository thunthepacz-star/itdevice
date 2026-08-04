'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MonitorCheck, Lock, Mail, ShieldAlert, Loader2, UserCheck } from 'lucide-react';
import { siteConfig } from '@/config/site';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'การเข้าสู่ระบบไม่สำเร็จ');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuickLogin(demoEmail: string, demoPass: string) {
    setEmail(demoEmail);
    setPassword(demoPass);
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-950 p-4 text-foreground">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-3">
            <MonitorCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {siteConfig.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            ระบบลงทะเบียนครุภัณฑ์และแผนผัง 2D/3D (Hospital On-Premise)
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-800 bg-slate-900/90 text-white backdrop-blur-md shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-lg">เข้าสู่ระบบ</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              กรุณากรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">อีเมล (Email)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    required
                    placeholder="admin@hospital.go.th"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-slate-950 border-slate-800 text-white focus-visible:ring-primary text-sm h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">รหัสผ่าน (Password)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 bg-slate-950 border-slate-800 text-white focus-visible:ring-primary text-sm h-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 font-semibold gap-2 shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  'เข้าสู่ระบบ (Sign In)'
                )}
              </Button>
            </form>

            {/* Quick Demo Selector */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
                ทดสอบเข้าใช้งาน (Quick Demo Account Login)
              </div>
              <div className="grid gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@hospital.go.th', 'admin123')}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition text-left"
                >
                  <div>
                    <span className="font-semibold text-primary">System Administrator</span>
                    <p className="text-[10px] text-slate-400">admin@hospital.go.th (สิทธิ์สูงสุด)</p>
                  </div>
                  <UserCheck className="h-4 w-4 text-primary" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('officer@hospital.go.th', 'officer123')}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition text-left"
                >
                  <div>
                    <span className="font-semibold text-emerald-400">IT Asset Officer</span>
                    <p className="text-[10px] text-slate-400">officer@hospital.go.th (จัดการอุปกรณ์/ย้ายตำแหน่ง)</p>
                  </div>
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('viewer@hospital.go.th', 'viewer123')}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition text-left"
                >
                  <div>
                    <span className="font-semibold text-amber-400">Viewer</span>
                    <p className="text-[10px] text-slate-400">viewer@hospital.go.th (ดูได้อย่างเดียว)</p>
                  </div>
                  <UserCheck className="h-4 w-4 text-amber-400" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
