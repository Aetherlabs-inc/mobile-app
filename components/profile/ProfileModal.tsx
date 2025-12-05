import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { getProfileShareUrl, ensureUserSlug } from '@/lib/profile';
import { ShareProfileModal } from './ShareProfileModal';

interface ProfileModalProps {
    visible: boolean;
    onClose: () => void;
}

export function ProfileModal({ visible, onClose }: ProfileModalProps) {
    const theme = useTheme();
    const { user, signOut, reloadUser } = useAuth();
    const router = useRouter();
    const [profileUrl, setProfileUrl] = useState<string | null>(null);
    const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [loading, setLoading] = useState(true);


    const loadProfileUrl = useCallback(async () => {
        if (!user) return;
        try {
            const url = await getProfileShareUrl(user);
            setProfileUrl(url);
        } catch (error) {
            console.error('Error loading profile URL:', error);
        }
    }, [user]);

    useEffect(() => {
        if (visible && user?.id) {
            setLoading(true);
            loadProfileUrl().finally(() => {
                setLoading(false);
            });
        }
    }, [visible, user?.id, loadProfileUrl]);


    const handleSignOut = async () => {
        await signOut();
        onClose();
        router.replace('/(auth)/signin');
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
                                Account
                            </Text>
                            <View style={{ flexDirection: 'row', gap: theme.spacing?.sm || 8 }}>

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
                        </View>

                        {loading ? (
                            <View style={[styles.loadingContainer, { flex: 1 }]}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            </View>
                        ) : (
                            <ScrollView
                                style={styles.scrollView}
                                contentContainerStyle={[
                                    styles.content,
                                    {
                                        paddingBottom: theme.spacing?.['2xl'] || 40,
                                    },
                                ]}
                                showsVerticalScrollIndicator={false}
                                nestedScrollEnabled={true}
                            >
                                {/* Profile Card */}
                                <TouchableOpacity onPress={() => {
                                    onClose();
                                    router.push('/profile');
                                }}>
                                    <View
                                        style={[
                                            styles.profileCard,
                                            {
                                                backgroundColor: theme.colors.surface,
                                                borderRadius: theme.borderRadius?.lg || 16,
                                                marginHorizontal: theme.spacing?.screenPaddingHorizontal || 20,
                                                marginTop: theme.spacing?.base || 16,
                                                marginBottom: theme.spacing?.lg || 24,
                                            },
                                        ]}
                                    >
                                        <View style={styles.profileHeader}>
                                            <View
                                                style={[
                                                    styles.avatarContainer,
                                                    {
                                                        borderRadius: theme.borderRadius?.full || 50,
                                                        overflow: 'hidden',
                                                    },
                                                ]}
                                            >
                                                {user?.avatar_url ? (
                                                    <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                                                ) : (
                                                    <View
                                                        style={[
                                                            styles.avatarPlaceholder,
                                                            {
                                                                backgroundColor: theme.colors.surfaceMuted,
                                                            },
                                                        ]}
                                                    >
                                                        <Ionicons name="person" size={40} color={theme.colors.textTertiary} />
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.profileInfo}>
                                                <Text
                                                    style={[
                                                        styles.fullName,
                                                        {
                                                            fontSize: theme.typography?.heading2?.fontSize || 20,
                                                            fontWeight: theme.typography?.heading2?.fontWeight || '600',
                                                            color: theme.colors.text,
                                                            marginBottom: theme.spacing?.xs || 4,
                                                        },
                                                    ]}
                                                >
                                                    {user?.full_name || 'No name'}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.email,
                                                        {
                                                            fontSize: theme.typography?.fontSize?.sm || 14,
                                                            color: theme.colors.textSecondary,
                                                        },
                                                    ]}
                                                >
                                                    {user?.email}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                {/* Account Options */}
                                <View style={{ paddingHorizontal: theme.spacing?.screenPaddingHorizontal || 20 }}>
                                    <Text
                                        style={[
                                            styles.sectionHeading,
                                            {
                                                fontSize: theme.typography?.fontSize?.xs || 12,
                                                color: theme.colors.textSecondary,
                                                marginBottom: theme.spacing?.sm || 12,
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.5,
                                            },
                                        ]}
                                    >
                                        ACCOUNT
                                    </Text>

                                    <TouchableOpacity
                                        style={[
                                            styles.menuItem,
                                            {
                                                backgroundColor: theme.colors.surface,
                                                borderRadius: theme.borderRadius?.lg || 16,
                                                marginBottom: theme.spacing?.xs || 4,
                                            },
                                        ]}
                                        onPress={() => {
                                            onClose();
                                            router.push('/profile/edit');
                                        }}
                                    >
                                        <View style={styles.menuItemLeft}>
                                            <Ionicons name="create-outline" size={22} color={theme.colors.text} />
                                            <Text
                                                style={[
                                                    styles.menuItemText,
                                                    {
                                                        fontSize: theme.typography?.fontSize?.base || 16,
                                                        color: theme.colors.text,
                                                        marginLeft: theme.spacing?.base || 16,
                                                    },
                                                ]}
                                            >
                                                Edit Profile
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.menuItem,
                                            {
                                                backgroundColor: theme.colors.surface,
                                                borderRadius: theme.borderRadius?.lg || 16,
                                                marginBottom: theme.spacing?.xs || 4,
                                            },
                                        ]}
                                        onPress={() => {
                                            onClose();
                                            router.push('/profile/account-security');
                                        }}
                                    >
                                        <View style={styles.menuItemLeft}>
                                            <Ionicons name="shield-outline" size={22} color={theme.colors.text} />
                                            <Text
                                                style={[
                                                    styles.menuItemText,
                                                    {
                                                        fontSize: theme.typography?.fontSize?.base || 16,
                                                        color: theme.colors.text,
                                                        marginLeft: theme.spacing?.base || 16,
                                                    },
                                                ]}
                                            >
                                                Account Security
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.menuItem,
                                            {
                                                backgroundColor: theme.colors.surface,
                                                borderRadius: theme.borderRadius?.lg || 16,
                                                marginBottom: theme.spacing?.xs || 4,
                                            },
                                        ]}
                                        onPress={() => {
                                            onClose();
                                            router.push('/profile/app-settings');
                                        }}
                                    >
                                        <View style={styles.menuItemLeft}>
                                            <Ionicons name="settings-outline" size={22} color={theme.colors.text} />
                                            <Text
                                                style={[
                                                    styles.menuItemText,
                                                    {
                                                        fontSize: theme.typography?.fontSize?.base || 16,
                                                        color: theme.colors.text,
                                                        marginLeft: theme.spacing?.base || 16,
                                                    },
                                                ]}
                                            >
                                                App Settings
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.menuItem,
                                            {
                                                backgroundColor: theme.colors.surface,
                                                borderRadius: theme.borderRadius?.base || 12,
                                                marginBottom: theme.spacing?.lg || 24,
                                            },
                                        ]}
                                        onPress={handleSignOut}
                                    >
                                        <View style={styles.menuItemLeft}>
                                            <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
                                            <Text
                                                style={[
                                                    styles.menuItemText,
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
                                </View>
                            </ScrollView>
                        )}
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

    },
    closeButton: {
        // Styles applied via theme
    },
    headerButton: {
        // Styles applied via theme
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
        paddingVertical: 40,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        paddingTop: 20,
    },
    profileCard: {
        padding: 16,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 60,
        height: 60,
        marginRight: 16,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    fullName: {
        marginBottom: 4,
    },
    email: {
        // Styles applied via theme
    },
    sectionHeading: {
        // Styles applied via theme
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuItemText: {
        // Styles applied via theme
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemCount: {
        // Styles applied via theme
    },
});
