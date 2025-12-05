# Development Testing Guide

This guide explains how to test the AetheraApp in development mode.

## Prerequisites

1. **Node.js** (v18 or later)
2. **pnpm** package manager
3. **Expo CLI** (installed globally or via npx)
4. **iOS Simulator** (for Mac users) or **Android Emulator**
5. **Physical Device** (for NFC testing - iPhone 7+ or Android with NFC)

## Initial Setup

### 1. Install Dependencies

```bash
cd /Users/rashodkorala/Documents/Gihub/AetheraApp
pnpm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start Development Server

```bash
pnpm start
# or
npx expo start
```

This will:
- Start the Metro bundler
- Show a QR code for Expo Go (if using)
- Provide options to open on iOS/Android

## Testing Methods

### Option 1: Expo Go (Limited Features)

**Pros:**
- Quick testing
- No build required
- Works on physical devices

**Cons:**
- NFC features won't work
- Some native modules may not be available

**Steps:**
1. Install Expo Go app on your phone (iOS App Store or Google Play)
2. Run `pnpm start`
3. Scan QR code with Expo Go app
4. App will load in Expo Go

### Option 2: Development Build (Recommended)

**Pros:**
- Full access to native features (NFC, camera, etc.)
- Production-like experience
- Can test all features

**Cons:**
- Requires building the app first
- Takes longer to set up

#### For iOS (Mac Required)

**Using EAS Build (Cloud):**

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to EAS:**
   ```bash
   eas login
   ```

3. **Configure EAS (if not already done):**
   ```bash
   eas build:configure
   ```

4. **Build for iOS Development:**
   ```bash
   eas build --platform ios --profile development
   ```

5. **Install on Device:**
   - Download the build from EAS dashboard
   - Install via TestFlight or direct install
   - Make sure your device UDID is registered in Apple Developer account

**Using Local Build:**

1. **Prebuild iOS project:**
   ```bash
   npx expo prebuild --platform ios
   ```

2. **Install iOS dependencies:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Open in Xcode:**
   ```bash
   npx expo run:ios
   # or
   open ios/AetheraApp.xcworkspace
   ```

4. **In Xcode:**
   - Select your Team (Apple Developer account)
   - Select your device or simulator
   - Click Run (⌘R)

#### For Android

**Using EAS Build (Cloud):**

1. **Build for Android Development:**
   ```bash
   eas build --platform android --profile development
   ```

2. **Install APK:**
   - Download from EAS dashboard
   - Install on Android device

**Using Local Build:**

1. **Prebuild Android project:**
   ```bash
   npx expo prebuild --platform android
   ```

2. **Run on Android:**
   ```bash
   npx expo run:android
   ```

   Make sure you have:
   - Android Studio installed
   - Android SDK configured
   - Emulator running or device connected via USB

## Testing Workflows

### 1. Basic App Testing

```bash
# Start development server
pnpm start

# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Scan QR code for physical device
```

### 2. Testing NFC Features

**Important:** NFC only works on:
- Physical devices (iPhone 7+ or Android with NFC)
- Development builds (not Expo Go)

**Steps:**
1. Build a development build (see Option 2 above)
2. Install on physical device
3. Enable NFC in device settings
4. Test NFC reading in artwork registration flow

### 3. Testing Image Upload

1. Grant camera/media permissions when prompted
2. Test both camera and gallery options
3. Verify images upload to Supabase Storage

### 4. Testing Authentication

1. Test sign up flow
2. Test sign in flow
3. Test profile creation
4. Verify session persistence

### 5. Testing Artwork Flow

1. Create new artwork (Step 1)
2. Generate certificate (Step 2)
3. Link NFC tag (Step 2) - requires physical device
4. Add context (Step 3)
5. View artwork details
6. Edit artwork
7. Delete artwork

## Development Commands

```bash
# Start development server
pnpm start

# Start with cache cleared
pnpm start -- --clear

# Start iOS simulator
pnpm ios

# Start Android emulator
pnpm android

# Type checking
npx tsc --noEmit

# Linting (if configured)
pnpm lint
```

## Hot Reloading

The app supports:
- **Fast Refresh**: Automatically reloads when you save files
- **Live Reload**: Full app reload on changes
- **Hot Reloading**: Updates without losing state

To disable:
- Press `r` in terminal to reload
- Press `m` to toggle menu
- Press `j` to open debugger

## Debugging

### React Native Debugger

1. Install React Native Debugger:
   ```bash
   brew install --cask react-native-debugger
   ```

2. Open debugger
3. In app, shake device or press `⌘D` (iOS) / `⌘M` (Android)
4. Select "Debug"

### Console Logs

View logs in terminal where you ran `pnpm start`:
- All `console.log()` statements appear here
- Errors are highlighted in red

### Network Debugging

1. Enable network inspection:
   - Shake device or press `⌘D` (iOS) / `⌘M` (Android)
   - Select "Show Inspector"
   - Enable "Network" tab

2. Check Supabase requests:
   - All API calls are logged
   - Check for authentication errors
   - Verify data is being sent/received

## Common Issues & Solutions

### Issue: "Metro bundler not starting"

**Solution:**
```bash
# Clear cache and restart
pnpm start -- --clear
# or
rm -rf node_modules
pnpm install
pnpm start
```

### Issue: "Cannot connect to development server"

**Solution:**
- Make sure your phone and computer are on the same WiFi network
- Check firewall settings
- Try using tunnel mode: `pnpm start --tunnel`

### Issue: "NFC not working"

**Solution:**
- Make sure you're using a development build (not Expo Go)
- Verify NFC is enabled in device settings
- Check that you're on a physical device (not simulator)
- Verify NFC permissions are granted

### Issue: "Image upload failing"

**Solution:**
- Check Supabase Storage bucket exists
- Verify environment variables are set
- Check network connection
- Review console logs for specific errors

### Issue: "TypeScript errors"

**Solution:**
```bash
# Check for errors
npx tsc --noEmit

# Fix common issues
# - Missing imports
# - Type mismatches
# - Undefined variables
```

### Issue: "Build fails"

**Solution:**
```bash
# Clean build
rm -rf ios/build android/build
rm -rf node_modules
pnpm install

# For iOS
cd ios
pod deintegrate
pod install
cd ..

# Rebuild
npx expo prebuild --clean
```

## Testing Checklist

- [ ] App starts without errors
- [ ] Authentication works (sign up/sign in)
- [ ] Profile creation/editing works
- [ ] Artwork creation flow works
- [ ] Image upload works
- [ ] Certificate generation works
- [ ] NFC reading works (physical device)
- [ ] Artwork editing works
- [ ] Artwork deletion works
- [ ] Theme switching works (light/dark)
- [ ] Navigation works between screens
- [ ] Data persists after app restart

## Performance Testing

### Check Bundle Size

```bash
# Analyze bundle
npx expo export --dump-sourcemap
```

### Monitor Performance

1. Enable performance monitor:
   - Shake device or press `⌘D` (iOS) / `⌘M` (Android)
   - Select "Show Performance Monitor"

2. Watch for:
   - Frame rate (should be 60 FPS)
   - Memory usage
   - Network requests

## Next Steps

1. **Test all features** using the checklist above
2. **Fix any bugs** you discover
3. **Optimize performance** if needed
4. **Prepare for production** build when ready

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Supabase Documentation](https://supabase.com/docs)

---

**Note:** For NFC testing, you must use a development build on a physical device. Expo Go does not support NFC functionality.

