import { useColorScheme } from 'nativewind';

/**
 * Theme hook that wraps NativeWind's useColorScheme.
 * Eliminates the repeated `useColorScheme() + isDark` boilerplate.
 */

interface ThemeColors {
  text: string;
  textMuted: string;
  textInverse: string;
  background: string;
  surface: string;
  border: string;
  icon: string;
  iconMuted: string;
  active: string;
  inactive: string;
}

interface UseThemeReturn {
  isDark: boolean;
  colorScheme: 'light' | 'dark' | undefined;
  toggleColorScheme: () => void;
  colors: ThemeColors;
}

export function useTheme(): UseThemeReturn {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors: ThemeColors = isDark
    ? {
        text: '#f8fafc',        // slate-50
        textMuted: '#94a3b8',   // slate-400
        textInverse: '#0f172a', // slate-900
        background: '#020617',  // slate-950
        surface: '#0f172a',     // slate-900
        border: '#1e293b',      // slate-800
        icon: '#e2e8f0',        // slate-200
        iconMuted: '#64748b',   // slate-500
        active: '#ffffff',
        inactive: '#64748b',    // slate-500
      }
    : {
        text: '#0f172a',        // slate-900
        textMuted: '#64748b',   // slate-500
        textInverse: '#ffffff',
        background: '#f9fafb',  // gray-50
        surface: '#ffffff',
        border: '#f3f4f6',      // gray-100
        icon: '#475569',        // slate-600
        iconMuted: '#94a3b8',   // slate-400
        active: '#0f172a',      // slate-900
        inactive: '#94a3b8',    // slate-400
      };

  return { isDark, colorScheme, toggleColorScheme, colors };
}
