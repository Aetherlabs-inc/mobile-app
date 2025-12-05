import { Platform, Alert } from 'react-native';

// Import NFC Manager - now enabled for development/production builds
let NfcManager: any = null;
let NfcTech: any = null;
let NfcAvailable = false;

try {
  const nfcModule = require('react-native-nfc-manager');
  NfcManager = nfcModule.default || nfcModule;
  NfcTech = nfcModule.NfcTech;
  NfcAvailable = true;
} catch (error) {
  console.error('NFC Manager not available. Make sure react-native-nfc-manager is installed and you are using a development build:', error);
  NfcAvailable = false;
}

/**
 * Check if NFC module is available
 */
export function isNfcModuleAvailable(): boolean {
  return NfcAvailable && NfcManager !== null;
}

/**
 * Check if NFC is supported on the device
 */
export async function isNfcSupported(): Promise<boolean> {
  if (!isNfcModuleAvailable()) {
    return false;
  }
  try {
    return await NfcManager.isSupported();
  } catch (error) {
    console.error('Error checking NFC support:', error);
    return false;
  }
}

/**
 * Check if NFC is enabled on the device
 */
export async function isNfcEnabled(): Promise<boolean> {
  if (!isNfcModuleAvailable()) {
    return false;
  }
  try {
    return await NfcManager.isEnabled();
  } catch (error) {
    console.error('Error checking NFC enabled:', error);
    return false;
  }
}

/**
 * Start NFC manager
 */
export async function startNfc(): Promise<void> {
  if (!isNfcModuleAvailable()) {
    throw new Error('NFC Manager is not available. Please ensure react-native-nfc-manager is properly installed and you are using a development or production build.');
  }
  try {
    await NfcManager.start();
  } catch (error) {
    console.error('Error starting NFC:', error);
    throw new Error('Failed to start NFC. Please make sure NFC is enabled in your device settings.');
  }
}

/**
 * Stop NFC manager
 */
export async function stopNfc(): Promise<void> {
  if (!isNfcModuleAvailable()) {
    return;
  }
  try {
    await NfcManager.cancelTechnologyRequest().catch(() => 0);
  } catch (error) {
    console.error('Error stopping NFC:', error);
  }
}

/**
 * Read NFC tag UID
 * Returns the UID as a string
 */
export async function readNfcTag(): Promise<string> {
  if (!isNfcModuleAvailable() || !NfcTech) {
    throw new Error('NFC Manager is not available. Please ensure react-native-nfc-manager is properly installed and you are using a development or production build.');
  }
  
  try {
    // Request NFC technology
    await NfcManager.requestTechnology(NfcTech.Ndef);
    
    // Get the tag
    const tag = await NfcManager.getTag();
    
    if (!tag) {
      throw new Error('No tag found');
    }

    // Extract UID from tag
    // The UID format varies by platform
    let uid: string = '';
    
    if (Platform.OS === 'ios') {
      // iOS: UID is in tag.id
      uid = tag.id || '';
    } else {
      // Android: UID is in tag.id as a byte array, convert to hex string
      if (Array.isArray(tag.id)) {
        uid = tag.id.map((byte: number) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
      } else if (typeof tag.id === 'string') {
        uid = tag.id.toUpperCase();
      }
    }

    if (!uid) {
      throw new Error('Could not extract UID from tag');
    }

    return uid;
  } catch (error: any) {
    console.error('Error reading NFC tag:', error);
    
    if (error.message?.includes('cancelled') || error.message?.includes('User')) {
      throw new Error('NFC scan cancelled');
    }
    
    throw new Error(error.message || 'Failed to read NFC tag. Please try again.');
  } finally {
    // Clean up
    try {
      if (isNfcModuleAvailable()) {
        await NfcManager.cancelTechnologyRequest();
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Request NFC permissions and check availability
 */
export async function requestNfcPermission(): Promise<boolean> {
  if (!isNfcModuleAvailable()) {
    Alert.alert(
      'NFC Not Available',
      'NFC Manager is not available. Please ensure react-native-nfc-manager is properly installed and you are using a development or production build.'
    );
    return false;
  }

  try {
    const supported = await isNfcSupported();
    if (!supported) {
      Alert.alert(
        'NFC Not Supported',
        'Your device does not support NFC functionality.'
      );
      return false;
    }

    const enabled = await isNfcEnabled();
    if (!enabled) {
      Alert.alert(
        'NFC Disabled',
        'Please enable NFC in your device settings to scan tags.',
        [
          { text: 'OK', style: 'default' },
        ]
      );
      return false;
    }

    await startNfc();
    return true;
  } catch (error: any) {
    Alert.alert(
      'NFC Error',
      error.message || 'Failed to initialize NFC. Please check your device settings.'
    );
    return false;
  }
}
