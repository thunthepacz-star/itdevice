import { z } from 'zod';

export const buildingSchema = z.object({
  code: z.string().min(2, 'รหัสอาคารต้องมีอย่างน้อย 2 ตัวอักษร'),
  name: z.string().min(2, 'ชื่ออาคารต้องมีอย่างน้อย 2 ตัวอักษร'),
  shortName: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  locationDescription: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateBuildingSchema = buildingSchema.partial();

export const floorSchema = z.object({
  floorNumber: z.number().int('ลำดับชั้นต้องเป็นจำนวนเต็ม'),
  name: z.string().min(1, 'ชื่อชั้นต้องไม่ว่างเปล่า'),
  description: z.string().optional(),
  displayOrder: z.number().int().default(0),
  floorWidth: z.number().positive().default(50.0),
  floorDepth: z.number().positive().default(30.0),
  floorHeight: z.number().positive().default(3.5),
  floorThickness: z.number().positive().default(0.3),
  floorElevation: z.number().default(0.0),
  rotationX: z.number().default(0.0),
  rotationY: z.number().default(0.0),
  rotationZ: z.number().default(0.0),
  isActive: z.boolean().default(true),
});

export const updateFloorSchema = floorSchema.partial();
