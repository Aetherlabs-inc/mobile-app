import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getArtworks } from '@/lib/artworks';
import { getUserStatistics } from '@/lib/profile';
import { getUserCertificates } from '@/lib/certificates';
import { supabase } from '@/lib/supabase';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { Card } from '@/components/ui/Card';

interface ActivityItem {
  id: string;
  type: 'artwork_created' | 'certificate_generated' | 'tag_linked' | 'scan';
  title: string;
  artworkTitle?: string;
  timestamp: string;
  relativeTime: string;
}

interface Tip {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const [stats, setStats] = useState({
    artworks: 0,
    certificates: 0,
    tagsLinked: 0,
    scansThisWeek: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  const loadStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Get comprehensive statistics
      const statistics = await getUserStatistics(user.id);

      // Get artworks to count bound tags
      const artworks = await getArtworks(user.id);
      const artworkIds = artworks.map(a => a.id);

      // Get bound NFC tags count
      const { count: tagsCount } = artworkIds.length > 0
        ? await supabase
          .from('nfc_tags')
          .select('*', { count: 'exact', head: true })
          .eq('is_bound', true)
          .in('artwork_id', artworkIds)
        : { count: 0 };

      // For now, scans this week is approximated by recent artworks with tags
      // In a real implementation, you'd track scans in a separate table
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentArtworks = artworks.filter(
        a => a.created_at && new Date(a.created_at) >= oneWeekAgo
      );
      const scansThisWeek = Math.min(recentArtworks.length, 10); // Placeholder

      setStats({
        artworks: statistics.artworks,
        certificates: statistics.certificates,
        tagsLinked: tagsCount || 0,
        scansThisWeek,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [user?.id]);

  const loadActivities = useCallback(async () => {
    if (!user?.id) return;
    try {
      const activityItems: ActivityItem[] = [];

      // Get recent artworks (last 10)
      const artworks = await getArtworks(user.id);
      const recentArtworks = artworks.slice(0, 5);
      recentArtworks.forEach(artwork => {
        if (artwork.created_at) {
          activityItems.push({
            id: `artwork-${artwork.id}`,
            type: 'artwork_created',
            title: 'New artwork registered',
            artworkTitle: artwork.title,
            timestamp: artwork.created_at,
            relativeTime: formatRelativeTime(artwork.created_at),
          });
        }
      });

      // Get recent certificates
      const certificates = await getUserCertificates(user.id);
      const recentCertificates = certificates.slice(0, 5);
      for (const cert of recentCertificates) {
        const artwork = artworks.find(a => a.id === cert.artwork_id);
        if (cert.generated_at) {
          activityItems.push({
            id: `cert-${cert.id}`,
            type: 'certificate_generated',
            title: 'New certificate generated',
            artworkTitle: artwork?.title,
            timestamp: cert.generated_at,
            relativeTime: formatRelativeTime(cert.generated_at),
          });
        }
      }

      // Get recent NFC tag links
      if (artworks.length > 0) {
        const artworkIds = artworks.map(a => a.id);
        const { data: recentTags } = await supabase
          .from('nfc_tags')
          .select('*')
          .in('artwork_id', artworkIds)
          .eq('is_bound', true)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentTags) {
          recentTags.forEach(tag => {
            if (tag.created_at) {
              const artwork = artworks.find(a => a.id === tag.artwork_id);
              activityItems.push({
                id: `tag-${tag.id}`,
                type: 'tag_linked',
                title: 'NFC tag linked',
                artworkTitle: artwork?.title,
                timestamp: tag.created_at,
                relativeTime: formatRelativeTime(tag.created_at),
              });
            }
          });
        }
      }

      // Sort by timestamp and take most recent 5
      activityItems.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setActivities(activityItems.slice(0, 5));
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadActivities()]);
      setLoading(false);
    };
    loadData();
  }, [loadStats, loadActivities]);

  const tips: Tip[] = [
    {
      id: '1',
      title: 'Place NFC tags behind framed works',
      description: 'Position tags on the back of the frame, near the top center for easy scanning.',
      icon: 'cube-outline',
    },
    {
      id: '2',
      title: 'What to tell collectors',
      description: 'When collectors scan your tag, they\'ll see the certificate and artwork details automatically.',
      icon: 'chatbubble-outline',
    },
    {
      id: '3',
      title: 'Why certificates matter',
      description: 'Digital certificates help establish provenance and can increase resale value of your artwork.',
      icon: 'shield-checkmark-outline',
    },
  ];

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'artwork_created':
        return 'images-outline';
      case 'certificate_generated':
        return 'document-text-outline';
      case 'tag_linked':
        return 'link-outline';
      case 'scan':
        return 'scan-outline';
      default:
        return 'ellipse-outline';
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={[styles.welcome, { color: theme.colors.textSecondary }]}>Welcome back,</Text>
              <Text style={[styles.name, { color: theme.colors.text }]}>
                {user?.full_name || 'User'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.profileButton,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.borderRadius?.full || 20,
                },
              ]}
              onPress={() => setShowProfileModal(true)}
            >
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                    },
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary Actions Section */}
        <View style={styles.section}>
          <View style={styles.primaryActions}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius?.lg || 16,
                },
              ]}
              onPress={() => router.push('/(tabs)/scan')}
            >
              <Ionicons name="scan" size={28} color={theme.colors.textOnPrimary || '#fff'} />
              <Text style={[styles.primaryButtonText, { color: theme.colors.textOnPrimary || '#fff' }]}>
                Scan a tag
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius?.lg || 16,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                },
              ]}
              onPress={() => router.push('/artworks/new')}
            >
              <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                Register new artwork
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius?.lg || 16,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                },
              ]}
              onPress={() => router.push('/(tabs)/artworks')}
            >
              <Ionicons name="images-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                View my artworks
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Snapshot Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Status Snapshot</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius?.lg || 16 }]}>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.artworks}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Artworks</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius?.lg || 16 }]}>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.certificates}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Certificates</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius?.lg || 16 }]}>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.tagsLinked}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Tags linked</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius?.lg || 16 }]}>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.scansThisWeek}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Scans this week</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity Section */}
        {activities.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Activity</Text>
            <Card style={{ padding: 0, borderRadius: theme.borderRadius?.lg || 16 }}>
              {activities.map((activity, index) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityItem,
                    {
                      borderBottomColor: theme.colors.border,
                      borderBottomWidth: index < activities.length - 1 ? 1 : 0,
                    },
                  ]}
                  onPress={() => {
                    if (activity.type === 'artwork_created' || activity.type === 'certificate_generated' || activity.type === 'tag_linked') {
                      // Navigate to artwork if we can find it
                      const artworkId = activity.id.split('-')[1];
                      if (artworkId) {
                        router.push(`/artworks/${artworkId}`);
                      }
                    }
                  }}
                >
                  <View style={[styles.activityIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
                    <Ionicons
                      name={getActivityIcon(activity.type) as any}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                      {activity.title}
                    </Text>
                    {activity.artworkTitle && (
                      <Text style={[styles.activitySubtitle, { color: theme.colors.textSecondary }]}>
                        {activity.artworkTitle}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.activityTime, { color: theme.colors.textTertiary }]}>
                    {activity.relativeTime}
                  </Text>
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tips for Artists</Text>
          {tips.map((tip) => (
            <Card
              key={tip.id}
              style={{
                ...styles.tipCard,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius?.lg || 16,
                marginBottom: theme.spacing?.base || 16,
              }}
            >
              <View style={styles.tipHeader}>
                <View style={[styles.tipIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
                  <Ionicons name={tip.icon as any} size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.tipTitle, { color: theme.colors.text }]}>{tip.title}</Text>
              </View>
              <Text style={[styles.tipDescription, { color: theme.colors.textSecondary }]}>
                {tip.description}
              </Text>
            </Card>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  welcome: {
    fontSize: 16,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  primaryActions: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  secondaryButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
  },
  activityTime: {
    fontSize: 12,
  },
  tipCard: {
    padding: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
