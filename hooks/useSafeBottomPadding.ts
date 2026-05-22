import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Returns insets.bottom + extra, for dynamic bottom padding that clears the system nav bar. */
export function useSafeBottomPadding(extra = 0): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + extra;
}
