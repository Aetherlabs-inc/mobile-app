import { supabase } from './supabase';
import { Certificate } from '@/types';
import { updateArtwork } from './artworks';

/**
 * Generate a unique certificate ID
 */
function generateCertificateId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

/**
 * Generate a simple hash (for blockchain simulation)
 * In production, this would connect to an actual blockchain service
 */
function generateBlockchainHash(certificateId: string, artworkId: string): string {
  // Simple hash simulation - replace with actual blockchain integration
  const data = `${certificateId}-${artworkId}-${Date.now()}`;
  // Using a simple hash function (in production, use actual blockchain)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
}

/**
 * Generate QR code URL for certificate
 * In production, use a QR code generation service or library
 */
function generateQRCodeUrl(certificateId: string, baseUrl?: string): string {
  // For now, using a placeholder QR code service
  // In production, generate QR code locally or use a service
  const url = baseUrl || 'https://aetherlabs.app/certificate';
  const qrData = `${url}/${certificateId}`;
  // Using a QR code API (replace with your preferred service)
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
}

/**
 * Create a certificate for an artwork
 */
export async function createCertificate(
  artworkId: string,
  options?: {
    generateQR?: boolean;
    generateBlockchainHash?: boolean;
    baseUrl?: string;
  }
): Promise<Certificate> {
  const certificateId = generateCertificateId();
  const qrCodeUrl = options?.generateQR !== false 
    ? generateQRCodeUrl(certificateId, options?.baseUrl)
    : undefined;
  const blockchainHash = options?.generateBlockchainHash !== false
    ? generateBlockchainHash(certificateId, artworkId)
    : undefined;

  const { data, error } = await supabase
    .from('certificates')
    .insert({
      artwork_id: artworkId,
      certificate_id: certificateId,
      qr_code_url: qrCodeUrl,
      blockchain_hash: blockchainHash,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating certificate:', error);
    throw error;
  }

  // Automatically mark artwork as verified when certificate is created
  try {
    await updateArtwork(artworkId, { status: 'verified' });
  } catch (updateError) {
    console.error('Error updating artwork status to verified:', updateError);
    // Don't throw - certificate was created successfully, status update is secondary
  }

  return data;
}

/**
 * Get certificate by artwork ID
 */
export async function getCertificateByArtworkId(artworkId: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('artwork_id', artworkId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching certificate:', error);
    return null;
  }

  return data;
}

/**
 * Get certificate by certificate ID (the unique certificate_id string)
 */
export async function getCertificateById(certificateId: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('certificate_id', certificateId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching certificate:', error);
    return null;
  }

  return data;
}

/**
 * Get certificate by database ID (UUID)
 */
export async function getCertificateByDbId(id: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching certificate:', error);
    return null;
  }

  return data;
}

/**
 * Get all certificates for a user (via their artworks)
 */
export async function getUserCertificates(userId: string): Promise<Certificate[]> {
  // First get user's artworks
  const { data: artworks, error: artworksError } = await supabase
    .from('artworks')
    .select('id')
    .eq('user_id', userId);

  if (artworksError) {
    console.error('Error fetching artworks:', artworksError);
    return [];
  }

  if (!artworks || artworks.length === 0) {
    return [];
  }

  const artworkIds = artworks.map(a => a.id);

  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .in('artwork_id', artworkIds)
    .order('generated_at', { ascending: false });

  if (error) {
    console.error('Error fetching certificates:', error);
    return [];
  }

  return data || [];
}

/**
 * Delete a certificate by database ID (UUID)
 */
export async function deleteCertificate(certificateId: string): Promise<void> {
  // First get the certificate to find the artwork_id
  // certificateId here is the database UUID (id field), not the certificate_id string
  const certificate = await getCertificateByDbId(certificateId);
  const artworkId = certificate?.artwork_id;

  const { error } = await supabase
    .from('certificates')
    .delete()
    .eq('id', certificateId);

  if (error) {
    console.error('Error deleting certificate:', error);
    throw error;
  }

  // If certificate was deleted and artwork exists, check if there are any other certificates
  // If no other certificates exist, mark artwork as unverified
  if (artworkId) {
    try {
      const remainingCertificates = await getCertificateByArtworkId(artworkId);
      if (!remainingCertificates) {
        // No certificates left, mark artwork as unverified
        await updateArtwork(artworkId, { status: 'unverified' });
      }
    } catch (updateError) {
      console.error('Error updating artwork status after certificate deletion:', updateError);
      // Don't throw - certificate was deleted successfully, status update is secondary
    }
  }
}

