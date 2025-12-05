import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Artwork, NFCTag } from '@/types';
import { getArtworkById, getNFCTagByArtworkId, deleteArtwork, unlinkNfcTag } from '@/lib/artworks';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

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

    useEffect(() => {
        loadArtwork();
    }, [id]);

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
        try {
            const artworkData = await getArtworkById(id);
            setArtwork(artworkData);

            if (artworkData) {
                console.log('Artwork loaded:', artworkData.title);
                console.log('Image URL:', artworkData.image_url);
                const tagData = await getNFCTagByArtworkId(id);
                setNfcTag(tagData);
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
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Artwork not found</Text>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <ScrollView style={[styles.scrollView, { backgroundColor: theme.colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Artwork Details</Text>
                    <View style={styles.placeholder} />
                </View>

                <View style={styles.heroImage}>
                    {artwork.image_url && !imageError ? (
                        <Image
                            source={{ uri: artwork.image_url }}
                            style={styles.heroImageContent}
                            resizeMode="cover"
                            onError={() => {
                                console.error('Error loading image:', artwork.image_url);
                                setImageError(true);
                            }}
                        />
                    ) : (
                        <Ionicons name="image" size={120} color="#ddd" />
                    )}
                </View>

                <View style={styles.content}>
                    <View style={styles.statusBadge}>
                        {artwork.status === 'verified' ? (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                <Text style={styles.statusTextVerified}>Verified</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="warning" size={20} color="#FF9800" />
                                <Text style={styles.statusTextUnverified}>Unverified</Text>
                            </>
                        )}
                    </View>

                    <Text style={styles.title}>{artwork.title}</Text>
                    <Text style={styles.artist}>{artwork.artist}</Text>

                    <View style={styles.metadata}>
                        <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Year</Text>
                            <Text style={styles.metadataValue}>{artwork.year}</Text>
                        </View>
                        <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Medium</Text>
                            <Text style={styles.metadataValue}>{artwork.medium}</Text>
                        </View>
                        <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Dimensions</Text>
                            <Text style={styles.metadataValue}>{artwork.dimensions}</Text>
                        </View>
                        {nfcTag && (
                            <View style={styles.metadataRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.metadataLabel}>NFC Tag</Text>
                                    <Text style={styles.metadataValue}>{nfcTag.nfc_uid}</Text>
                                </View>
                                {isOwner && (
                                    <TouchableOpacity
                                        onPress={handleUnlinkNfc}
                                        style={{ padding: 8 }}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#ff4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push(`/artworks/${artwork.id}/certificate`)}
                        >
                            <Ionicons name="document-text" size={20} color="#000" />
                            <Text style={styles.actionButtonText}>View Certificate</Text>
                        </TouchableOpacity>
                        {isOwner && !nfcTag && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => router.push(`/artworks/link-nfc?id=${artwork.id}`)}
                            >
                                <Ionicons name="radio" size={20} color="#000" />
                                <Text style={styles.actionButtonText}>Link NFC Tag</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="share" size={20} color="#000" />
                            <Text style={styles.actionButtonText}>Share</Text>
                        </TouchableOpacity>
                        {isOwner && (
                            <>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={handleEdit}
                                >
                                    <Ionicons name="create" size={20} color="#000" />
                                    <Text style={styles.actionButtonText}>Edit Metadata</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.deleteButton]}
                                    onPress={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="trash" size={20} color="#fff" />
                                            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                                                Delete Artwork
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
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
    },
    errorText: {
        fontSize: 18,
        color: '#666',
        marginBottom: 16,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    placeholder: {
        width: 40,
    },
    heroImage: {
        width: '100%',
        height: 400,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    heroImageContent: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        fontSize: 16,
        color: '#999',
    },
    content: {
        padding: 24,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#f0f8f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
        gap: 6,
    },
    statusTextVerified: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4CAF50',
    },
    statusTextUnverified: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF9800',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    artist: {
        fontSize: 18,
        color: '#666',
        marginBottom: 24,
    },
    metadata: {
        marginBottom: 24,
    },
    metadataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    metadataLabel: {
        fontSize: 16,
        color: '#666',
    },
    metadataValue: {
        fontSize: 16,
        fontWeight: '500',
    },
    actions: {
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    actionButtonDisabled: {
        opacity: 0.5,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    actionButtonTextDisabled: {
        color: '#999',
    },
    deleteButton: {
        backgroundColor: '#ff4444',
        marginTop: 8,
    },
    deleteButtonText: {
        color: '#fff',
    },
    backButtonText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '600',
    },
});
