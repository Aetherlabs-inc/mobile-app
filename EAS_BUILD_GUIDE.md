# EAS Build Guide for AetheraApp

This guide will help you build and test your app using EAS Build.

## Prerequisites

✅ EAS CLI installed (`eas` command available)
✅ Expo account (free tier works)
✅ Apple Developer account (for iOS builds)
✅ EAS project ID configured in `app.json`

## Step 1: Login to EAS

```bash
eas login
```

If you don't have an account, create one at [expo.dev](https://expo.dev)

## Step 2: Verify EAS Configuration

Your `eas.json` should have development and production profiles. Check it:

```bash
cat eas.json
```

## Step 3: Build for iOS Development

### Option A: Build and Install on Your Device

```bash
# Build for iOS development
eas build --platform ios --profile development
```

This will:
1. Upload your code to EAS servers
2. Build the app in the cloud
3. Provide a download link when complete

**After build completes:**
1. Download the `.ipa` file from the EAS dashboard
2. Install on your device using one of these methods:
   - **TestFlight** (recommended): Upload to App Store Connect, then install via TestFlight
   - **Direct Install**: Use Apple Configurator 2 or Xcode
   - **Ad Hoc Distribution**: If you've registered your device UDID

### Option B: Build and Download for Local Testing

```bash
# Build and download directly
eas build --platform ios --profile development --local
```

**Note:** Local builds require:
- macOS
- Xcode installed
- Takes longer but gives you more control

## Step 4: Build for Android Development

```bash
# Build for Android development
eas build --platform android --profile development
```

This will:
1. Build an APK file
2. Provide a download link
3. You can install directly on your Android device

**To install:**
1. Download the APK from EAS dashboard
2. Enable "Install from Unknown Sources" on your Android device
3. Transfer APK to device and install

## Step 5: Build for Both Platforms

```bash
# Build for both iOS and Android
eas build --platform all --profile development
```

## Build Profiles Explained

### Development Profile
- Includes development tools
- Can be installed on registered devices
- Faster build times
- Good for testing

### Preview Profile
- Production-like build
- Can be shared via link
- Good for beta testing

### Production Profile
- App Store / Play Store ready
- Optimized and signed
- For final release

## Monitoring Builds

### Check Build Status

```bash
# List recent builds
eas build:list

# View specific build
eas build:view [BUILD_ID]
```

### Build Dashboard

Visit: https://expo.dev/accounts/[your-account]/projects/AetheraApp/builds

## Installing on Device

### iOS Installation Methods

#### Method 1: TestFlight (Recommended)
1. Build with production profile
2. Upload to App Store Connect
3. Add testers in TestFlight
4. Testers install via TestFlight app

#### Method 2: Direct Install (Development)
1. Download `.ipa` from EAS
2. Use Xcode:
   ```bash
   # Open Xcode
   # Window > Devices and Simulators
   # Drag .ipa to your device
   ```
3. Or use Apple Configurator 2

#### Method 3: Ad Hoc Distribution
1. Register device UDID in Apple Developer portal
2. Build with ad hoc provisioning profile
3. Install via link or direct transfer

### Android Installation

1. Download APK from EAS dashboard
2. Transfer to Android device
3. Enable "Install from Unknown Sources"
4. Tap APK to install

## Testing NFC Features

After installing the development build:

1. **Enable NFC on Device:**
   - iOS: Settings → Control Center → Add NFC
   - Android: Settings → Connected Devices → NFC

2. **Grant Permissions:**
   - App will request NFC permission on first use
   - Grant permission when prompted

3. **Test NFC Reading:**
   - Navigate to artwork registration → Step 2
   - Tap "Link Tag Now"
   - Hold NFC tag near device
   - Should read tag UID

## Common Commands

```bash
# Build iOS development
eas build --platform ios --profile development

# Build Android development
eas build --platform android --profile development

# Build both platforms
eas build --platform all --profile development

# Build with local option (faster, requires local setup)
eas build --platform ios --profile development --local

# View build status
eas build:list

# Cancel a build
eas build:cancel [BUILD_ID]

# Configure EAS (if needed)
eas build:configure
```

## Troubleshooting

### Build Fails

1. **Check logs:**
   ```bash
   eas build:view [BUILD_ID]
   ```

2. **Common issues:**
   - Missing environment variables
   - Invalid Apple Developer credentials
   - Code signing issues
   - Missing dependencies

3. **Fix and rebuild:**
   ```bash
   # Fix the issue, then rebuild
   eas build --platform ios --profile development
   ```

### Can't Install on Device

**iOS:**
- Make sure device UDID is registered
- Check provisioning profile matches device
- Verify Apple Developer account is active

**Android:**
- Enable "Install from Unknown Sources"
- Check APK is for correct architecture (arm64, x86, etc.)
- Verify device has enough storage

### NFC Not Working

1. Verify you're using a development build (not Expo Go)
2. Check NFC is enabled in device settings
3. Ensure you're on a physical device (not simulator)
4. Grant NFC permissions when prompted
5. Check build includes NFC entitlements (already configured)

## Environment Variables

If your build needs environment variables:

1. **Set in EAS:**
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your_url"
   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_key"
   ```

2. **Or use .env file** (for local builds only)

## Next Steps

1. **Build your first development build:**
   ```bash
   eas build --platform ios --profile development
   ```

2. **Wait for build to complete** (usually 10-20 minutes)

3. **Download and install** on your device

4. **Test all features**, especially NFC

5. **Iterate and rebuild** as needed

## Tips

- **Development builds** are faster and good for testing
- **Preview builds** can be shared with testers
- **Production builds** are for App Store submission
- Builds are cached, so rebuilds are faster
- You can have multiple builds running simultaneously

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Build Status](https://expo.dev/accounts/[your-account]/projects/AetheraApp/builds)
- [Apple Developer Portal](https://developer.apple.com)
- [Google Play Console](https://play.google.com/console)

---

**Ready to build?** Run:
```bash
eas build --platform ios --profile development
```


