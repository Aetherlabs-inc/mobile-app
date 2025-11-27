import { supabase } from './supabase';

/**
 * Upload an image file to Supabase Storage
 * @param fileUri - Local file URI (from expo-image-picker)
 * @param bucketName - Name of the storage bucket (default: 'artwork_images')
 * @param folder - Optional folder path within the bucket
 * @returns Public URL of the uploaded image
 */
export async function uploadImage(
  fileUri: string,
  bucketName: string = 'artwork_images',
  folder?: string
): Promise<string> {
  try {
    // Get the file extension
    const fileExtension = fileUri.split('.').pop() || 'jpg';
    
    // Generate a unique filename
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Read the file - use fetch to get the file as a blob, then convert to array buffer
    // This approach works reliably in React Native
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    // Convert blob to array buffer
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);


    // Upload to Supabase Storage using ArrayBuffer
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, bytes, {
        contentType: `image/${fileExtension}`,
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw error;
  }
}

/**
 * Delete an image from Supabase Storage
 * @param filePath - Path to the file in storage
 * @param bucketName - Name of the storage bucket (default: 'artwork_images')
 */
export async function deleteImage(
  filePath: string,
  bucketName: string = 'artwork_images'
): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteImage:', error);
    throw error;
  }
}

