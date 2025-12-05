import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to signin if not authenticated
      router.replace('/(auth)/signin');
    } else if (user && inAuthGroup) {
      // Redirect authenticated users away from auth screens
      router.replace('/(tabs)/home');
    }
  }, [user, segments, isLoading]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Routes are auto-discovered by Expo Router */}
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
