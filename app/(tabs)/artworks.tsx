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
      style={[styles.card, { backgroundColor: theme.colors.surfaceMuted }]}
      onPress={() => router.push(`/artworks/${item.id}`)}
    >
      <View style={styles.cardImage}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <Ionicons name="image" size={48} color={theme.colors.textTertiary} />
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.cardYear, { color: theme.colors.textSecondary }]}>{item.year}</Text>
        <View style={styles.cardStatus}>
          {item.status === 'verified' ? (
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
          ) : (
            <Ionicons name="warning" size={16} color={theme.colors.warning} />
          )}
          <Text
            style={[
              styles.statusText,
              { color: theme.colors.textSecondary },
              item.status === 'verified' && { color: theme.colors.success },
            ]}
          >
            {item.status === 'verified' ? 'Verified' : 'Unverified'}
          </Text>
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
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Artworks</Text>
          <TouchableOpacity
            onPress={() => router.push('/artworks/link-nfc')}
            style={[
              styles.linkNfcButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.button,
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.base,
              },
            ]}
          >
            <Ionicons name="radio" size={18} color={theme.colors.textOnPrimary} />
            <Text
              style={[
                styles.linkNfcButtonText,
                {
                  color: theme.colors.textOnPrimary,
                  fontSize: theme.typography.fontSize.sm,
                  marginLeft: theme.spacing.xs,
                },
              ]}
            >
              Link NFC
            </Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceMuted }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search by title or artist..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      <FlatList
        data={filteredArtworks}
        renderItem={renderArtworkCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { backgroundColor: theme.colors.background }]}
        refreshing={loading}
        onRefresh={loadArtworks}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>No artworks found</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              {searchQuery ? 'Try a different search term' : 'Create your first artwork'}
            </Text>
          </View>
        }
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
  },
  linkNfcButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkNfcButtonText: {
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardImage: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 12,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardYear: {
    fontSize: 14,
    marginBottom: 4,
  },
  cardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
});
