import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeMode } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ShareProfileModal } from './ShareProfileModal';
import { getProfileShareUrl, ensureUserSlug } from '@/lib/profile';

interface AppSettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export function AppSettingsModal({ visible, onClose }: AppSettingsModalProps) {
    const theme = useTheme();
    const { user, signOut } = useAuth();
    const { mode, setMode } = useThemeMode();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [profileUrl, setProfileUrl] = useState<string | null>(null);

    const handleShareProfile = async () => {
        if (!user) {
            Alert.alert('Error', 'Profile not available');
            return;
        }

        try {
            await ensureUserSlug(user);
            const url = await getProfileShareUrl(user);
            setProfileUrl(url);
            setShowShareModal(true);
        } catch (error: any) {
            console.error('Error preparing profile share:', error);
            Alert.alert('Error', 'Failed to prepare profile share. Please try again.');
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
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
                            // Delete user account from Supabase
                            const { error } = await supabase.auth.admin.deleteUser(user?.id || '');
                            
                            if (error) {
                                throw error;
                            }

                            Alert.alert('Success', 'Account deleted successfully');
                            signOut();
                            onClose();
                        } catch (error: any) {
                            console.error('Error deleting account:', error);
                            Alert.alert('Error', error.message || 'Failed to delete account');
                        }
                    },
                },
            ]
        );
    };

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        onClose();
                    },
                },
            ]
        );
    };

    return (
        <>
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
                                App Settings
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
                            {/* Notifications */}
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
                                    Notifications
                                </Text>

                                <View
                                    style={[
                                        styles.settingItem,
                                        {
                                            borderBottomColor: theme.colors.border,
                                            borderBottomWidth: 1,
                                            paddingBottom: theme.spacing?.base || 16,
                                        },
                                    ]}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[
                                                styles.settingLabel,
                                                {
                                                    fontSize: theme.typography?.fontSize?.base || 16,
                                                    fontWeight: theme.typography?.fontWeight?.medium || '500',
                                                    color: theme.colors.text,
                                                    marginBottom: theme.spacing?.xs || 4,
                                                },
                                            ]}
                                        >
                                            Enable Notifications
                                        </Text>
                                        <Text
                                            style={[
                                                styles.settingDescription,
                                                {
                                                    fontSize: theme.typography?.fontSize?.sm || 14,
                                                    color: theme.colors.textSecondary,
                                                },
                                            ]}
                                        >
                                            Receive notifications about your artworks and certificates
                                        </Text>
                                    </View>
                                    <Switch
                                        value={notificationsEnabled}
                                        onValueChange={setNotificationsEnabled}
                                        trackColor={{ false: theme.colors.surfaceMuted, true: theme.colors.primary }}
                                        thumbColor={theme.colors.textInverse}
                                    />
                                </View>
                            </View>

                            {/* Appearance */}
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
                                    Appearance
                                </Text>

                                <View style={styles.settingItem}>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[
                                                styles.settingLabel,
                                                {
                                                    fontSize: theme.typography?.fontSize?.base || 16,
                                                    fontWeight: theme.typography?.fontWeight?.medium || '500',
                                                    color: theme.colors.text,
                                                    marginBottom: theme.spacing?.xs || 4,
                                                },
                                            ]}
                                        >
                                            Dark Mode
                                        </Text>
                                        <Text
                                            style={[
                                                styles.settingDescription,
                                                {
                                                    fontSize: theme.typography?.fontSize?.sm || 14,
                                                    color: theme.colors.textSecondary,
                                                },
                                            ]}
                                        >
                                            Toggle dark mode theme
                                        </Text>
                                    </View>
                                    <Switch
                                        value={mode === 'dark'}
                                        onValueChange={(value) => setMode(value ? 'dark' : 'light')}
                                        trackColor={{ false: theme.colors.surfaceMuted, true: theme.colors.primary }}
                                        thumbColor={theme.colors.textInverse}
                                    />
                                </View>
                            </View>

                            {/* Share Profile */}
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    {
                                        backgroundColor: theme.colors.surface,
                                        borderRadius: theme.borderRadius?.base || 12,
                                        padding: theme.spacing?.base || 16,
                                        marginBottom: theme.spacing?.base || 16,
                                    },
                                ]}
                                onPress={handleShareProfile}
                            >
                                <View style={styles.actionButtonContent}>
                                    <Ionicons name="share-outline" size={22} color={theme.colors.text} />
                                    <Text
                                        style={[
                                            styles.actionButtonText,
                                            {
                                                fontSize: theme.typography?.fontSize?.base || 16,
                                                color: theme.colors.text,
                                                marginLeft: theme.spacing?.base || 16,
                                            },
                                        ]}
                                    >
                                        Share Profile
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>

                            {/* Delete Account */}
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    {
                                        backgroundColor: theme.colors.surface,
                                        borderRadius: theme.borderRadius?.base || 12,
                                        padding: theme.spacing?.base || 16,
                                        marginBottom: theme.spacing?.base || 16,
                                    },
                                ]}
                                onPress={handleDeleteAccount}
                            >
                                <View style={styles.actionButtonContent}>
                                    <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
                                    <Text
                                        style={[
                                            styles.actionButtonText,
                                            {
                                                fontSize: theme.typography?.fontSize?.base || 16,
                                                color: theme.colors.error,
                                                marginLeft: theme.spacing?.base || 16,
                                            },
                                        ]}
                                    >
                                        Delete Account
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>

                            {/* Sign Out */}
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    {
                                        backgroundColor: theme.colors.surface,
                                        borderRadius: theme.borderRadius?.base || 12,
                                        padding: theme.spacing?.base || 16,
                                    },
                                ]}
                                onPress={handleSignOut}
                            >
                                <View style={styles.actionButtonContent}>
                                    <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
                                    <Text
                                        style={[
                                            styles.actionButtonText,
                                            {
                                                fontSize: theme.typography?.fontSize?.base || 16,
                                                color: theme.colors.error,
                                                marginLeft: theme.spacing?.base || 16,
                                            },
                                        ]}
                                    >
                                        Sign Out
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Share Profile Modal */}
            {profileUrl && (
                <ShareProfileModal
                    visible={showShareModal}
                    url={profileUrl}
                    userName={user?.full_name}
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </>
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
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    actionButtonText: {
        // Styles applied via theme
    },
});

