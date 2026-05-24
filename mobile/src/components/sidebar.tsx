import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
// Type only (erased at runtime) — SDK 56 expo-router vendors its own navigation fork.
import type { DrawerContentComponentProps } from 'expo-router/build/react-navigation/drawer';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
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
  { name: 'profile', label: 'Profile', icon: 'person-outline' },
];

export function Sidebar(props: DrawerContentComponentProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

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
        </View>

        {/* Tappable user card -> profile */}
        {user ? (
          <Pressable
            onPress={() => props.navigation.navigate('profile')}
            style={({ pressed }) => [
              styles.userCard,
              { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}>
            <Avatar name={user.name} size={40} />
            <View style={styles.userText}>
              <ThemedText type="small" numberOfLines={1} style={styles.userName}>
                {user.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {user.samajId}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.icon} />
          </Pressable>
        ) : null}

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

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.three }]}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.footerText}>
          Charity &amp; Service · Coimbatore
        </ThemedText>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginHorizontal: Spacing.two,
    marginTop: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.three,
  },
  userText: { flex: 1, gap: 1 },
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
  },
  footerText: { textAlign: 'center' },
});
