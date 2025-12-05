import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Platform, Switch, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Screen } from '@/components/ui/Screen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useNewArtworkStore } from '@/store/useNewArtworkStore';
import { linkNfcTag } from '@/lib/artworks';
import { createCertificate } from '@/lib/certificates';
import { requestNfcPermission, readNfcTag, stopNfc, isNfcSupported, isNfcModuleAvailable } from '@/lib/nfc';

export default function Step2NfcScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { nfcUID: nfcUIDParam } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [nfcUID, setNfcUID] = useState<string | null>(null);

  const {
    artworkId,
    generateCertificate,
    certificateId,
    setGenerateCertificate,
    setCertificateId,
  } = useNewArtworkStore();

  // Check NFC support on mount
  useEffect(() => {
    checkNfcSupport();
    
    // If nfcUID is provided in params, set it
    if (nfcUIDParam && typeof nfcUIDParam === 'string') {
      setNfcUID(nfcUIDParam);
    }
    
    // Cleanup on unmount
    return () => {
      stopNfc().catch(() => 0);
    };
  }, [nfcUIDParam]);

  const checkNfcSupport = async () => {
    try {
      // Check if NFC module is available first
      if (!isNfcModuleAvailable()) {
        setNfcSupported(false);
        return;
      }
      const supported = await isNfcSupported();
      setNfcSupported(supported);
    } catch (error) {
      console.warn('NFC not available (likely Expo Go or not configured):', error);
      // Set to false if NFC module is not available
      setNfcSupported(false);
    }
  };

  // Generate certificate if user wants it
  const handleCertificateToggle = async (value: boolean) => {
    setGenerateCertificate(value);

    if (value && !certificateId && artworkId) {
      // Generate certificate immediately
      setGeneratingCertificate(true);
      try {
        const certificate = await createCertificate(artworkId, {
          generateQR: true,
          generateBlockchainHash: true,
        });
        setCertificateId(certificate.id);
      } catch (error: any) {
        console.error('Error generating certificate:', error);
        Alert.alert('Error', 'Failed to generate certificate. You can still continue.');
        setGenerateCertificate(false);
      } finally {
        setGeneratingCertificate(false);
      }
    } else if (!value) {
      setCertificateId(null);
    }
  };

  const handleLinkTag = async () => {
    if (!artworkId) {
      Alert.alert('Error', 'Artwork ID not found. Please go back and try again.');
      return;
    }

    // Check NFC support
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
      // Request NFC permission and check if enabled
      const hasPermission = await requestNfcPermission();
      if (!hasPermission) {
        setScanning(false);
        return;
      }

      // Show scanning instruction
      Alert.alert(
        'NFC Scanning',
        'Hold your NFC tag near the back of your device. Keep it steady until the scan completes.',
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
                  // Read NFC tag
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

  const handleNfcScan = async (scannedUID: string) => {
    const uidToUse = nfcUID || scannedUID;
    if (!artworkId) {
      Alert.alert('Error', 'Artwork ID not found');
      await stopNfc();
      setScanning(false);
      return;
    }

    try {
      await stopNfc();
      
      await linkNfcTag(artworkId, uidToUse);
      
      // If certificate exists, note it's linked via artwork
      if (certificateId) {
        console.log('Certificate linked to artwork:', certificateId);
      }
      
      const successMessage = certificateId
        ? `NFC tag linked successfully!\n\nTag UID: ${uidToUse}\nCertificate: ${certificateId}`
        : `NFC tag linked successfully!\n\nTag UID: ${uidToUse}`;
      
      Alert.alert('Success', successMessage, [
        {
          text: 'OK',
          onPress: () => {
            setScanning(false);
            router.push('/(artworks)/new/step3-context');
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

  const handleSkip = () => {
    router.push('/(artworks)/new/step3-context');
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
            Certificate & NFC
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
            Step 2 of 3
          </Text>
        </View>

        <View style={styles.content}>
          {/* Certificate Generation Section */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.card,
                padding: theme.spacing.base,
                marginBottom: theme.spacing['2xl'],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={32}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.sectionContent}>
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
                  Generate Certificate
                </Text>
                <Text
                  style={[
                    styles.sectionDescription,
                    {
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.textSecondary,
                      marginBottom: theme.spacing.base,
                    },
                  ]}
                >
                  Create a digital certificate of authenticity with QR code and blockchain hash.
                </Text>
              </View>
              <Switch
                value={generateCertificate}
                onValueChange={handleCertificateToggle}
                disabled={generatingCertificate}
                trackColor={{
                  false: theme.colors.surfaceMuted,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.surface}
              />
            </View>
            {generatingCertificate && (
              <View style={styles.generatingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text
                  style={[
                    styles.generatingText,
                    {
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.textSecondary,
                      marginLeft: theme.spacing.sm,
                    },
                  ]}
                >
                  Generating certificate...
                </Text>
              </View>
            )}
            {certificateId && (
              <View
                style={[
                  styles.certificateInfo,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderRadius: theme.borderRadius.base,
                    padding: theme.spacing.sm,
                    marginTop: theme.spacing.base,
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={theme.colors.success}
                  style={{ marginRight: theme.spacing.xs }}
                />
                <Text
                  style={[
                    styles.certificateIdText,
                    {
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.text,
                      fontFamily: 'monospace',
                    },
                  ]}
                >
                  {certificateId}
                </Text>
              </View>
            )}
          </View>

          {/* NFC Tag Section */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.card,
                padding: theme.spacing.base,
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.borderRadius.full,
                  width: 100,
                  height: 100,
                  marginBottom: theme.spacing.base,
                  alignSelf: 'center',
                },
              ]}
            >
              <Ionicons
                name="radio-outline"
                size={56}
                color={theme.colors.primary}
              />
            </View>

            <Text
              style={[
                styles.question,
                {
                  fontSize: theme.typography.heading2.fontSize,
                  fontWeight: theme.typography.heading2.fontWeight,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.sm,
                  textAlign: 'center',
                },
              ]}
            >
              Link NFC Tag
            </Text>

            <Text
              style={[
                styles.description,
                {
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing.base,
                  textAlign: 'center',
                  lineHeight: theme.typography.lineHeight.relaxed,
                },
              ]}
            >
              {certificateId
                ? 'Link an NFC tag to your artwork. The certificate will be automatically associated with the tag.'
                : 'Link an NFC tag to verify and authenticate your artwork using near-field communication.'}
            </Text>

            {nfcSupported === false && (
              <View
                style={[
                  styles.note,
                  {
                    backgroundColor: theme.colors.errorBackground || theme.colors.surfaceMuted,
                    borderRadius: theme.borderRadius.base,
                    padding: theme.spacing.sm,
                    marginTop: theme.spacing.base,
                  },
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={16}
                  color={theme.colors.error}
                  style={{ marginRight: theme.spacing.xs }}
                />
                <Text
                  style={[
                    styles.noteText,
                    {
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.error,
                      flex: 1,
                    },
                  ]}
                >
                  NFC is not supported on this device. You can skip this step.
                </Text>
              </View>
            )}
            {nfcSupported === true && Platform.OS === 'ios' && (
              <View
                style={[
                  styles.note,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderRadius: theme.borderRadius.base,
                    padding: theme.spacing.sm,
                    marginTop: theme.spacing.base,
                  },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={theme.colors.textSecondary}
                  style={{ marginRight: theme.spacing.xs }}
                />
                <Text
                  style={[
                    styles.noteText,
                    {
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.textSecondary,
                      flex: 1,
                    },
                  ]}
                >
                  Make sure NFC is enabled in your device settings.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={scanning ? 'Scanning...' : nfcSupported === false ? 'NFC Not Available' : 'Link Tag Now'}
            onPress={handleLinkTag}
            loading={scanning}
            disabled={scanning || loading || generatingCertificate || nfcSupported === false}
            style={{ marginBottom: theme.spacing.base }}
          />
          <PrimaryButton
            title="Skip for Later"
            onPress={handleSkip}
            variant="outline"
            disabled={scanning || loading || generatingCertificate}
          />
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
  header: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sectionIconContainer: {
    marginRight: 12,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionDescription: {
    marginBottom: 8,
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  generatingText: {
    marginLeft: 8,
  },
  certificateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  certificateIdText: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  question: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteText: {
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
  },
});
