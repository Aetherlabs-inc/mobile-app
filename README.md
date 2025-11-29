# AetheraApp

A modern mobile application for artists, galleries, and collectors to register, authenticate, and manage artworks with NFC tag integration and digital certificates of authenticity.

## 📱 Overview

AetheraApp is a React Native application built with Expo that enables users to:
- Register artworks with detailed metadata
- Generate digital certificates of authenticity with QR codes and blockchain hashes
- Link NFC tags to artworks for physical authentication
- Manage and view their artwork collection
- Verify artwork authenticity through NFC scanning

## ✨ Features

### Core Functionality
- **Multi-Step Artwork Registration**
  - Step 1: Basic artwork information (title, artist, year, medium, dimensions, image)
  - Step 2: Certificate generation and NFC tag linking
  - Step 3: Additional context (location, pricing)
  - Success screen with artwork summary

- **Digital Certificates**
  - Unique certificate ID generation
  - QR code generation for verification
  - Blockchain hash for tamper-proof authentication
  - Certificate viewing and management

- **NFC Tag Integration**
  - Real-time NFC tag reading
  - Link NFC tags to artworks
  - Automatic certificate association with NFC tags
  - Cross-platform support (iOS & Android)

- **Artwork Management**
  - View all registered artworks
  - Search and filter artworks
  - Detailed artwork information
  - Status tracking (verified/unverified)

- **User Authentication**
  - Secure sign up and sign in
  - User profile management
  - Role-based access (artist, gallery, collector)

### UI/UX Features
- Clean, Apple-inspired minimal design
- Light and dark mode support
- Responsive layouts
- Smooth navigation
- Keyboard-aware forms
- Image upload and preview

## 🛠 Tech Stack

### Frontend
- **React Native** (0.81.5) - Mobile framework
- **Expo** (~54.0.25) - Development platform
- **Expo Router** (~6.0.15) - File-based routing
- **TypeScript** (5.3.3) - Type safety
- **Zustand** (5.0.8) - State management
- **React Native NFC Manager** (3.17.2) - NFC functionality

### Backend & Services
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Storage (for images)
  - Row Level Security (RLS)

### UI Components
- Custom theme system (light/dark)
- Reusable UI components (Screen, Input, Button, Card)
- Expo Vector Icons
- React Native Safe Area Context

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **pnpm** (package manager)
- **Expo CLI** (installed globally or via npx)
- **iOS Simulator** (for iOS development) or **Android Studio** (for Android)
- **Physical device** (required for NFC testing)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AetheraApp
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note**: Get these values from your Supabase project settings → API

### 4. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migrations in order:
   - `supabase/schema.sql` - Base schema (profiles, artworks, collections)
   - `supabase/migrations/create_user_profiles.sql` - User profiles table
   - `supabase/migrations/create_certificates.sql` - Certificates table

See `SUPABASE_SETUP.md` for detailed instructions.

### 5. Storage Bucket Setup

1. In Supabase dashboard, go to **Storage**
2. Create a bucket named `artwork_images`
3. Set it to **Public** (or configure RLS policies as needed)

### 6. Start Development Server

```bash
pnpm start
```

Or for specific platforms:

```bash
# iOS
pnpm ios

# Android
pnpm android

# Web
pnpm web
```

## 📁 Project Structure

```
AetheraApp/
├── app/                          # Expo Router pages
│   ├── (artworks)/              # Artwork-related routes
│   │   └── new/                 # Multi-step artwork registration
│   │       ├── step1-basic.tsx  # Basic artwork info
│   │       ├── step2-nfc.tsx    # Certificate & NFC linking
│   │       ├── step3-context.tsx # Additional context
│   │       └── success.tsx       # Success screen
│   ├── (auth)/                  # Authentication routes
│   │   ├── signin.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                  # Tab navigation
│   │   ├── home.tsx
│   │   ├── artworks.tsx
│   │   ├── scan.tsx
│   │   └── profile.tsx
│   └── artworks/
│       ├── [id].tsx             # Artwork detail
│       └── [id]/certificate.tsx # Certificate view
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── Screen.tsx
│   │   ├── Input.tsx
│   │   ├── PrimaryButton.tsx
│   │   └── Card.tsx
│   └── certificates/
│       └── CertificateGenerator.tsx
├── contexts/                    # React contexts
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── lib/                         # Utility functions
│   ├── artworks.ts              # Artwork API functions
│   ├── certificates.ts          # Certificate API functions
│   ├── nfc.ts                   # NFC utilities
│   ├── storage.ts               # Image upload functions
│   ├── supabase.ts              # Supabase client
│   └── theme.ts                 # Theme configuration
├── store/                       # Zustand stores
│   └── useNewArtworkStore.ts    # Artwork registration state
├── types/                       # TypeScript types
│   └── index.ts
└── supabase/
    ├── schema.sql               # Base database schema
    └── migrations/              # Database migrations
```

## 🔑 Key Features Explained

### Artwork Registration Flow

1. **Step 1 - Basic Information**
   - Title, artist name, year, medium, dimensions
   - Image upload (camera or gallery)
   - Status selection (verified/unverified)
   - Creates artwork in database

2. **Step 2 - Certificate & NFC**
   - Optional certificate generation
   - NFC tag linking
   - Certificate automatically associated with NFC tag

3. **Step 3 - Context**
   - Optional location
   - For sale toggle and price

4. **Success Screen**
   - Artwork summary
   - Options to view artwork or link NFC tag

### NFC Tag Reading

The app uses `react-native-nfc-manager` for NFC functionality:

- **iOS**: Requires NFC-enabled device (iPhone 7+)
- **Android**: Requires NFC-enabled device
- **Permissions**: Automatically requested on first use
- **Testing**: Must be done on physical devices (simulators don't support NFC)

### Certificate Generation

- Generates unique certificate IDs (format: `CERT-timestamp-random`)
- Creates QR codes for easy verification
- Generates blockchain hashes (currently simulated, ready for real blockchain integration)
- Links certificates to artworks and NFC tags

## 🧪 Testing

### NFC Testing

1. Build the app on a physical device:
   ```bash
   # For iOS
   pnpm ios

   # For Android
   pnpm android
   ```

2. Navigate to artwork registration → Step 2
3. Enable certificate generation (optional)
4. Tap "Link Tag Now"
5. Grant NFC permissions
6. Hold an NFC tag near the device
7. The app will read and display the tag's UID

### Development Mode

The app currently runs in **development mode** with Supabase operations disabled. To enable database operations:

1. Find code blocks marked with:
   ```typescript
   /* ========== ORIGINAL CODE (DISABLED) ========== */
   ```
2. Uncomment the code
3. Remove or comment out the dev mode sections

## 🏗 Building for Production

### iOS

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios
```

### Android

```bash
# Build for Android
eas build --platform android
```

See `DEV_BUILD_INSTRUCTIONS.md` for detailed build instructions.

## 🔧 Configuration

### App Configuration

Edit `app.json` for:
- App name and version
- Bundle identifiers
- Permissions
- Icons and splash screens

### Theme Configuration

Edit `lib/theme.ts` to customize:
- Colors (light/dark mode)
- Typography
- Spacing
- Border radius
- Shadows

## 🐛 Troubleshooting

### NFC Not Working

- **Issue**: NFC scanning doesn't work
- **Solutions**:
  - Ensure you're testing on a physical device (not simulator)
  - Check that NFC is enabled in device settings
  - Verify permissions are granted
  - Make sure the device supports NFC (iPhone 7+ for iOS)

### Image Upload Fails

- **Issue**: Images not uploading
- **Solutions**:
  - Check Supabase storage bucket exists and is public
  - Verify storage permissions in Supabase
  - Check network connection
  - Ensure file size is reasonable

### Database Connection Issues

- **Issue**: Can't connect to Supabase
- **Solutions**:
  - Verify `.env` file has correct credentials
  - Check Supabase project is active
  - Verify RLS policies are set correctly
  - Check network connectivity

### Metro Bundler Cache Issues

```bash
# Clear cache and restart
pnpm exec expo start --clear
```

## 📚 Additional Documentation

- `SUPABASE_SETUP.md` - Detailed Supabase setup guide
- `DEV_BUILD_INSTRUCTIONS.md` - Build instructions for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 👥 Authors

- **Rashod Korala** - Initial work

## 🙏 Acknowledgments

- Expo team for the amazing development platform
- Supabase for backend infrastructure
- React Native community for excellent libraries

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**Note**: This app requires physical devices for NFC testing. Simulators and emulators do not support NFC functionality.
