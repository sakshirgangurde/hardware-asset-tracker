# Hardware Asset Tracker 🚀

Enterprise-grade Hardware Asset Tracking & Lifecycle Management system built with **Next.js 14 (App Router)**, **TypeScript**, **Prisma ORM**, **Supabase PostgreSQL**, **Tailwind CSS**, **React Hook Form + Zod**, and **PapaParse**.

---

## ✨ Features & Architecture

### 1. 🛡️ Authentication & Security
- **Bcrypt Password Hashing** & **JWT Sessions** stored in secure, `httpOnly`, `SameSite=Lax` cookies.
- **Pre-configured Default Admin**:
  - **Email**: `admin@hardwaretracker.com`
  - **Password**: `adminpassword123`
- **1-Click Demo Login** button on `/login` for evaluation.

### 2. 📊 Executive Operations Dashboard
- **Real-Time KPI Cards**: Total Hardware Assets, In Use, In Stock, Under Repair, Scrapped / Lost, and Active Staff.
- **🚨 Offboarded Employees with Unreturned Hardware Alert**: Highlights former employees who left without returning equipment with a 1-click resolution workflow.
- **⏱️ Warranty Expiration Radar**: Real-time breakdown of hardware warranties expiring in **≤ 30 days (Critical)**, **≤ 60 days (Warning)**, and **≤ 90 days (Upcoming)**.
- **🏢 Multi-Office Distribution**: Real-time breakdown of inventory across **Hyderabad (HYD)** and **Mumbai (MUM)** offices.
- **⚡ Recent Lifecycle Events**: Live timeline of recent assignments, returns, maintenance tickets, and disposals.

### 3. 💻 Hardware Asset Management
- **Complete CRUD**: Create, view, edit, and delete hardware assets with auto-tag generator.
- **CSV Bulk Import (PapaParse)**: Drag-and-drop CSV upload with live row-by-row validation preview (checks duplicate tags, category enums, date logic, and employee existence). Sample CSV template download included.
- **CSV Instant Export**: 1-click export of currently filtered view or full database.
- **Quick Custody Actions**:
  - **Assign Asset**: Allocates hardware to active staff, updates status to `IN_USE`, and opens an assignment history ledger record.
  - **Return Asset**: Closes assignment history, reverts status to `IN_STOCK`, and updates storage location.
  - **Log Repair**: Transitions status to `UNDER_REPAIR` and logs service center / technician details.
  - **Scrap / Dispose**: Permanently audits decommissioned, obsolete, or lost hardware.
- **UI Name Resolution**: All `employee_id` foreign keys are automatically resolved to clickable employee names with department badges.

### 4. 👥 Employee Directory & Clearance Workflow
- **Staff Onboarding**: Register employee profile with department, start date, and office hub.
- **Employee Detail Profile**: View personal metadata, all currently assigned equipment, and lifetime equipment custody history.
- **🔄 Guided Offboarding Workflow**: When offboarding an employee, the system displays all currently held hardware and prompts the admin to either:
  1. **Return to Stock** (select storage locker location in HYD or MUM)
  2. **Mark as Lost** (creates an immutable disposal loss audit record)
  Then stamps the exit date and marks the employee as `OFFBOARDED`.

### 5. 🔧 Maintenance & Repairs Hub
- Centralized tracking of open diagnostic tickets, vendor repair visits, and parts replacements.
- Filter by outcome (`PENDING`, `REPAIRED`, `UNREPAIRABLE`).

### 6. 📑 Reports & Audit Center
- One-click CSV downloads powered by PapaParse:
  1. **Full Asset Inventory CSV** (with resolved employee custodians)
  2. **Expiring Warranties Radar CSV** (customizable 30/60/90/180/365 days window)
  3. **Complete Assignment History Ledger CSV** (every past and present assignment)
  4. **Maintenance & Repair History CSV**
  5. **Decommissioned & Scrapped Assets Audit Log CSV**

---

## 🗄️ Database Schema & Entities

- **`Asset`**: `id`, `assetTag` (unique), `name`, `category` (Laptop, Desktop, Monitor, Peripheral, Networking, Other), `brand`, `model`, `serialNumber` (unique), `status` (IN_STOCK, IN_USE, UNDER_REPAIR, LOST, SCRAPPED), `employeeId` (FK → Employee), `officeLocation` (HYD, MUM), `purchaseDate`, `vendor`, `warrantyExpiry`, `accessories`, `notes`, timestamps.
- **`Employee`**: `id`, `name`, `email` (unique), `department`, `officeLocation` (HYD, MUM), `status` (ACTIVE, OFFBOARDED), `startDate`, `endDate`, `notes`, timestamps.
- **`AssignmentHistory`**: `id`, `assetId` (FK → Asset), `employeeId` (FK → Employee), `assignedDate`, `returnedDate`, `notes`, `createdAt`.
- **`MaintenanceLog`**: `id`, `assetId` (FK → Asset), `dateReported`, `issueDescription`, `sentTo`, `dateReturned`, `outcome` (REPAIRED, UNREPAIRABLE, PENDING), `performedBy`.
- **`DisposalRecord`**: `id`, `assetId` (FK → Asset), `disposalDate`, `disposalReason` (DAMAGED_BEYOND_REPAIR, OBSOLETE, LOST, STOLEN, OTHER), `notes`.
- **`AdminUser`**: `id`, `email` (unique), `passwordHash`, `name`, timestamps.

---

## 🚀 Local Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database & Seed Sample Data
The local database is pre-configured with SQLite (`file:./dev.db`) for instant, zero-configuration local execution:
```bash
npx prisma db push
npm run seed
```
*Seeds 11 employees, 24 hardware assets across HYD & MUM, maintenance logs, assignment history, and admin user.*

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🌐 Deploy to Supabase & Vercel

### Step 1: Connect Supabase PostgreSQL
1. Create a new project in [Supabase](https://supabase.com).
2. Go to **Project Settings → Database** and copy the **Connection string (URI)**.
3. In `prisma/schema.prisma`, update the datasource provider:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```
4. Set your Supabase connection strings in `.env`:
```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
JWT_SECRET="your-secure-production-jwt-secret"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```
5. Run migrations and seed Supabase:
```bash
npx prisma db push
npm run seed
```

### Step 2: Deploy on Vercel
1. Push this repository to GitHub / GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Under **Environment Variables**, add:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL`
4. Deploy! Vercel will automatically run `prisma generate && next build`.

---

## 📋 Validation Rules Enforced

- **Asset Tag**: Required, trimmed, globally unique.
- **Category**: Strict enum validation (`Laptop`, `Desktop`, `Monitor`, `Peripheral`, `Networking`, `Other`).
- **Status Integrity**: If `status === IN_USE`, an active employee must be selected.
- **Warranty Constraint**: `warrantyExpiry >= purchaseDate`.
- **Assignment Integrity**: Enforces only one active open `AssignmentHistory` per asset at any time.
- **Employee Email**: Unique format validation.
- **Data Retention**: Scrapped and lost assets are permanently retained in the database with their immutable `DisposalRecord`.
