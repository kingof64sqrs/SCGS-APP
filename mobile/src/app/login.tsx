import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { bioLabel, hasBiometricSession } from '@/utils/biometric';

const LOGO = require('@/assets/images/scgs-logo.png');
const CARD_MAX_WIDTH = 420;

export default function LoginScreen() {
  const theme = useTheme();
  const {
    signIn,
    signInWithBiometric,
    enableBiometric,
    biometricEnabled,
    biometricSupported,
    biometricKind,
  } = useAuth();
  const { width } = useWindowDimensions();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always hold a ref to the latest enableBiometric to avoid stale closures after signIn.
  const enableBiometricRef = useRef(enableBiometric);
  useEffect(() => {
    enableBiometricRef.current = enableBiometric;
  }, [enableBiometric]);

  const isWide = width >= 600;
  const logoSize = Math.round(Math.min(132, Math.max(96, width * 0.3)));

  const handleSubmit = async () => {
    if (submitting) return;
    if (!identifier.trim() || !password) {
      setError('Please enter your phone number and password.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn(identifier, password);
      if (biometricSupported) {
        if (biometricEnabled) {
          // Already enrolled — silently refresh the stored session with the new token.
          // Use ref to get the latest enableBiometric (avoids stale closure after await).
          enableBiometricRef.current().catch(() => {});
        } else {
          const label = bioLabel(biometricKind);
          Alert.alert(
            `Enable ${label}?`,
            `Use your ${label.toLowerCase()} next time to sign in faster.`,
            [
              { text: 'Not now', style: 'cancel' },
              {
                text: 'Enable',
                onPress: () => {
                  enableBiometricRef.current().catch(() => {});
                },
              },
            ],
          );
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBiometric = useCallback(async (silent = false) => {
    if (bioBusy) return;
    setBioBusy(true);
    setError(null);
    try {
      const hasSession = await hasBiometricSession();
      if (!hasSession) {
        if (!silent) setError('Please sign in with your password first to set up fingerprint.');
        return;
      }
      const ok = await signInWithBiometric();
      if (!ok && !silent) setError('Fingerprint sign-in was cancelled.');
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Biometric sign-in failed.');
    } finally {
      setBioBusy(false);
    }
  }, [bioBusy, signInWithBiometric]);

  // Auto-prompt biometrics silently on screen open when a stored session exists.
  useEffect(() => {
    if (!biometricEnabled) return;
    hasBiometricSession().then((has) => {
      if (has) void handleBiometric(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricEnabled]);

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
                  Sign in to Shree Coimbatore Gujarati Samaj
                </ThemedText>
              </View>

              <View style={styles.form}>
                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}>
                  <Ionicons name="call-outline" size={20} color={theme.icon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Phone number"
                    placeholderTextColor={theme.textSecondary}
                    value={identifier}
                    onChangeText={setIdentifier}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoComplete="tel"
                    autoCorrect={false}
                    editable={!submitting}
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
                    editable={!submitting}
                    onSubmitEditing={handleSubmit}
                    returnKeyType="go"
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

                {error ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
                    <ThemedText type="small" style={styles.errorText}>
                      {error}
                    </ThemedText>
                  </View>
                ) : null}

                <Pressable
                  onPress={handleSubmit}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: theme.tint, opacity: pressed || submitting ? 0.85 : 1 },
                  ]}
                  accessibilityRole="button">
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.buttonText}>Sign In</ThemedText>
                  )}
                </Pressable>

                {biometricEnabled ? (
                  <Pressable
                    onPress={() => handleBiometric()}
                    disabled={bioBusy}
                    style={({ pressed }) => [
                      styles.bioButton,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.background,
                        opacity: pressed || bioBusy ? 0.7 : 1,
                      },
                    ]}
                    accessibilityRole="button">
                    <Ionicons name="finger-print" size={20} color={theme.tint} />
                    <ThemedText type="smallBold" style={{ color: theme.tint }}>
                      {bioBusy
                        ? 'Authenticating…'
                        : `Sign in with ${bioLabel(biometricKind)}`}
                    </ThemedText>
                  </Pressable>
                ) : null}

                <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                  First time? Your password is your phone number — you&apos;ll set a new one after signing in.
                </ThemedText>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  card: {
    width: '100%',
    gap: Spacing.four,
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
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  errorText: {
    color: '#DC2626',
    flex: 1,
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
  hint: {
    textAlign: 'center',
  },
  bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 52,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
