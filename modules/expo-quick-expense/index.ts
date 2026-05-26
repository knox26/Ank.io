import { NativeModules } from 'react-native';

const { ExpoQuickExpense } = NativeModules;

/**
 * Sync widget cache with current templates and categories.
 * Debounced internally (300ms window) — safe to call after every mutation.
 */
export function syncWidgetCache(): void {
  if (ExpoQuickExpense?.syncWidgetCache) {
    ExpoQuickExpense.syncWidgetCache();
  }
}

/**
 * Force an immediate widget update.
 */
export function requestWidgetUpdate(): void {
  if (ExpoQuickExpense?.requestWidgetUpdate) {
    ExpoQuickExpense.requestWidgetUpdate();
  }
}
