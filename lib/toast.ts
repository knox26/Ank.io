import { Alert } from 'react-native';

/**
 * Simple user-facing feedback utilities.
 * Wraps Alert.alert() for now — can be swapped for a toast library later.
 */

export function showError(title: string, message?: string): void {
  Alert.alert(title, message ?? 'Something went wrong. Please try again.', [
    { text: 'OK' },
  ]);
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = 'Confirm',
  confirmStyle: 'default' | 'destructive' = 'default'
): void {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmText, style: confirmStyle, onPress: onConfirm },
  ]);
}
