'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useUIStore } from '@/stores/use-ui-store';
import { siteConfig } from '@/config/site';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Menu,
  Moon,
  Sun,
  Bell,
  Search,
  ChevronRight,
} from 'lucide-react';

export function TopNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { toggleSidebar, searchQuery, setSearchQuery } = useUIStore();

  // Find active nav item title for breadcrumb
  const currentNavItem = siteConfig.navItems.find(
    (item) => item.href === pathname || pathname.startsWith(`${item.href}/`)
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur-xs">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{siteConfig.shortName}</span>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-primary">
            {currentNavItem ? currentNavItem.title : 'หน้าหลัก'}
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="ค้นหาตาม Asset Code, Serial Number, ชื่ออุปกรณ์..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-9 bg-accent/40 text-sm border-none focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Right: Actions (Theme, Notifications, User) */}
      <div className="flex items-center gap-2">
        {/* Timezone Badge */}
        <span className="hidden md:inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          Bangkok (GMT+7)
        </span>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* Theme Switcher */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="สลับโหมดสว่าง/มืด"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
