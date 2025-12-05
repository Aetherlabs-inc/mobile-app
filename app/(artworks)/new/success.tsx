import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Screen } from '@/components/ui/Screen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useNewArtworkStore } from '@/store/useNewArtworkStore';
import { getNFCTagByArtworkId } from '@/lib/artworks';

export default function ArtworkSuccessScreen() {
  const theme = useTheme();
  const router = useRouter();

  const {
    title,
    imageUri,
    artworkId,
    reset,
  } = useNewArtworkStore();

  const [hasNfcTag, setHasNfcTag] = useState(false);

  useEffect(() => {
    checkNfcTag();
  }, [artworkId]);

  const checkNfcTag = async () => {
    if (!artworkId) return;
    try {
      const tag = await getNFCTagByArtworkId(artworkId);
      setHasNfcTag(!!tag);
    } catch (error) {
      console.error('Error checking NFC tag:', error);
    }
  };

  const handleViewArtwork = () => {
    if (artworkId) {
      reset();
      router.replace(`/artworks/${artworkId}`);
    } else {
      router.replace('/(tabs)/artworks');
    }
  };

  const handleLinkNfc = () => {
    if (artworkId) {
      reset();
      router.push(`/artworks/${artworkId}?linkNfc=true`);
    }
  };

  return (
    <Screen edges={['top']}>
      <View
        style={[
          styles.container,
          {
            paddingHorizontal: theme.spacing.screenPaddingHorizontal,
            paddingTop: theme.spacing['2xl'],
            paddingBottom: theme.spacing['2xl'],
          },
        ]}
      >
        <View style={styles.content}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: theme.colors.success + '20',
                borderRadius: theme.borderRadius.full,
                width: 120,
                height: 120,
                marginBottom: theme.spacing['2xl'],
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={80}
              color={theme.colors.success}
            />
          </View>

          <Text
            style={[
              styles.title,
              {
                fontSize: theme.typography.heading1.fontSize,
                fontWeight: theme.typography.heading1.fontWeight,
                color: theme.colors.text,
                marginBottom: theme.spacing.base,
                textAlign: 'center',
              },
            ]}
          >
            Artwork Registered Successfully
          </Text>

          {imageUri && (
            <View
              style={[
                styles.imageContainer,
                {
                  borderRadius: theme.borderRadius.card,
                  marginBottom: theme.spacing['2xl'],
                  overflow: 'hidden',
                },
              ]}
            >
              <Image
                source={{ uri: imageUri }}
                style={styles.artworkImage}
                resizeMode="cover"
              />
            </View>
          )}

          {title && (
            <Text
              style={[
                styles.artworkTitle,
                {
                  fontSize: theme.typography.heading2.fontSize,
                  fontWeight: theme.typography.heading2.fontWeight,
                  color: theme.colors.text,
                  marginBottom: theme.spacing['2xl'],
                  textAlign: 'center',
                },
              ]}
            >
              {title}
            </Text>
          )}

          <Text
            style={[
              styles.description,
              {
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing['2xl'],
                textAlign: 'center',
                lineHeight: theme.typography.lineHeight.relaxed,
              },
            ]}
          >
            Your artwork has been successfully registered and is ready for
            verification and certificate generation.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="View Artwork"
            onPress={handleViewArtwork}
            style={{ marginBottom: theme.spacing.base }}
          />
          {!hasNfcTag && (
            <PrimaryButton
              title="Link NFC Tag"
              onPress={handleLinkNfc}
              variant="outline"
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    maxWidth: 300,
    height: 300,
    marginVertical: 24,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  artworkTitle: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
  },
});

