-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.artworks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  artist character varying NOT NULL,
  year integer NOT NULL,
  medium character varying NOT NULL,
  dimensions character varying NOT NULL,
  status character varying DEFAULT 'unverified'::character varying CHECK (status::text = ANY (ARRAY['verified'::character varying, 'unverified'::character varying]::text[])),
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT artworks_pkey PRIMARY KEY (id),
  CONSTRAINT artworks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  artwork_id uuid,
  certificate_id character varying NOT NULL UNIQUE,
  qr_code_url text,
  blockchain_hash text,
  generated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT certificates_pkey PRIMARY KEY (id),
  CONSTRAINT certificates_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id)
);
CREATE TABLE public.nfc_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  artwork_id uuid,
  nfc_uid character varying NOT NULL UNIQUE,
  is_bound boolean DEFAULT false,
  binding_status character varying DEFAULT 'pending'::character varying CHECK (binding_status::text = ANY (ARRAY['bound'::character varying, 'unbound'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nfc_tags_pkey PRIMARY KEY (id),
  CONSTRAINT nfc_tags_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id)
);
CREATE TABLE public.survey_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying,
  responses jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT survey_responses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  email character varying NOT NULL,
  full_name character varying,
  avatar_url text,
  user_type character varying DEFAULT 'artist'::character varying CHECK (user_type::text = ANY (ARRAY['artist'::character varying, 'gallery'::character varying, 'collector'::character varying]::text[])),
  bio text,
  website text,
  location character varying,
  phone character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  instagram text,
  username character varying,
  profile_visibility character varying DEFAULT 'private'::character varying CHECK (profile_visibility::text = ANY (ARRAY['private'::character varying, 'public'::character varying]::text[])),
  slug character varying,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.verification_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  artwork_id uuid,
  level character varying NOT NULL CHECK (level::text = ANY (ARRAY['unverified'::character varying, 'artist_verified'::character varying, 'gallery_verified'::character varying, 'third_party_verified'::character varying]::text[])),
  verified_by character varying,
  verified_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT verification_levels_pkey PRIMARY KEY (id),
  CONSTRAINT verification_levels_artwork_id_fkey FOREIGN KEY (artwork_id) REFERENCES public.artworks(id)
);