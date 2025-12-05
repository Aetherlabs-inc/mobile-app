import { supabase } from './supabase';
import { Artwork, NFCTag } from '@/types';

export async function getArtworks(userId: string): Promise<Artwork[]> {
  const { data, error } = await supabase
    .from('artworks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching artworks:', error);
    throw error;
  }

  return data || [];
}

export async function getArtworkById(artworkId: string): Promise<Artwork | null> {
  const { data, error } = await supabase
    .from('artworks')
    .select('*')
    .eq('id', artworkId)
    .single();

  if (error) {
    console.error('Error fetching artwork:', error);
    return null;
  }

  return data;
}

export async function createArtwork(artwork: Omit<Artwork, 'id' | 'created_at' | 'updated_at'>): Promise<Artwork> {
  const { data, error } = await supabase
    .from('artworks')
    .insert(artwork)
    .select()
    .single();

  if (error) {
    console.error('Error creating artwork:', error);
    throw error;
  }

  return data;
}

export async function updateArtwork(artworkId: string, updates: Partial<Artwork>): Promise<Artwork> {
  const { data, error } = await supabase
    .from('artworks')
    .update(updates)
    .eq('id', artworkId)
    .select()
    .single();

  if (error) {
    console.error('Error updating artwork:', error);
    throw error;
  }

  return data;
}

export async function getNFCTagByUID(nfcUID: string): Promise<NFCTag | null> {
  const { data, error } = await supabase
    .from('nfc_tags')
    .select('*')
    .eq('nfc_uid', nfcUID)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching NFC tag:', error);
    return null;
  }

  return data;
}

export async function getNFCTagByArtworkId(artworkId: string): Promise<NFCTag | null> {
  const { data, error } = await supabase
    .from('nfc_tags')
    .select('*')
    .eq('artwork_id', artworkId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching NFC tag:', error);
    return null;
  }

  return data;
}

export async function linkNfcTag(artworkId: string, nfcUID: string): Promise<NFCTag> {
  // First check if tag exists
  const existingTag = await getNFCTagByUID(nfcUID);

  if (existingTag) {
    // Update existing tag
    const { data, error } = await supabase
      .from('nfc_tags')
      .update({
        artwork_id: artworkId,
        is_bound: true,
        binding_status: 'bound',
      })
      .eq('id', existingTag.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating NFC tag:', error);
      throw error;
    }

    return data;
  } else {
    // Create new tag
    const { data, error } = await supabase
      .from('nfc_tags')
      .insert({
        artwork_id: artworkId,
        nfc_uid: nfcUID,
        is_bound: true,
        binding_status: 'bound',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating NFC tag:', error);
      throw error;
    }

    return data;
  }
}

export async function bindNFCTagToArtwork(nfcUID: string, artworkId: string): Promise<NFCTag> {
  return linkNfcTag(artworkId, nfcUID);
}

/**
 * Delete an artwork
 */
export async function deleteArtwork(artworkId: string): Promise<void> {
  const { error } = await supabase
    .from('artworks')
    .delete()
    .eq('id', artworkId);

  if (error) {
    console.error('Error deleting artwork:', error);
    throw error;
  }
}

/**
 * Unlink NFC tag from artwork
 */
export async function unlinkNfcTag(artworkId: string): Promise<void> {
  const { error } = await supabase
    .from('nfc_tags')
    .update({
      artwork_id: null,
      is_bound: false,
      binding_status: 'unbound',
    })
    .eq('artwork_id', artworkId);

  if (error) {
    console.error('Error unlinking NFC tag:', error);
    throw error;
  }
}

/**
 * Delete NFC tag
 */
export async function deleteNfcTag(nfcTagId: string): Promise<void> {
  const { error } = await supabase
    .from('nfc_tags')
    .delete()
    .eq('id', nfcTagId);

  if (error) {
    console.error('Error deleting NFC tag:', error);
    throw error;
  }
}


