import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Alert,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { updateProfile, validateUsername, checkUsernameAvailability, updateProfileVisibility } from '@/lib/profile';
import { uploadImage, deleteFolder } from '@/lib/storage';
import { ProfileVisibility } from '@/types';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onSave?: () => void;
}

export function EditProfileModal({ visible, onClose, onSave }: EditProfileModalProps) {
    const theme = useTheme();
    const { user, reloadUser } = useAuth();
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [saving, setSaving] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        user_type: 'artist',
        bio: '',
        website: '',
        phone: '',
        location: '',
        instagram: '',
    });

    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);

    useEffect(() => {
        if (user && visible) {
            setFormData({
                full_name: user.full_name || '',
                username: user.username || '',
                user_type: (user.user_type || 'artist').toLowerCase(),
                bio: user.bio || '',
                website: user.website || '',
                phone: user.phone || '',
                location: user.location || '',
                instagram: user.instagram || '',
            });
            setAvatarUri(user.avatar_url || null);
            setNewAvatarUri(null);
            setUsernameError(null);
        }
    }, [user, visible]);

    const requestPermissions = async () => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
            Alert.alert(
                'Permissions Required',
                'Please grant camera and media library permissions to upload images.'
            );
            return false;
        }
        return true;
    };

    const pickImage = async (source: 'camera' | 'gallery') => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        let result: ImagePicker.ImagePickerResult;

        if (source === 'camera') {
            result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
        } else {
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
        }

        if (!result.canceled && result.assets[0]) {
            setNewAvatarUri(result.assets[0].uri);
        }
    };

    const handleChangePhoto = () => {
        Alert.alert(
            'Select Photo',
            'Choose an option',
            [
                {
                    text: 'Take Photo',
                    onPress: () => pickImage('camera'),
                },
                {
                    text: 'Choose from Gallery',
                    onPress: () => pickImage('gallery'),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    };

    const handleUsernameChange = async (username: string) => {
        setFormData({ ...formData, username });
        setUsernameError(null);

        if (!username.trim()) {
            return;
        }

        const trimmedUsername = username.trim().toLowerCase();
        const validation = validateUsername(trimmedUsername);

        if (!validation.valid) {
            setUsernameError(validation.error || 'Invalid username format');
            return;
        }

        setCheckingUsername(true);
        try {
            const isAvailable = await checkUsernameAvailability(trimmedUsername, user?.id);
            if (!isAvailable) {
                setUsernameError('Username is already taken');
            }
        } catch (error: any) {
            console.error('Error checking username:', error);
            setUsernameError('Error checking username availability');
        } finally {
            setCheckingUsername(false);
        }
    };

    const handleSave = async () => {
        if (!user?.id) {
            Alert.alert('Error', 'User not found');
            return;
        }

        if (usernameError) {
            Alert.alert('Error', 'Please fix the username error before saving');
            return;
        }

        setSaving(true);
        try {
            let avatarUrl = avatarUri;

            // Upload new avatar if one is selected
            if (newAvatarUri) {
                setUploadingPhoto(true);
                try {
                    // Always delete all files in user's avatar folder before uploading new one
                    try {
                        console.log(`Deleting all files in avatar folder for user: ${user.id}`);
                        await deleteFolder(`${user.id}/`, 'avatars');
                        console.log('Successfully deleted all old avatar files');
                    } catch (deleteError: any) {
                        if (deleteError?.message?.includes('not found') || deleteError?.message?.includes('empty')) {
                            console.log('No old avatar files to delete (folder empty or not found)');
                        } else {
                            console.warn('Error deleting old avatar folder (continuing anyway):', deleteError?.message);
                        }
                    }

                    // Upload new avatar
                    console.log('Uploading new avatar...');
                    avatarUrl = await uploadImage(newAvatarUri, 'avatars', `${user.id}/`);
                    console.log('New avatar uploaded successfully:', avatarUrl);
                } catch (error: any) {
                    console.error('Error uploading avatar:', error);
                    Alert.alert('Error', 'Failed to upload profile photo. Please try again.');
                    setSaving(false);
                    setUploadingPhoto(false);
                    return;
                } finally {
                    setUploadingPhoto(false);
                }
            }

            await updateProfile(user.id, {
                ...formData,
                avatar_url: avatarUrl || undefined,
            });

            // Reload user data
            await reloadUser();

            Alert.alert('Success', 'Profile updated successfully', [
                {
                    text: 'OK',
                    onPress: () => {
                        onSave?.();
                        onClose();
                    },
                },
            ]);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const displayAvatarUri = newAvatarUri || avatarUri;

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
                            Edit Profile
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
                        {/* Photo Section */}
                        <View style={styles.photoSection}>
                            <TouchableOpacity
                                onPress={handleChangePhoto}
                                disabled={uploadingPhoto}
                                style={[
                                    styles.avatarContainer,
                                    {
                                        borderRadius: theme.borderRadius?.full || 50,
                                        overflow: 'hidden',
                                    },
                                ]}
                            >
                                {displayAvatarUri ? (
                                    <Image source={{ uri: displayAvatarUri }} style={styles.avatar} />
                                ) : (
                                    <View
                                        style={[
                                            styles.avatarPlaceholder,
                                            {
                                                backgroundColor: theme.colors.surfaceMuted,
                                            },
                                        ]}
                                    >
                                        <Ionicons name="person" size={48} color={theme.colors.textTertiary} />
                                    </View>
                                )}
                                {uploadingPhoto && (
                                    <View style={styles.uploadingOverlay}>
                                        <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
                                    </View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleChangePhoto}
                                disabled={uploadingPhoto}
                                style={[
                                    styles.changePhotoButton,
                                    {
                                        backgroundColor: theme.colors.surfaceMuted,
                                        borderRadius: theme.borderRadius?.base || 12,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.changePhotoText,
                                        {
                                            color: theme.colors.text,
                                            fontSize: theme.typography?.fontSize?.sm || 14,
                                        },
                                    ]}
                                >
                                    {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Basic Information */}
                        <Input
                            label="Full Name"
                            placeholder="Enter your full name"
                            value={formData.full_name}
                            onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                            containerStyle={{ marginBottom: theme.spacing?.base || 16 }}
                        />

                        <View style={styles.inputGroup}>
                            <Text
                                style={[
                                    styles.label,
                                    {
                                        fontSize: theme.typography?.fontSize?.sm || 14,
                                        fontWeight: theme.typography?.fontWeight?.medium || '500',
                                        color: theme.colors.textSecondary,
                                        marginBottom: theme.spacing?.xs || 4,
                                    },
                                ]}
                            >
                                Username
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            color: theme.colors.text,
                                            fontSize: theme.typography?.fontSize?.base || 16,
                                            borderBottomColor: usernameError ? theme.colors.error : theme.colors.border,
                                            paddingBottom: theme.spacing?.sm || 12,
                                            paddingTop: theme.spacing?.sm || 12,
                                            flex: 1,
                                        },
                                    ]}
                                    placeholder="username"
                                    placeholderTextColor={theme.colors.textTertiary}
                                    value={formData.username}
                                    onChangeText={handleUsernameChange}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                {checkingUsername && (
                                    <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: theme.spacing?.sm || 8 }} />
                                )}
                            </View>
                            {usernameError && (
                                <Text
                                    style={[
                                        styles.errorText,
                                        {
                                            fontSize: theme.typography?.fontSize?.xs || 12,
                                            color: theme.colors.error,
                                            marginTop: theme.spacing?.xs || 4,
                                        },
                                    ]}
                                >
                                    {usernameError}
                                </Text>
                            )}
                        </View>

                        <Input
                            label="Bio"
                            placeholder="Tell us about yourself"
                            value={formData.bio}
                            onChangeText={(text) => setFormData({ ...formData, bio: text })}
                            containerStyle={{ marginBottom: theme.spacing?.base || 16 }}
                            multiline
                            numberOfLines={4}
                        />

                        {/* Contact Information */}
                        <Input
                            label="Website"
                            placeholder="www.example.com"
                            value={formData.website}
                            onChangeText={(text) => setFormData({ ...formData, website: text })}
                            containerStyle={{ marginBottom: theme.spacing?.base || 16 }}
                            keyboardType="url"
                            autoCapitalize="none"
                        />

                        <Input
                            label="Phone"
                            placeholder="+1234567890"
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            containerStyle={{ marginBottom: theme.spacing?.base || 16 }}
                            keyboardType="phone-pad"
                        />

                        <Input
                            label="Location"
                            placeholder="City, Country"
                            value={formData.location}
                            onChangeText={(text) => setFormData({ ...formData, location: text })}
                            containerStyle={{ marginBottom: theme.spacing?.base || 16 }}
                        />

                        <Input
                            label="Instagram"
                            placeholder="@username"
                            value={formData.instagram}
                            onChangeText={(text) => setFormData({ ...formData, instagram: text })}
                            autoCapitalize="none"
                        />

                        {/* Profile Visibility Section */}
                        <View
                            style={[
                                styles.visibilitySection,
                                {
                                    backgroundColor: theme.colors.surface,
                                    borderRadius: theme.borderRadius?.base || 12,
                                    padding: theme.spacing?.base || 16,
                                    marginTop: theme.spacing?.base || 16,
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
                                Account Visibility
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
                                        Private Account
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
                                        {user?.profile_visibility !== 'public'
                                            ? 'People can see your profile header if you share your link, but your artworks remain hidden.'
                                            : 'In the future, this will allow artworks to be visible on your public page. For now, only your profile header is visible.'}
                                    </Text>
                                </View>
                                {isUpdatingVisibility ? (
                                    <ActivityIndicator size="small" color={theme.colors.primary} />
                                ) : (
                                    <Switch
                                        value={user?.profile_visibility !== 'public'}
                                        onValueChange={async (value: boolean) => {
                                            if (!user?.id) return;

                                            const newVisibility: ProfileVisibility = value ? 'private' : 'public';
                                            setIsUpdatingVisibility(true);

                                            try {
                                                await updateProfileVisibility(user.id, newVisibility);
                                                await reloadUser();
                                            } catch (error: any) {
                                                console.error('Error updating profile visibility:', error);
                                                Alert.alert('Error', error.message || 'Failed to update profile visibility');
                                            } finally {
                                                setIsUpdatingVisibility(false);
                                            }
                                        }}
                                        trackColor={{ false: theme.colors.surfaceMuted, true: theme.colors.primary }}
                                        thumbColor={theme.colors.textInverse}
                                    />
                                )}
                            </View>
                        </View>

                        {/* Save Button */}
                        <PrimaryButton
                            title={saving || uploadingPhoto ? 'Saving...' : 'Save Changes'}
                            onPress={handleSave}
                            loading={saving || uploadingPhoto}
                            disabled={saving || uploadingPhoto}
                            style={{ marginTop: theme.spacing?.lg || 24, marginBottom: theme.spacing?.base || 16 }}
                        />
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
    photoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 16,
    },
    avatarContainer: {
        width: 80,
        height: 80,
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
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    changePhotoButton: {
        padding: 12,
    },
    changePhotoText: {
        // Styles applied via theme
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 4,
    },
    input: {
        borderBottomWidth: 1,
    },
    errorText: {
        marginTop: 4,
    },
    visibilitySection: {
        marginTop: 16,
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

