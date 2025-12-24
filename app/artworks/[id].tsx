import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, Modal, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Artwork, NFCTag } from '@/types';
import { getArtworkById, getPublicArtworkById, getNFCTagByArtworkId, deleteArtwork, unlinkNfcTag } from '@/lib/artworks';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ArtworkDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const theme = useTheme();
    const [artwork, setArtwork] = useState<Artwork | null>(null);
    const [nfcTag, setNfcTag] = useState<NFCTag | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [fullScreenImageVisible, setFullScreenImageVisible] = useState(false);

    useEffect(() => {
        loadArtwork();
    }, [id, user]);

    // Reset image loading state when artwork changes
    useEffect(() => {
        if (artwork) {
            setImageError(false);
            setImageLoading(true);
        }
    }, [artwork?.id, artwork?.image_url]);

    // Timeout for image loading (8 seconds)
    useEffect(() => {
        if (artwork?.image_url && !imageError && imageLoading) {
            const timeout = setTimeout(() => {
                console.warn('Image loading timeout for:', artwork.image_url);
                setImageLoading(false);
                // Don't set error immediately, just stop showing loading
                // The image might still load, just slowly
            }, 8000); // 8 second timeout

            return () => clearTimeout(timeout);
        }
    }, [artwork?.image_url, imageError, imageLoading]);

    const loadArtwork = async () => {
        if (!id || typeof id !== 'string' || id === 'new') {
            // Redirect to new artwork screen if id is "new"
            if (id === 'new') {
                router.replace('/artworks/new');
            }
            return;
        }
        setLoading(true);
        setImageError(false);
        setImageLoading(true);
        try {
            // Try to get artwork - use public function first, fallback to authenticated
            let artworkData = await getPublicArtworkById(id);

            // If public fetch fails and user is authenticated, try authenticated fetch
            if (!artworkData && user) {
                artworkData = await getArtworkById(id);
            }

            setArtwork(artworkData);

            if (artworkData) {
                console.log('Artwork loaded:', artworkData.title);
                console.log('Image URL:', artworkData.image_url);
                // Only fetch NFC tag if user is authenticated (NFC tags might be private)
                if (user) {
                    const tagData = await getNFCTagByArtworkId(id);
                    setNfcTag(tagData);
                }
            }
        } catch (error) {
            console.error('Error loading artwork:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Artwork',
            'Are you sure you want to delete this artwork? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (!artwork?.id) return;
                        setDeleting(true);
                        try {
                            await deleteArtwork(artwork.id);
                            Alert.alert('Success', 'Artwork deleted successfully', [
                                {
                                    text: 'OK',
                                    onPress: () => router.replace('/(tabs)/artworks'),
                                },
                            ]);
                        } catch (error: any) {
                            console.error('Error deleting artwork:', error);
                            Alert.alert('Error', error.message || 'Failed to delete artwork');
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    const handleEdit = () => {
        if (artwork?.id) {
            router.push(`/artworks/${artwork.id}/edit`);
        }
    };

    const handleUnlinkNfc = () => {
        if (!artwork?.id) return;
        Alert.alert(
            'Unlink NFC Tag',
            'Are you sure you want to unlink this NFC tag from the artwork?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Unlink',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await unlinkNfcTag(artwork.id);
                            setNfcTag(null);
                            Alert.alert('Success', 'NFC tag unlinked successfully');
                        } catch (error: any) {
                            console.error('Error unlinking NFC tag:', error);
                            Alert.alert('Error', error.message || 'Failed to unlink NFC tag');
                        }
                    },
                },
            ]
        );
    };

    const isOwner = artwork && user && artwork.user_id === user.id;

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!artwork) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={theme.colors.textTertiary} />
                    <Text style={[styles.errorText, { color: theme.colors.text }]}>Artwork not found</Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
                    >
                        <Text style={[styles.backButtonText, { color: theme.colors.textOnPrimary }]}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <ScrollView
                style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Top Header */}
                <View style={styles.topHeader}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Hero Image */}
                <View style={styles.imageWrapper}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                            if (artwork.image_url && !imageError) {
                                setFullScreenImageVisible(true);
                            }
                        }}
                        disabled={!artwork.image_url || imageError}
                    >
                        <View style={[styles.heroImageContainer, {
                            backgroundColor: theme.colors.surfaceMuted,
                            ...theme.shadows.md,
                        }]}>
                            {artwork.image_url && !imageError ? (
                                <>
                                    {imageLoading && (
                                        <View style={[styles.imageLoadingContainer, { backgroundColor: theme.colors.surfaceMuted }]}>
                                            <ActivityIndicator size="large" color={theme.colors.primary} />
                                            <Text style={[styles.imageLoadingText, { color: theme.colors.textSecondary }]}>
                                                Loading image...
                                            </Text>
                                        </View>
                                    )}
                                    <Image
                                        source={{ uri: artwork.image_url }}
                                        style={styles.heroImageContent}
                                        resizeMode="cover"
                                        onLoadStart={() => {
                                            setImageLoading(true);
                                            setImageError(false);
                                        }}
                                        onLoad={() => {
                                            setImageLoading(false);
                                            setImageError(false);
                                        }}
                                        onLoadEnd={() => {
                                            setImageLoading(false);
                                        }}
                                        onError={(error) => {
                                            console.error('Error loading image:', artwork.image_url, error);
                                            setImageError(true);
                                            setImageLoading(false);
                                        }}
                                    />
                                    {!imageLoading && (
                                        <View style={[styles.imageOverlay, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                                            <View style={[styles.imageOverlayBadge, {
                                                backgroundColor: theme.colors.surfaceElevated,
                                                ...theme.shadows.sm,
                                            }]}>
                                                <Ionicons name="expand-outline" size={16} color={theme.colors.text} />
                                                <Text style={[styles.imageOverlayText, { color: theme.colors.text }]}>
                                                    Tap to expand
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </>
                            ) : (
                                <View style={styles.imagePlaceholderContainer}>
                                    <View style={[styles.placeholderIconContainer, { backgroundColor: theme.colors.surface }]}>
                                        <Ionicons name="image-outline" size={64} color={theme.colors.textTertiary} />
                                    </View>
                                    <Text style={[styles.imagePlaceholderText, { color: theme.colors.textSecondary }]}>
                                        No Image Available
                                    </Text>
                                    <Text style={[styles.imagePlaceholderSubtext, { color: theme.colors.textTertiary }]}>
                                        This artwork doesn&apos;t have an image
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Full Screen Image Modal */}
                <Modal
                    visible={fullScreenImageVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setFullScreenImageVisible(false)}
                    statusBarTranslucent
                >
                    <View style={[styles.fullScreenModal, { backgroundColor: 'rgba(0,0,0,0.95)' }]}>
                        <StatusBar hidden />
                        <SafeAreaView style={styles.fullScreenModalContent} edges={['top']}>
                            <TouchableOpacity
                                style={[styles.fullScreenCloseButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                                onPress={() => setFullScreenImageVisible(false)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={28} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.fullScreenImageContainer}>
                                {artwork.image_url && (
                                    <Image
                                        source={{ uri: artwork.image_url }}
                                        style={styles.fullScreenImage}
                                        resizeMode="contain"
                                    />
                                )}
                            </View>
                            <View style={[styles.fullScreenFooter, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                                <Text style={styles.fullScreenTitle}>{artwork.title}</Text>
                                <Text style={styles.fullScreenArtist}>{artwork.artist}</Text>
                            </View>
                        </SafeAreaView>
                    </View>
                </Modal>

                {/* Title Section */}
                <View style={styles.titleSection}>
                    <View style={[styles.statusBadge, {
                        backgroundColor: artwork.status === 'verified'
                            ? theme.colors.success + '20'
                            : theme.colors.warning + '20',
                    }]}>
                        {artwork.status === 'verified' ? (
                            <>
                                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                                <Text style={[styles.statusText, { color: theme.colors.success }]}>
                                    Verified
                                </Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="time-outline" size={16} color={theme.colors.warning} />
                                <Text style={[styles.statusText, { color: theme.colors.warning }]}>
                                    Unverified
                                </Text>
                            </>
                        )}
                    </View>
                    <Text style={[styles.greetingText, { color: theme.colors.text }]}>
                        {artwork.title}
                    </Text>
                    <View style={styles.artistRow}>
                        <Ionicons name="person-outline" size={18} color={theme.colors.textSecondary} />
                        <Text style={[styles.artistText, { color: theme.colors.textSecondary }]}>
                            {artwork.artist}
                        </Text>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>

                    {/* Metadata Card */}
                    <View style={[styles.metadataCard, {
                        backgroundColor: theme.colors.surface,
                        borderRadius: theme.borderRadius?.lg || 16,
                        ...theme.shadows.base,
                    }]}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                                <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                Artwork Details
                            </Text>
                        </View>
                        <View style={styles.metadata}>
                            <View style={[styles.metadataRow, { borderBottomColor: theme.colors.border }]}>
                                <View style={styles.metadataItem}>
                                    <View style={[styles.metadataIconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
                                        <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                                    </View>
                                    <View style={styles.metadataTextContainer}>
                                        <Text style={[styles.metadataLabel, { color: theme.colors.textSecondary }]}>
                                            Year Created
                                        </Text>
                                        <Text style={[styles.metadataValue, { color: theme.colors.text }]}>
                                            {artwork.year}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={[styles.metadataRow, { borderBottomColor: theme.colors.border }]}>
                                <View style={styles.metadataItem}>
                                    <View style={[styles.metadataIconContainer, { backgroundColor: theme.colors.secondary + '10' }]}>
                                        <Ionicons name="brush-outline" size={20} color={theme.colors.secondary} />
                                    </View>
                                    <View style={styles.metadataTextContainer}>
                                        <Text style={[styles.metadataLabel, { color: theme.colors.textSecondary }]}>
                                            Medium
                                        </Text>
                                        <Text style={[styles.metadataValue, { color: theme.colors.text }]}>
                                            {artwork.medium}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={[styles.metadataRow, { borderBottomColor: theme.colors.border }]}>
                                <View style={styles.metadataItem}>
                                    <View style={[styles.metadataIconContainer, { backgroundColor: theme.colors.accent + '10' }]}>
                                        <Ionicons name="resize-outline" size={20} color={theme.colors.accent} />
                                    </View>
                                    <View style={styles.metadataTextContainer}>
                                        <Text style={[styles.metadataLabel, { color: theme.colors.textSecondary }]}>
                                            Dimensions
                                        </Text>
                                        <Text style={[styles.metadataValue, { color: theme.colors.text }]}>
                                            {artwork.dimensions}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            {nfcTag && (
                                <View style={[styles.metadataRow, styles.nfcRow]}>
                                    <View style={styles.metadataItem}>
                                        <View style={[styles.metadataIconContainer, { backgroundColor: theme.colors.info + '10' }]}>
                                            <Ionicons name="radio-outline" size={20} color={theme.colors.info} />
                                        </View>
                                        <View style={styles.metadataTextContainer}>
                                            <Text style={[styles.metadataLabel, { color: theme.colors.textSecondary }]}>
                                                NFC Tag ID
                                            </Text>
                                            <View style={styles.nfcTagContainer}>
                                                <Text style={[styles.nfcTagValue, { color: theme.colors.primary }]}>
                                                    {nfcTag.nfc_uid}
                                                </Text>
                                                {isOwner && (
                                                    <TouchableOpacity
                                                        onPress={handleUnlinkNfc}
                                                        style={[styles.unlinkButton, {
                                                            backgroundColor: theme.colors.errorBackground,
                                                        }]}
                                                    >
                                                        <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Public Actions */}
                    <View style={styles.actionsSection}>
                        <TouchableOpacity
                            style={[styles.actionButton, {
                                backgroundColor: theme.colors.surface,
                                borderRadius: theme.borderRadius?.lg || 16,
                                ...theme.shadows.base,
                            }]}
                            onPress={() => router.push(`/artworks/${artwork.id}/authenticity`)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.surfaceMuted }]}>
                                <Ionicons name="document-text-outline" size={28} color={theme.colors.primary} />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={[styles.actionCardTitle, { color: theme.colors.text }]}>
                                    View Certificate
                                </Text>
                                <Text style={[styles.actionCardSubtitle, { color: theme.colors.textSecondary }]}>
                                    Digital certificate of authenticity
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, {
                                backgroundColor: theme.colors.surface,
                                borderRadius: theme.borderRadius?.lg || 16,
                                ...theme.shadows.base,
                            }]}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.surfaceMuted }]}>
                                <Ionicons name="share-outline" size={28} color={theme.colors.primary} />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={[styles.actionCardTitle, { color: theme.colors.text }]}>
                                    Share Artwork
                                </Text>
                                <Text style={[styles.actionCardSubtitle, { color: theme.colors.textSecondary }]}>
                                    Share with others
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Owner Actions */}
                    {isOwner && (
                        <View style={[styles.ownerSection, {
                            backgroundColor: theme.colors.surface,
                            borderRadius: theme.borderRadius?.lg || 16,
                            ...theme.shadows.base,
                        }]}>
                            <View style={styles.ownerHeader}>
                                <View style={[styles.ownerIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                                    <Ionicons name="settings-outline" size={18} color={theme.colors.primary} />
                                </View>
                                <Text style={[styles.ownerLabel, { color: theme.colors.text }]}>
                                    Owner Controls
                                </Text>
                            </View>
                            <View style={styles.ownerActions}>
                                <TouchableOpacity
                                    style={[styles.ownerActionButton, {
                                        backgroundColor: theme.colors.primary,
                                        ...theme.shadows.base,
                                    }]}
                                    onPress={handleEdit}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="create-outline" size={22} color={theme.colors.textOnPrimary} />
                                    <Text style={[styles.ownerActionButtonText, { color: theme.colors.textOnPrimary }]}>
                                        Edit Artwork
                                    </Text>
                                </TouchableOpacity>
                                {!nfcTag && (
                                    <TouchableOpacity
                                        style={[styles.ownerActionButton, styles.secondaryActionButton, {
                                            backgroundColor: theme.colors.surface,
                                            borderColor: theme.colors.border,
                                            ...theme.shadows.sm,
                                        }]}
                                        onPress={() => router.push(`/artworks/link-nfc?id=${artwork.id}`)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="radio-outline" size={22} color={theme.colors.primary} />
                                        <Text style={[styles.ownerActionButtonText, { color: theme.colors.text }]}>
                                            Link NFC Tag
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.ownerActionButton, styles.deleteActionButton, {
                                        backgroundColor: theme.colors.error,
                                        ...theme.shadows.base,
                                    }]}
                                    onPress={handleDelete}
                                    disabled={deleting}
                                    activeOpacity={0.8}
                                >
                                    {deleting ? (
                                        <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
                                    ) : (
                                        <>
                                            <Ionicons name="trash-outline" size={22} color={theme.colors.textOnPrimary} />
                                            <Text style={[styles.ownerActionButtonText, { color: theme.colors.textOnPrimary }]}>
                                                Delete Artwork
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        gap: 16,
    },
    errorText: {
        fontSize: 18,
        marginBottom: 16,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageWrapper: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 28,
    },
    heroImageContainer: {
        width: '100%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 20,
    },
    heroImageContent: {
        width: '100%',
        height: '100%',
    },
    imageLoadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        zIndex: 1,
    },
    imageLoadingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        zIndex: 2,
    },
    imageOverlayBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 24,
        gap: 6,
    },
    imageOverlayText: {
        fontSize: 13,
        fontWeight: '600',
    },
    imagePlaceholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 40,
    },
    placeholderIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: 16,
        fontWeight: '600',
    },
    imagePlaceholderSubtext: {
        fontSize: 13,
        fontWeight: '400',
        textAlign: 'center',
    },
    fullScreenModal: {
        flex: 1,
    },
    fullScreenModalContent: {
        flex: 1,
    },
    fullScreenCloseButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    fullScreenImageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    fullScreenImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    fullScreenFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 40,
    },
    fullScreenTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    fullScreenArtist: {
        fontSize: 16,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.8)',
    },
    titleSection: {
        paddingHorizontal: 24,
        paddingBottom: 28,
        gap: 12,
    },
    content: {
        paddingHorizontal: 24,
        gap: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
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
    artistRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    artistText: {
        fontSize: 18,
        fontWeight: '500',
    },
    metadataCard: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    sectionIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    metadata: {
        gap: 0,
    },
    metadataRow: {
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    nfcRow: {
        borderBottomWidth: 0,
    },
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
    },
    metadataIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    metadataTextContainer: {
        flex: 1,
        gap: 4,
    },
    metadataLabel: {
        fontSize: 13,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    metadataValue: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 2,
    },
    nfcTagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    nfcTagValue: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'monospace',
        flex: 1,
    },
    unlinkButton: {
        padding: 6,
        borderRadius: 10,
    },
    actionsSection: {
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 20,
        gap: 16,
    },
    actionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionTextContainer: {
        flex: 1,
        gap: 4,
    },
    actionCardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    actionCardSubtitle: {
        fontSize: 13,
    },
    ownerSection: {
        padding: 20,
        gap: 18,
    },
    ownerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
    },
    ownerIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ownerLabel: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    ownerActions: {
        gap: 12,
    },
    ownerActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        padding: 16,
        gap: 10,
    },
    secondaryActionButton: {
        borderWidth: 1,
    },
    deleteActionButton: {
        marginTop: 4,
    },
    ownerActionButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
