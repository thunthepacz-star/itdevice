# ระบบทะเบียนครุภัณฑ์ IT และแผนผังอุปกรณ์ 2D/3D (IT Device Register & Floor Plan)

Web Application สำหรับจัดการทะเบียนครุภัณฑ์คอมพิวเตอร์และอุปกรณ์เครือข่าย พร้อมแผนผังระบุตำแหน่ง 2D Canvas และ 3D Spatial สำหรับติดตั้งและใช้งานแบบ On-premise

---

## 🛠 Technology Stack

- **Frontend:** Next.js (App Router), TypeScript (Strict), Tailwind CSS, shadcn/ui, Lucide Icons
- **State & Query:** Zustand, TanStack React Query v5
- **Forms & Validation:** React Hook Form, Zod
- **2D/3D Rendering:** React Konva (2D Editor), Three.js / React Three Fiber (3D View)
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Deployment:** Docker, Docker Compose, Nginx, On-premise Local Storage / MinIO

---

## 🚀 Getting Started (Development)

### 1. Prerequisites
- Node.js 18+ หรือ 20+
- npm หรือ pnpm
- PostgreSQL Database (สำหรับ Step 2 เป็นต้นไป)

### 2. Environment Variables Setup
คัดลอกไฟล์ `.env.example` เป็น `.env.local`

```bash
cp .env.example .env.local
```

### 3. Installation
ติดตั้ง Dependencies ของโครงการ:

```bash
npm install
```

### 4. Run Development Server
เปิด Web Server ในโหมดพัฒนา:

```bash
npm run dev
```

เปิดเบราว์เซอร์เข้าใช้งานที่ `http://localhost:3000`

---

## 🧪 Verification Commands (Lint & Build)

เพื่อตรวจสอบความถูกต้องของ TypeScript Strict Mode และ Code Quality ให้รันคำสั่ง:

```bash
npm run lint
npm run build
```

---

## 📁 Directory Structure

```text
src/
├── app/                  # Next.js App Router Pages & Layouts
├── components/           # UI & Layout Components (shadcn/ui, TopNav, Sidebar)
├── config/               # Site Configuration & Menu Navigation
├── features/             # Feature Modules (FloorPlan, Devices, Buildings)
├── hooks/                # Custom React Hooks
├── lib/                  # Utilities & Providers
├── schemas/              # Zod Validation Schemas
├── services/             # API Service Clients
├── stores/               # Zustand Global Stores
└── types/                # TypeScript Interfaces & Types
```
