import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMemo } from 'react';

export default function TabsLayout() {
  const theme = useTheme();

  const screenOptions = useMemo(() => ({
    tabBarActiveTintColor: theme?.colors?.primary || '#007AFF',
    tabBarInactiveTintColor: theme?.colors?.textSecondary || '#666',
    tabBarStyle: {
      backgroundColor: theme?.colors?.tabBarBackground || '#fff',
      borderTopColor: theme?.colors?.border || '#e0e0e0',
    },
    headerShown: false,
  }), [theme]);

  return (
    <Tabs
      screenOptions={screenOptions}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="scan"
              size={focused ? size + 2 : size}
              color={focused ? theme?.colors?.primary : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="artworks"
        options={{
          title: 'Artworks',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          href: null, // Hide from bottom navigation
        }}
      />
    </Tabs>
  );
}


