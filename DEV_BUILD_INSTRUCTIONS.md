# Creating a Development Build

The Worklets version mismatch occurs because Expo Go has a fixed version of react-native-reanimated that doesn't match your JavaScript code. You need to create a development build.

## Option A: Local Development Build (iOS/Android)

### For iOS (requires Mac with Xcode):
```bash
# Generate native iOS project
npx expo prebuild --platform ios

# Install CocoaPods dependencies
cd ios && pod install && cd ..

# Open in Xcode and run
open ios/AetheraApp.xcworkspace
```

### For Android:
```bash
# Generate native Android project
npx expo prebuild --platform android

# Open in Android Studio and run
# Or build from command line:
cd android && ./gradlew assembleDebug && cd ..
```

## Option B: EAS Build (Cloud build, easier)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure EAS (already done - eas.json created):
```bash
eas build:configure
```

4. Build development client:
```bash
# For iOS
eas build --profile development --platform ios

# For Android
eas build --profile development --platform android
```

5. Install the build on your device and run:
```bash
npx expo start --dev-client
```

## Option C: Temporary Workaround (Remove Moti)

If you need to test quickly without animations, you can temporarily remove Moti imports and use plain React Native components. This is not recommended for production but works for quick testing.

