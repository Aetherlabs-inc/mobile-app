import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';

export default function SettingsScreen() {
    const theme = useTheme();
    const router = useRouter();

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
                        Settings
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Settings Navigation */}
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
                        Settings
                    </Text>

                    {/* Edit Profile */}
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
                        onPress={() => router.push('/profile/edit')}
                    >
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons
                                name="create-outline"
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
                                    Edit Profile
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
                                    Update your profile information, photo, and contact details
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                    </TouchableOpacity>

                    {/* Account Security */}
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
                        onPress={() => router.push('/profile/account-security')}
                    >
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons
                                name="shield-checkmark-outline"
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
                                    Account Security
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
                                    Change password and view email verification status
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                    </TouchableOpacity>

                    {/* App Settings */}
                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => router.push('/profile/app-settings')}
                    >
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons
                                name="settings-outline"
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
                                    App Settings
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
                                    Notifications, dark mode, and account actions
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
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
});
