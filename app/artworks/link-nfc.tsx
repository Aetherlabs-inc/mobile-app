import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Platform, ActivityIndicator, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/ui/Screen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { linkNfcTag, getArtworks, getNFCTagByArtworkId } from '@/lib/artworks';
import { requestNfcPermission, readNfcTag, stopNfc, isNfcSupported, isNfcModuleAvailable } from '@/lib/nfc';
import { Artwork } from '@/types';

export default function LinkNfcToArtworkScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id: artworkIdParam, nfcUID: nfcUIDParam } = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [nfcUID, setNfcUID] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'scan'>('select');

  useEffect(() => {
    loadArtworks();
    checkNfcSupport();
    return () => {
      stopNfc().catch(() => 0);
    };
  }, []);

  useEffect(() => {
    // If nfcUID is provided in params, set it
    if (nfcUIDParam && typeof nfcUIDParam === 'string') {
      setNfcUID(nfcUIDParam);
    }
    
    // If artworkId is provided in params, skip selection step
    if (artworkIdParam && typeof artworkIdParam === 'string') {
      loadArtworkById(artworkIdParam);
    }
  }, [artworkIdParam, nfcUIDParam]);

  const loadArtworkById = async (id: string) => {
    try {
      const { getArtworkById } = await import('@/lib/artworks');
      const artwork = await getArtworkById(id);
      if (artwork) {
        setSelectedArtwork(artwork);
        setStep('scan');
      }
    } catch (error) {
      console.error('Error loading artwork:', error);
      Alert.alert('Error', 'Failed to load artwork');
    }
  };

  const loadArtworks = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const allArtworks = await getArtworks(user.id);
      
      // Filter out artworks that already have NFC tags
      const artworksWithoutNfc = await Promise.all(
        allArtworks.map(async (artwork) => {
          const nfcTag = await getNFCTagByArtworkId(artwork.id);
          return nfcTag ? null : artwork;
        })
      );

      const filtered = artworksWithoutNfc.filter((a) => a !== null) as Artwork[];
      setArtworks(filtered);
    } catch (error) {
      console.error('Error loading artworks:', error);
      Alert.alert('Error', 'Failed to load artworks');
    } finally {
      setLoading(false);
    }
  };

  const checkNfcSupport = async () => {
    try {
      if (!isNfcModuleAvailable()) {
        setNfcSupported(false);
        return;
      }
      const supported = await isNfcSupported();
      setNfcSupported(supported);
    } catch (error) {
      console.error('Error checking NFC support:', error);
      setNfcSupported(false);
    }
  };

  const handleSelectArtwork = async (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    
    // If nfcUID is already provided, automatically link it
    if (nfcUID) {
      try {
        await linkNfcTag(artwork.id, nfcUID);
        Alert.alert(
          'Success',
          `NFC tag linked to "${artwork.title}" successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to link NFC tag');
      }
    } else {
      setStep('scan');
    }
  };

  const handleLinkTag = async () => {
    if (!selectedArtwork?.id) {
      Alert.alert('Error', 'Please select an artwork first');
      return;
    }

    if (nfcSupported === false) {
      Alert.alert(
        'NFC Not Available',
        'NFC is not available on this device or NFC Manager is not properly configured. Please ensure you are using a development build and NFC is enabled.',
        [{ text: 'OK' }]
      );
      return;
    }

    setScanning(true);
    try {
      const hasPermission = await requestNfcPermission();
      if (!hasPermission) {
        setScanning(false);
        return;
      }

      Alert.alert(
        'NFC Scanning',
        'Hold your NFC tag near the top of your device. Keep it steady until the scan completes.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: async () => {
              await stopNfc();
              setScanning(false);
            },
          },
          {
            text: 'Start Scan',
            onPress: async () => {
              try {
                // If nfcUID is already provided, use it directly
                if (nfcUID) {
                  await handleNfcScan(nfcUID);
                } else {
                  const scannedUID = await readNfcTag();
                  console.log('NFC Tag UID:', scannedUID);
                  await handleNfcScan(scannedUID);
                }
              } catch (error: any) {
                await stopNfc();
                if (error.message?.includes('cancelled')) {
                  setScanning(false);
                  return;
                }
                Alert.alert('Scan Error', error.message || 'Failed to read NFC tag. Please try again.');
                setScanning(false);
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error starting NFC scan:', error);
      Alert.alert('Error', error.message || 'Failed to start NFC scanning. Please try again.');
      await stopNfc();
      setScanning(false);
    }
  };

  const handleNfcScan = async (nfcUID: string) => {
    if (!selectedArtwork?.id) {
      Alert.alert('Error', 'Artwork ID not found');
      await stopNfc();
      setScanning(false);
      return;
    }

    try {
      await stopNfc();
      await linkNfcTag(selectedArtwork.id, nfcUID);
      
      Alert.alert('Success', `NFC tag linked successfully!\n\nTag UID: ${nfcUID}`, [
        {
          text: 'OK',
          onPress: () => {
            setScanning(false);
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error linking NFC tag:', error);
      await stopNfc();
      Alert.alert('Error', error.message || 'Failed to link NFC tag');
      setScanning(false);
    }
  };

  const handleBack = () => {
    if (step === 'scan') {
      setStep('select');
      setSelectedArtwork(null);
    } else {
      router.back();
    }
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

  return (
    <Screen scrollable edges={['top']}>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text
            style={[
              styles.title,
              {
                fontSize: theme.typography.heading1.fontSize,
                fontWeight: theme.typography.heading1.fontWeight,
                color: theme.colors.text,
              },
            ]}
          >
            {step === 'select' ? 'Select Artwork' : 'Link NFC Tag'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {step === 'select' ? (
          <>
            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.xl,
                },
              ]}
            >
              Select an artwork to link an NFC tag to. Artworks that already have NFC tags are not shown.
            </Text>

            {artworks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="images-outline" size={64} color={theme.colors.textTertiary} />
                <Text
                  style={[
                    styles.emptyText,
                    {
                      fontSize: theme.typography.fontSize.lg,
                      color: theme.colors.text,
                      marginTop: theme.spacing.base,
                    },
                  ]}
                >
                  No artworks available
                </Text>
                <Text
                  style={[
                    styles.emptySubtext,
                    {
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.textSecondary,
                      marginTop: theme.spacing.sm,
                    },
                  ]}
                >
                  All your artworks already have NFC tags, or you haven't created any artworks yet.
                </Text>
                <PrimaryButton
                  title="Create New Artwork"
                  onPress={() => router.push('/artworks/new')}
                  style={{ marginTop: theme.spacing.xl }}
                />
              </View>
            ) : (
              <FlatList
                data={artworks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectArtwork(item)}
                    style={[
                      styles.artworkCard,
                      {
                        backgroundColor: theme.colors.cardBackground,
                        borderRadius: theme.borderRadius.card,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.artworkImage} />
                    ) : (
                      <View
                        style={[
                          styles.artworkImage,
                          { backgroundColor: theme.colors.surfaceMuted, justifyContent: 'center', alignItems: 'center' },
                        ]}
                      >
                        <Ionicons name="image-outline" size={40} color={theme.colors.textTertiary} />
                      </View>
                    )}
                    <View style={styles.artworkInfo}>
                      <Text
                        style={[
                          styles.artworkTitle,
                          {
                            fontSize: theme.typography.fontSize.lg,
                            fontWeight: theme.typography.fontWeight.semibold,
                            color: theme.colors.text,
                          },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.artworkArtist,
                          {
                            fontSize: theme.typography.fontSize.base,
                            color: theme.colors.textSecondary,
                          },
                        ]}
                      >
                        {item.artist}
                      </Text>
                      {item.year && (
                        <Text
                          style={[
                            styles.artworkYear,
                            {
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.textTertiary,
                            },
                          ]}
                        >
                          {item.year}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        ) : (
          <>
            {selectedArtwork && (
              <Card style={{ marginBottom: theme.spacing.xl }}>
                <View style={styles.selectedArtworkContainer}>
                  {selectedArtwork.image_url ? (
                    <Image source={{ uri: selectedArtwork.image_url }} style={styles.selectedArtworkImage} />
                  ) : (
                    <View
                      style={[
                        styles.selectedArtworkImage,
                        { backgroundColor: theme.colors.surfaceMuted, justifyContent: 'center', alignItems: 'center' },
                      ]}
                    >
                      <Ionicons name="image-outline" size={40} color={theme.colors.textTertiary} />
                    </View>
                  )}
                  <View style={styles.selectedArtworkInfo}>
                    <Text
                      style={[
                        styles.selectedArtworkTitle,
                        {
                          fontSize: theme.typography.fontSize.lg,
                          fontWeight: theme.typography.fontWeight.semibold,
                          color: theme.colors.text,
                        },
                      ]}
                    >
                      {selectedArtwork.title}
                    </Text>
                    <Text
                      style={[
                        styles.selectedArtworkArtist,
                        {
                          fontSize: theme.typography.fontSize.base,
                          color: theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {selectedArtwork.artist}
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            <Text
              style={[
                styles.instructionText,
                {
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.xl,
                  textAlign: 'center',
                },
              ]}
            >
              {nfcSupported === false
                ? 'NFC is not available on this device. Please use a development build on a physical device with NFC support.'
                : 'Ready to link an NFC tag to this artwork. Tap the button below to start scanning.'}
            </Text>

            <View style={styles.nfcIconContainer}>
              <Ionicons name="radio-outline" size={80} color={theme.colors.primary} />
            </View>

            <PrimaryButton
              title={scanning ? 'Scanning...' : 'Link NFC Tag'}
              onPress={handleLinkTag}
              loading={scanning}
              disabled={scanning || nfcSupported === false}
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 5,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 34,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  artworkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  artworkImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  artworkInfo: {
    flex: 1,
  },
  artworkTitle: {
    marginBottom: 4,
  },
  artworkArtist: {
    marginBottom: 2,
  },
  artworkYear: {},
  selectedArtworkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedArtworkImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  selectedArtworkInfo: {
    flex: 1,
  },
  selectedArtworkTitle: {
    marginBottom: 4,
  },
  selectedArtworkArtist: {},
  instructionText: {
    marginBottom: 20,
  },
  nfcIconContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
});

