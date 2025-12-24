import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Artwork } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getArtworks } from '@/lib/artworks';

export default function ArtworksScreen() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    loadArtworks();
  }, [user]);

  const loadArtworks = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getArtworks(user.id);
      setArtworks(data);
    } catch (error) {
      console.error('Error loading artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtworks = artworks.filter((artwork) => {
    const matchesSearch =
      artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artwork.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderArtworkCard = ({ item }: { item: Artwork }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius?.lg || 16,
          ...theme.shadows.base,
        },
      ]}
      onPress={() => router.push(`/artworks/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.cardImageContainer, { backgroundColor: theme.colors.surfaceMuted }]}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="image-outline" size={40} color={theme.colors.textTertiary} />
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={[styles.statusBadge, {
              backgroundColor: item.status === 'verified'
                ? theme.colors.success + '20'
                : theme.colors.warning + '20',
            }]}>
              {item.status === 'verified' ? (
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
              ) : (
                <Ionicons name="time-outline" size={14} color={theme.colors.warning} />
              )}
            </View>
          </View>
          <View style={styles.artistRow}>
            <Ionicons name="person-outline" size={14} color={theme.colors.textTertiary} />
            <Text style={[styles.cardArtist, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.artist}
            </Text>
          </View>
        </View>
        <View style={styles.cardMetadata}>
          <View style={styles.metadataItem}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.textTertiary} />
            <Text style={[styles.metadataText, { color: theme.colors.textSecondary }]}>
              {item.year}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Ionicons name="brush-outline" size={14} color={theme.colors.textTertiary} />
            <Text style={[styles.metadataText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.medium}
            </Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={[styles.statusIndicator, {
            backgroundColor: item.status === 'verified'
              ? theme.colors.success + '15'
              : theme.colors.warning + '15',
          }]}>
            {item.status === 'verified' ? (
              <>
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                <Text style={[styles.statusText, { color: theme.colors.success }]}>
                  Verified
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="time-outline" size={14} color={theme.colors.warning} />
                <Text style={[styles.statusText, { color: theme.colors.warning }]}>
                  Unverified
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
      <FlatList
        data={filteredArtworks}
        renderItem={renderArtworkCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        refreshing={loading}
        onRefresh={loadArtworks}
        ListHeaderComponent={
          <>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.headerTop}>
                <View style={styles.titleContainer}>
                  <Text style={[styles.greetingText, { color: theme.colors.text}]}>
                    <Text style={{ fontSize: 40, fontWeight: 'bold' }}>My</Text> Artworks
                  </Text>
                  {/* {filteredArtworks.length > 0 && (
                    <Text style={[styles.greetingSubtext, { color: theme.colors.text }]}>
                      {filteredArtworks.length} {filteredArtworks.length === 1 ? 'artwork' : 'artworks'}
                    </Text>
                  )} */}
                </View>
                {/* <TouchableOpacity
                  onPress={() => router.push('/artworks/link-nfc')}
                  style={[
                    styles.linkNfcButton,
                    {
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.borderRadius?.lg || 16,
                      ...theme.shadows.base,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.linkNfcIconContainer, { backgroundColor: theme.colors.surfaceMuted }]}>
                    <Ionicons name="radio" size={20} color={theme.colors.primary} />
                  </View>
                  <Text
                    style={[
                      styles.linkNfcButtonText,
                      {
                        color: theme.colors.text,
                        fontSize: 14,
                        marginLeft: 8,
                      },
                    ]}
                  >
                    Link NFC
                  </Text>
                </TouchableOpacity> */}
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderRadius: theme.borderRadius?.lg || 16,
                  },
                ]}
              >
                <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.text }]}
                  placeholder="Search by title or artist..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.surfaceMuted }]}>
              <Ionicons name="images-outline" size={64} color={theme.colors.textTertiary} />
            </View>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              {searchQuery ? 'No artworks found' : 'No artworks yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              {searchQuery
                ? 'Try a different search term'
                : 'Start building your collection by adding your first artwork'}
            </Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 25,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  greetingText: {
    fontSize: 40,
    fontWeight: '600',
    marginBottom: 1,
  },
  greetingSubtext: {
    fontSize: 45,
    fontWeight: 'bold',
  },
  linkNfcButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  linkNfcIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkNfcButtonText: {
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  card: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 16,
    overflow: 'hidden',
  },
  cardImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 16,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 10,
  },
  cardHeader: {
    gap: 6,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    lineHeight: 24,
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardArtist: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  cardMetadata: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 100,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});
