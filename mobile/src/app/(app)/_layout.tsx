import { Drawer } from 'expo-router/drawer';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { NotificationsBell } from '@/components/notifications-bell';
import { Sidebar } from '@/components/sidebar';
import { useTheme } from '@/hooks/use-theme';

export default function AppLayout() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  // Laptop/desktop: pin the sidebar permanently and drop the hamburger;
  // phones/tablets keep the slide-over drawer.
  const isWide = width >= 1024;

  return (
    <Drawer
      drawerContent={(props) => <Sidebar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        drawerStyle: {
          backgroundColor: theme.background,
          width: 300,
          borderRightWidth: isWide ? StyleSheet.hairlineWidth : 0,
          borderRightColor: theme.border,
        },
        drawerType: isWide ? 'permanent' : 'front',
        ...(isWide ? { headerLeft: () => null } : {}),
        headerRight: () => <NotificationsBell />,
      }}>
      <Drawer.Screen name="home" options={{ title: 'Home' }} />
      <Drawer.Screen name="members" options={{ title: 'Member Directory' }} />
      <Drawer.Screen name="governing-body" options={{ title: 'Governing Body' }} />
      <Drawer.Screen name="events" options={{ title: 'Events' }} />
      <Drawer.Screen name="notifications" options={{ title: 'Notifications', headerRight: () => null }} />
      <Drawer.Screen name="rulebook" options={{ title: 'Rule Book' }} />
      <Drawer.Screen name="about" options={{ title: 'About Us' }} />
      <Drawer.Screen name="facilities" options={{ title: 'Facilities' }} />
      <Drawer.Screen name="contact" options={{ title: 'Contact Us' }} />
      <Drawer.Screen name="profile" options={{ title: 'Profile' }} />
      <Drawer.Screen name="edit-profile" options={{ title: 'Edit Profile' }} />
    </Drawer>
  );
}
