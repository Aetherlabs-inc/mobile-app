import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useNewArtworkStore } from '@/store/useNewArtworkStore';
import { createArtwork } from '@/lib/artworks';
import { uploadImage } from '@/lib/storage';

export default function Step1BasicScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const {
        title,
        year,
        medium,
        dimensions,
        status,
        imageUri,
        artist,
        setTitle,
        setYear,
        setMedium,
        setDimensions,
        setStatus,
        setImageUri,
        setArtist,
        setArtworkId,
    } = useNewArtworkStore();

    // Initialize artist name if user is an artist
    const isArtist = user?.user_type === 'artist';
    const initialArtist = artist || user?.full_name || '';

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
                aspect: [4, 3],
                quality: 0.8,
            });
        } else {
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });
        }

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
        }
    };

    const showImagePickerOptions = () => {
        Alert.alert(
            'Select Image',
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

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        if (!artist.trim()) {
            Alert.alert('Error', 'Please enter an artist name');
            return;
        }

        if (!user?.id) {
            Alert.alert('Error', 'You must be logged in to create artworks');
            return;
        }

        setLoading(true);
        try {
            let imageUrl: string | undefined;

            // Upload image if one is selected
            if (imageUri) {
                setUploadingImage(true);
                try {
                    imageUrl = await uploadImage(imageUri, 'artwork-images', user.id);
                } catch (error: any) {
                    console.error('Error uploading image:', error);
                    Alert.alert('Error', 'Failed to upload image. Please try again.');
                    setLoading(false);
                    setUploadingImage(false);
                    return;
                } finally {
                    setUploadingImage(false);
                }
            }

            const artwork = await createArtwork({
                user_id: user.id,
                title: title.trim(),
                artist: artist.trim(),
                year: parseInt(year) || new Date().getFullYear(),
                medium: medium.trim() || '',
                dimensions: dimensions.trim() || '',
                status,
                image_url: imageUrl,
            });

            setArtworkId(artwork.id);
            router.push('/(artworks)/new/step2-nfc');
        } catch (error: any) {
            console.error('Error creating artwork:', error);
            Alert.alert('Error', error.message || 'Failed to create artwork');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen scrollable edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.content,
                    { paddingHorizontal: theme.spacing.screenPaddingHorizontal },
                ]}
            >
                <View style={styles.header}>
                    <Text
                        style={[
                            styles.title,
                            {
                                fontSize: theme.typography.heading1.fontSize,
                                fontWeight: theme.typography.heading1.fontWeight,
                                color: theme.colors.text,
                                marginBottom: theme.spacing.base,
                            },
                        ]}
                    >
                        Register Artwork
                    </Text>
                    <Text
                        style={[
                            styles.subtitle,
                            {
                                fontSize: theme.typography.fontSize.base,
                                color: theme.colors.textSecondary,
                                marginBottom: theme.spacing['2xl'],
                            },
                        ]}
                    >
                        Step 1 of 3: Basic Information
                    </Text>
                </View>

                {/* Image Upload */}
                <View style={styles.imageSection}>
                    <Text
                        style={[
                            styles.sectionLabel,
                            {
                                fontSize: theme.typography.fontSize.sm,
                                fontWeight: theme.typography.fontWeight.medium,
                                color: theme.colors.textSecondary,
                                marginBottom: theme.spacing.sm,
                            },
                        ]}
                    >
                        Artwork Image
                    </Text>
                    {imageUri ? (
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: imageUri }} style={styles.previewImage} />
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => setImageUri(null)}
                            >
                                <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.imageUploadButton,
                                {
                                    backgroundColor: theme.colors.surfaceMuted,
                                    borderColor: theme.colors.border,
                                    borderRadius: theme.borderRadius.base,
                                },
                            ]}
                            onPress={showImagePickerOptions}
                            disabled={uploadingImage}
                        >
                            <Ionicons name="image-outline" size={32} color={theme.colors.textTertiary} />
                            <Text
                                style={[
                                    styles.imageUploadText,
                                    {
                                        color: theme.colors.textSecondary,
                                        marginTop: theme.spacing.sm,
                                    },
                                ]}
                            >
                                {uploadingImage ? 'Uploading...' : 'Tap to add image'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Form Fields */}
                <Input
                    label="Title *"
                    placeholder="Enter artwork title"
                    value={title}
                    onChangeText={setTitle}
                />

                <Input
                    label="Artist *"
                    placeholder="Enter artist name"
                    value={artist || initialArtist}
                    onChangeText={setArtist}

                />

                <Input
                    label="Year"
                    placeholder="e.g., 2024"
                    value={year}
                    onChangeText={setYear}
                    keyboardType="numeric"
                />

                <Input
                    label="Medium"
                    placeholder="e.g., Oil on Canvas"
                    value={medium}
                    onChangeText={setMedium}
                />

                <Input
                    label="Dimensions"
                    placeholder="e.g., 24 x 36 inches"
                    value={dimensions}
                    onChangeText={setDimensions}
                />

                {/* Status Dropdown */}
                <View style={styles.statusSection}>
                    <Text
                        style={[
                            styles.sectionLabel,
                            {
                                fontSize: theme.typography.fontSize.sm,
                                fontWeight: theme.typography.fontWeight.medium,
                                color: theme.colors.textSecondary,
                                marginBottom: theme.spacing.sm,
                            },
                        ]}
                    >
                        Status
                    </Text>
                    <View style={styles.statusButtons}>
                        <TouchableOpacity
                            style={[
                                styles.statusButton,
                                {
                                    backgroundColor:
                                        status === 'verified'
                                            ? theme.colors.primary
                                            : theme.colors.surfaceMuted,
                                    borderRadius: theme.borderRadius.base,
                                },
                            ]}
                            onPress={() => setStatus('verified')}
                        >
                            <Text
                                style={[
                                    styles.statusButtonText,
                                    {
                                        color:
                                            status === 'verified'
                                                ? theme.colors.textOnPrimary
                                                : theme.colors.text,
                                        fontWeight: theme.typography.fontWeight.semibold,
                                    },
                                ]}
                            >
                                Verified
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.statusButton,
                                {
                                    backgroundColor:
                                        status === 'unverified'
                                            ? theme.colors.primary
                                            : theme.colors.surfaceMuted,
                                    borderRadius: theme.borderRadius.base,
                                },
                            ]}
                            onPress={() => setStatus('unverified')}
                        >
                            <Text
                                style={[
                                    styles.statusButtonText,
                                    {
                                        color:
                                            status === 'unverified'
                                                ? theme.colors.textOnPrimary
                                                : theme.colors.text,
                                        fontWeight: theme.typography.fontWeight.semibold,
                                    },
                                ]}
                            >
                                Unverified
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <PrimaryButton
                        title="Continue"
                        onPress={handleSubmit}
                        loading={loading || uploadingImage}
                        disabled={loading || uploadingImage}
                    />
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    content: {
        paddingTop: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        marginBottom: 8,
    },
    subtitle: {
        marginBottom: 32,
    },
    imageSection: {
        marginBottom: 32,
    },
    imageContainer: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: 4,
    },
    imageUploadButton: {
        borderWidth: 2,
        borderStyle: 'dashed',
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
    },
    imageUploadText: {
        fontSize: 14,
    },
    sectionLabel: {
        marginBottom: 8,
    },
    statusSection: {
        marginBottom: 32,
    },
    statusButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    statusButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusButtonText: {
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 24,
    },
});

