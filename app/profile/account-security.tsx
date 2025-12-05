import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

export default function AccountSecurityScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { user, reloadUser } = useAuth();
    const [changingPassword, setChangingPassword] = useState(false);

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleChangePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            Alert.alert('Error', 'Please fill in all password fields');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        setChangingPassword(true);
        try {
            // Update password using Supabase Auth
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword,
            });

            if (error) {
                throw error;
            }

            Alert.alert('Success', 'Password changed successfully');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error: any) {
            console.error('Error changing password:', error);
            Alert.alert('Error', error.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
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
                        Account Security
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Email Verification Status */}
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
                        Email Verification
                    </Text>

                    <View
                        style={[
                            styles.settingItem,
                            {
                                borderBottomColor: theme.colors.border,
                                borderBottomWidth: 1,
                                paddingBottom: theme.spacing.base,
                            },
                        ]}
                    >
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                                <Ionicons
                                    name={user?.email_verified ? "checkmark-circle" : "close-circle"}
                                    size={24}
                                    color={user?.email_verified ? theme.colors.success : theme.colors.error}
                                    style={{ marginRight: theme.spacing.sm }}
                                />
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
                                    {user?.email_verified ? 'Email Verified' : 'Email Not Verified'}
                                </Text>
                            </View>
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
                                {user?.email || 'No email'}
                            </Text>
                            {!user?.email_verified && (
                                <Text
                                    style={[
                                        styles.helperText,
                                        {
                                            fontSize: theme.typography.fontSize.xs,
                                            color: theme.colors.error,
                                            marginTop: theme.spacing.sm,
                                        },
                                    ]}
                                >
                                    Please verify your email address for account security. This is required for App Store compliance.
                                </Text>
                            )}
                        </View>
                    </View>
                </Card>

                {/* Change Password Section */}
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
                        Change Password
                    </Text>

                    <View style={styles.inputGroup}>
                        <Text
                            style={[
                                styles.label,
                                {
                                    fontSize: theme.typography.fontSize.sm,
                                    fontWeight: theme.typography.fontWeight.medium,
                                    color: theme.colors.textSecondary,
                                    marginBottom: theme.spacing.xs,
                                },
                            ]}
                        >
                            Current Password
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    color: theme.colors.text,
                                    fontSize: theme.typography.fontSize.base,
                                    borderBottomColor: theme.colors.border,
                                    paddingBottom: theme.spacing.sm,
                                    paddingTop: theme.spacing.sm,
                                },
                            ]}
                            placeholder="Enter current password"
                            placeholderTextColor={theme.colors.textTertiary}
                            value={passwordData.currentPassword}
                            onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text
                            style={[
                                styles.label,
                                {
                                    fontSize: theme.typography.fontSize.sm,
                                    fontWeight: theme.typography.fontWeight.medium,
                                    color: theme.colors.textSecondary,
                                    marginBottom: theme.spacing.xs,
                                },
                            ]}
                        >
                            New Password
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    color: theme.colors.text,
                                    fontSize: theme.typography.fontSize.base,
                                    borderBottomColor: theme.colors.border,
                                    paddingBottom: theme.spacing.sm,
                                    paddingTop: theme.spacing.sm,
                                },
                            ]}
                            placeholder="Enter new password"
                            placeholderTextColor={theme.colors.textTertiary}
                            value={passwordData.newPassword}
                            onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                            secureTextEntry
                        />
                        <Text
                            style={[
                                styles.helperText,
                                {
                                    fontSize: theme.typography.fontSize.xs,
                                    color: theme.colors.textTertiary,
                                    marginTop: theme.spacing.xs,
                                },
                            ]}
                        >
                            Password must be at least 6 characters long
                        </Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text
                            style={[
                                styles.label,
                                {
                                    fontSize: theme.typography.fontSize.sm,
                                    fontWeight: theme.typography.fontWeight.medium,
                                    color: theme.colors.textSecondary,
                                    marginBottom: theme.spacing.xs,
                                },
                            ]}
                        >
                            Confirm New Password
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    color: theme.colors.text,
                                    fontSize: theme.typography.fontSize.base,
                                    borderBottomColor: theme.colors.border,
                                    paddingBottom: theme.spacing.sm,
                                    paddingTop: theme.spacing.sm,
                                },
                            ]}
                            placeholder="Confirm new password"
                            placeholderTextColor={theme.colors.textTertiary}
                            value={passwordData.confirmPassword}
                            onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                            secureTextEntry
                        />
                    </View>

                    <PrimaryButton
                        title={changingPassword ? 'Changing...' : 'Change Password'}
                        onPress={handleChangePassword}
                        loading={changingPassword}
                        disabled={changingPassword}
                        style={{ marginTop: theme.spacing.base }}
                    />
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
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        marginBottom: 4,
    },
    input: {
        borderBottomWidth: 1,
        paddingVertical: 12,
    },
    helperText: {
        marginTop: 4,
    },
});

