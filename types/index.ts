export type ProfileVisibility = 'private' | 'public';

export interface User {
  id: string;
  email: string;
  full_name: string;
  username?: string;
  slug?: string;
  avatar_url?: string;
  user_type?: string;
  bio?: string;
  website?: string;
  location?: string;
  phone?: string;
  instagram?: string;
  profile_visibility?: ProfileVisibility;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Artwork {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  year: number;
  medium: string;
  dimensions: string;
  status: 'verified' | 'unverified';
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NFCTag {
  id: string;
  artwork_id: string;
  nfc_uid: string;
  is_bound: boolean;
  binding_status: string;
  created_at?: string;
  updated_at?: string;
}

export interface VerificationLevel {
  id: string;
  artwork_id: string;
  level: string;
  verified_by?: string;
  verified_at?: string;
  created_at?: string;
}

export interface Certificate {
  id: string;
  artwork_id: string;
  certificate_id: string;
  qr_code_url?: string;
  blockchain_hash?: string;
  generated_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SurveyResponse {
  id: string;
  email: string;
  responses: Record<string, any>;
  certificate_id?: string;
  qr_code_url?: string;
  blockchain_hash?: string;
  generated_at?: string;
  created_at?: string;
  updated_at?: string;
}
