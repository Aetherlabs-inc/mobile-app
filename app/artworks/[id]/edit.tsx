import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { getArtworkById, updateArtwork } from '@/lib/artworks';
import { uploadImage, deleteImage } from '@/lib/storage';
import { Artwork } from '@/types';

export default function EditArtworkScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    year: '',
    medium: '',
    dimensions: '',
    status: 'unverified' as 'verified' | 'unverified',
  });

  useEffect(() => {
    loadArtwork();
  }, [id]);

  const loadArtwork = async () => {
    if (!id || typeof id !== 'string') return;
    
    try {
      const artwork = await getArtworkById(id);
      if (artwork) {
        setFormData({
          title: artwork.title,
          artist: artwork.artist,
          year: artwork.year?.toString() || '',
          medium: artwork.medium || '',
          dimensions: artwork.dimensions || '',
          status: artwork.status,
        });
        setExistingImageUrl(artwork.image_url || null);
        setImageUri(artwork.image_url || null);
      }
    } catch (error) {
      console.error('Error loading artwork:', error);
      Alert.alert('Error', 'Failed to load artwork');
      router.back();
    }
  };

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
          text: 'Remove Image',
          style: 'destructive',
          onPress: () => {
            setImageUri(null);
            setExistingImageUrl(null);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.artist.trim()) {
      Alert.alert('Error', 'Please fill in title and artist');
      return;
    }

    if (!id || typeof id !== 'string') {
      Alert.alert('Error', 'Artwork ID not found');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to update artworks');
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | undefined = existingImageUrl || undefined;

      // Upload new image if one is selected and different from existing
      if (imageUri && imageUri !== existingImageUrl) {
        setUploadingImage(true);
        try {
          // Delete old image if exists
          if (existingImageUrl) {
            try {
              // Extract file path from URL
              const urlParts = existingImageUrl.split('/');
              const fileName = urlParts[urlParts.length - 1].split('?')[0];
              const filePath = `${user.id}/${fileName}`;
              await deleteImage(filePath, 'artwork_images');
            } catch (error) {
              console.error('Error deleting old image:', error);
              // Continue even if deletion fails
            }
          }

          imageUrl = await uploadImage(imageUri, 'artwork_images', user.id);
        } catch (error: any) {
          console.error('Error uploading image:', error);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
          setLoading(false);
          setUploadingImage(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      } else if (!imageUri && existingImageUrl) {
        // User removed the image
        try {
          const urlParts = existingImageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1].split('?')[0];
          const filePath = `${user.id}/${fileName}`;
          await deleteImage(filePath, 'artwork_images');
          imageUrl = undefined;
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      }

      await updateArtwork(id, {
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        year: parseInt(formData.year) || new Date().getFullYear(),
        medium: formData.medium.trim() || '',
        dimensions: formData.dimensions.trim() || '',
        status: formData.status,
        image_url: imageUrl,
      });

      Alert.alert('Success', 'Artwork updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error updating artwork:', error);
      Alert.alert('Error', error.message || 'Failed to update artwork');
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
            Edit Artwork
          </Text>
          <View style={{ width: 40 }} />
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
                onPress={showImagePickerOptions}
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
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
        />

        <Input
          label="Artist *"
          placeholder="Enter artist name"
          value={formData.artist}
          onChangeText={(text) => setFormData({ ...formData, artist: text })}
        />

        <Input
          label="Year"
          placeholder="e.g., 2024"
          value={formData.year}
          onChangeText={(text) => setFormData({ ...formData, year: text })}
          keyboardType="numeric"
        />

        <Input
          label="Medium"
          placeholder="e.g., Oil on Canvas"
          value={formData.medium}
          onChangeText={(text) => setFormData({ ...formData, medium: text })}
        />

        <Input
          label="Dimensions"
          placeholder="e.g., 24 x 36 inches"
          value={formData.dimensions}
          onChangeText={(text) => setFormData({ ...formData, dimensions: text })}
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
                    formData.status === 'verified'
                      ? theme.colors.primary
                      : theme.colors.surfaceMuted,
                  borderRadius: theme.borderRadius.base,
                },
              ]}
              onPress={() => setFormData({ ...formData, status: 'verified' })}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  {
                    color:
                      formData.status === 'verified'
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
                    formData.status === 'unverified'
                      ? theme.colors.primary
                      : theme.colors.surfaceMuted,
                  borderRadius: theme.borderRadius.base,
                },
              ]}
              onPress={() => setFormData({ ...formData, status: 'unverified' })}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  {
                    color:
                      formData.status === 'unverified'
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
            title="Save Changes"
            onPress={handleSave}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
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

