# NFC Setup Guide for iOS Development Build

Now that you have an Apple Developer account, NFC is fully enabled for your app. Follow these steps to build and test NFC functionality.

## Prerequisites

✅ Apple Developer Account (you have this!)
✅ `react-native-nfc-manager` package installed
✅ NFC permissions configured in `app.json`

## Configuration Complete

The following has been configured:

1. **iOS Entitlements**: NFC reader session format (NDEF) enabled
2. **Info.plist**: NFC usage description added
3. **Android Permissions**: NFC permission added
4. **NFC Plugin**: `react-native-nfc-manager` plugin configured

## Building a Development Build

### Option 1: Using EAS Build (Recommended)

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to EAS**:
   ```bash
   eas login
   ```

3. **Configure EAS Build**:
   ```bash
   eas build:configure
   ```

4. **Build for iOS Development**:
   ```bash
   eas build --platform ios --profile development
   ```

5. **Install on Device**:
   - Download the build from the EAS dashboard
   - Install via TestFlight or direct install
   - Make sure your device is registered in your Apple Developer account

### Option 2: Local Development Build

1. **Install iOS Dependencies**:
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Open in Xcode**:
   ```bash
   npx expo run:ios
   ```

3. **Configure Signing in Xcode**:
   - Open `ios/AetheraApp.xcworkspace` in Xcode
   - Select your project → Signing & Capabilities
   - Select your Team (Apple Developer account)
   - Ensure "Near Field Communication Tag Reading" capability is enabled

4. **Build and Run**:
   - Select your physical iOS device (NFC doesn't work in simulator)
   - Click Run or press Cmd+R

## Testing NFC

1. **Enable NFC on Device**:
   - Go to Settings → Control Center
   - Add NFC to Control Center
   - Ensure NFC is enabled

2. **Test NFC Reading**:
   - Open the app
   - Navigate to artwork registration → Step 2 (NFC)
   - Tap "Link Tag Now"
   - Hold an NFC tag near the top of your iPhone (near the camera)
   - The app should read the tag UID

## NFC Capabilities

The app can now:
- ✅ Read NFC tag UIDs
- ✅ Link NFC tags to artworks
- ✅ Associate certificates with NFC tags
- ✅ Scan NFC tags to view artwork details

## Troubleshooting

### NFC Not Working?

1. **Check Device Support**: Only iPhone 7 and later support NFC reading
2. **Check NFC is Enabled**: Settings → Control Center → NFC
3. **Check Permissions**: The app will request NFC permission on first use
4. **Check Build**: Make sure you're using a development build, not Expo Go
5. **Check Entitlements**: Verify NFC capability is enabled in Xcode

### Build Errors?

1. **Clean Build**:
   ```bash
   cd ios
   rm -rf build Pods Podfile.lock
   pod install
   cd ..
   ```

2. **Reset Metro Cache**:
   ```bash
   npx expo start --clear
   ```

3. **Check Xcode Version**: Ensure you're using a recent version of Xcode

## Next Steps

1. Build your development build
2. Test NFC reading on a physical device
3. Link NFC tags to artworks
4. Test the full artwork registration flow with NFC

## Notes

- NFC reading only works on physical devices (iPhone 7+)
- NFC writing requires additional configuration (not currently implemented)
- The app reads NDEF format NFC tags
- NFC tags must be held near the top of the iPhone for best results

