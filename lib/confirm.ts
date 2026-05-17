export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  confirmStyle?: 'default' | 'destructive';
  onConfirm: () => void;
}

type ConfirmHandler = (opts: ConfirmOptions) => void;

let handler: ConfirmHandler | null = null;

export function registerConfirmHandler(fn: ConfirmHandler) {
  handler = fn;
}

export function unregisterConfirmHandler() {
  handler = null;
}

export function showThemedConfirm(opts: ConfirmOptions) {
  if (handler) {
    handler(opts);
  } else {
    // Fallback to native Alert.alert if dialog not mounted
    const { Alert } = require('react-native');
    Alert.alert(opts.title, opts.message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: opts.confirmText ?? 'Confirm',
        style: opts.confirmStyle === 'destructive' ? 'destructive' : 'default',
        onPress: opts.onConfirm,
      },
    ]);
  }
}
