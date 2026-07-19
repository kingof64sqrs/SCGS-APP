import { useFocusEffect } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * Blocks screenshots / screen recording while the screen using it is focused
 * (Android: FLAG_SECURE; iOS: obscures the app switcher + screenshot). Releases
 * the block when the screen loses focus. No-op on web.
 */
export function useScreenshotGuard(): void {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return;
      let released = false;
      ScreenCapture.preventScreenCaptureAsync().catch(() => {});
      return () => {
        if (released) return;
        released = true;
        ScreenCapture.allowScreenCaptureAsync().catch(() => {});
      };
    }, []),
  );
}
