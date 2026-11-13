# SmashBill — Workspace Rules & Engineering Standards

@[Living Project Context](.agents/CONTEXT.md)

---

## 1. Persistent Context Protocol (Mandatory)
To maintain continuous context across sessions over time:
1. **Read on Start:** Always review `.agents/CONTEXT.md` (auto-included above) before planning or writing code so your work aligns with the current roadmap phase and past ADRs.
2. **Update Before Finishing:** Whenever you complete a feature, alter `schema.prisma`, introduce an architectural decision, or finish a task milestone, you **MUST** update `.agents/CONTEXT.md` (Roadmap checkboxes, ADR table, Active Focus, and Session Changelog) before creating the final commit.
3. Use the `context-sync` skill (`.agents/skills/context-sync/SKILL.md`) for structured session handoffs.

---

## 2. Git & Version Control Conventions (Mandatory)

### 2.1. Commit Message Format (Conventional Commits)
Every commit message MUST follow the Conventional Commits specification:
```text
<type>(<optional-scope>): <short imperative summary>

[optional body explaining "why", not just "what"]
```
- **Allowed `<type>` values:**
  - `feat`: New user-facing or API feature
  - `fix`: Bug fix
  - `refactor`: Code restructuring with no behavior change
  - `perf`: Performance or memory optimization
  - `db`: Prisma schema, migration, or seed changes
  - `docs`: Documentation or `.agents/CONTEXT.md` updates
  - `test`: Adding or updating unit/e2e tests
  - `ci`: GitHub Actions, Docker, or deployment config
  - `chore`: Tooling, dependencies, or workspace maintenance
- **Allowed `<scope>` values:** `api`, `web`, `db`, `auth`, `club`, `match`, `billing`, `classifieds`, `trust`, `infra`, `context`
- **Subject Line Rules:**
  - Use **imperative mood** (`add`, `fix`, `implement`, not `added` or `adds`).
  - Lowercase first word after `: `, no trailing period (`.`), max `72` characters.
  - Examples:
    - `feat(billing): persist match fee split and debt balance in transaction`
    - `db(schema): add index on attendance matchId and status`
    - `docs(context): update week 2 progress and session changelog`

### 2.2. Branch Naming Convention
- Feature branches: `feat/<scope>-<short-slug>` (e.g., `feat/billing-vietqr-settlement`)
- Bug fixes: `fix/<scope>-<short-slug>` (e.g., `fix/match-guest-deposit-calc`)
- Database/schema work: `db/<short-slug>`
- Chores/docs: `chore/<short-slug>` or `docs/<short-slug>`

### 2.3. Pre-Commit Quality Gate
Never commit broken or unformatted code. Before every `git commit`, run:
1. `pnpm db:generate` (if `apps/api/prisma/schema.prisma` changed)
2. `pnpm check` (runs Biome linter + formatter across the monorepo)
3. `pnpm build` (verifies TypeScript compilation for both `@smash-bill/api` and `@smash-bill/web`)

---

## 3. Domain & Business Invariants

1. **Single-Player First Usability:**
   - Club admins must be able to manage clubs, rosters, attendance, and VietQR billing without requiring members to register an account (`ClubMember.userId` is nullable). Never make `userId` mandatory for roster or billing flows.
2. **Currency & Rounding (`VND`):**
   - Store and compute all monetary values as integer `VND` (`Int` in Prisma, `number` integer in TS). Never use floating-point decimals for currency.
   - Match fee splits round **up** to the nearest `1,000 VND` (`Math.ceil(raw / 1000) * 1000`), and any positive difference is tracked as `clubFundSurplus`.
3. **SSO-Only Identity & Trust Enforcement:**
   - Only `GOOGLE` and `ZALO` SSO are permitted (`AuthProvider`). Do not add email/password registration.
   - `SHADOWBANNED` users (3 verified reports -> 7 days) cannot post classifieds or request drop-in guest slots. `BANNED` users are permanently blocked by `[provider, providerId]`.
4. **Standardized VietQR Transfer Syntax:**
   - Follow NAPAS-compatible uppercase ASCII syntax without diacritics (e.g., `SB <CLUB_SLUG> <PERIOD/MATCH> <MEMBER_NAME>`).

---

## 4. Tech Stack & Code Quality Standards

- **Low-RAM (`< $4/month` 1GB VPS) Constraint:** Avoid heavy in-memory dependencies or unnecessary daemons. Prefer PostgreSQL + Prisma transactions over external queues/caches unless explicitly requested.
- **Formatting & Linting (Biome):**
  - 2 spaces indentation, `100` character line width, single quotes (`'`), trailing commas `all`, semicolons `always`.
  - Do not install ESLint or Prettier; `biome.json` is the single code quality tool.
- **Backend (`apps/api` - NestJS 11):**
  - All endpoints live under global prefix `/api/v1`.
  - Validate all request payloads with `class-validator` / `class-transformer` DTOs (global `ValidationPipe` has `whitelist: true` and `forbidNonWhitelisted: true`).
  - Wrap multi-table financial/attendance updates in `this.prisma.$transaction(...)`.
- **Frontend (`apps/web` - Next.js 15 + Tailwind CSS 4 + `ui-ux-pro-max`):**
  - Follow `design-system/smash-bill/MASTER.md` and the `ui-ux-pro-max` skill (`.agents/skills/ui-ux-pro-max/SKILL.md`) for all UI/UX work.
  - Mobile-first PWA design: optimize for one-handed court-side use on mobile screens (`min-h-[44px]` touch targets, `cursor-pointer`, high contrast ≥ 4.5:1 in bright indoor court lighting, never disable viewport zoom).
  - Use vector SVG icons (never raw emojis as structural icons) and apply `tabular-nums` to all VND currency values and counters.
