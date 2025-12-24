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
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Top Header */}
                <View style={styles.topHeader}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Title Section */}
                <View style={styles.titleSection}>
                    <Text style={[styles.greetingText, { color: theme.colors.text }]}>
                        Register Artwork
                    </Text>
                    <Text style={[styles.greetingSubtext, { color: theme.colors.textSecondary }]}>
                        Step 1 of 3: Basic Information
                    </Text>
                </View>

                {/* Image Upload Card */}
                <View style={[styles.imageCard, {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius?.lg || 16,
                    ...theme.shadows.base,
                }]}>
                    <View style={styles.imageCardHeader}>
                        <View style={[styles.imageCardIconContainer, { backgroundColor: theme.colors.surfaceMuted }]}>
                            <Ionicons name="image-outline" size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={[styles.imageCardTitle, { color: theme.colors.text }]}>
                            Artwork Image
                        </Text>
                    </View>
                    {imageUri ? (
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: imageUri }} style={styles.previewImage} />
                            <TouchableOpacity
                                style={[styles.removeButton, {
                                    backgroundColor: theme.colors.surfaceElevated,
                                    ...theme.shadows.sm,
                                }]}
                                onPress={() => setImageUri(null)}
                            >
                                <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.imageUploadButton, {
                                backgroundColor: theme.colors.surfaceMuted,
                                borderRadius: theme.borderRadius?.base || 12,
                            }]}
                            onPress={showImagePickerOptions}
                            disabled={uploadingImage}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="camera-outline" size={40} color={theme.colors.textTertiary} />
                            <Text style={[styles.imageUploadText, { color: theme.colors.textSecondary }]}>
                                {uploadingImage ? 'Uploading...' : 'Tap to add image'}
                            </Text>
                            <Text style={[styles.imageUploadSubtext, { color: theme.colors.textTertiary }]}>
                                Camera or Gallery
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Form Fields Card */}
                <View style={[styles.formCard, {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius?.lg || 16,
                    ...theme.shadows.base,
                }]}>
                    <View style={styles.formCardHeader}>
                        <View style={[styles.formCardIconContainer, { backgroundColor: theme.colors.surfaceMuted }]}>
                            <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={[styles.formCardTitle, { color: theme.colors.text }]}>
                            Artwork Details
                        </Text>
                    </View>
                    <View style={styles.formFields}>
                        <View style={styles.inputWrapper}>
                            <Input
                                label="Title *"
                                placeholder="Enter artwork title"
                                value={title}
                                onChangeText={setTitle}
                                containerStyle={styles.inputContainer}
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Input
                                label="Artist *"
                                placeholder="Enter artist name"
                                value={artist || initialArtist}
                                onChangeText={setArtist}
                                containerStyle={styles.inputContainer}
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Input
                                label="Year"
                                placeholder="e.g., 2024"
                                value={year}
                                onChangeText={setYear}
                                keyboardType="numeric"
                                containerStyle={styles.inputContainer}
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Input
                                label="Medium"
                                placeholder="e.g., Oil on Canvas"
                                value={medium}
                                onChangeText={setMedium}
                                containerStyle={styles.inputContainer}
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Input
                                label="Dimensions"
                                placeholder="e.g., 24 x 36 inches"
                                value={dimensions}
                                onChangeText={setDimensions}
                                containerStyle={styles.inputContainer}
                            />
                        </View>
                    </View>
                </View>

                {/* Status Card */}
                <View style={[styles.statusCard, {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius?.lg || 16,
                    ...theme.shadows.base,
                }]}>
                    <View style={styles.statusCardHeader}>
                        <View style={[styles.statusCardIconContainer, { backgroundColor: theme.colors.surfaceMuted }]}>
                            <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={[styles.statusCardTitle, { color: theme.colors.text }]}>
                            Verification Status
                        </Text>
                    </View>
                    <View style={styles.statusButtons}>
                        <TouchableOpacity
                            style={[
                                styles.statusButton,
                                {
                                    backgroundColor:
                                        status === 'verified'
                                            ? theme.colors.primary
                                            : theme.colors.surfaceMuted,
                                    borderRadius: theme.borderRadius?.base || 12,
                                    ...(status === 'verified' ? theme.shadows.sm : {}),
                                },
                            ]}
                            onPress={() => setStatus('verified')}
                            activeOpacity={0.7}
                        >
                            <Ionicons 
                                name={status === 'verified' ? 'checkmark-circle' : 'checkmark-circle-outline'} 
                                size={20} 
                                color={status === 'verified' ? theme.colors.textOnPrimary : theme.colors.textSecondary} 
                            />
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
                                    borderRadius: theme.borderRadius?.base || 12,
                                    ...(status === 'unverified' ? theme.shadows.sm : {}),
                                },
                            ]}
                            onPress={() => setStatus('unverified')}
                            activeOpacity={0.7}
                        >
                            <Ionicons 
                                name={status === 'unverified' ? 'time' : 'time-outline'} 
                                size={20} 
                                color={status === 'unverified' ? theme.colors.textOnPrimary : theme.colors.textSecondary} 
                            />
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
                        style={[styles.continueButton, {
                            borderRadius: theme.borderRadius?.lg || 16,
                            ...theme.shadows.base,
                        }]}
                    />
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleSection: {
        paddingHorizontal: 24,
        paddingBottom: 28,
        gap: 4,
    },
    greetingText: {
        fontSize: 40,
        fontWeight: '600',
        marginBottom: 1,
    },
    greetingSubtext: {
        fontSize: 18,
        fontWeight: '500',
    },
    imageCard: {
        marginHorizontal: 24,
        marginBottom: 12,
        padding: 20,
    },
    imageCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    imageCardIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageCardTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    imageContainer: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: 280,
        resizeMode: 'cover',
    },
    removeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        borderRadius: 20,
        padding: 6,
    },
    imageUploadButton: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        gap: 12,
    },
    imageUploadText: {
        fontSize: 16,
        fontWeight: '600',
    },
    imageUploadSubtext: {
        fontSize: 13,
    },
    formCard: {
        marginHorizontal: 24,
        marginBottom: 12,
        padding: 20,
    },
    formCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    formCardIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formCardTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    formFields: {
        gap: 0,
    },
    inputWrapper: {
        marginBottom: 0,
    },
    inputContainer: {
        marginBottom: 20,
    },
    statusCard: {
        marginHorizontal: 24,
        marginBottom: 12,
        padding: 20,
    },
    statusCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    statusCardIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusCardTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    statusButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    statusButton: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    statusButtonText: {
        fontSize: 16,
    },
    buttonContainer: {
        marginHorizontal: 24,
        marginTop: 24,
    },
    continueButton: {
        paddingVertical: 18,
    },
});

