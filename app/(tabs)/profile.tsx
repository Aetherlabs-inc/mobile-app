import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { getUserStatistics, getProfileShareUrl, ensureUserSlug } from '@/lib/profile';
import { ShareProfileModal } from '@/components/profile/ShareProfileModal';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [statistics, setStatistics] = useState({
    artworks: 0,
    certificates: 0,
    collections: 0,
  });
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const loadStatistics = useCallback(async () => {
    if (!user?.id) return;
    try {
      const stats = await getUserStatistics(user.id);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, [user?.id]);

  const loadProfileUrl = useCallback(async () => {
    if (!user) return;
    try {
      const url = await getProfileShareUrl(user);
      setProfileUrl(url);
    } catch (error) {
      console.error('Error loading profile URL:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      loadStatistics();
      loadProfileUrl();
    }
  }, [user?.id, user?.slug, loadStatistics, loadProfileUrl]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/signin');
  };

  const handleLinkPress = (url: string) => {
    if (url) {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      Linking.openURL(formattedUrl).catch((err) => {
        console.error('Failed to open URL:', err);
      });
    }
  };

  const handleInstagramPress = () => {
    if (user?.instagram) {
      const instagramUrl = user.instagram.startsWith('@')
        ? `https://instagram.com/${user.instagram.slice(1)}`
        : user.instagram.startsWith('http')
          ? user.instagram
          : `https://instagram.com/${user.instagram}`;
      Linking.openURL(instagramUrl).catch((err) => {
        console.error('Failed to open Instagram:', err);
      });
    }
  };

  const handleShareProfile = async () => {
    if (!user) {
      Alert.alert('Error', 'Profile not available');
      return;
    }

    setIsGeneratingUrl(true);
    try {
      // Ensure slug exists before sharing
      await ensureUserSlug(user);
      const url = await getProfileShareUrl(user);
      setProfileUrl(url);
      setShowShareModal(true);
    } catch (error: any) {
      console.error('Error preparing profile share:', error);
      Alert.alert('Error', 'Failed to prepare profile share. Please try again.');
    } finally {
      setIsGeneratingUrl(false);
    }
  };

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
        {/* Header */}
        <View style={styles.header}>
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
            Profile
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <TouchableOpacity
              onPress={handleShareProfile}
              disabled={isGeneratingUrl}
              style={[
                styles.settingsButton,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.borderRadius.full,
                  padding: theme.spacing.sm,
                },
              ]}
            >
              {isGeneratingUrl ? (
                <ActivityIndicator size="small" color={theme.colors.text} />
              ) : (
                <Ionicons name="share-outline" size={24} color={theme.colors.text} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/profile/settings')}
              style={[
                styles.settingsButton,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.borderRadius.full,
                  padding: theme.spacing.sm,
                },
              ]}
            >
              <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Header Section */}
        <Card style={{ marginBottom: theme.spacing.base }}>
          <View style={styles.profileHeader}>
            <View
              style={[
                styles.avatarContainer,
                {
                  borderRadius: theme.borderRadius.full,
                  overflow: 'hidden',
                },
              ]}
            >
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                    },
                  ]}
                >
                  <Ionicons name="person" size={48} color={theme.colors.textTertiary} />
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text
                style={[
                  styles.name,
                  {
                    fontSize: theme.typography.heading2.fontSize,
                    fontWeight: theme.typography.heading2.fontWeight,
                    color: theme.colors.text,
                    marginBottom: theme.spacing.xs,
                  },
                ]}
              >
                {user?.full_name || 'User'}
              </Text>

              {user?.username && (
                <Text
                  style={[
                    styles.username,
                    {
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.textSecondary,
                      marginBottom: theme.spacing.xs,
                    },
                  ]}
                >
                  @{user.username}
                </Text>
              )}

              {user?.user_type && (
                <View
                  style={[
                    styles.userTypeBadge,
                    {
                      backgroundColor: theme.colors.primary + '20',
                      borderRadius: theme.borderRadius.base,
                      paddingVertical: theme.spacing.xs,
                      paddingHorizontal: theme.spacing.sm,
                      alignSelf: 'flex-start',
                      marginBottom: theme.spacing.xs,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.userTypeText,
                      {
                        color: theme.colors.primary,
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.semibold,
                      },
                    ]}
                  >
                    {user.user_type ? user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1) : ''}
                  </Text>
                </View>
              )}

              <Text
                style={[
                  styles.email,
                  {
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  },
                ]}
              >
                {user?.email}
              </Text>
            </View>
          </View>

          {user?.bio && (
            <View
              style={[
                styles.bioSection,
                {
                  borderTopColor: theme.colors.border,
                  borderTopWidth: 1,
                  marginTop: theme.spacing.base,
                  paddingTop: theme.spacing.base,
                },
              ]}
            >
              <Text
                style={[
                  styles.bio,
                  {
                    fontSize: theme.typography.fontSize.base,
                    color: theme.colors.text,
                    lineHeight: 22,
                  },
                ]}
              >
                {user.bio}
              </Text>
            </View>
          )}
        </Card>

        {/* Statistics Section */}
        <Card style={{ marginBottom: theme.spacing.base }}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: theme.typography.heading2.fontSize,
                fontWeight: theme.typography.heading2.fontWeight,
                color: theme.colors.text,
                marginBottom: theme.spacing.base,
              },
            ]}
          >
            Statistics
          </Text>
          <View style={styles.statisticsContainer}>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.borderRadius.base,
                  padding: theme.spacing.base,
                },
              ]}
            >
              <Text
                style={[
                  styles.statNumber,
                  {
                    fontSize: theme.typography.heading1.fontSize,
                    fontWeight: theme.typography.heading1.fontWeight,
                    color: theme.colors.text,
                  },
                ]}
              >
                {statistics.artworks}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  {
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  },
                ]}
              >
                Artworks
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.borderRadius.base,
                  padding: theme.spacing.base,
                },
              ]}
            >
              <Text
                style={[
                  styles.statNumber,
                  {
                    fontSize: theme.typography.heading1.fontSize,
                    fontWeight: theme.typography.heading1.fontWeight,
                    color: theme.colors.text,
                  },
                ]}
              >
                {statistics.certificates}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  {
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  },
                ]}
              >
                Certificates
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.borderRadius.base,
                  padding: theme.spacing.base,
                },
              ]}
            >
              <Text
                style={[
                  styles.statNumber,
                  {
                    fontSize: theme.typography.heading1.fontSize,
                    fontWeight: theme.typography.heading1.fontWeight,
                    color: theme.colors.text,
                  },
                ]}
              >
                {statistics.collections}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  {
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                  },
                ]}
              >
                Collections
              </Text>
            </View>
          </View>
        </Card>

        {/* Contact Information Section */}
        {(user?.website || user?.phone || user?.location || user?.instagram) && (
          <Card style={{ marginBottom: theme.spacing.base }}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  fontSize: theme.typography.heading2.fontSize,
                  fontWeight: theme.typography.heading2.fontWeight,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.base,
                },
              ]}
            >
              Contact Information
            </Text>

            {user?.website && (
              <TouchableOpacity
                style={[
                  styles.contactItem,
                  {
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: 1,
                    paddingBottom: theme.spacing.sm,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
                onPress={() => handleLinkPress(user.website!)}
              >
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text
                  style={[
                    styles.contactLabel,
                    {
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.textSecondary,
                      marginRight: theme.spacing.sm,
                    },
                  ]}
                >
                  Website:
                </Text>
                <Text
                  style={[
                    styles.contactValue,
                    {
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.primary,
                      flex: 1,
                    },
                  ]}
                >
                  {user.website}
                </Text>
                <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            )}

            {user?.phone && (
              <TouchableOpacity
                style={[
                  styles.contactItem,
                  {
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: 1,
                    paddingBottom: theme.spacing.sm,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
                onPress={() => Linking.openURL(`tel:${user.phone}`)}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text
                  style={[
                    styles.contactLabel,
                    {
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.textSecondary,
                      marginRight: theme.spacing.sm,
                    },
                  ]}
                >
                  Phone:
                </Text>
                <Text
                  style={[
                    styles.contactValue,
                    {
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.text,
                      flex: 1,
                    },
                  ]}
                >
                  {user.phone}
                </Text>
              </TouchableOpacity>
            )}

            {user?.location && (
              <View
                style={[
                  styles.contactItem,
                  {
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: 1,
                    paddingBottom: theme.spacing.sm,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text
                  style={[
                    styles.contactLabel,
                    {
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.textSecondary,
                      marginRight: theme.spacing.sm,
                    },
                  ]}
                >
                  Location:
                </Text>
                <Text
                  style={[
                    styles.contactValue,
                    {
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.text,
                      flex: 1,
                    },
                  ]}
                >
                  {user.location}
                </Text>
              </View>
            )}

            {user?.instagram && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={handleInstagramPress}
              >
                <Ionicons
                  name="logo-instagram"
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text
                  style={[
                    styles.contactLabel,
                    {
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.textSecondary,
                      marginRight: theme.spacing.sm,
                    },
                  ]}
                >
                  Instagram:
                </Text>
                <Text
                  style={[
                    styles.contactValue,
                    {
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.primary,
                      flex: 1,
                    },
                  ]}
                >
                  {user.instagram}
                </Text>
                <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* Account Information Section */}
        <Card style={{ marginBottom: theme.spacing.base }}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: theme.typography.heading2.fontSize,
                fontWeight: theme.typography.heading2.fontWeight,
                color: theme.colors.text,
                marginBottom: theme.spacing.base,
              },
            ]}
          >
            Account Information
          </Text>

          <View
            style={[
              styles.accountInfo,
              {
                borderBottomColor: theme.colors.border,
                borderBottomWidth: 1,
                paddingBottom: theme.spacing.sm,
                marginBottom: theme.spacing.sm,
              },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={theme.colors.textSecondary}
              style={{ marginRight: theme.spacing.sm }}
            />
            <Text
              style={[
                styles.accountInfoText,
                {
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary,
                },
              ]}
            >
              Member since:{' '}
              <Text
                style={{
                  color: theme.colors.text,
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              >
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                  : 'N/A'}
              </Text>
            </Text>
          </View>

          <View style={styles.accountInfo}>
            <Ionicons
              name="time-outline"
              size={18}
              color={theme.colors.textSecondary}
              style={{ marginRight: theme.spacing.sm }}
            />
            <Text
              style={[
                styles.accountInfoText,
                {
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary,
                },
              ]}
            >
              Last updated:{' '}
              <Text
                style={{
                  color: theme.colors.text,
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              >
                {user?.updated_at
                  ? new Date(user.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                  : 'N/A'}
              </Text>
            </Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.base,
                paddingVertical: theme.spacing.base,
                paddingHorizontal: theme.spacing.lg,
                marginBottom: theme.spacing.base,
              },
            ]}
            onPress={() => router.push('/profile/settings')}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={theme.colors.textOnPrimary}
              style={{ marginRight: theme.spacing.sm }}
            />
            <Text
              style={[
                styles.actionButtonText,
                {
                  color: theme.colors.textOnPrimary,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                },
              ]}
            >
              Edit Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.errorBackground || theme.colors.surfaceMuted,
                borderRadius: theme.borderRadius.base,
                paddingVertical: theme.spacing.base,
                paddingHorizontal: theme.spacing.lg,
              },
            ]}
            onPress={handleSignOut}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={theme.colors.error}
              style={{ marginRight: theme.spacing.sm }}
            />
            <Text
              style={[
                styles.actionButtonText,
                {
                  color: theme.colors.error,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                },
              ]}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Share Profile Modal */}
      {profileUrl && (
        <ShareProfileModal
          visible={showShareModal}
          url={profileUrl}
          userName={user?.full_name}
          onClose={() => setShowShareModal(false)}
        />
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  title: {
    flex: 1,
  },
  settingsButton: {
    marginLeft: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    marginRight: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    marginBottom: 4,
  },
  userTypeBadge: {
    marginBottom: 4,
  },
  userTypeText: {
    // Styles applied via theme
  },
  email: {
    marginTop: 4,
  },
  username: {
    // Styles applied via theme
  },
  bioSection: {
    marginTop: 16,
    paddingTop: 16,
  },
  bio: {
    // Styles applied via theme
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statisticsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    marginBottom: 4,
  },
  statLabel: {
    marginTop: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
  },
  contactLabel: {
    marginRight: 8,
  },
  contactValue: {
    flex: 1,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
  },
  accountInfoText: {
    flex: 1,
  },
  actionsContainer: {
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  actionButtonText: {
    // Styles applied via theme
  },
});
