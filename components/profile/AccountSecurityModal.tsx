import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { supabase } from '@/lib/supabase';

interface AccountSecurityModalProps {
    visible: boolean;
    onClose: () => void;
}

export function AccountSecurityModal({ visible, onClose }: AccountSecurityModalProps) {
    const theme = useTheme();
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

            Alert.alert('Success', 'Password updated successfully', [
                {
                    text: 'OK',
                    onPress: () => {
                        setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                        });
                        onClose();
                    },
                },
            ]);
        } catch (error: any) {
            console.error('Error changing password:', error);
            Alert.alert('Error', error.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.modalContent,
                        {
                            backgroundColor: theme.colors.background,
                            borderTopLeftRadius: theme.borderRadius?.xl || 20,
                            borderTopRightRadius: theme.borderRadius?.xl || 20,
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text
                            style={[
                                styles.modalTitle,
                                {
                                    fontSize: theme.typography?.heading1?.fontSize || 24,
                                    fontWeight: theme.typography?.heading1?.fontWeight || 'bold',
                                    color: theme.colors.text,
                                },
                            ]}
                        >
                            Account Security
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[
                                styles.closeButton,
                                {
                                    backgroundColor: theme.colors.surfaceMuted,
                                    borderRadius: theme.borderRadius?.full || 20,
                                    width: 32,
                                    height: 32,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                },
                            ]}
                        >
                            <Ionicons name="close" size={20} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={[
                            styles.content,
                            {
                                paddingHorizontal: theme.spacing?.screenPaddingHorizontal || 20,
                                paddingBottom: theme.spacing?.['2xl'] || 40,
                            },
                        ]}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Email Verification Status */}
                        <View
                            style={[
                                styles.section,
                                {
                                    backgroundColor: theme.colors.surface,
                                    borderRadius: theme.borderRadius?.base || 12,
                                    padding: theme.spacing?.base || 16,
                                    marginBottom: theme.spacing?.base || 16,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.sectionTitle,
                                    {
                                        fontSize: theme.typography?.heading2?.fontSize || 20,
                                        fontWeight: theme.typography?.heading2?.fontWeight || '600',
                                        color: theme.colors.text,
                                        marginBottom: theme.spacing?.base || 16,
                                    },
                                ]}
                            >
                                Email Verification
                            </Text>

                            <View style={styles.verificationRow}>
                                <View style={styles.verificationInfo}>
                                    <Text
                                        style={[
                                            styles.emailText,
                                            {
                                                fontSize: theme.typography?.fontSize?.base || 16,
                                                color: theme.colors.text,
                                                marginBottom: theme.spacing?.xs || 4,
                                            },
                                        ]}
                                    >
                                        {user?.email}
                                    </Text>
                                    <View style={styles.verificationStatus}>
                                        <Ionicons
                                            name={user?.email_verified ? "checkmark-circle" : "close-circle"}
                                            size={16}
                                            color={user?.email_verified ? theme.colors.success : theme.colors.error}
                                            style={{ marginRight: theme.spacing?.xs || 4 }}
                                        />
                                        <Text
                                            style={[
                                                styles.verificationText,
                                                {
                                                    fontSize: theme.typography?.fontSize?.sm || 14,
                                                    color: user?.email_verified ? theme.colors.success : theme.colors.error,
                                                },
                                            ]}
                                        >
                                            {user?.email_verified ? 'Verified' : 'Not Verified'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Change Password Section */}
                        <View
                            style={[
                                styles.section,
                                {
                                    backgroundColor: theme.colors.surface,
                                    borderRadius: theme.borderRadius?.base || 12,
                                    padding: theme.spacing?.base || 16,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.sectionTitle,
                                    {
                                        fontSize: theme.typography?.heading2?.fontSize || 20,
                                        fontWeight: theme.typography?.heading2?.fontWeight || '600',
                                        color: theme.colors.text,
                                        marginBottom: theme.spacing?.base || 16,
                                    },
                                ]}
                            >
                                Change Password
                            </Text>

                            <Input
                                label="Current Password"
                                placeholder="Enter current password"
                                value={passwordData.currentPassword}
                                onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                                secureTextEntry
                                containerStyle={{ marginBottom: theme.spacing?.base || 16 }}
                            />

                            <Input
                                label="New Password"
                                placeholder="Enter new password"
                                value={passwordData.newPassword}
                                onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                                secureTextEntry
                                containerStyle={{ marginBottom: theme.spacing?.base || 16 }}
                            />

                            <Input
                                label="Confirm New Password"
                                placeholder="Confirm new password"
                                value={passwordData.confirmPassword}
                                onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                                secureTextEntry
                                containerStyle={{ marginBottom: theme.spacing?.base || 16 }}
                            />

                            <PrimaryButton
                                title={changingPassword ? 'Changing Password...' : 'Change Password'}
                                onPress={handleChangePassword}
                                loading={changingPassword}
                                disabled={changingPassword}
                            />
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        width: '100%',
        height: '90%',
        paddingTop: 20,
        flexDirection: 'column',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    modalTitle: {
        flex: 1,
        textAlign: 'center',
    },
    closeButton: {
        // Styles applied via theme
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingTop: 20,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        marginBottom: 16,
    },
    verificationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    verificationInfo: {
        flex: 1,
    },
    emailText: {
        marginBottom: 4,
    },
    verificationStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    verificationText: {
        // Styles applied via theme
    },
});

