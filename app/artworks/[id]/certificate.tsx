import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Screen } from '@/components/ui/Screen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { CertificateGenerator } from '@/components/certificates/CertificateGenerator';
import { getArtworkById } from '@/lib/artworks';
import { getCertificateByArtworkId, deleteCertificate } from '@/lib/certificates';
import { Artwork } from '@/types';
import { Certificate } from '@/types';

export default function CertificateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id || typeof id !== 'string') {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const artworkData = await getArtworkById(id);
      setArtwork(artworkData);

      if (artworkData) {
        const certData = await getCertificateByArtworkId(id);
        setCertificate(certData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateGenerated = (newCertificate: Certificate) => {
    setCertificate(newCertificate);
  };

  if (loading) {
    return (
      <Screen edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!artwork) {
    return (
      <Screen edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text
            style={[
              styles.errorText,
              {
                fontSize: theme.typography.heading2.fontSize,
                color: theme.colors.text,
                marginTop: theme.spacing.base,
              },
            ]}
          >
            Artwork not found
          </Text>
          <PrimaryButton
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
            style={{ marginTop: theme.spacing['2xl'] }}
          />
        </View>
      </Screen>
    );
  }

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
            Certificate of Authenticity
          </Text>
        </View>

        {artwork.image_url && (
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
              source={{ uri: artwork.image_url }}
              style={styles.artworkImage}
              resizeMode="cover"
            />
          </View>
        )}

        <View
          style={[
            styles.artworkInfo,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.card,
              padding: theme.spacing.base,
              marginBottom: theme.spacing['2xl'],
            },
          ]}
        >
          <Text
            style={[
              styles.artworkTitle,
              {
                fontSize: theme.typography.heading2.fontSize,
                fontWeight: theme.typography.heading2.fontWeight,
                color: theme.colors.text,
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            {artwork.title}
          </Text>
          <Text
            style={[
              styles.artworkArtist,
              {
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.sm,
              },
            ]}
          >
            by {artwork.artist}
          </Text>
          {artwork.year && (
            <Text
              style={[
                styles.artworkYear,
                {
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textTertiary,
                },
              ]}
            >
              {artwork.year}
            </Text>
          )}
        </View>

        {certificate ? (
          <CertificateGenerator
            artworkId={artwork.id}
            existingCertificate={certificate}
            onCertificateGenerated={handleCertificateGenerated}
            onCertificateDeleted={() => {
              setCertificate(null);
            }}
          />
        ) : (
          <CertificateGenerator
            artworkId={artwork.id}
            onCertificateGenerated={handleCertificateGenerated}
          />
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    textAlign: 'center',
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
  },
  imageContainer: {
    width: '100%',
    height: 300,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  artworkInfo: {
    marginBottom: 32,
  },
  artworkTitle: {
    marginBottom: 4,
  },
  artworkArtist: {
    marginBottom: 8,
  },
  artworkYear: {
    marginTop: 4,
  },
});

