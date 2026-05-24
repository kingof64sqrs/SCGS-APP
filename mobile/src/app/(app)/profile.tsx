import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { MemberPhoto } from '@/components/member-photo';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useThemeMode, type ThemeMode } from '@/context/theme-context';
import { useTheme } from '@/hooks/use-theme';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

function DetailRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.detailRow, !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.detailIcon, { backgroundColor: theme.backgroundSelected }]}>
        <Ionicons name={icon} size={18} color={theme.tint} />
      </View>
      <View style={styles.detailText}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="small">{value}</ThemedText>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { mode, setMode } = useThemeMode();

  if (!user) return null;

  return (
    <ScreenScroll>
      {/* Profile header */}
      <Card style={styles.headerCard}>
        <MemberPhoto samajId={user.samajId} name={user.name} size={84} />
        <ThemedText type="subtitle" style={styles.name}>
          {user.name}
        </ThemedText>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small" style={{ color: theme.tint }}>
              {user.samajId}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.tint }]}>
            <Ionicons name="water" size={13} color="#fff" />
            <ThemedText type="small" style={styles.bloodText}>
              {user.bloodGroup}
            </ThemedText>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/edit-profile')}
          style={({ pressed }) => [
            styles.editBtn,
            { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Ionicons name="create-outline" size={18} color={theme.tint} />
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            Edit Profile
          </ThemedText>
        </Pressable>
      </Card>

      {/* Details */}
      <ThemedText type="smallBold" style={styles.sectionTitle}>
        My Details
      </ThemedText>
      <Card style={styles.detailsCard}>
        <DetailRow icon="mail-outline" label="Email" value={user.email} />
        <DetailRow icon="call-outline" label="Phone" value={user.phone} />
        <DetailRow icon="location-outline" label="Address" value={user.address} last />
      </Card>

      {/* Appearance */}
      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Appearance
      </ThemedText>
      <Card style={styles.appearanceCard}>
        <ThemedText type="small" themeColor="textSecondary">
          Choose how the app looks.
        </ThemedText>
        <View style={[styles.themeRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
          {THEME_OPTIONS.map((opt) => {
            const active = mode === opt.mode;
            return (
              <Pressable
                key={opt.mode}
                onPress={() => setMode(opt.mode)}
                style={[styles.themeBtn, active && { backgroundColor: theme.tint }]}>
                <Ionicons name={opt.icon} size={18} color={active ? '#fff' : theme.icon} />
                <ThemedText
                  type="small"
                  style={{ color: active ? '#fff' : theme.textSecondary }}>
                  {opt.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Logout */}
      <Pressable
        onPress={signOut}
        style={({ pressed }) => [
          styles.logout,
          { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
        ]}>
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <ThemedText type="smallBold" style={{ color: '#DC2626' }}>
          Log Out
        </ThemedText>
      </Pressable>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  name: {
    textAlign: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  bloodText: {
    color: '#fff',
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  detailsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    flex: 1,
    gap: 2,
  },
  appearanceCard: {
    gap: Spacing.three,
  },
  themeRow: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    marginTop: Spacing.three,
  },
});
