import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
// Type only (erased at runtime) — SDK 56 expo-router vendors its own navigation fork.
import type { DrawerContentComponentProps } from 'expo-router/build/react-navigation/drawer';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useThemeMode, type ThemeMode } from '@/context/theme-context';
import { useTheme } from '@/hooks/use-theme';

const LOGO = require('@/assets/images/scgs-logo.png');

type NavItem = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  { name: 'home', label: 'Home', icon: 'home-outline' },
  { name: 'members', label: 'Member Directory', icon: 'people-outline' },
  { name: 'governing-body', label: 'Governing Body', icon: 'ribbon-outline' },
  { name: 'about', label: 'About Us', icon: 'information-circle-outline' },
  { name: 'facilities', label: 'Facilities', icon: 'business-outline' },
  { name: 'contact', label: 'Contact Us', icon: 'call-outline' },
];

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  { mode: 'system', label: 'Auto', icon: 'phone-portrait-outline' },
];

export function Sidebar(props: DrawerContentComponentProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { mode, setMode } = useThemeMode();

  const activeRoute = props.state.routes[props.state.index]?.name;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}>
        {/* Brand header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Image source={LOGO} style={styles.logo} contentFit="contain" />
          <ThemedText type="smallBold" style={styles.brand}>
            Shree Coimbatore{'\n'}Gujarati Samaj
          </ThemedText>
          {user ? (
            <View style={[styles.userChip, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="person-circle-outline" size={18} color={theme.tint} />
              <ThemedText type="small" numberOfLines={1} style={styles.userName}>
                {user.name}
              </ThemedText>
            </View>
          ) : null}
        </View>

        {/* Navigation */}
        <View style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = item.name === activeRoute;
            return (
              <Pressable
                key={item.name}
                onPress={() => props.navigation.navigate(item.name)}
                style={[styles.navItem, active && { backgroundColor: theme.backgroundElement }]}>
                <Ionicons name={item.icon} size={20} color={active ? theme.tint : theme.icon} />
                <ThemedText
                  type={active ? 'smallBold' : 'small'}
                  style={{ color: active ? theme.tint : theme.text }}>
                  {item.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer: theme switch + logout */}
      <View style={[styles.footer, { borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.three }]}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.footerLabel}>
          Appearance
        </ThemedText>
        <View style={[styles.themeRow, { backgroundColor: theme.backgroundElement }]}>
          {THEME_OPTIONS.map((opt) => {
            const active = mode === opt.mode;
            return (
              <Pressable
                key={opt.mode}
                onPress={() => setMode(opt.mode)}
                style={[styles.themeBtn, active && { backgroundColor: theme.tint }]}>
                <Ionicons name={opt.icon} size={16} color={active ? '#fff' : theme.icon} />
                <ThemedText type="small" style={{ color: active ? '#fff' : theme.textSecondary }}>
                  {opt.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={signOut}
          style={({ pressed }) => [styles.logout, { opacity: pressed ? 0.7 : 1 }]}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <ThemedText type="smallBold" style={{ color: '#DC2626' }}>
            Log Out
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: Spacing.three },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logo: { width: 72, height: 72 },
  brand: { textAlign: 'center' },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
    maxWidth: '100%',
    marginTop: Spacing.one,
  },
  userName: { flexShrink: 1 },
  nav: {
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.three,
    gap: Spacing.half,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  footerLabel: { marginLeft: Spacing.one },
  themeRow: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
