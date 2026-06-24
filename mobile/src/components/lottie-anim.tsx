import LottieView from 'lottie-react-native';
import type { ComponentProps } from 'react';
import { StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  source: ComponentProps<typeof LottieView>['source'];
  /** Override the computed size (square width=height). */
  size?: number;
  /** Maximum size used when computing from viewport. Default 220. */
  maxSize?: number;
  /** Fraction of viewport width used to compute the size. Default 0.5. */
  ratio?: number;
  /** Minimum size used when computing from viewport. Default 120. */
  minSize?: number;
  loop?: boolean;
  /**
   * Render the animation inside a themed surface (white card with a hairline
   * border) so Lotties that contain white artwork don't look broken on dark
   * backgrounds.
   */
  framed?: boolean;
  /** Shape of the frame when framed=true. Default 'circle'. */
  frameShape?: 'circle' | 'rounded';
  style?: StyleProp<ViewStyle>;
};

/**
 * Responsive Lottie wrapper. Square by default; size adapts to viewport
 * (min..max bounds), so it lines up nicely on phones, tablets and web.
 */
export function LottieAnim({
  source,
  size,
  maxSize = 220,
  ratio = 0.5,
  minSize = 120,
  loop = true,
  framed = false,
  frameShape = 'circle',
  style,
}: Props) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const computed = size ?? Math.round(Math.min(maxSize, Math.max(minSize, width * ratio)));
  const radius = frameShape === 'circle' ? computed / 2 : 22;

  return (
    <View
      style={[
        { width: computed, height: computed, alignSelf: 'center' },
        framed && {
          backgroundColor: '#ffffff',
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.border,
        },
        style,
      ]}>
      <LottieView source={source} autoPlay loop={loop} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}
