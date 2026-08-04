import { z } from 'zod';

export const ipAddressRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
export const macAddressRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

export const baseDeviceSchema = z.object({
  assetCode: z.string().min(1, 'รหัสครุภัณฑ์ (Asset Code) ห้ามว่างเปล่า'),
  govAssetCode: z.string().optional().nullable(),
  deviceName: z.string().min(1, 'ชื่ออุปกรณ์ห้ามว่างเปล่า'),
  deviceTypeId: z.string().min(1, 'กรุณาเลือกประเภทอุปกรณ์'),
  deviceSubtype: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  buildingId: z.string().optional().nullable(),
  floorId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  ownerDepartmentId: z.string().optional().nullable(),
  status: z
    .enum(['ACTIVE', 'IN_USE', 'IN_REPAIR', 'RETIRED', 'DISPOSED'])
    .default('ACTIVE'),
  responsiblePerson: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.number().nonnegative().optional().nullable(),
  vendor: z.string().optional().nullable(),
  contractNumber: z.string().optional().nullable(),
  warrantyStartDate: z.string().optional().nullable(),
  warrantyEndDate: z.string().optional().nullable(),
  expectedLifetime: z.number().int().nonnegative().optional().nullable(),
  installDate: z.string().optional().nullable(),
  lastInspectionDate: z.string().optional().nullable(),
  nextInspectionDate: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  // Network Validation fields
  ipAddress: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || ipAddressRegex.test(val), {
      message: 'รูปแบบ IP Address ไม่ถูกต้อง (ตัวอย่าง: 192.168.1.50)',
    }),
  macAddress: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || macAddressRegex.test(val), {
      message: 'รูปแบบ MAC Address ไม่ถูกต้อง (ตัวอย่าง: 00:1A:2B:3C:4D:5E)',
    }),
});

export const deviceSchema = baseDeviceSchema.refine(
  (data) => {
    if (data.warrantyStartDate && data.warrantyEndDate) {
      return new Date(data.warrantyEndDate) >= new Date(data.warrantyStartDate);
    }
    return true;
  },
  {
    message: 'วันหมดอายุการรับประกันต้องอยู่หลังหรือวันเดียวกับวันเริ่มรับประกัน',
    path: ['warrantyEndDate'],
  }
);

export const updateDeviceSchema = baseDeviceSchema.partial();
