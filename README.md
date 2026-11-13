# 🏸 SmashBill

> **Single-Player Sports Micro-SaaS PWA for Badminton Club Attendance, Cost Splitting & Dynamic VietQR Billing.**

SmashBill helps badminton club admins automate court attendance, calculate session expenses (court fees, shuttlecocks, water, referee fees), track accumulated member debts, and collect payments effortlessly via dynamic **VietQR** codes—without requiring every club member to install an app or register an account.

---

## ✨ Key Features

### 🎯 Core MVP
- **Single-Player Club Management:** Valuable immediately even if only the Club Admin uses it. Share an invite link or QR code for regular and drop-in (*vãng lai*) players to join the roster.
- **1-Touch Court Attendance Board:** Create matches by date, time, and court location. Tick present players or add guest drop-ins directly from your phone on the court.
- **Automated Fund & Billing Engine:**
  - Automatically splits court fees, shuttlecocks, and extra costs evenly among present players.
  - Tracks accumulated unpaid balances across multiple matches.
- **VietQR Smart Checkout (NAPAS Standard):**
  - Members open a summary link with a dynamically generated VietQR code pre-filled with the **Admin's bank account**, **exact debt amount**, and **standardized transfer syntax** (e.g., `SB CLBSAOMAI T10 MINH`).
  - Scan and confirm in any banking app with zero manual typing.
- **Mobile-First PWA:** Installable directly to iOS/Android home screens with no App Store friction.

### 🛡️ Phase 1: Badminton Community & Trust Expansion
- **Mandatory SSO Authentication:** Google (Gmail) & Zalo SSO only—eliminating email/password bots and fake accounts.
- **Drop-in / Guest Anti-Flaking System:**
  - View a guest player's flake rate and skill rating before approving a slot.
  - Automatic VietQR deposit generation (e.g., `50,000 VND`) before slot confirmation.
- **Badminton Gear Classifieds (Pass Đồ Cầu Lông):**
  - Peer-to-peer listings for rackets, shoes, bags, and accessories with direct Zalo/phone contact and seller trust ratings (👍 / 👎).
- **Report & Blacklist Engine:**
  - **Shadowban:** 3 verified reports lock an account from posting classifieds or requesting guest slots for 7 days.
  - **Hard Ban:** Permanent ban tied to the underlying SSO `providerId` (Google/Zalo).

---

## 🛠️ Tech Stack (Optimized for `< $4/month` 1GB RAM VPS)

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Monorepo** | `pnpm` Workspaces | Fast, disk-efficient package management across `apps/*` |
| **Backend API** | **NestJS 11** (TypeScript) | Modular architecture, low memory footprint, strict validation |
| **Database & ORM** | **PostgreSQL 16 + Prisma** | Type-safe database queries, migrations, and relational integrity |
| **Frontend** | **Next.js 15 + Tailwind CSS 4** | SEO-friendly, mobile-first UI, native Web App Manifest (PWA) |
| **Code Quality** | **Biome (`biome.json`)** | Ultra-fast Rust-based linter & formatter replacing ESLint + Prettier |
| **Infrastructure** | **Docker + GitHub Actions** | Pre-built container images for low-RAM VPS + Nginx Reverse Proxy |

---

## 📂 Monorepo Structure

```text
smash-bill/
├── .github/workflows/
│   └── ci.yml                  # GitHub Actions CI (Biome check, Prisma generate, Build)
├── apps/
│   ├── api/                    # NestJS Backend API (@smash-bill/api)
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Core models: User, Club, ClubMember, Match, Attendance, Transaction
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Google & Zalo SSO authentication module
│   │   │   │   ├── billing/    # Court fee splitter & dynamic VietQR generator
│   │   │   │   ├── club/       # Club & roster management module
│   │   │   │   ├── health/     # API health check endpoint
│   │   │   │   └── match/      # Match scheduling & 1-touch attendance module
│   │   │   ├── prisma/         # Global PrismaService connection lifecycle
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── Dockerfile
│   └── web/                    # Next.js 15 Frontend PWA (@smash-bill/web)
│       ├── src/app/
│       │   ├── manifest.ts     # Progressive Web App (PWA) manifest
│       │   ├── layout.tsx      # Root layout & mobile viewport configuration
│       │   └── page.tsx        # Mobile-first Attendance & VietQR preview dashboard
│       └── Dockerfile
├── .env.example                # Environment variables template
├── biome.json                  # Unified linter & formatter config
├── docker-compose.yml          # PostgreSQL + API + Web container orchestration
├── package.json                # Root workspace scripts
├── pnpm-workspace.yaml         # pnpm workspace definition
└── tsconfig.base.json          # Shared TypeScript configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** `>= 20.x` (Node 22 LTS recommended)
- **pnpm** `>= 9.x`
- **Docker & Docker Compose** (optional, for running PostgreSQL locally)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` at the repository root:
```bash
cp .env.example .env
```

### 4. Start PostgreSQL & Initialize Prisma
Start a local PostgreSQL container via Docker Compose:
```bash
docker compose up -d postgres
```

Generate the Prisma Client and push the schema to your database:
```bash
pnpm db:generate
pnpm db:push
```

### 5. Run in Development Mode
Run both the NestJS API (`http://localhost:4000/api/v1`) and Next.js PWA (`http://localhost:3000`) concurrently:
```bash
pnpm dev
```

Or run each app individually:
```bash
pnpm dev:api   # Starts NestJS on http://localhost:4000/api/v1
pnpm dev:web   # Starts Next.js on http://localhost:3000
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Run both `@smash-bill/api` and `@smash-bill/web` in watch mode |
| `pnpm build` | Build all packages and applications |
| `pnpm check` | Run Biome formatter & linter with auto-fix across the monorepo |
| `pnpm lint` | Run Biome linter |
| `pnpm format` | Format code using Biome |
| `pnpm db:generate` | Generate Prisma Client from `apps/api/prisma/schema.prisma` |
| `pnpm db:migrate` | Create and apply Prisma migrations in development |
| `pnpm db:push` | Push Prisma schema state directly to PostgreSQL |
| `pnpm db:studio` | Open Prisma Studio GUI to inspect database records |

