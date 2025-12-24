import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { getArtworkById, getPublicArtworkById, getNFCTagByArtworkId } from '@/lib/artworks';
import { getCertificateByArtworkId } from '@/lib/certificates';
import { Artwork, NFCTag, Certificate } from '@/types';

export default function AuthenticityCertificateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [nfcTag, setNfcTag] = useState<NFCTag | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

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
      // Try public first, then authenticated
      let artworkData = await getPublicArtworkById(id);
      if (!artworkData) {
        artworkData = await getArtworkById(id);
      }

      setArtwork(artworkData);

      if (artworkData) {
        const [certData, tagData] = await Promise.all([
          getCertificateByArtworkId(id),
          getNFCTagByArtworkId(id),
        ]);
        setCertificate(certData);
        setNfcTag(tagData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!artwork) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>Artwork not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.textOnPrimary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Simple Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Big Title Section */}
        <View style={styles.titleSection}>
          <View style={[styles.certificateIconContainer, { 
            backgroundColor: theme.colors.primary + '15',
          }]}>
            <Ionicons name="shield-checkmark" size={48} color={theme.colors.primary} />
          </View>
          <Text style={[styles.mainTitle, { color: theme.colors.text }]}>
            Certificate of{'\n'}Authenticity
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Official verification document
          </Text>
        </View>

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          {artwork.status === 'verified' ? (
            <View style={[styles.statusBadge, {
              backgroundColor: theme.colors.success + '15',
            }]}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={[styles.statusText, { color: theme.colors.success }]}>
                Verified Authentic
              </Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, {
              backgroundColor: theme.colors.warning + '15',
            }]}>
              <Ionicons name="time-outline" size={24} color={theme.colors.warning} />
              <Text style={[styles.statusText, { color: theme.colors.warning }]}>
                Pending Verification
              </Text>
            </View>
          )}
        </View>

        {/* Artwork Image Card */}
        {artwork.image_url && !imageError && (
          <View style={[styles.imageCard, {
            backgroundColor: theme.colors.surface,
            ...theme.shadows.base,
          }]}>
            <Image
              source={{ uri: artwork.image_url }}
              style={styles.artworkImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          </View>
        )}

        {/* Artwork Information Card */}
        <View style={[styles.infoCard, {
          backgroundColor: theme.colors.surface,
          ...theme.shadows.base,
        }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: theme.colors.surfaceMuted }]}>
              <Ionicons name="brush-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Artwork Details
            </Text>
          </View>
          
          <View style={styles.artworkInfo}>
            <Text style={[styles.artworkTitle, { color: theme.colors.text }]}>
              {artwork.title}
            </Text>
            <View style={styles.artistRow}>
              <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.artworkArtist, { color: theme.colors.textSecondary }]}>
                {artwork.artist}
              </Text>
            </View>
          </View>

          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  Year Created
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {artwork.year}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="color-palette-outline" size={18} color={theme.colors.primary} />
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  Medium
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {artwork.medium}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="resize-outline" size={18} color={theme.colors.primary} />
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  Dimensions
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {artwork.dimensions}
              </Text>
            </View>
          </View>
        </View>

        {/* Authentication Card */}
        {certificate && (
          <View style={[styles.infoCard, {
            backgroundColor: theme.colors.surface,
            ...theme.shadows.base,
          }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: theme.colors.surfaceMuted }]}>
                <Ionicons name="finger-print-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Authentication
              </Text>
            </View>
            
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} />
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Certificate ID
                  </Text>
                </View>
                <Text style={[styles.detailValue, styles.monospace, { color: theme.colors.primary }]} numberOfLines={1}>
                  {certificate.certificate_id}
                </Text>
              </View>

              {certificate.blockchain_hash && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <Ionicons name="cube-outline" size={18} color={theme.colors.primary} />
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                      Blockchain Hash
                    </Text>
                  </View>
                  <Text style={[styles.detailValue, styles.monospace, { color: theme.colors.text }]} numberOfLines={1}>
                    {certificate.blockchain_hash.substring(0, 12)}...
                  </Text>
                </View>
              )}

              {nfcTag && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <Ionicons name="wifi-outline" size={18} color={theme.colors.primary} />
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                      NFC Tag UID
                    </Text>
                  </View>
                  <Text style={[styles.detailValue, styles.monospace, { color: theme.colors.primary }]}>
                    {nfcTag.nfc_uid}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Issued Date
                  </Text>
                </View>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {new Date(certificate.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Brand Footer */}
        <View style={styles.footer}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.brandText, { color: theme.colors.text }]}>
            AetherLabs
          </Text>
          <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
            Digital authenticity verification platform
          </Text>
          <Text style={[styles.footerSubtext, { color: theme.colors.textTertiary }]}>
            Scan the NFC tag to verify this certificate
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: 'center',
  },
  certificateIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  statusContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imageCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  artworkImage: {
    width: '100%',
    aspectRatio: 1,
  },
  infoCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  artworkInfo: {
    marginBottom: 20,
  },
  artworkTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 34,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  artworkArtist: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailsList: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  monospace: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    width: 60,
    height: 60,
    marginBottom: 12,
    borderRadius: 30,
    overflow: 'hidden',
  },
  logo: {
    width: 60,
    height: 60,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerSubtext: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
});

