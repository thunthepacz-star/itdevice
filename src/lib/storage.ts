import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'floor-plans');
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/jfif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
];

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.jfif', '.webp', '.svg', '.pdf'];

export interface UploadedFileResult {
  fileUrl: string;
  savedFilePath: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
}

/**
 * Ensures the uploads directory exists
 */
export async function ensureUploadDirExists() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating upload dir:', err);
  }
}

/**
 * Securely saves an uploaded file preventing Path Traversal & dangerous filenames
 */
export async function saveUploadedFile(file: File): Promise<UploadedFileResult> {
  await ensureUploadDirExists();

  // 1. Validate File Size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`ขนาดไฟล์เกินขีดจำกัด (สูงสุด ${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
  }

  // 2. Validate MIME Type
  const mimeType = file.type || 'application/octet-stream';
  const ext = path.extname(file.name).toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(mimeType) && !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('ประเภทไฟล์ไม่รองรับ (รองรับเฉพาะ PNG, JPG, WebP, SVG, PDF)');
  }

  // 3. Prevent Path Traversal & Generate Random Safe Filename
  const safeFilename = `${randomUUID()}${ext}`;
  const targetPath = path.join(UPLOAD_DIR, safeFilename);

  // Security Check: Path Traversal Guard
  if (!targetPath.startsWith(UPLOAD_DIR)) {
    throw new Error('Invalid file path: Path traversal detected');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await fs.writeFile(targetPath, buffer);

  const fileUrl = `/uploads/floor-plans/${safeFilename}`;

  return {
    fileUrl,
    savedFilePath: targetPath,
    originalFileName: path.basename(file.name),
    mimeType,
    fileSize: file.size,
  };
}

/**
 * Image dimensions helper (Fallback mock for server environments)
 */
export function getInitialImageDimensions(mimeType: string) {
  if (mimeType === 'application/pdf') {
    return { width: 1920, height: 1080 };
  }
  return { width: 1600, height: 1000 };
}
