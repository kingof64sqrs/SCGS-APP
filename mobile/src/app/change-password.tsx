import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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

import { api } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

const LOGO = require('@/assets/images/scgs-logo.png');
const CARD_MAX_WIDTH = 420;
const MIN_LENGTH = 6;

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { token, user, markPasswordChanged, signOut } = useAuth();
  const { width } = useWindowDimensions();

  // mustChangePassword=true → forced flow (just new+confirm).
  // mustChangePassword=false → voluntary (need current password too).
  const forced = !!user?.mustChangePassword;

  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isWide = width >= 600;
  const logoSize = Math.round(Math.min(110, Math.max(86, width * 0.26)));

  const handleSubmit = async () => {
    if (submitting) return;
    if (!forced && !current) {
      setError('Please enter your current password.');
      return;
    }
    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.changePassword(
        token,
        forced ? { password } : { password, currentPassword: current },
      );
      await markPasswordChanged();
      if (forced) {
        // Root navigator moves us into the app group automatically.
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/profile');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change password.');
    } finally {
      setSubmitting(false);
    }
  };

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
                  {forced ? 'Set Your Password' : 'Change Password'}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.centerText}>
                  {forced
                    ? user
                      ? `Welcome, ${user.name}. Please choose a new password to continue.`
                      : 'Please choose a new password to continue.'
                    : 'Enter your current password and choose a new one.'}
                </ThemedText>
              </View>

              <View style={styles.form}>
                {!forced && (
                  <View
                    style={[
                      styles.inputWrapper,
                      { backgroundColor: theme.background, borderColor: theme.border },
                    ]}>
                    <Ionicons name="lock-closed-outline" size={20} color={theme.icon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Current password"
                      placeholderTextColor={theme.textSecondary}
                      value={current}
                      onChangeText={setCurrent}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!submitting}
                      autoFocus
                    />
                  </View>
                )}

                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}>
                  <Ionicons name="key-outline" size={20} color={theme.icon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="New password"
                    placeholderTextColor={theme.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!submitting}
                    autoFocus={forced}
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

                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}>
                  <Ionicons name="checkmark-outline" size={20} color={theme.icon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Confirm new password"
                    placeholderTextColor={theme.textSecondary}
                    value={confirm}
                    onChangeText={setConfirm}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!submitting}
                    onSubmitEditing={handleSubmit}
                    returnKeyType="go"
                  />
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
                    <ThemedText style={styles.buttonText}>
                      {forced ? 'Set Password & Continue' : 'Update Password'}
                    </ThemedText>
                  )}
                </Pressable>

                {forced ? (
                  <Pressable onPress={signOut} hitSlop={6} style={styles.signOutBtn}>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                      Not you?{' '}
                      <ThemedText type="small" style={{ color: theme.tint }}>
                        Sign out
                      </ThemedText>
                    </ThemedText>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
                    hitSlop={6}
                    style={styles.signOutBtn}>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                      Cancel
                    </ThemedText>
                  </Pressable>
                )}
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
  card: { width: '100%', gap: Spacing.four },
  header: { alignItems: 'center', gap: Spacing.two },
  centerText: { textAlign: 'center' },
  form: { gap: Spacing.three },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    height: 52,
  },
  input: { flex: 1, fontSize: 16, height: '100%' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  errorText: { color: '#DC2626', flex: 1 },
  button: {
    height: 52,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  signOutBtn: { alignSelf: 'center', marginTop: Spacing.two },
});
