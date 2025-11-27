/**
 * Example: How to use the global theme in your components
 * 
 * 1. Import the useTheme hook
 * 2. Call useTheme() to get the theme object
 * 3. Use theme values in your styles
 */

import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export function ExampleComponent() {
  const theme = useTheme();
  
  // Option 1: Create styles function that uses theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.xl,
    },
    title: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.base,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.base,
      padding: theme.spacing.base,
    },
    buttonText: {
      color: theme.colors.textInverse,
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Example Component</Text>
      <View style={styles.card}>
        <Text style={{ color: theme.colors.textSecondary }}>
          This card uses theme colors
        </Text>
      </View>
    </View>
  );
}

/**
 * Option 2: For components that need dynamic theme access,
 * you can also use inline styles with theme values
 */
export function InlineThemeExample() {
  const theme = useTheme();
  
  return (
    <View style={{
      backgroundColor: theme.colors.background,
      padding: theme.spacing.xl,
    }}>
      <Text style={{
        color: theme.colors.text,
        fontSize: theme.typography.fontSize.lg,
      }}>
        Inline styles with theme
      </Text>
    </View>
  );
}

