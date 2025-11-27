import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getNFCTagByUID, getArtworkById } from '@/lib/artworks';

export default function ScanScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    type: 'found' | 'not-found' | null;
    artworkId?: string;
    nfcUID?: string;
  }>({ type: null });
  const router = useRouter();

  const handleScan = async () => {
    setIsScanning(true);
    setScanResult({ type: null });
    
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // TODO: Replace with actual NFC reading
    // For now, simulate NFC scan with a mock UID
    // In production, use expo-nfc to read the actual NFC tag UID
    setTimeout(async () => {
      try {
        // Mock NFC UID - replace with actual NFC reading
        const mockNFCUID = 'mock-nfc-uid-123';
        
        // Look up NFC tag in database
        const nfcTag = await getNFCTagByUID(mockNFCUID);
        
        if (nfcTag && nfcTag.is_bound && nfcTag.artwork_id) {
          // Tag found and bound to artwork
          setScanResult({
            type: 'found',
            artworkId: nfcTag.artwork_id,
            nfcUID: nfcTag.nfc_uid,
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
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
            nfcUID: mockNFCUID,
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setIsScanning(false);
        }
      } catch (error) {
        console.error('Scan error:', error);
        setScanResult({ type: 'not-found' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsScanning(false);
      }
    }, 2000);
  };

  useEffect(() => {
    return () => {
      setIsScanning(false);
      setScanResult({ type: null });
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.scanArea}>
          {isScanning ? (
            <>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.scanningText}>Scanning...</Text>
              <Text style={styles.scanningSubtext}>Hold your phone near the tag</Text>
            </>
          ) : scanResult.type === 'not-found' ? (
            <>
              <Ionicons name="close-circle" size={80} color="#FF9800" />
              <Text style={styles.resultTitle}>Tag Not Found</Text>
              <Text style={styles.resultSubtext}>
                This tag is not linked to an artwork yet.
              </Text>
              {scanResult.nfcUID && (
                <Text style={styles.nfcUID}>NFC UID: {scanResult.nfcUID}</Text>
              )}
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => router.push('/artworks/new')}
              >
                <Text style={styles.linkButtonText}>Link to Artwork</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.nfcIcon}>
                <Ionicons name="radio" size={80} color="#000" />
              </View>
              <Text style={styles.instructionText}>Hold your phone near the tag</Text>
            </>
          )}
        </View>

        {!isScanning && scanResult.type !== 'found' && (
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
            onPress={handleScan}
            disabled={isScanning}
          >
            <Text style={styles.scanButtonText}>Start Scan</Text>
          </TouchableOpacity>
        )}

        {scanResult.type === 'not-found' && (
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => {
              setScanResult({ type: null });
              setIsScanning(false);
            }}
          >
            <Text style={styles.scanButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#666',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  resultSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  nfcUID: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  linkButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#000',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
