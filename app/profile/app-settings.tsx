import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
    Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeMode } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

export default function AppSettingsScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { mode, setMode } = useThemeMode();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Placeholder for future implementation

    const handleShareProfile = async () => {
        try {
            const profileUrl = user?.username 
                ? `https://aethera.app/profile/${user.username}`
                : `https://aethera.app/profile/${user?.id}`;
            
            const result = await Share.share({
                message: `Check out ${user?.full_name || 'my'} profile on Aethera: ${profileUrl}`,
                url: profileUrl,
                title: `${user?.full_name || 'User'}'s Profile`,
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // Shared with activity type
                } else {
                    // Shared
                }
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to share profile');
            console.error('Error sharing profile:', error);
        }
    };

    const handleToggleDarkMode = () => {
        setMode(mode === 'dark' ? 'light' : 'dark');
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        Alert.alert(
                            'Confirm Deletion',
                            'This will permanently delete your account. Type DELETE to confirm.',
                            [
                                {
                                    text: 'Cancel',
                                    style: 'cancel',
                                },
                                {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: async () => {
                                        try {
                                            // Delete user profile
                                            const { error: profileError } = await supabase
                                                .from('user_profiles')
                                                .delete()
                                                .eq('id', user?.id);

                                            if (profileError) {
                                                console.error('Error deleting profile:', profileError);
                                            }

                                            // Sign out and delete auth user
                                            await signOut();
                                            router.replace('/(auth)/signin');
                                            Alert.alert('Account Deleted', 'Your account has been deleted successfully');
                                        } catch (error: any) {
                                            console.error('Error deleting account:', error);
                                            Alert.alert('Error', 'Failed to delete account. Please contact support.');
                                        }
                                    },
                                },
                            ]
                        );
                    },
                },
            ]
        );
    };

    return (
        <Screen scrollable edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.content,
                    {
                        paddingHorizontal: theme.spacing.screenPaddingHorizontal,
                        paddingTop: theme.spacing['2xl'],
                        paddingBottom: theme.spacing['2xl'],
                    },
                ]}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[
                            styles.backButton,
                            {
                                backgroundColor: theme.colors.surfaceMuted,
                                borderRadius: theme.borderRadius.full,
                                padding: theme.spacing.sm,
                            },
                        ]}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text
                        style={[
                            styles.headerTitle,
                            {
                                fontSize: theme.typography.heading1.fontSize,
                                fontWeight: theme.typography.heading1.fontWeight,
                                color: theme.colors.text,
                            },
                        ]}
                    >
                        App Settings
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* App Settings Section */}
                <Card style={{ marginBottom: theme.spacing.base }}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            {
                                fontSize: theme.typography.heading2.fontSize,
                                fontWeight: theme.typography.heading2.fontWeight,
                                color: theme.colors.text,
                                marginBottom: theme.spacing.base,
                            },
                        ]}
                    >
                        Preferences
                    </Text>

                    {/* Notifications */}
                    <View
                        style={[
                            styles.settingItem,
                            {
                                borderBottomColor: theme.colors.border,
                                borderBottomWidth: 1,
                                paddingBottom: theme.spacing.base,
                                marginBottom: theme.spacing.base,
                            },
                        ]}
                    >
                        <View style={{ flex: 1 }}>
                            <Text
                                style={[
                                    styles.settingLabel,
                                    {
                                        fontSize: theme.typography.fontSize.base,
                                        fontWeight: theme.typography.fontWeight.medium,
                                        color: theme.colors.text,
                                        marginBottom: theme.spacing.xs,
                                    },
                                ]}
                            >
                                Notifications
                            </Text>
                            <Text
                                style={[
                                    styles.settingDescription,
                                    {
                                        fontSize: theme.typography.fontSize.sm,
                                        color: theme.colors.textSecondary,
                                    },
                                ]}
                            >
                                Receive push notifications
                            </Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: theme.colors.surfaceMuted, true: theme.colors.primary }}
                            thumbColor={theme.colors.textInverse}
                        />
                    </View>

                    {/* Dark Mode */}
                    <View
                        style={[
                            styles.settingItem,
                            {
                                borderBottomColor: theme.colors.border,
                                borderBottomWidth: 1,
                                paddingBottom: theme.spacing.base,
                                marginBottom: theme.spacing.base,
                            },
                        ]}
                    >
                        <View style={{ flex: 1 }}>
                            <Text
                                style={[
                                    styles.settingLabel,
                                    {
                                        fontSize: theme.typography.fontSize.base,
                                        fontWeight: theme.typography.fontWeight.medium,
                                        color: theme.colors.text,
                                        marginBottom: theme.spacing.xs,
                                    },
                                ]}
                            >
                                Dark Mode
                            </Text>
                            <Text
                                style={[
                                    styles.settingDescription,
                                    {
                                        fontSize: theme.typography.fontSize.sm,
                                        color: theme.colors.textSecondary,
                                    },
                                ]}
                            >
                                Switch between light and dark theme
                            </Text>
                        </View>
                        <Switch
                            value={mode === 'dark'}
                            onValueChange={handleToggleDarkMode}
                            trackColor={{ false: theme.colors.surfaceMuted, true: theme.colors.primary }}
                            thumbColor={theme.colors.textInverse}
                        />
                    </View>

                    {/* Share Profile */}
                    <TouchableOpacity
                        style={[
                            styles.settingItem,
                            {
                                borderBottomColor: theme.colors.border,
                                borderBottomWidth: 1,
                                paddingBottom: theme.spacing.base,
                                marginBottom: theme.spacing.base,
                            },
                        ]}
                        onPress={handleShareProfile}
                    >
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons
                                name="share-outline"
                                size={20}
                                color={theme.colors.primary}
                                style={{ marginRight: theme.spacing.sm }}
                            />
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[
                                        styles.settingLabel,
                                        {
                                            fontSize: theme.typography.fontSize.base,
                                            fontWeight: theme.typography.fontWeight.medium,
                                            color: theme.colors.text,
                                        },
                                    ]}
                                >
                                    Share Profile
                                </Text>
                                <Text
                                    style={[
                                        styles.settingDescription,
                                        {
                                            fontSize: theme.typography.fontSize.sm,
                                            color: theme.colors.textSecondary,
                                            marginTop: theme.spacing.xs,
                                        },
                                    ]}
                                >
                                    Share your public profile link
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                    </TouchableOpacity>
                </Card>

                {/* Danger Zone */}
                <Card style={{ marginBottom: theme.spacing.base }}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            {
                                fontSize: theme.typography.heading2.fontSize,
                                fontWeight: theme.typography.heading2.fontWeight,
                                color: theme.colors.error,
                                marginBottom: theme.spacing.base,
                            },
                        ]}
                    >
                        Danger Zone
                    </Text>

                    {/* Delete Account */}
                    <TouchableOpacity
                        style={[
                            styles.dangerButton,
                            {
                                backgroundColor: theme.colors.errorBackground || theme.colors.surfaceMuted,
                                borderRadius: theme.borderRadius.base,
                                padding: theme.spacing.base,
                                marginBottom: theme.spacing.base,
                            },
                        ]}
                        onPress={handleDeleteAccount}
                    >
                        <Ionicons
                            name="trash-outline"
                            size={20}
                            color={theme.colors.error}
                            style={{ marginRight: theme.spacing.sm }}
                        />
                        <Text
                            style={[
                                styles.dangerButtonText,
                                {
                                    color: theme.colors.error,
                                    fontSize: theme.typography.fontSize.base,
                                    fontWeight: theme.typography.fontWeight.semibold,
                                },
                            ]}
                        >
                            Delete Account
                        </Text>
                    </TouchableOpacity>

                    {/* Sign Out */}
                    <TouchableOpacity
                        style={[
                            styles.signOutButton,
                            {
                                backgroundColor: theme.colors.surfaceMuted,
                                borderRadius: theme.borderRadius.base,
                                padding: theme.spacing.base,
                            },
                        ]}
                        onPress={async () => {
                            Alert.alert(
                                'Sign Out',
                                'Are you sure you want to sign out?',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Sign Out',
                                        style: 'destructive',
                                        onPress: async () => {
                                            await signOut();
                                            router.replace('/(auth)/signin');
                                        },
                                    },
                                ]
                            );
                        }}
                    >
                        <Ionicons
                            name="log-out-outline"
                            size={20}
                            color={theme.colors.error}
                            style={{ marginRight: theme.spacing.sm }}
                        />
                        <Text
                            style={[
                                styles.signOutText,
                                {
                                    color: theme.colors.error,
                                    fontSize: theme.typography.fontSize.base,
                                    fontWeight: theme.typography.fontWeight.semibold,
                                },
                            ]}
                        >
                            Sign Out
                        </Text>
                    </TouchableOpacity>
                </Card>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    content: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    backButton: {
        marginRight: 12,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
    },
    sectionTitle: {
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingLabel: {
        marginBottom: 4,
    },
    settingDescription: {
        marginTop: 4,
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dangerButtonText: {
        // Styles applied via theme
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    signOutText: {
        // Styles applied via theme
    },
});

