import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface ShareProfileModalProps {
  visible: boolean;
  url: string;
  userName?: string;
  onClose: () => void;
}

export function ShareProfileModal({ visible, url, userName, onClose }: ShareProfileModalProps) {
  const theme = useTheme();
  
  // Generate QR code URL using a QR code service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${userName || 'my'} artist profile on AetherLabs: ${url}`,
        url: url,
        title: `${userName || 'My'} Profile`,
      });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      // Use Share API as workaround for copying
      await Share.share({
        message: url,
        url: url,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
      console.error('Error copying link:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.xl,
            },
          ]}
        >
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  fontSize: theme.typography.heading2.fontSize,
                  fontWeight: theme.typography.heading2.fontWeight,
                  color: theme.colors.text,
                },
              ]}
            >
              Share Profile
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.borderRadius.full,
                },
              ]}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.qrContainer}>
            <Image
              source={{ uri: qrCodeUrl }}
              style={[
                styles.qrCode,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.borderRadius.base,
                },
              ]}
              resizeMode="contain"
            />
          </View>

          <View
            style={[
              styles.urlContainer,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.borderRadius.base,
                borderColor: theme.colors.border,
                borderWidth: 1,
                padding: theme.spacing.base,
                marginBottom: theme.spacing.base,
              },
            ]}
          >
            <Text
              style={[
                styles.urlText,
                {
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text,
                  flex: 1,
                },
              ]}
              numberOfLines={2}
              ellipsizeMode="middle"
            >
              {url}
            </Text>
            <TouchableOpacity
              onPress={handleCopyLink}
              style={styles.copyButton}
            >
              <Ionicons name="copy-outline" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.shareButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.base,
                  paddingVertical: theme.spacing.base,
                  paddingHorizontal: theme.spacing.lg,
                },
              ]}
              onPress={handleShare}
            >
              <Ionicons
                name="share-outline"
                size={20}
                color={theme.colors.textOnPrimary}
                style={{ marginRight: theme.spacing.sm }}
              />
              <Text
                style={[
                  styles.shareButtonText,
                  {
                    color: theme.colors.textOnPrimary,
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                  },
                ]}
              >
                Share Profile
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[
              styles.helperText,
              {
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textTertiary,
                textAlign: 'center',
                marginTop: theme.spacing.base,
              },
            ]}
          >
            Sharing your profile does not expose your artwork files. Artworks remain inside the AetherLabs app.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCode: {
    width: 250,
    height: 250,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urlText: {
    marginRight: 8,
  },
  copyButton: {
    padding: 4,
  },
  actionsContainer: {
    marginTop: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    // Styles applied via theme
  },
  helperText: {
    marginTop: 16,
  },
});

