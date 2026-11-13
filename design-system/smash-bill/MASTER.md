# Design System Master File — SmashBill

> **LOGIC:** When building a specific page, first check `design-system/smash-bill/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** `smash-bill`
**Category:** Sports Club Micro-SaaS PWA (Court Attendance, Cost Splitting & VietQR Billing)
**Stack:** Next.js 15 App Router + React 19 + Tailwind CSS 4
**Design Dials:** Variance `5/10` (Modern Clean) | Motion `4/10` (Fast Court Feedback) | Density `7/10` (Compact Mobile Dashboard)

---

## 1. Global Design Tokens

### 1.1 Color Palette (High-Contrast Court Dark Mode)

Designed for instant legibility under bright indoor badminton hall lighting and OLED power savings on mobile devices.

| Role | Hex | Tailwind Token | CSS Variable | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | `#020617` | `slate-950` | `--color-background` | App shell background |
| **Card / Surface** | `#0F172A` | `slate-900` | `--color-card` | Match cards, roster containers |
| **Elevated Surface** | `#1E293B` | `slate-800` | `--color-secondary` | Interactive rows, pills, secondary buttons |
| **Primary / Brand CTA** | `#10B981` | `emerald-500` | `--color-primary` | Primary CTA, "Present" checkmark, Paid state |
| **On Primary** | `#020617` | `slate-950` | `--color-on-primary` | High-contrast dark text/icon on emerald fill |
| **VietQR / Payment Accent** | `#38BDF8` | `sky-400` | `--color-accent-qr` | VietQR checkout badges, payment copy actions |
| **Warning / Guest Deposit** | `#F59E0B` | `amber-500` | `--color-warning` | Drop-in guest deposit pending, Late status |
| **Destructive / Debt** | `#F43F5E` | `rose-500` | `--color-destructive` | Unpaid debt alert, Shadowban/Ban badge |
| **Foreground (Primary)** | `#F8FAFC` | `slate-50` | `--color-foreground` | Headings, player names, VND amounts |
| **Muted Foreground** | `#94A3B8` | `slate-400` | `--color-muted-foreground` | Secondary labels, timestamps, roles (≥ 4.5:1 on `slate-950`) |
| **Border / Divider** | `#1E293B` | `slate-800` | `--color-border` | Card borders, list dividers |
| **Focus Ring** | `#34D399` | `emerald-400` | `--color-ring` | `2px` visible keyboard focus ring |

### 1.2 Typography & Numeric Discipline

- **Primary UI Font:** `Inter` / `Plus Jakarta Sans` (System UI fallback for instant load on 3G/4G court connections)
- **Monospace / Syntax Font:** `JetBrains Mono` / `Fira Code` (Used for VietQR transfer syntax e.g. `SB CLBSAOMAI T10 MINH` and bank account numbers)
- **Mandatory Numeric Rule (`tabular-nums`):**
  - Always apply `tabular-nums` (`font-variant-numeric: tabular-nums`) to **all VND currency figures (`65,000 ₫`)**, **attendance counts (`4 Present`)**, and **session times (`20:00 - 22:00`)** so numbers align vertically and never cause layout shift when toggling attendance.
- **Type Scale:**
  - App Title / Hero Metric: `text-xl` (`20px`) / `font-bold`
  - Section Heading: `text-base` (`16px`) / `font-semibold`
  - Body / Player Name: `text-sm` (`14px`) / `font-medium` (Inputs MUST use `text-base` `16px` to prevent iOS Safari auto-zoom)
  - Caption / Badge: `text-xs` (`12px`) / `font-medium` (Never use `< 12px` for readable labels)

### 1.3 Spacing & Touch Rhythm (Density `7/10`)

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--space-xs` | `4px` (`gap-1`) | Tight label-to-badge gaps |
| `--space-sm` | `8px` (`gap-2`) | Minimum spacing between adjacent touch targets |
| `--space-md` | `16px` (`p-4`) | Standard mobile card padding & screen horizontal gutter |
| `--space-lg` | `24px` (`space-y-6`) | Vertical rhythm between major dashboard sections |
| `--touch-min` | `44px × 44px` (`min-h-[44px] min-w-[44px]`) | Mandatory minimum hit area for every button, checkbox, and row toggle |

---

## 2. Core SmashBill Component Specifications

### 2.1 1-Touch Court Attendance Row
- **Interaction:** Entire row or dedicated toggle button has `min-h-[48px]`, `cursor-pointer`, `touch-action: manipulation`, and active press feedback (`active:scale-[0.99] transition-transform duration-150`).
- **Accessibility:** Use semantic `<button type="button" role="switch" aria-checked={present}>` or `<input type="checkbox">` with descriptive label, never a non-interactive `<div>` or `<span>`.
- **Visual State:**
  - `PRESENT`: Emerald indicator (`bg-emerald-500 text-slate-950`) + crisp SVG check icon + active fee share in `tabular-nums`.
  - `ABSENT`: Subtle slate border (`border-slate-700 bg-slate-900`) + muted player name (`text-slate-400`).

### 2.2 VietQR Smart Checkout Card
- **QR Quiet Zone:** Always render the NAPAS VietQR image inside a high-contrast white frame (`bg-white p-3 rounded-2xl shadow-md`) with fixed aspect ratio (`aspect-square w-56 h-56`) to guarantee zero CLS (`CLS < 0.1`) and fast scanning by banking apps in dim or bright rooms.
- **Fallback Copy Controls:** Provide one-tap copy pills (`min-h-[44px]`) for **Bank Account Number**, **Exact VND Amount**, and **Transfer Syntax (`SB ...`)**.

### 2.3 Status & Trust Badges
- Always combine **semantic color + vector SVG icon + text label** (never color alone, never raw emojis):
  - `Regular`: `bg-slate-800 text-slate-300`
  - `Guest • Deposit Paid`: `bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30`
  - `Guest • Deposit Pending`: `bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30`
  - `Shadowbanned (7d)`: `bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30`

---

## 3. Anti-Patterns (Strictly Forbidden)

- ❌ **Raw Emojis as UI Icons:** Do not use `🏸`, `🔐`, `⚡`, or `✓` text characters as structural icons. Use clean inline SVGs or `lucide-react` icons with `aria-hidden="true"`.
- ❌ **Disabling Viewport Zoom:** Never set `maximumScale: 1` or `userScalable: false` in Next.js `Viewport` metadata (violates WCAG 2.1 AA).
- ❌ **Sub-12px Text (`text-[10px]`, `text-[11px]`):** Hard to read on a phone held at arm's length on a badminton court; use `text-xs` (`12px`) minimum.
- ❌ **Non-Tabular Currency Figures:** Never render VND prices or player counts without `tabular-nums`.
- ❌ **Layout-Shifting Hover/Press States:** Only animate `transform` and `opacity` (`150–250ms`), and respect `motion-reduce:transition-none`.

---

## 4. Pre-Delivery Checklist

Before delivering or committing any UI code in `apps/web`:
- [ ] All icons are crisp SVGs (no raw emojis used as structural icons), with `aria-hidden="true"` on decorative icons
- [ ] Every clickable control has `cursor-pointer`, `min-h-[44px]` touch target, and visible `:focus-visible` ring
- [ ] Viewport metadata allows pinch-zoom (`width: 'device-width', initialScale: 1` without `maximumScale: 1`)
- [ ] Text contrast is `≥ 4.5:1` (`text-xs` minimum size; `text-base` `16px` on form `<input>` fields)
- [ ] All VND amounts, split calculations, and counters use `tabular-nums`
- [ ] `prefers-reduced-motion` is respected (`motion-reduce:*`)
- [ ] Layout tested for `375px` (mobile court view), `768px`, and `1024px` with zero horizontal scroll
