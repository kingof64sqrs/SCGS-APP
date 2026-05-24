import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const LOGO = require('@/assets/images/scgs-logo.png');

// Comfortable form width on tablets/desktop; phones just fill the padding.
const CARD_MAX_WIDTH = 420;

export default function LoginScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Wider viewports (tablet / web) get an explicit centered card.
  const isWide = width >= 600;
  const logoSize = Math.round(Math.min(140, Math.max(96, width * 0.32)));

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View
              style={[
                styles.card,
                { maxWidth: CARD_MAX_WIDTH },
                isWide && {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderRadius: Spacing.four,
                  padding: Spacing.five,
                },
              ]}>
              {/* Logo + heading */}
              <View style={styles.header}>
                <Image
                  source={LOGO}
                  style={{ width: logoSize, height: logoSize, marginBottom: Spacing.two }}
                  contentFit="contain"
                />
                <ThemedText type="subtitle" style={styles.centerText}>
                  Welcome Back
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.centerText}>
                  Sign in to your SCGS account
                </ThemedText>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}>
                  <Ionicons name="mail-outline" size={20} color={theme.icon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Email"
                    placeholderTextColor={theme.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    textContentType="emailAddress"
                  />
                </View>

                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.icon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Password"
                    placeholderTextColor={theme.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={theme.icon}
                    />
                  </Pressable>
                </View>

                <Pressable style={styles.forgot} hitSlop={8}>
                  <ThemedText type="small" style={{ color: theme.tint }}>
                    Forgot password?
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
                  ]}
                  accessibilityRole="button">
                  <ThemedText style={styles.buttonText}>Sign In</ThemedText>
                </Pressable>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <ThemedText type="small" themeColor="textSecondary">
                  Don&apos;t have an account?{' '}
                </ThemedText>
                <Pressable hitSlop={8}>
                  <ThemedText type="smallBold" style={{ color: theme.tint }}>
                    Sign Up
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  card: {
    width: '100%',
    gap: Spacing.five,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
  form: {
    gap: Spacing.three,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  forgot: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.one,
  },
  button: {
    height: 52,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
