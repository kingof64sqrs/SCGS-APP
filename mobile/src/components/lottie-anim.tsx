import LottieView from 'lottie-react-native';
import type { ComponentProps } from 'react';
import { useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';

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
  style,
}: Props) {
  const { width } = useWindowDimensions();
  const computed = size ?? Math.round(Math.min(maxSize, Math.max(minSize, width * ratio)));
  return (
    <View style={[{ width: computed, height: computed, alignSelf: 'center' }, style]}>
      <LottieView source={source} autoPlay loop={loop} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}
