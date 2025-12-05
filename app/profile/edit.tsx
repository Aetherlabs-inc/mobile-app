import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Alert,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { updateProfile, validateUsername, checkUsernameAvailability, updateProfileVisibility } from '@/lib/profile';
import { uploadImage, deleteFolder } from '@/lib/storage';
import { ProfileVisibility } from '@/types';

export default function EditProfileScreen() {
    const theme = useTheme();
    const router = useRouter();
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
        if (user) {
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
        }
    }, [user]);

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

        const validation = validateUsername(username);
        if (!validation.valid) {
            setUsernameError(validation.error || 'Invalid username');
            return;
        }

        // Check availability if username changed
        if (username.toLowerCase() !== user?.username?.toLowerCase()) {
            setCheckingUsername(true);
            try {
                const isAvailable = await checkUsernameAvailability(username, user?.id);
                if (!isAvailable) {
                    setUsernameError('Username is already taken');
                }
            } catch (error) {
                console.error('Error checking username:', error);
            } finally {
                setCheckingUsername(false);
            }
        }
    };

    const handleSave = async () => {
        if (!user?.id) {
            Alert.alert('Error', 'User not found');
            return;
        }

        // Validate username if provided
        if (formData.username) {
            const validation = validateUsername(formData.username);
            if (!validation.valid) {
                Alert.alert('Invalid Username', validation.error || 'Please enter a valid username');
                return;
            }

            // Check availability one more time
            if (formData.username.toLowerCase() !== user?.username?.toLowerCase()) {
                const isAvailable = await checkUsernameAvailability(formData.username, user.id);
                if (!isAvailable) {
                    Alert.alert('Username Taken', 'This username is already taken. Please choose another one.');
                    return;
                }
            }
        }

        setSaving(true);
        try {
            let avatarUrl = avatarUri;

            // Upload new avatar if one is selected
            if (newAvatarUri) {
                setUploadingPhoto(true);
                try {
                    // Always delete all files in user's avatar folder before uploading new one
                    // This ensures we don't leave orphaned files
                    try {
                        console.log(`Deleting all files in avatar folder for user: ${user.id}`);
                        await deleteFolder(`${user.id}/`, 'avatars');
                        console.log('Successfully deleted all old avatar files');
                    } catch (deleteError: any) {
                        // If folder doesn't exist or is empty, that's okay - just log it
                        if (deleteError?.message?.includes('not found') || deleteError?.message?.includes('empty')) {
                            console.log('No old avatar files to delete (folder empty or not found)');
                        } else {
                            console.warn('Error deleting old avatar folder (continuing anyway):', deleteError?.message);
                        }
                        // Continue with upload even if deletion fails
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
                        router.back();
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
                        Edit Profile
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Profile Photo Section */}
                <Card style={{ marginBottom: theme.spacing.base }}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            {
                                fontSize: theme.typography.heading2.fontSize,
                                fontWeight: theme.typography.heading2.fontWeight,
                                color: theme.colors.text,
                                marginBottom: theme.spacing.xs,
                            },
                        ]}
                    >
                        Profile Photo
                    </Text>

                    <View style={styles.photoSection}>
                        <View
                            style={[
                                styles.avatarContainer,
                                {
                                    borderRadius: theme.borderRadius.full,
                                    overflow: 'hidden',
                                },
                            ]}
                        >
                            {displayAvatarUri ? (
                                <Image
                                    source={{ uri: displayAvatarUri }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <View
                                    style={[
                                        styles.avatarPlaceholder,
                                        {
                                            backgroundColor: theme.colors.surfaceMuted,
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name="person"
                                        size={48}
                                        color={theme.colors.textTertiary}
                                    />
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.changePhotoButton,
                                {
                                    backgroundColor: theme.colors.primary,
                                    borderRadius: theme.borderRadius.base,
                                    paddingVertical: theme.spacing.sm,
                                    paddingHorizontal: theme.spacing.base,
                                },
                            ]}
                            onPress={handleChangePhoto}
                            disabled={uploadingPhoto}
                        >
                            {uploadingPhoto ? (
                                <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
                            ) : (
                                <>
                                    <Ionicons
                                        name="camera"
                                        size={16}
                                        color={theme.colors.textOnPrimary}
                                        style={{ marginRight: theme.spacing.xs }}
                                    />
                                    <Text
                                        style={[
                                            styles.changePhotoText,
                                            {
                                                color: theme.colors.textOnPrimary,
                                                fontSize: theme.typography.fontSize.sm,
                                                fontWeight: theme.typography.fontWeight.medium,
                                            },
                                        ]}
                                    >
                                        Change Photo
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </Card>

                {/* Basic Information Section */}
                <Card style={{ marginBottom: theme.spacing.base }}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            {
                                fontSize: theme.typography.heading2.fontSize,
                                fontWeight: theme.typography.heading2.fontWeight,
                                color: theme.colors.text,
                                marginBottom: theme.spacing.xs,
                            },
                        ]}
                    >
                        Basic Information
                    </Text>

                    <Input
                        label="Full Name"
                        placeholder="Enter your full name"
                        value={formData.full_name}
                        onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                        containerStyle={{ marginBottom: theme.spacing.base }}
                    />

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
                            Username
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        color: theme.colors.text,
                                        fontSize: theme.typography.fontSize.base,
                                        borderBottomColor: usernameError ? theme.colors.error : theme.colors.border,
                                        paddingBottom: theme.spacing.sm,
                                        paddingTop: theme.spacing.sm,
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
                                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: theme.spacing.sm }} />
                            )}
                        </View>
                        {usernameError && (
                            <Text
                                style={[
                                    styles.errorText,
                                    {
                                        fontSize: theme.typography.fontSize.xs,
                                        color: theme.colors.error,
                                        marginTop: theme.spacing.xs,
                                    },
                                ]}
                            >
                                {usernameError}
                            </Text>
                        )}
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
                            Choose a unique username (1-30 characters, letters, numbers, underscores, dots)
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
                            Email
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.inputDisabled,
                                {
                                    color: theme.colors.textSecondary,
                                    fontSize: theme.typography.fontSize.base,
                                    borderBottomColor: theme.colors.border,
                                    paddingBottom: theme.spacing.sm,
                                    paddingTop: theme.spacing.sm,
                                },
                            ]}
                            value={user?.email || ''}
                            editable={false}
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs }}>
                            <Ionicons
                                name={user?.email_verified ? "checkmark-circle" : "close-circle"}
                                size={16}
                                color={user?.email_verified ? theme.colors.success : theme.colors.error}
                                style={{ marginRight: theme.spacing.xs }}
                            />
                            <Text
                                style={[
                                    styles.helperText,
                                    {
                                        fontSize: theme.typography.fontSize.xs,
                                        color: user?.email_verified ? theme.colors.success : theme.colors.error,
                                    },
                                ]}
                            >
                                {user?.email_verified ? 'Email verified' : 'Email not verified'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text
                            style={[
                                styles.label,
                                {
                                    fontSize: theme.typography.fontSize.sm,
                                    fontWeight: theme.typography.fontWeight.medium,
                                    color: theme.colors.textSecondary,
                                    marginBottom: theme.spacing.sm,
                                },
                            ]}
                        >
                            User Type
                        </Text>
                        <View style={styles.userTypeButtons}>
                            {['artist', 'gallery', 'collector'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.userTypeButton,
                                        {
                                            backgroundColor:
                                                formData.user_type === type
                                                    ? theme.colors.primary
                                                    : theme.colors.surfaceMuted,
                                            borderRadius: theme.borderRadius.base,
                                            paddingVertical: theme.spacing.sm,
                                            paddingHorizontal: theme.spacing.base,
                                        },
                                    ]}
                                    onPress={() => setFormData({ ...formData, user_type: type })}
                                >
                                    <Text
                                        style={[
                                            styles.userTypeButtonText,
                                            {
                                                color:
                                                    formData.user_type === type
                                                        ? theme.colors.textOnPrimary
                                                        : theme.colors.text,
                                                fontSize: theme.typography.fontSize.sm,
                                                fontWeight: theme.typography.fontWeight.medium,
                                            },
                                        ]}
                                    >
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
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
                            Bio
                        </Text>
                        <TextInput
                            style={[
                                styles.textArea,
                                {
                                    color: theme.colors.text,
                                    fontSize: theme.typography.fontSize.base,
                                    borderBottomColor: theme.colors.border,
                                    paddingBottom: theme.spacing.sm,
                                    paddingTop: theme.spacing.sm,
                                    minHeight: 100,
                                    textAlignVertical: 'top',
                                },
                            ]}
                            placeholder="Tell us about yourself..."
                            placeholderTextColor={theme.colors.textTertiary}
                            value={formData.bio}
                            onChangeText={(text) => setFormData({ ...formData, bio: text })}
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                </Card>

                {/* Contact Information Section */}
                <Card style={{ marginBottom: theme.spacing.base }}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            {
                                fontSize: theme.typography.heading2.fontSize,
                                fontWeight: theme.typography.heading2.fontWeight,
                                color: theme.colors.text,
                                marginBottom: theme.spacing.xs,
                            },
                        ]}
                    >
                        Contact Information
                    </Text>

                    <Input
                        label="Website"
                        placeholder="www.example.com"
                        value={formData.website}
                        onChangeText={(text) => setFormData({ ...formData, website: text })}
                        containerStyle={{ marginBottom: theme.spacing.base }}
                        keyboardType="url"
                        autoCapitalize="none"
                    />

                    <Input
                        label="Phone"
                        placeholder="+1234567890"
                        value={formData.phone}
                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                        containerStyle={{ marginBottom: theme.spacing.base }}
                        keyboardType="phone-pad"
                    />

                    <Input
                        label="Location"
                        placeholder="City, Country"
                        value={formData.location}
                        onChangeText={(text) => setFormData({ ...formData, location: text })}
                        containerStyle={{ marginBottom: theme.spacing.base }}
                    />

                    <Input
                        label="Instagram"
                        placeholder="@username"
                        value={formData.instagram}
                        onChangeText={(text) => setFormData({ ...formData, instagram: text })}
                        autoCapitalize="none"
                    />
                </Card>

                {/* Profile Visibility Section */}
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
                        Account Visibility
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
                                Private Account
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
                </Card>

                {/* Save Changes Button */}
                <PrimaryButton
                    title={saving || uploadingPhoto ? 'Saving...' : 'Save Changes'}
                    onPress={handleSave}
                    loading={saving || uploadingPhoto}
                    disabled={saving || uploadingPhoto}
                    style={{ marginBottom: theme.spacing.base }}
                />
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
        marginBottom: 8,
    },
    backButton: {
        marginRight: 12,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
    },
    sectionTitle: {
        marginBottom: 4,
    },
    photoSection: {
        flexDirection: 'row',
        alignItems: 'center',
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    changePhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    changePhotoText: {
        marginLeft: 4,
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
    inputDisabled: {
        opacity: 0.6,
    },
    helperText: {
        marginTop: 4,
    },
    errorText: {
        marginTop: 4,
    },
    textArea: {
        borderBottomWidth: 1,
        paddingVertical: 12,
    },
    userTypeButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    userTypeButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    userTypeButtonText: {
        fontSize: 14,
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

