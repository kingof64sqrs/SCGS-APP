/**
 * Returns the active color palette based on the user's theme choice
 * (light / dark / system), provided by ThemeModeProvider.
 * Learn more: https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/context/theme-context';

export function useTheme() {
  const { scheme } = useThemeMode();
  return Colors[scheme];
}
