const fs = require('fs');
const path = require('path');

// Minimal valid PNG (1x1 transparent pixel)
// This is a base64-encoded minimal PNG
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const assetsDir = path.join(__dirname, '../assets/images');

// Ensure directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create placeholder icons
const icons = [
  'icon.png',           // 1024x1024 for app icon
  'adaptive-icon.png',  // 1024x1024 for Android adaptive icon
  'favicon.png',        // 48x48 for web favicon
  'splash-icon.png',   // 200x200 for splash screen
];

icons.forEach(iconName => {
  const iconPath = path.join(assetsDir, iconName);
  fs.writeFileSync(iconPath, minimalPNG);
  console.log(`Created placeholder: ${iconPath}`);
});

console.log('\n✅ Placeholder icons created!');
console.log('⚠️  Replace these with your actual app icons before production.');


