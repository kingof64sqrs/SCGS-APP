import { Drawer } from 'expo-router/drawer';

import { Sidebar } from '@/components/sidebar';
import { useTheme } from '@/hooks/use-theme';

export default function AppLayout() {
  const theme = useTheme();
  return (
    <Drawer
      drawerContent={(props) => <Sidebar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        drawerStyle: { backgroundColor: theme.background, width: 300 },
        drawerType: 'front',
      }}>
      <Drawer.Screen name="home" options={{ title: 'Home' }} />
      <Drawer.Screen name="members" options={{ title: 'Member Directory' }} />
      <Drawer.Screen name="governing-body" options={{ title: 'Governing Body' }} />
      <Drawer.Screen name="about" options={{ title: 'About Us' }} />
      <Drawer.Screen name="facilities" options={{ title: 'Facilities' }} />
      <Drawer.Screen name="contact" options={{ title: 'Contact Us' }} />
      <Drawer.Screen name="profile" options={{ title: 'Profile' }} />
    </Drawer>
  );
}
