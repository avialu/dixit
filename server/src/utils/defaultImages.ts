import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load default images from the default-images folder
 * Returns array of base64 encoded image data
 */
export function loadDefaultImages(): string[] {
  const defaultImagesPath = join(__dirname, '..', '..', 'default-images');
  
  try {
    const files = readdirSync(defaultImagesPath)
      .filter(file => file.endsWith('.jpg') || file.endsWith('.png'))
      .sort();
    
    const images = files.map(file => {
      const filePath = join(defaultImagesPath, file);
      const imageBuffer = readFileSync(filePath);
      const base64 = imageBuffer.toString('base64');
      const mimeType = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    });
    
    console.log(`Loaded ${images.length} default images`);
    return images;
  } catch (error) {
    console.error('Error loading default images:', error);
    return [];
  }
}
