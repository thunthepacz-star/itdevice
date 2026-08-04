import {
  LayoutDashboard,
  Map,
  Building2,
  HardDrive,
  Network,
  ArrowRightLeft,
  Wrench,
  FileBarChart,
  Users,
  History,
  Settings,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
}

export const siteConfig = {
  name: 'ระบบทะเบียนครุภัณฑ์ IT และแผนผังอุปกรณ์',
  shortName: 'IT Asset 2D/3D',
  description: 'ระบบจัดการทะเบียนครุภัณฑ์คอมพิวเตอร์ อุปกรณ์เครือข่าย และแผนผังตำแหน่ง 2D/3D On-premise',
  version: '1.0.0',
  timezone: 'Asia/Bangkok',
  navItems: [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'ภาพรวมระบบและสถิติครุภัณฑ์',
    },
    {
      title: 'แผนผังอุปกรณ์',
      href: '/floor-plans',
      icon: Map,
      description: 'แผนผังอาคาร 2D/3D และตำแหน่งอุปกรณ์',
    },
    {
      title: 'อาคารและชั้น',
      href: '/buildings',
      icon: Building2,
      description: 'จัดการข้อมูลอาคาร ชั้น และแผนผัง',
    },
    {
      title: 'ทะเบียนครุภัณฑ์',
      href: '/devices',
      icon: HardDrive,
      description: 'จัดการครุภัณฑ์คอมพิวเตอร์และไอที',
    },
    {
      title: 'อุปกรณ์เครือข่าย',
      href: '/network',
      icon: Network,
      description: 'จัดการ Network Switch, Port & Topology',
    },
    {
      title: 'การย้ายอุปกรณ์',
      href: '/movements',
      icon: ArrowRightLeft,
      description: 'ประวัติและคำขอการย้ายตำแหน่งอุปกรณ์',
    },
    {
      title: 'การซ่อมบำรุง',
      href: '/maintenance',
      icon: Wrench,
      description: 'ประวัติการซ่อมบำรุงและส่งเคลม',
    },
    {
      title: 'รายงาน',
      href: '/reports',
      icon: FileBarChart,
      description: 'รายงานครุภัณฑ์ และ Export ข้อมูล',
    },
    {
      title: 'ผู้ใช้งานและสิทธิ์',
      href: '/users',
      icon: Users,
      description: 'จัดการผู้ใช้งาน Role & RBAC Permissions',
    },
    {
      title: 'Audit Log',
      href: '/audit-logs',
      icon: History,
      description: 'ประวัติการใช้งานและกิจกรรมในระบบ',
    },
    {
      title: 'ตั้งค่าระบบ',
      href: '/settings',
      icon: Settings,
      description: 'ตั้งค่าระบบ ระบบจัดเก็บ และข้อมูลทั่วไป',
    },
  ] as NavItem[],
};
