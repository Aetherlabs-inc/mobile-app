import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getNFCTagByUID, getArtworks, getArtworkById } from '@/lib/artworks';
import { Card } from '@/components/ui/Card';
import {
  isNfcSupported,
  isNfcEnabled,
  readNfcTag,
  requestNfcPermission,
  startNfc,
  stopNfc,
  isNfcModuleAvailable,
} from '@/lib/nfc';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LastScan {
  artworkTitle: string;
  timestamp: string;
}

export default function ScanScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    type: 'found' | 'not-found' | 'error' | null;
    artworkId?: string;
    nfcUID?: string;
    errorMessage?: string;
  }>({ type: null });
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [lastScan, setLastScan] = useState<LastScan | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkNfcAvailability();
    loadLastScan();
    return () => {
      stopNfc().catch(() => 0);
    };
  }, []);

  const loadLastScan = async () => {
    try {
      const stored = await AsyncStorage.getItem('lastScan');
      if (stored) {
        const scan: LastScan = JSON.parse(stored);
        setLastScan(scan);
      }
    } catch (error) {
      console.error('Error loading last scan:', error);
    }
  };

  const saveLastScan = async (artworkTitle: string) => {
    try {
      const scan: LastScan = {
        artworkTitle,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem('lastScan', JSON.stringify(scan));
      setLastScan(scan);
    } catch (error) {
      console.error('Error saving last scan:', error);
    }
  };

  const checkNfcAvailability = async () => {
    if (!isNfcModuleAvailable()) {
      setNfcSupported(false);
      return;
    }
    try {
      const supported = await isNfcSupported();
      setNfcSupported(supported);
    } catch (error) {
      console.error('Error checking NFC support:', error);
      setNfcSupported(false);
    }
  };

  const formatRelativeTime = (date: string): string => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return then.toLocaleDateString();
  };

  const handleScan = async () => {
    if (nfcSupported === false) {
      Alert.alert(
        'NFC Not Available',
        'NFC is not available on this device or NFC Manager is not properly configured. Please ensure you are using a development build and NFC is enabled.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsScanning(true);
    setScanResult({ type: null });
    
    // Light haptic feedback when starting scan
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Request NFC permission and check if enabled
      const hasPermission = await requestNfcPermission();
      if (!hasPermission) {
        setIsScanning(false);
        return;
      }

      // Show scanning instruction
      Alert.alert(
        'NFC Scanning',
        'Hold your NFC tag near the top of your device. Keep it steady until the scan completes.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: async () => {
              await stopNfc();
              setIsScanning(false);
            },
          },
          {
            text: 'Start Scan',
            onPress: async () => {
              try {
                // Read NFC tag
                const nfcUID = await readNfcTag();
                console.log('NFC Tag UID:', nfcUID);
                
                // Light haptic when tag is detected
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                
                // Look up NFC tag in database
                const nfcTag = await getNFCTagByUID(nfcUID);
                
                await stopNfc();
                
                if (nfcTag && nfcTag.is_bound && nfcTag.artwork_id) {
                  // Tag found and bound to artwork
                  const artwork = await getArtworkById(nfcTag.artwork_id);
                  
                  if (artwork) {
                    await saveLastScan(artwork.title);
                  }
                  
                  setScanResult({
                    type: 'found',
                    artworkId: nfcTag.artwork_id,
                    nfcUID: nfcTag.nfc_uid,
                  });
                  
                  // Success haptic and sound
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  
                  // Navigate to artwork detail
                  setTimeout(() => {
                    router.push(`/artworks/${nfcTag.artwork_id}`);
                    setIsScanning(false);
                    setScanResult({ type: null });
                  }, 1500);
                } else {
                  // Tag not found or not bound
                  setScanResult({
                    type: 'not-found',
                    nfcUID: nfcUID,
                  });
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  setIsScanning(false);
                }
              } catch (error: any) {
                await stopNfc();
                
                // Handle specific error types
                let errorMessage = 'We couldn\'t read this tag. Try again and move your phone slowly over the tag.';
                let errorType: 'error' = 'error';
                
                if (error.message?.includes('cancelled')) {
                  setIsScanning(false);
                  return;
                } else if (error.message?.includes('unsupported') || error.message?.includes('type')) {
                  errorMessage = 'This tag type is not supported. Please use a compatible NFC tag.';
                } else if (error.message?.includes('timeout')) {
                  errorMessage = 'Scan timed out. Please try again and hold your phone closer to the tag.';
                } else if (error.message) {
                  errorMessage = error.message;
                }
                
                setScanResult({
                  type: errorType,
                  errorMessage,
                });
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setIsScanning(false);
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error starting NFC scan:', error);
      setScanResult({
        type: 'error',
        errorMessage: error.message || 'Failed to start NFC scanning. Please try again.',
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await stopNfc();
      setIsScanning(false);
    }
  };

  const handleLinkToExisting = async () => {
    if (!scanResult.nfcUID) return;
    
    try {
      // Get user's artworks
      if (!user?.id) {
        Alert.alert('Error', 'User not found');
        return;
      }
      
      const artworks = await getArtworks(user.id);
      
      if (artworks.length === 0) {
        Alert.alert(
          'No Artworks',
          'You don\'t have any artworks yet. Create a new artwork first.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Create Artwork',
              onPress: () => {
                router.push(`/artworks/new?nfcUID=${scanResult.nfcUID}`);
              },
            },
          ]
        );
        return;
      }
      
      // Navigate to link NFC screen with the NFC UID
      router.push(`/artworks/link-nfc?nfcUID=${scanResult.nfcUID}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load artworks');
    }
  };

  const handleCreateNew = () => {
    if (!scanResult.nfcUID) return;
    router.push(`/artworks/new?nfcUID=${scanResult.nfcUID}`);
  };

  useEffect(() => {
    return () => {
      stopNfc().catch(() => 0);
      setIsScanning(false);
      setScanResult({ type: null });
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.scanArea}>
          {isScanning ? (
            <>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.scanningText, { color: theme.colors.text }]}>Scanning...</Text>
              <Text style={[styles.scanningSubtext, { color: theme.colors.textSecondary }]}>
                Hold your phone near the tag
              </Text>
            </>
          ) : scanResult.type === 'found' ? (
            <>
              <Ionicons name="checkmark-circle" size={80} color={theme.colors.success || theme.colors.primary} />
              <Text style={[styles.resultTitle, { color: theme.colors.text }]}>Tag Found</Text>
              <Text style={[styles.resultSubtext, { color: theme.colors.textSecondary }]}>
                Opening artwork...
              </Text>
            </>
          ) : scanResult.type === 'not-found' ? (
            <>
              <Ionicons name="link-outline" size={80} color={theme.colors.warning || theme.colors.primary} />
              <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
                Tag Not Linked
              </Text>
              <Text style={[styles.resultSubtext, { color: theme.colors.textSecondary }]}>
                This tag is not linked to an artwork yet.
              </Text>
              {scanResult.nfcUID && (
                <Text style={[styles.nfcUID, { color: theme.colors.textTertiary }]}>
                  NFC UID: {scanResult.nfcUID}
                </Text>
              )}
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderWidth: 1,
                      borderRadius: theme.borderRadius?.lg || 16,
                    },
                  ]}
                  onPress={handleLinkToExisting}
                >
                  <Ionicons name="link-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                    Link to existing artwork
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: theme.colors.primary,
                      borderRadius: theme.borderRadius?.lg || 16,
                    },
                  ]}
                  onPress={handleCreateNew}
                >
                  <Ionicons name="add-circle-outline" size={20} color={theme.colors.textOnPrimary || '#fff'} />
                  <Text style={[styles.actionButtonText, { color: theme.colors.textOnPrimary || '#fff' }]}>
                    Create new artwork and link
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : scanResult.type === 'error' ? (
            <>
              <Ionicons name="alert-circle" size={80} color={theme.colors.error || theme.colors.warning} />
              <Text style={[styles.resultTitle, { color: theme.colors.text }]}>Scan Error</Text>
              <Text style={[styles.resultSubtext, { color: theme.colors.textSecondary }]}>
                {scanResult.errorMessage || 'Something went wrong. Please try again.'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.retryButton,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.borderRadius?.lg || 16,
                    marginTop: 24,
                  },
                ]}
                onPress={() => {
                  setScanResult({ type: null });
                  handleScan();
                }}
              >
                <Text style={[styles.retryButtonText, { color: theme.colors.textOnPrimary || '#fff' }]}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.nfcIcon}>
                <Ionicons name="radio" size={80} color={theme.colors.primary} />
              </View>
              <Text style={[styles.instructionText, { color: theme.colors.text }]}>
                Hold your phone near the tag
              </Text>
            </>
          )}
        </View>

        {!isScanning && scanResult.type !== 'found' && scanResult.type !== 'not-found' && scanResult.type !== 'error' && (
          <TouchableOpacity
            style={[
              styles.scanButton,
              { 
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius?.lg || 16,
              },
              isScanning && styles.scanButtonDisabled
            ]}
            onPress={handleScan}
            disabled={isScanning}
          >
            <Ionicons name="scan" size={24} color={theme.colors.textOnPrimary || '#fff'} />
            <Text style={[styles.scanButtonText, { color: theme.colors.textOnPrimary || '#fff' }]}>
              Start Scan
            </Text>
          </TouchableOpacity>
        )}

        {scanResult.type === 'not-found' && (
          <TouchableOpacity
            style={[
              styles.retryButton,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.borderRadius?.lg || 16,
                marginTop: 16,
              },
            ]}
            onPress={() => {
              setScanResult({ type: null });
              setIsScanning(false);
            }}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.text }]}>Scan Another Tag</Text>
          </TouchableOpacity>
        )}

        {/* Last Scan Info */}
        {lastScan && scanResult.type !== 'found' && (
          <Card
            style={{
              marginTop: 24,
              padding: 16,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius?.lg || 16,
            }}
          >
            <View style={styles.lastScanContainer}>
              <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.lastScanText, { color: theme.colors.textSecondary }]}>
                Last scan: <Text style={{ fontWeight: '600', color: theme.colors.text }}>{lastScan.artworkTitle}</Text> • {formatRelativeTime(lastScan.timestamp)}
              </Text>
            </View>
          </Card>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  nfcIcon: {
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  scanningText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  scanningSubtext: {
    fontSize: 16,
    textAlign: 'center',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  resultSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  nfcUID: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  actionButtons: {
    width: '100%',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingVertical: 16,
    gap: 8,
    marginTop: 24,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  lastScanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lastScanText: {
    fontSize: 12,
    flex: 1,
  },
});
