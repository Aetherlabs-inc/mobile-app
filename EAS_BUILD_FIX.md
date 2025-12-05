# EAS Build Fix for react-native-worklets Error

## Problem

The EAS build was failing with:
```
Error: Cannot find module 'react-native-worklets/package.json'
```

This happens because `react-native-reanimated` requires `react-native-worklets` as a peer dependency, but EAS build wasn't finding it.

## Solution Applied

1. **Added `react-native-worklets` explicitly to `package.json`**
   - Added `"react-native-worklets": "^0.6.1"` to dependencies
   - This ensures the package is available during EAS build

2. **Updated `eas.json` to use pnpm**
   - Added pnpm configuration to ensure EAS uses pnpm (not npm)
   - This matches your local development setup

## Next Steps

1. **Commit the changes:**
   ```bash
   git add package.json eas.json
   git commit -m "Fix: Add react-native-worklets dependency for EAS build"
   ```

2. **Try the build again:**
   ```bash
   eas build --platform ios --profile development
   ```

## If Build Still Fails

If you still encounter issues, try:

1. **Clear EAS build cache:**
   ```bash
   eas build --platform ios --profile development --clear-cache
   ```

2. **Check if worklets is properly installed:**
   ```bash
   pnpm list react-native-worklets
   ```

3. **Verify babel config:**
   - Make sure `react-native-reanimated/plugin` is last in `babel.config.js`
   - It should be: `'react-native-reanimated/plugin', // Must be last`

4. **Alternative: Use npm for build**
   - If pnpm continues to cause issues, you can temporarily switch to npm:
   ```bash
   # Remove pnpm config from eas.json
   # EAS will use npm by default
   ```

## Verification

After the build succeeds, verify:
- ✅ App installs on device
- ✅ NFC functionality works
- ✅ Animations work (if using reanimated)
- ✅ No runtime errors

## Notes

- `react-native-worklets` is a peer dependency of `react-native-reanimated`
- It's needed for worklet functions in reanimated
- EAS build needs explicit dependencies (not just peer deps)
- Using pnpm ensures consistency with local development


