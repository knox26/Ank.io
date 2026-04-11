# AnkIo React Native Architecture & Code Audit Report

*Prepared for Production Readiness Readiness Review*

This document provides a comprehensive, production-grade review of the AnkIo React Native expense tracker app. The review focuses on scalability, performance, security, and long-term maintainability for a local-first application.

---

## 1. Architecture Review

### Current State
The project uses Expo Router for navigation and structured around `/app` for UI, `/store` for state, and `/services` for the database. While functional for a small-scale app, the current architecture tightly couples the UI with data access and business logic.

### Findings & Improvements
*   **Missing Repository Pattern:** The `useStore.ts` (Zustand) is directly executing SQL queries (`dbRequest.runAsync`). State management should **not** know about SQL.
    *   **Recommendation:** Move SQL queries into a dedicated `repositories/ExpenseRepository.ts` and `repositories/CategoryRepository.ts`. The store should just call `ExpenseRepository.getAll()`.
*   **Fat UI Components:** Components like `analytics.tsx` and `expenses.tsx` contain heavy data aggregation and grouping logic.
    *   **Recommendation:** Move data shaping logic (e.g., grouping by date, aggregating totals) into custom hooks (e.g., `useGroupedExpenses`) or utilize SQLite's native aggregation functions `GROUP BY`.
*   **Monolithic Store:** `useStore.ts` combines settings (currency, theme), categories, and expenses.
    *   **Recommendation:** Split into smaller slices: `useSettingsStore`, `useExpenseStore`, `useCategoryStore`.
*   **Scalability Concern:** The entire database (`categories` and `expenses`) is loaded into memory on `initializeApp`. This will crash the app when the user has thousands of expenses.
    *   **Recommendation:** Implement infinite scrolling/pagination. The store should only hold the *visible* page of data, not the entire database history.

---

## 2. Code Quality Review

### Findings & Improvements
*   **Heavy Reusability Misses:** You are repeating common UI elements like the "Card" wrapper and date pickers.
    *   **Recommendation:** Extract atomic components: `<Card />`, `<SectionHeader />`, `<EmptyState />`.
*   **Complex Render Methods:** In `expenses.tsx` and `index.tsx`, there are massive inline map functions rendering complex Views.
    *   **Recommendation:** Break these down into smaller pure components (e.g., `<CategoryCard />`, `<ExpenseListItem />`) wrapped in `React.memo` to prevent unnecessary re-renders when parent state changes.
*   **Time & Date Reliability:** You are using native `Date` object string splitting `date.split("T")[0]` and `expenseDate < start`.
    *   **Recommendation:** For an offline-first financial app, timezone bugs are a critical failure point. Standardize timezone handling using a library like `date-fns` or `dayjs`, or strictly store and query UTC epochs.
*   **Magic Strings & Inline Styles:** Mixed usage of internal `style={{...}}` and NativeWind `className="flex-1 ..."`.
    *   **Recommendation:** Commit to NativeWind exclusively. Move static config like shadow properties into `tailwind.config.js` to keep JSX clean.

---

## 3. SQLite & Data Layer Review

### Current State
A basic single-file setup (`db.ts`) with hardcoded schema creation.

### Findings & Improvements
*   **Missing Indexing (CRITICAL):** You are querying `ORDER BY date DESC` and filtering by `category_id` and `date`. Without indexes, SQLite performs a slow full-table scan.
    *   **Recommendation:** Add indices:
        ```sql
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
        CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
        ```
*   **RAM-Heavy "Select *" Anti-Pattern:** Loading all expenses via `SELECT * FROM expenses ORDER BY date DESC` is fatal in long-term production.
    *   **Recommendation:** Use `LIMIT` and `OFFSET` in queries. Use `Cursor` based pagination for the list views.
*   **Poor Migration Strategy:** The schema is created via `CREATE TABLE IF NOT EXISTS`. If you need to alter a table (e.g., add an `image_uri` column later), this setup will fail without manually wrangling `PRAGMA user_version`.
    *   **Recommendation:** Implement a robust migration system (like `drizzle-orm` for Expo SQLite or a custom metadata tracking table) to handle versioning smoothly (V1 -> V2).
*   **Data Aggregation:** `index.tsx` pulls all expenses into JavaScript to calculate the sum.
    *   **Recommendation:** Do this in SQLite, which is heavily optimized for math:
        `SELECT SUM(amount) FROM expenses WHERE strftime('%m', date) = '04'`

---

## 4. Performance Review

### Findings & Improvements
*   **List Rendering (HIGH):** You are using `ScrollView` map in `index.tsx` and `budget.tsx`, and `SectionList` in `expenses.tsx`. As data grows, React Native will choke on memory.
    *   **Recommendation:** Replace `SectionList` and `ScrollView` lists with `@shopify/flash-list`. It reuses UI nodes and is the industry standard for React Native list performance.
*   **Unmemoized Grouping:** In `expenses.tsx`, `groupedExpenses` is outside of a `useMemo`. It rebuilds a massive JavaScript object holding all expenses *on every single render, scroll, or filter toggle*.
    *   **Recommendation:** Wrap `groupedExpenses` in a `useMemo`.
*   **Over-rendering Analytics:** The PieChart and BarChart compute logic executes on the main thread during component render.
    *   **Recommendation:** Pre-compute chart data in a background layer or `useEffect` and store in local state, preventing main-thread JS blocking during navigation transitions.
*   **Bundle Size & Load Speed:** `expo-router` is great, but ensure you aren't inadvertently loading giant SVG components (if not optimized).
    *   **Recommendation:** Ensure all assets are optimized, and leverage React concurrent features if calculations block the UI.

---

## 5. Security & Reliability

### Findings & Improvements
*   **App Privacy Layer:** Financial data is considered highly sensitive. Anyone who opens the unlocked phone can see everything.
    *   **Recommendation:** Implement an "App Lock" screen utilizing `expo-local-authentication` (FaceID/TouchID/PIN) on app resume (`AppState.addEventListener`).
*   **Database Encryption:** Currently, the SQLite db is stored in plain text in the app sandbox. If the device is rooted, it's trivial to extract.
    *   **Recommendation:** Use `expo-secure-store` to hold an encryption key, and enable SQLCipher (if supported via your expo setup, or consider `react-native-quick-sqlite` or equivalent encryptable adapters if highly sensitive).
*   **Backup / Restore:** There is no backup strategy. If a user loses their device, all data is lost.
    *   **Recommendation:** Implement an export/import feature. Allow users to export the `.db` file or a `.csv` to their local files/iCloud/Google Drive.
*   **Error Handling (Crash Prevention):** Empty catch blocks or simple `console.error` in `useStore.ts` (e.g., `catch (error) { console.error... }`). If a DB write fails, the UI does not inform the user.
    *   **Recommendation:** Propagate errors to the UI layer and show a `Toast` or `Alert` so the user knows an action failed rather than silently failing.

---

## 6. Production Readiness Checklist

**Pre-Flight Status: 🔴 NOT READY**

*   [ ] **Pagination:** Implemented infinite lists (FlashList) and paginated DB queries. *(Missing)*
*   [ ] **Indices:** SQL indices built for `.date` and `.category_id`. *(Missing)*
*   [ ] **Error Reporting:** Sentry or equivalent crashlytics integrated. *(Missing)*
*   [ ] **Metrics / Analytics:** PostHog/Mixpanel installed to track feature usage (anonymously). *(Missing)*
*   [ ] **Automated Testing:** Jest/Detox test coverage for core DB calculations. *(Missing)*
*   [ ] **Security Guard:** Biometric app-lock integration. *(Missing)*
*   [ ] **Data Export:** User can export their financial data. *(Missing)*
*   [ ] **Migrations:** Schema version control system in place. *(Missing)*

---

## 7. Executive Summary

Your app demonstrates excellent UI/UX capabilities and a solid grasp of modern React Native tooling (Expo Router, Tailwind/NativeWind, Zustand). However, the infrastructure is built like a prototype rather than a scalable production app.

### Priority Action Plan:
1.  **Critical (Fix Before Launch):** Add `LIMIT`/`OFFSET` to your SQLite queries and implement pagination in the UI. Move from `ScrollView`/`SectionList` to `FlashList` for any expense lists. Move aggregation math to SQL queries instead of JS arrays. Add DB Indexes!
2.  **High (Architecture Refactor):** Decouple `useStore` from your direct SQLite queries by introducing a dedicated Repository layer. Add a robust DB schema migration system.
3.  **Enhancements (Post-Launch):** Add Biometric Lock (`expo-local-authentication`), Data Export/Backup functionality, and extract shared UI components to enforce dryness.
