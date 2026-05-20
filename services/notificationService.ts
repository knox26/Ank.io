import { Platform } from 'react-native';
import { getDb } from './db';
import { formatCurrency } from '../lib/currency';
import { Category } from '../types';

// Lazy-load expo-notifications — native module may not be linked yet in dev builds.
// Falls back to no-op if unavailable so the app still boots.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch {
  console.warn('expo-notifications native module not available — notifications disabled.');
}

interface CategorySpend {
  category_id: number | null;
  total: number;
}

// ─── Module-level guards ─────────────────────────────────────────

let permissionsChecked = false;
let isChecking = false;

const CHANNEL_ID = 'budget-alerts';
const OVERALL_KEY = 'notified_budget_overall';

function mondayDateStr(d: Date): string {
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // days since Monday
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  const yyyy = mon.getFullYear();
  const mm = String(mon.getMonth() + 1).padStart(2, '0');
  const dd = String(mon.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function weekKey(prefix: string, suffix?: number): string {
  const base = `${prefix}_${mondayDateStr(new Date())}`;
  return suffix !== undefined ? `${base}_${suffix}` : base;
}

// ─── Settings-based dedup ────────────────────────────────────────

async function hasBeenNotified(key: string): Promise<boolean> {
  try {
    const row = await getDb().getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?",
      key
    );
    return row?.value === '1';
  } catch {
    return false;
  }
}

async function markNotified(key: string): Promise<void> {
  try {
    await getDb().runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      key,
      '1'
    );
  } catch {
    // Silently ignore — notification delivery is best-effort
  }
}

async function clearNotified(key: string): Promise<void> {
  try {
    await getDb().runAsync('DELETE FROM settings WHERE key = ?', key);
  } catch {
    // Silently ignore
  }
}

// ─── Permission ───────────────────────────────────────────────────

async function ensurePermissions(): Promise<boolean> {
  if (!Notifications) return false;
  if (permissionsChecked) {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }
  permissionsChecked = true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Channel (Android) ────────────────────────────────────────────

export async function setupNotificationChannel(): Promise<void> {
  if (!Notifications || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Budget Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 100, 50, 100],
    lightColor: '#FF6B6B',
  });
}

// ─── Foreground handler ───────────────────────────────────────────

export function configureForegroundNotifications(): void {
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// ─── Send ─────────────────────────────────────────────────────────

function sendLocalNotification(title: string, body: string): void {
  if (!Notifications) return;
  Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: null, // immediate
  });
}

// ─── Core budget check ────────────────────────────────────────────

export async function checkBudgetsAndNotify(
  categories: Category[],
  spends: CategorySpend[],
  currency: string
): Promise<void> {
  if (isChecking) return;
  isChecking = true;

  try {
    const granted = await ensurePermissions();
    if (!granted) return;

    if (categories.length === 0) return;

    // Build spend map
    const spendMap = new Map<number | null, number>();
    for (const s of spends) {
      spendMap.set(s.category_id, s.total);
    }

    // Overall budget
    const totalSpent = spends.reduce((sum, s) => sum + s.total, 0);
    const totalBudget = categories.reduce((sum, c) => sum + c.budget_limit, 0);

    if (totalBudget > 0) {
      const overallKey = weekKey(OVERALL_KEY);
      if (totalSpent > totalBudget) {
        if (!(await hasBeenNotified(overallKey))) {
          await markNotified(overallKey);
          sendLocalNotification(
            'Monthly Budget Exceeded',
            `You have spent ${formatCurrency(totalSpent, currency)} of your ${formatCurrency(totalBudget, currency)} budget this month.`
          );
        }
      } else {
        // Dropped back under budget — reset so re-exceeding fires again
        await clearNotified(overallKey);
      }
    }

    // Per-category budgets
    for (const cat of categories) {
      if (cat.budget_limit <= 0) continue;
      const spent = spendMap.get(cat.id) ?? 0;
      const catKey = weekKey(`notified_budget_category`, cat.id);
      if (spent > cat.budget_limit) {
        if (!(await hasBeenNotified(catKey))) {
          await markNotified(catKey);
          sendLocalNotification(
            `${cat.name} Budget Exceeded`,
            `You have spent ${formatCurrency(spent, currency)} of your ${formatCurrency(cat.budget_limit, currency)} budget on ${cat.name} this month.`
          );
        }
      } else {
        // Dropped back under category budget — reset for re-exceed
        await clearNotified(catKey);
      }
    }
  } catch (error) {
    console.error('Budget notification check failed:', error);
  } finally {
    isChecking = false;
  }
}
