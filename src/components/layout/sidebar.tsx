'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/config/site';
import { useUIStore } from '@/stores/use-ui-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  MonitorCheck,
  X,
  LogOut,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, toggleSidebarCollapse } = useUIStore();

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300 ease-in-out lg:static',
          sidebarCollapsed ? 'w-20' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header / Brand */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <MonitorCheck className="h-6 w-6" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold tracking-tight text-sm text-foreground">
                  {siteConfig.shortName}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  ทะเบียนครุภัณฑ์ & Plan 2D/3D
                </span>
              </div>
            )}
          </Link>

          {/* Close Mobile Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {siteConfig.navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.title : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group relative',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-transform group-hover:scale-110',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {!sidebarCollapsed && <span className="truncate">{item.title}</span>}

                {/* Badge if present */}
                {item.badge && !sidebarCollapsed && (
                  <span className="ml-auto rounded-full bg-primary/20 text-primary px-2 py-0.5 text-xs font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User Card & Collapse Toggle */}
        <div className="border-t p-3 space-y-2">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-accent/50 p-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                  AD
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold truncate text-foreground">
                    ผู้ดูแลระบบ (Admin)
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    IT Administrator
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/login';
                }}
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                title="ออกจากระบบ"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs" title="ผู้ดูแลระบบ (Admin)">
                AD
              </div>
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSidebarCollapse}
            className="hidden w-full items-center justify-center gap-2 lg:flex"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs">ย่อแถบเมนู</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
