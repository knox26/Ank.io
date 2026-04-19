# AnkIo — Production Readiness Audit Report

**Reviewer**: Principal Mobile Architect / Senior React Native Engineer  
**Date**: April 19, 2026  
**Scope**: Full codebase — architecture, code quality, data layer, performance, security, production readiness  
**Verdict**: **Solid foundation, several high-priority gaps remain before a production release**

---

## Executive Summary

AnkIo has progressed substantially from its initial monolithic prototype. The codebase now demonstrates clear separation of concerns (Repository → Store → UI), proper migration-based schema management, memoized computations, and extracted components. However, several production-critical deficiencies remain across **data integrity**, **error recovery**, **testing**, and **UX edge cases** that would cause user-facing failures at scale.

---

## 1. Architecture Review

### Current Structure (Good)

```
services/          ← Repository layer (DB access)
store/             ← Zustand stores (state management)
hooks/             ← Custom hooks (filter logic, theme)
lib/               ← Pure utilities (currency, date, validation)
components/        ← Extracted/memoized UI primitives
constants/         ← Static config (icons, colors)
app/               ← Route-level screens (Expo Router)
types.ts           ← Centralized domain models
```

**Strengths:**
- Clean three-layer architecture: `Repository → Store → Screen`
- Stores never execute raw SQL — all DB access goes through repositories
- Zustand used with individual selectors (`(s) => s.expenses`) preventing full-store re-renders
- `useAppStore` orchestrates initialization order (DB → parallel store loads)
- Types are centralized in a single file with JSDoc comments
- Error boundaries are per-screen (isolated failure domains)

### Findings

| # | Finding | Severity |
|---|---------|----------|
| A1 | **No `estimatedItemSize` on FlashList** — FlashList requires this prop for optimal scroll performance. Its absence degrades initial render time and causes internal warnings. | Medium |
| A2 | [x] **`analytics.tsx` recomputes chart data client-side from full expense array** — filtering 6 months of expenses on each render. The `ExpenseRepository` already has `getMonthlyTrend()` and `getCategorySpends()` — these should be used from a dedicated analytics store, not recomputed from raw data. | High |
| A3 | **Missing `update` flow for expenses** — The store has `addExpense` and `deleteExpense` but no `updateExpense`, despite the repository having `updateExpense()`. Users cannot edit a submitted expense, which is a fundamental UX gap. | High |
| A4 | [x] **`index.tsx` home screen does O(n×m) category spending calculation** — Lines 180-182 run `.filter().reduce()` per category inside the `.map()` render. This should be pre-computed in a single pass via `useMemo`. | Medium |
| A5 | **No separate "add" tab screen file** — The `(tabs)/add` route is defined in `_layout.tsx` but has no corresponding file. It functions as a redirect to `/modal`, but Expo Router may warn about missing route files in production. | Low |

### Recommended Architecture Improvements

```
services/
  repositories/          ← group repositories
    ExpenseRepository.ts
    CategoryRepository.ts
    SettingsRepository.ts
  db.ts                  ← keep as singleton
store/
  useExpenseStore.ts
  useCategoryStore.ts
  useSettingsStore.ts
  useAnalyticsStore.ts   ← NEW: dedicated analytics queries
  useAppStore.ts
```

---

## 2. Code Quality Review

### Strengths
- Consistent naming conventions (PascalCase components, camelCase functions)
- All list item components are `React.memo` with `displayName`
- Input validation is centralized in `lib/validation.ts` with proper return types
- Currency parsing correctly guards against NaN, Infinity, negative, and excessive decimals
- `useCallback` wraps all handler functions passed to child components

### Findings

| # | Finding | Severity |
|---|---------|----------|
| C1 | **`useTheme` recreates the full `colors` object on every render** — The `colors` object is defined inline in the hook body, creating a new reference each render. This defeats `React.memo` on any child receiving `colors`. Memoize with `useMemo`. | Medium |
| C2 | **`ICON_MAP` typed as `Record<string, any>`** — Loses all type safety. Should be `Record<string, React.ComponentType<LucideProps>>` or similar. | Low |
| C3 | **`FilterPanel` receives 13 props** — This is a code smell. The component should accept an `ExpenseFilters` state object + a `dispatch` or grouped callbacks. | Low |
| C4 | **Inline function in `onToggleFilters`** — `expenses.tsx` line 137: `onToggleFilters={() => setShowFilters(!showFilters)}` creates a new closure every render, partially defeating `FilterPanel`'s `React.memo`. Stabilize with `useCallback`. | Low |
| C5 | **`add-category.tsx` uses `React.createElement` for icon preview** — Line 116-119 dynamically renders icons via `React.createElement`. This is functional but fragile — use the `CategoryIcon` component instead for consistency. | Low |
| C6 | **No linting/formatting tooling configured** — No ESLint, Prettier, or Husky in `package.json` or config files. Production codebases require automated code quality enforcement. | Medium |

---

## 3. SQLite & Data Layer Review

### Strengths
- **Migration system** is well-designed: versioned, transactional, with `PRAGMA user_version` tracking
- **Integer cents** for all monetary values eliminates floating-point rounding issues
- **Index coverage**: `idx_expenses_date`, `idx_expenses_category`, and composite `idx_expenses_date_category` cover all current query patterns
- **WAL mode** enabled for concurrent read performance
- **Foreign keys enabled** with `ON DELETE SET NULL` — prevents orphaned expense records
- **Soft-delete** for categories via `is_archived` preserves data integrity

### Findings

| # | Finding | Severity |
|---|---------|----------|
| D1 | [x] **PRAGMA `journal_mode = WAL` is set inside Migration v1, not at connection time** — If a user already passed migration v1, WAL mode is never re-set on subsequent app launches. Move this to `initDatabase()` or connection setup. | **Critical** |
| D2 | [x] **PRAGMA `user_version` set inside transaction** — SQLite does not support `PRAGMA user_version` inside transactions on all platforms. If this silently fails, migrations will re-run on every launch. Move the version update outside the transaction but after the migration body. | High |
| D3 | [x] **`exportDatabase` uses `require()` instead of `import`** — Dynamic `require('expo-file-system/legacy')` is a Node.js pattern. Use conditional `import()` for Metro compatibility, or move to a separate file that's conditionally imported. | Medium |
| D4 | [x] **No database connection error handling** — `SQLite.openDatabaseSync('expense_tracker.db')` on line 5 of `db.ts` runs at module load time with no try/catch. If the device has disk space issues, the app will crash on import. | High |
| D5 | [x] **Migration v2 amount conversion is lossy** — The WHERE clause `amount < 100` assumes all pre-migration amounts under 100 are "dollars not cents", but a legitimate expense of $0.50 (stored as 0.50) meets the condition while an expense of $1.00 (stored as 1.00 = 100 cents) does not. This was a one-time migration so the damage is done, but document it for future reference. | Low (historical) |
| D6 | [x] **No database size monitoring** — No VACUUM strategy, no WAL checkpoint management. After many deletes, the database file will only grow. Add periodic `PRAGMA wal_checkpoint(TRUNCATE)` and consider a manual VACUUM option in settings. | Low |
| D7 | [x] **`addExpense` returns `created!` with a non-null assertion** — If the INSERT succeeds but the subsequent SELECT fails (race condition, disk full), this will throw a runtime crash. Add a null check. | Medium |

---

## 4. Performance Review

### Strengths
- **FlashList** for expense list — handles large datasets significantly better than FlatList/SectionList
- **`useMemo`** on all expensive computations (date grouping, totals, chart data)
- **`useCallback`** on all callbacks passed to child components
- **`React.memo`** on all list item components (`ExpenseItem`, `CategoryGridItem`, `FilterPanel`)
- **Skeleton screens** for loading states (no layout jumps)
- **Pagination** on expense loading (50 per page with `loadMore`)

### Findings

| # | Finding | Severity |
|---|---------|----------|
| P1 | [x] **Home screen category spend is O(expenses × categories)** — Each category grid item filters the full `thisMonthExpenses` array (line 180-182). With 20 categories and 500 expenses, this is 10,000 iterations inside a render. Pre-compute a `Map<categoryId, totalSpent>` in a single-pass `useMemo`. | High |
| P2 | [x] **Analytics computes bar chart data from in-memory expenses** — `analytics.tsx` filters the full expense array 6 times (once per month) inside `useMemo`. This should use `ExpenseRepository.getMonthlyTrend(6)` — a single SQL query with `GROUP BY`. | High |
| P3 | [x] **`loadMore` pagination offset by array length is fragile** — If items are deleted between pages, the offset shifts and items may be skipped or duplicated. Use cursor-based pagination (e.g., `WHERE id < lastSeenId`) instead. | Medium |
| P4 | **`useExpenseFilters` filters in-memory instead of SQL** — After loading all expenses, the hook re-filters them in JS. For datasets > 1000 rows, this should be a database query via `ExpenseRepository.getFilteredExpenses()`. | Medium |
| P5 | [x] **`centerLabelComponent` in PieChart creates component inline** — `analytics.tsx` line 112: the arrow function creates a new component instance on every render, potentially causing the chart to re-mount. Extract to a memoized component. | Low |
| P6 | **`currentMonthName` memo has empty deps `[]`** — In `analytics.tsx` and `index.tsx`, this means if the user keeps the app open across midnight on the 1st of the month, the label will be stale until a remount. Minor, but worth noting. | Low |

---

## 5. Security & Reliability

### Findings

| # | Finding | Severity |
|---|---------|----------|
| S1 | **No data encryption at rest** — SQLite database is stored as plaintext on the file system. Anyone with device access (or a backup extraction tool) can read all financial data. Use `expo-crypto` with SQLCipher or at minimum `expo-secure-store` for sensitive fields. | **Critical** |
| S2 | **No app-level authentication** — No PIN, biometric, or password protection. The user's financial data is accessible to anyone who picks up the unlocked device. | High |
| S3 | **No backup/restore strategy beyond CSV export** — The CSV export is one-way; there's no import function. A re-install or device change results in complete data loss. Implement SQLite `.db` file backup/restore or cloud sync. | High |
| S4 | **`showConfirm` delete has no undo** — Deleting an expense is permanent and immediate. Consider a "soft-delete with undo toast" pattern (show a Snackbar with "Undo" for 5 seconds). | Medium |
| S5 | **Error boundary `componentDidCatch` only logs to console** — Line 31 of `ErrorBoundary.tsx` has a TODO for crash reporting but nothing is wired. Production apps need Sentry, Bugsnag, or similar. | High |
| S6 | **`initializeApp` failure is non-recoverable** — If migration fails, the app shows an error screen with no retry button. The user is stuck. Add a "Retry" or "Reset Database" option. | Medium |
| S7 | [x] **CSV export doesn't sanitize for formula injection** — Exported CSV values starting with `=`, `+`, `-`, or `@` could be interpreted as formulas by spreadsheet software. Prefix cells with a single quote or tab character. | Low |

---

## 6. Production Readiness Checklist

| Area | Status | Notes |
|------|--------|-------|
| ☐ Unit tests | **Missing** | No test files except a default `components/__tests__` folder. Zero coverage. |
| ☐ Integration tests | **Missing** | No repository or store tests. |
| ☐ E2E tests | **Missing** | No Detox/Maestro configuration. |
| ☐ Error monitoring | **Missing** | No Sentry/Bugsnag/Crashlytics integration. |
| ☐ Analytics / telemetry | **Missing** | No usage tracking (even privacy-friendly local analytics). |
| ☐ Logging framework | **Missing** | Uses `console.log/error` throughout — no structured logging. |
| ☐ CI/CD pipeline | **Missing** | No GitHub Actions, no EAS Build automation. |
| ☐ ESLint + Prettier | **Missing** | No code quality automation. |
| ☐ TypeScript strict mode | **Partial** | `tsconfig.json` exists but no `"strict": true`. |
| ☐ Accessibility audit | **Good** | `accessibilityRole`, `accessibilityLabel`, `accessibilityState` are consistently applied. |
| ☐ Dark mode support | **Good** | Full NativeWind dark mode support with `useTheme` hook. |
| ☐ Offline resilience | **Good** | Fully offline by design — SQLite, no network dependencies. |
| ☐ Input validation | **Good** | Centralized validation with clear error messages. |
| ☐ Error boundaries | **Good** | Per-screen boundaries with retry UI. |
| ☐ Loading states | **Good** | Skeleton screens for all main tabs. |
| ☐ Migration system | **Good** | Versioned, transactional, with clear rules documented. |
| ☐ Data export | **Partial** | CSV export exists, no import/restore capability. |

---

## 7. Final Audit Report — Prioritized Findings

### 🔴 Critical Issues (Must fix before release)

| ID | Issue | Impact |
|----|-------|--------|
| D1 | WAL mode not set on every app launch | Silent journal mode fallback degrades concurrent read perf, possible corruption on crash |
| S1 | No database encryption at rest | Financial data fully exposed to anyone with file system access |

### 🟠 High Priority Improvements (Should fix before release)

| ID | Issue | Impact |
|----|-------|--------|
| A2 | Analytics recomputes from full array instead of SQL queries | O(n) on every render; wastes battery, degrades older devices |
| A3 | No expense editing flow | Users must delete and re-create to fix a typo — unacceptable UX |
| P1 | Home screen O(n×m) category spend computation | Quadratic work in render path; janky with many categories |
| P2 | Bar chart computed from in-memory data | Should use dedicated `getMonthlyTrend()` SQL query |
| D2 | PRAGMA user_version inside transaction may silently fail | Migrations could re-run on every launch |
| D4 | No error handling on database connection | Crash at module import time if disk is full |
| S2 | No app-level PIN/biometric lock | Financial privacy risk |
| S3 | No backup/restore beyond one-way CSV export | Complete data loss on reinstall |
| S5 | Crash reporting is console.log only | Zero visibility into production crashes |
| C6 | No linting/formatting tooling | Code quality degrades as team grows |

### 🟡 Good to Have Enhancements

| ID | Issue | Impact |
|----|-------|--------|
| C1 | `useTheme` colors object recreated every render | Minor perf; defeats React.memo in edge cases |
| P3 | Offset-based pagination is fragile | Duplicate/missing items after deletes between pages |
| P4 | In-memory filtering instead of SQL for large datasets | Degrades at >1000 expenses |
| D3 | Dynamic `require()` for expo-file-system | Metro bundler compatibility concern |
| D7 | Non-null assertion on addExpense return | Potential crash on edge-case disk failures |
| S4 | No undo for destructive actions | Accidental data loss |
| S6 | Non-recoverable init failure | User stuck on error screen forever |
| S7 | CSV formula injection vulnerability | Low risk but easy to exploit via crafted notes |

### 🔵 Future Scalability Recommendations

| Area | Recommendation |
|------|---------------|
| **Multi-account support** | Add an `accounts` table; expense can be attributed to different spending accounts |
| **Recurring expenses** | The `is_recurring` field exists but has no processing engine. Build a scheduler that auto-creates entries monthly. |
| **Data sync** | Consider CRDTs or a sync engine (PowerSync, ElectricSQL) for multi-device support without a custom backend. |
| **Widget** | Expose monthly spend summary via iOS Widget / Android App Widget using `expo-widgets`. |
| **Localization** | Replace hardcoded strings with `i18n-js` or `expo-localization` for international markets. |
| **Theming** | Extract the color palette from `useTheme` into a design token system for easier brand customization. |
| **Database queries via repository** | Move _all_ data transformations (chart data, filtered lists) to SQL `GROUP BY` queries — the DB is orders of magnitude faster than JS array processing. |

---

## Score Card

| Dimension | Score | Notes |
|-----------|-------|-------|
| Architecture | **8/10** | Clean layers, proper separation, only needs analytics store |
| Code Quality | **7/10** | Well-structured, but lacks tooling enforcement and has minor anti-patterns |
| Data Layer | **7.5/10** | Strong migration system, good schema, but WAL + connection issues |
| Performance | **7/10** | Good foundations (FlashList, memo), but compute-in-render patterns remain |
| Security | **4/10** | Major gap — no encryption, no auth, no crash reporting |
| Testing | **1/10** | Effectively zero test coverage |
| Production Infra | **3/10** | No CI/CD, no monitoring, no structured logging |
| **Overall** | **6/10** | Solid app architecture with significant production gaps |

---

*End of audit. Findings indexed for backlog grooming and sprint planning.*
