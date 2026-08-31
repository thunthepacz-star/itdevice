import { db as prisma } from '../src/lib/db';
import { hash } from 'bcryptjs';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo seeding is disabled in production. Create an administrator with a unique password instead.');
  }
  console.log('🌱 Seeding IT Device Register database...');

  // 1. Roles
  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      code: 'ADMIN',
      name: 'System Administrator',
      description: 'ผู้ดูแลระบบสูงสุด จัดการผู้ใช้งาน สิทธิ์ อาคาร และการตั้งค่า',
    },
  });

  const officerRole = await prisma.role.upsert({
    where: { code: 'OFFICER' },
    update: {},
    create: {
      code: 'OFFICER',
      name: 'IT Asset Officer',
      description: 'เจ้าหน้าที่ไอที จัดการครุภัณฑ์ อัปโหลดแผนผัง และย้ายอุปกรณ์',
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { code: 'VIEWER' },
    update: {},
    create: {
      code: 'VIEWER',
      name: 'Viewer',
      description: 'ผู้รับชม ดูแผนผังและค้นหาข้อมูลครุภัณฑ์เท่านั้น',
    },
  });

  // 2. Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hospital.go.th' },
    update: {},
    create: {
      email: 'admin@hospital.go.th',
      name: 'ผู้ดูแลระบบ (Admin)',
      passwordHash: await hash('admin123', 12),
      roles: {
        create: { roleId: adminRole.id },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'officer@hospital.go.th' },
    update: {},
    create: {
      email: 'officer@hospital.go.th',
      name: 'เจ้าหน้าที่พัสดุไอที (Asset Officer)',
      passwordHash: await hash('officer123', 12),
      roles: {
        create: { roleId: officerRole.id },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'viewer@hospital.go.th' },
    update: {},
    create: {
      email: 'viewer@hospital.go.th',
      name: 'ผู้ใช้งานทั่วไป (Viewer)',
      passwordHash: await hash('viewer123', 12),
      roles: {
        create: { roleId: viewerRole.id },
      },
    },
  });

  // 3. Buildings
  const opdBuilding = await prisma.building.upsert({
    where: { code: 'BLD-OPD' },
    update: {},
    create: {
      code: 'BLD-OPD',
      name: 'อาคารผู้ป่วยนอก (OPD)',
      shortName: 'อาคาร OPD',
      locationDescription: 'โซนหน้า ติดถนนหลักโรงพยาบาล',
      description: 'อาคารบริการผู้ป่วยนอก คลินิกตรวจโรค และห้องตรวจชั้น 1-7',
    },
  });

  const ipdBuilding = await prisma.building.upsert({
    where: { code: 'BLD-IPD' },
    update: {},
    create: {
      code: 'BLD-IPD',
      name: 'อาคารผู้ป่วยใน (IPD)',
      shortName: 'อาคาร IPD',
      locationDescription: 'โซนหลัง เชื่อมต่อสะพานทางเดินอาคาร OPD',
      description: 'อาคารหอผู้ป่วย ห้องพักฟื้น และห้องผ่าตัด 10 ชั้น',
    },
  });

  const adminBuilding = await prisma.building.upsert({
    where: { code: 'BLD-ADM' },
    update: {},
    create: {
      code: 'BLD-ADM',
      name: 'อาคารอำนวยการ',
      shortName: 'อาคารบริหาร',
      locationDescription: 'โซนทิศตะวันออก',
      description: 'ศูนย์คอมพิวเตอร์ ฝ่ายไอที ฝ่ายการเงิน และฝ่ายบริหาร',
    },
  });

  // 4. Floors (At least 5 floors)
  const floorOpd1 = await prisma.floor.create({
    data: {
      buildingId: opdBuilding.id,
      floorNumber: 1,
      name: 'ชั้น 1 - เวชระเบียนและต้อนรับ',
      displayOrder: 1,
      floorElevation: 0.0,
      floorWidth: 60.0,
      floorDepth: 40.0,
    },
  });

  const floorOpd2 = await prisma.floor.create({
    data: {
      buildingId: opdBuilding.id,
      floorNumber: 2,
      name: 'ชั้น 2 - คลินิกตรวจโรคทั่วไป',
      displayOrder: 2,
      floorElevation: 4.0,
      floorWidth: 60.0,
      floorDepth: 40.0,
    },
  });

  const floorIpd1 = await prisma.floor.create({
    data: {
      buildingId: ipdBuilding.id,
      floorNumber: 1,
      name: 'ชั้น 1 - หอผู้ป่วยฉุกเฉิน (ER)',
      displayOrder: 1,
      floorElevation: 0.0,
      floorWidth: 70.0,
      floorDepth: 45.0,
    },
  });

  const floorIpd2 = await prisma.floor.create({
    data: {
      buildingId: ipdBuilding.id,
      floorNumber: 2,
      name: 'ชั้น 2 - หอผู้ป่วยวิกฤต (ICU)',
      displayOrder: 2,
      floorElevation: 4.5,
      floorWidth: 70.0,
      floorDepth: 45.0,
    },
  });

  const floorAdmin1 = await prisma.floor.create({
    data: {
      buildingId: adminBuilding.id,
      floorNumber: 1,
      name: 'ชั้น 1 - ศูนย์คอมพิวเตอร์ (Data Center)',
      displayOrder: 1,
      floorElevation: 0.0,
      floorWidth: 50.0,
      floorDepth: 35.0,
    },
  });

  // 5. Device Types (15 categories)
  const deviceTypes = [
    { code: 'DEV-DESKTOP', name: 'Desktop Computer', category: 'COMPUTER', icon: 'Monitor' },
    { code: 'DEV-NOTEBOOK', name: 'Notebook / Laptop', category: 'COMPUTER', icon: 'Laptop' },
    { code: 'DEV-AIO', name: 'All-in-One Computer', category: 'COMPUTER', icon: 'MonitorCheck' },
    { code: 'DEV-THIN', name: 'Thin Client', category: 'COMPUTER', icon: 'Cpu' },
    { code: 'DEV-SERVER', name: 'Server', category: 'COMPUTER', icon: 'Server' },
    { code: 'DEV-PRINTER', name: 'Printer', category: 'PERIPHERAL', icon: 'Printer' },
    { code: 'DEV-LBLPRT', name: 'Label Printer', category: 'PERIPHERAL', icon: 'PrinterCheck' },
    { code: 'DEV-SCANNER', name: 'Document Scanner', category: 'PERIPHERAL', icon: 'Scan' },
    { code: 'DEV-BCSCAN', name: 'Barcode Scanner', category: 'PERIPHERAL', icon: 'Barcode' },
    { code: 'DEV-UPS', name: 'UPS (เครื่องสำรองไฟ)', category: 'PERIPHERAL', icon: 'Zap' },
    { code: 'DEV-MONITOR', name: 'Display Monitor', category: 'PERIPHERAL', icon: 'Tv' },
    { code: 'DEV-PROJ', name: 'Projector', category: 'PERIPHERAL', icon: 'Projector' },
    { code: 'DEV-AP', name: 'Wireless Access Point', category: 'NETWORK', icon: 'Wifi' },
    { code: 'DEV-SWITCH', name: 'Network Switch', category: 'NETWORK', icon: 'Network' },
    { code: 'DEV-CCTV', name: 'CCTV Camera', category: 'OTHER', icon: 'Camera' },
  ];

  for (const dt of deviceTypes) {
    await prisma.deviceType.upsert({
      where: { code: dt.code },
      update: {},
      create: dt,
    });
  }

  // 6. System Settings
  await prisma.systemSetting.upsert({
    where: { key: 'SYSTEM_NAME' },
    update: {},
    create: {
      key: 'SYSTEM_NAME',
      value: 'ระบบทะเบียนครุภัณฑ์ IT โรงพยาบาล',
      description: 'ชื่อระบบที่แสดงบนแถบ Header',
      isPublic: true,
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'STORAGE_TYPE' },
    update: {},
    create: {
      key: 'STORAGE_TYPE',
      value: 'local',
      description: 'ประเภทการจัดเก็บไฟล์ (local / minio / s3)',
      isPublic: false,
    },
  });

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
