# Nitsuh Foods & Cafe — Intelligent Ordering & Kitchen Management System

A production-grade restaurant POS, Waiter Mobile Pad, Kitchen Display System (KDS), Dual-Store Inventory Management, and Real-Time Analytics platform built for **Nitsuh Foods & Cafe** (Addis Ababa, Ethiopia).

---

## 🌟 Key Features

- **Point of Sale (POS) Terminal**:
  - Dine-in & Takeaway order dispatching
  - Custom tip / gratuity inputs (no rigid presets)
  - Ethiopian payment tenders: Cash (Birr) with change calculation, Telebirr, and CBE / Card
  - Live waiter incoming slips confirmation and kitchen dispatching
  - Glassmorphic card design and responsive mobile drawer

- **Waiter Mobile Pad**:
  - Touch-optimized order creation for servers
  - Live table selection (Indoor, Window, Lounge, Patio, Terrace)
  - Fasting item indicators (`🌱 FASTING / የጾም`)
  - Direct slip transmission to Cashier & Kitchen

- **Kitchen Display System (KDS)**:
  - Real-time ticket management with WebSocket live updates
  - 3-stage kitchen workflow: `1. New Tickets` ➔ `2. Cooking / Brewing` ➔ `3. Ready for Service`
  - Overdue time tracking alerts
  - Automatic ingredient recipe deduction upon dish completion

- **Dual-Store Inventory System**:
  - Role-segregated isolation: Head Chef manages strictly `KITCHEN_STORE`, Main Storekeeper manages `MAIN_STORE`
  - Inter-store stock transfer requisition & confirmation workflow
  - Low-stock threshold alerts

- **Educated Warm Alabaster & Dark Luxury Themes**:
  - High-aesthetic dark luxury bistro theme
  - Warm Alabaster bistro light theme with tailored typography, borders, and contrast

---

## 🛠️ Tech Stack

- **Monorepo**: PNPM Workspaces & Turborepo
- **Frontend (`apps/web`)**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons, Zustand, WebSockets (Socket.IO client)
- **Backend (`apps/api`)**: NestJS, Prisma ORM, PostgreSQL, Socket.IO Gateway, Passport JWT Auth
- **Database**: PostgreSQL 15 via Docker Compose

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js >= 18
- pnpm >= 8
- Docker & Docker Compose

### 2. Environment Setup
```bash
# Clone the repository
git clone https://github.com/RhizanTechnologies/nitsuh-ordering-system.git
cd nitsuh-ordering-system

# Install dependencies
pnpm install

# Start PostgreSQL database container
docker compose up -d
```

### 3. Environment Variables
Copy `.env.example` files:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 4. Database Setup & Seeding
```bash
# Push Prisma schema to Postgres
pnpm --filter @cafe/api exec prisma db push

# Seed Nitsuh menu items, users, and tables
pnpm --filter @cafe/api run seed
```

### 5. Running in Development
```bash
# Start backend API (port 4000)
pnpm --filter @cafe/api run dev

# Start frontend web app (port 3000)
pnpm --filter @cafe/web run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the system.

---

## 👥 Default Demo Credentials

| Role | Name | PIN / Passcode |
| :--- | :--- | :--- |
| **Cashier** | Samantha W | `1234` |
| **Waiter** | Abel Tesfaye | `2222` |
| **Waiter** | Sara K | `3333` |
| **Kitchen Staff** | Chef Dawit | `4444` |
| **Main Storekeeper** | Michael | `5555` |
| **Head Chef** | Chef Tigist | `6666` |
| **Owner / Manager** | Adam S | `0000` |

---

## 📄 License
Private & Proprietary — Developed for Rhizan Technologies / Nitsuh Foods.
