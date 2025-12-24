import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getNFCTagByUID, getArtworks, getArtworkById } from '@/lib/artworks';
import {
  isNfcSupported,
  readNfcTag,
  requestNfcPermission,
  stopNfc,
  isNfcModuleAvailable,
} from '@/lib/nfc';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ScanHistory {
  artworkTitle: string;
  timestamp: string;
  artworkId?: string;
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
  const [lastScan, setLastScan] = useState<ScanHistory | null>(null);
  const [recentScans, setRecentScans] = useState<ScanHistory[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [uniqueArtworks, setUniqueArtworks] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const router = useRouter();

  // Animation values
  const scanPulse = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkNfcAvailability();
    loadLastScan();
    return () => {
      stopNfc().catch(() => 0);
    };
  }, []);

  // Scanning pulse animation
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanPulse, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scanPulse, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanPulse.setValue(1);
    }
  }, [isScanning]);

  // Success animation
  useEffect(() => {
    if (scanResult.type === 'found') {
      Animated.spring(successScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      successScale.setValue(0);
    }
  }, [scanResult.type]);

  const loadLastScan = async () => {
    try {
      const stored = await AsyncStorage.getItem('lastScan');
      if (stored) {
        const scan: ScanHistory = JSON.parse(stored);
        setLastScan(scan);
      }

      const recentStored = await AsyncStorage.getItem('recentScans');
      if (recentStored) {
        const scans: ScanHistory[] = JSON.parse(recentStored);
        setRecentScans(scans.slice(0, 5));

        // Calculate stats
        setTotalScans(scans.length);
        const uniqueIds = new Set(scans.map(s => s.artworkId).filter(Boolean));
        setUniqueArtworks(uniqueIds.size);
      }
    } catch (error) {
      console.error('Error loading scans:', error);
    }
  };

  const saveLastScan = async (artworkTitle: string, artworkId?: string) => {
    try {
      const scan: ScanHistory = {
        artworkTitle,
        timestamp: new Date().toISOString(),
        artworkId,
      };
      await AsyncStorage.setItem('lastScan', JSON.stringify(scan));
      setLastScan(scan);

      const recentStored = await AsyncStorage.getItem('recentScans');
      let recentScansList: ScanHistory[] = recentStored ? JSON.parse(recentStored) : [];

      recentScansList = [scan, ...recentScansList.filter(s => s.artworkId !== artworkId)].slice(0, 10);
      await AsyncStorage.setItem('recentScans', JSON.stringify(recentScansList));
      setRecentScans(recentScansList.slice(0, 5));
    } catch (error) {
      console.error('Error saving scan:', error);
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
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

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const hasPermission = await requestNfcPermission();
      if (!hasPermission) {
        setIsScanning(false);
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
              setIsScanning(false);
            },
          },
          {
            text: 'Start Scan',
            onPress: async () => {
              try {
                const nfcUID = await readNfcTag();
                console.log('NFC Tag UID:', nfcUID);

                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                const nfcTag = await getNFCTagByUID(nfcUID);

                await stopNfc();

                if (nfcTag && nfcTag.is_bound && nfcTag.artwork_id) {
                  const artwork = await getArtworkById(nfcTag.artwork_id);

                  if (artwork) {
                    await saveLastScan(artwork.title, artwork.id);
                  }

                  setScanResult({
                    type: 'found',
                    artworkId: nfcTag.artwork_id,
                    nfcUID: nfcTag.nfc_uid,
                  });

                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                  setTimeout(() => {
                    router.push(`/artworks/${nfcTag.artwork_id}/authenticity`);
                    setIsScanning(false);
                    setScanResult({ type: null });
                  }, 1500);
                } else {
                  setScanResult({
                    type: 'not-found',
                    nfcUID: nfcUID,
                  });
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  setIsScanning(false);
                }
              } catch (error: any) {
                await stopNfc();

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Elegant Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Tap Into Art
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Scan to verify and explore
          </Text>
        </View>

        {/* Quick Stats Card */}
        {totalScans > 0 && (
          <View style={[styles.statsCard, {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius?.xl || 20,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }]}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Ionicons name="scan" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{totalScans}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Scans</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: theme.colors.accent + '15' }]}>
                  <Ionicons name="images" size={20} color={theme.colors.accent} />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{uniqueArtworks}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Artworks</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: theme.colors.success + '15' }]}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {lastScan ? formatRelativeTime(lastScan.timestamp) : 'Never'}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Last Scan</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions Menu */}
        <View style={styles.quickActionsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Quick Actions
            </Text>
          </View>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionCard, {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius?.lg || 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }]}
              onPress={() => router.push('/(tabs)/artworks')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
                <Ionicons name="images-outline" size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                View{'\n'}Artworks
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius?.lg || 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }]}
              onPress={() => router.push('/artworks/link-nfc')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
                <Ionicons name="link-outline" size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                Manage{'\n'}Tags
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius?.lg || 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }]}
              onPress={() => setShowTips(!showTips)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
                <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                Scan{'\n'}Tips
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* NFC Tips Expandable Card */}
        {showTips && (
          <View style={[styles.tipsCard, {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius?.xl || 20,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }]}>
            <View style={styles.tipsHeader}>
              <View style={[styles.tipsIconContainer, { backgroundColor: theme.colors.info + '15' }]}>
                <Ionicons name="bulb" size={20} color={theme.colors.info} />
              </View>
              <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
                Scanning Best Practices
              </Text>
            </View>
            <View style={styles.tipsList}>
              {[
                { icon: 'phone-portrait-outline', text: 'Hold phone steady near the tag' },
                { icon: 'wifi-outline', text: 'Keep NFC enabled in settings' },
                { icon: 'remove-outline', text: 'Remove phone case if needed' },
                { icon: 'time-outline', text: 'Wait 2-3 seconds for detection' },
              ].map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Ionicons name={tip.icon as any} size={18} color={theme.colors.textSecondary} />
                  <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                    {tip.text}
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.tipsCloseButton, {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.borderRadius?.base || 8,
              }]}
              onPress={() => setShowTips(false)}
            >
              <Text style={[styles.tipsCloseText, { color: theme.colors.textSecondary }]}>
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Scan Card */}
        <View style={[styles.scanCard, {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius?.xl || 20,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }]}>
          <View style={styles.scanContent}>
            {isScanning ? (
              <View style={styles.statusContainer}>
                <Animated.View style={[styles.iconCircle, {
                  backgroundColor: theme.colors.primary + '10',
                  borderWidth: 2,
                  borderColor: theme.colors.primary + '20',
                  transform: [{ scale: scanPulse }],
                }]}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </Animated.View>
                <Text style={[styles.statusTitle, { color: theme.colors.text }]}>Scanning</Text>
                <Text style={[styles.statusSubtitle, { color: theme.colors.textSecondary }]}>
                  Hold near the tag
                </Text>
              </View>
            ) : scanResult.type === 'found' ? (
              <View style={styles.statusContainer}>
                <Animated.View style={[styles.iconCircle, {
                  backgroundColor: theme.colors.success + '15',
                  borderWidth: 2,
                  borderColor: theme.colors.success + '30',
                  transform: [{ scale: successScale }],
                }]}>
                  <Ionicons name="checkmark" size={48} color={theme.colors.success} />
                </Animated.View>
                <Text style={[styles.statusTitle, { color: theme.colors.text }]}>Verified</Text>
                <Text style={[styles.statusSubtitle, { color: theme.colors.textSecondary }]}>
                  Opening artwork details
                </Text>
              </View>
            ) : scanResult.type === 'not-found' ? (
              <View style={styles.statusContainer}>
                <View style={[styles.iconCircle, {
                  backgroundColor: theme.colors.warning + '15',
                  borderWidth: 2,
                  borderColor: theme.colors.warning + '30',
                }]}>
                  <Ionicons name="link-outline" size={48} color={theme.colors.warning} />
                </View>
                <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
                  Unlinked Tag
                </Text>
                <Text style={[styles.statusSubtitle, { color: theme.colors.textSecondary }]}>
                  This tag needs to be connected to an artwork
                </Text>
                {scanResult.nfcUID && (
                  <View style={[styles.uidBadge, {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderRadius: theme.borderRadius?.base || 8,
                  }]}>
                    <Text style={[styles.uidText, { color: theme.colors.textTertiary }]}>
                      {scanResult.nfcUID}
                    </Text>
                  </View>
                )}

                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderRadius: theme.borderRadius?.md || 12,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }]}
                    onPress={handleLinkToExisting}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="link" size={20} color={theme.colors.primary} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                      Link Existing
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonPrimary, {
                      backgroundColor: theme.colors.primary,
                      borderRadius: theme.borderRadius?.md || 12,
                    }]}
                    onPress={handleCreateNew}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={20} color={theme.colors.textOnPrimary} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.textOnPrimary }]}>
                      Create New
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.secondaryButton, {
                    borderRadius: theme.borderRadius?.base || 8,
                  }]}
                  onPress={() => {
                    setScanResult({ type: null });
                    setIsScanning(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
                    Scan Another
                  </Text>
                </TouchableOpacity>
              </View>
            ) : scanResult.type === 'error' ? (
              <View style={styles.statusContainer}>
                <View style={[styles.iconCircle, {
                  backgroundColor: theme.colors.error + '15',
                  borderWidth: 2,
                  borderColor: theme.colors.error + '30',
                }]}>
                  <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
                </View>
                <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
                  Scan Failed
                </Text>
                <Text style={[styles.statusSubtitle, { color: theme.colors.textSecondary }]}>
                  {scanResult.errorMessage || 'Please try again'}
                </Text>
                <TouchableOpacity
                  style={[styles.primaryButton, {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.borderRadius?.md || 12,
                  }]}
                  onPress={() => {
                    setScanResult({ type: null });
                    handleScan();
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={20} color={theme.colors.textOnPrimary} />
                  <Text style={[styles.primaryButtonText, { color: theme.colors.textOnPrimary }]}>
                    Try Again
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {recentScans.length > 0 ? (
                  <View style={styles.recentScansWrapper}>
                    <View style={styles.recentScansHeader}>
                      <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
                      <Text style={[styles.recentScansTitle, { color: theme.colors.text }]}>
                        Recent
                      </Text>
                    </View>
                    <View style={styles.recentScansList}>
                      {recentScans.map((scan, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.recentScanItem, {
                            backgroundColor: theme.colors.surfaceMuted,
                            borderRadius: theme.borderRadius?.base || 8,
                          }]}
                          onPress={() => {
                            if (scan.artworkId) {
                              router.push(`/artworks/${scan.artworkId}`);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.recentScanLeft}>
                            <Text style={[styles.recentScanTitle, { color: theme.colors.text }]} numberOfLines={1}>
                              {scan.artworkTitle}
                            </Text>
                            <Text style={[styles.recentScanTime, { color: theme.colors.textTertiary }]}>
                              {formatRelativeTime(scan.timestamp)}
                            </Text>
                          </View>
                          {scan.artworkId && (
                            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyIconCircle, {
                      backgroundColor: theme.colors.surfaceMuted,
                    }]}>
                      <Ionicons name="radio-outline" size={36} color={theme.colors.textTertiary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
                      No scans yet
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
                      Scan your first NFC tag to begin
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Scan Button */}
        {!isScanning && scanResult.type !== 'found' && scanResult.type !== 'not-found' && scanResult.type !== 'error' && (
          <TouchableOpacity
            style={[styles.scanButton, {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius?.xl || 20,
              ...theme.shadows.md,
            }]}
            onPress={handleScan}
            disabled={isScanning}
            activeOpacity={0.85}
          >
            <View style={[styles.scanButtonIcon, {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: theme.borderRadius?.base || 8,
            }]}>
              <Ionicons name="scan" size={24} color={theme.colors.textOnPrimary} />
            </View>
            <Text style={[styles.scanButtonText, { color: theme.colors.textOnPrimary }]}>
              Start Scan
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 32,
    gap: 6,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  scanCard: {
    padding: 28,
    marginBottom: 20,
  },
  scanContent: {
    width: '100%',
  },
  statusContainer: {
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statusSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 20,
  },
  uidBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  uidText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  actionsContainer: {
    width: '100%',
    gap: 10,
    marginTop: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  actionButtonPrimary: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 32,
    gap: 8,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  recentScansWrapper: {
    width: '100%',
    gap: 14,
  },
  recentScansHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentScansTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  recentScansList: {
    gap: 8,
  },
  recentScanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  recentScanLeft: {
    flex: 1,
    gap: 3,
  },
  recentScanTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  recentScanTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 28,
    gap: 12,
  },
  scanButtonIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statsCard: {
    padding: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 60,
    marginHorizontal: 8,
  },
  quickActionsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    minHeight: 110,
    justifyContent: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
    letterSpacing: -0.2,
  },
  tipsCard: {
    padding: 20,
    marginBottom: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tipsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  tipsList: {
    gap: 14,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  tipsCloseButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  tipsCloseText: {
    fontSize: 15,
    fontWeight: '600',
  },
});