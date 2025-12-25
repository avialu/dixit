import { IMAGE_CONSTANTS } from './imageConstants';

/**
 * Validate image file format using magic numbers (file signatures)
 * This is more reliable than checking MIME type alone
 */
async function validateImageMagicNumbers(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer);
      
      // Check magic numbers for common image formats
      // JPEG: FF D8 FF
      if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
        resolve(true);
        return;
      }
      
      // PNG: 89 50 4E 47
      if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
        resolve(true);
        return;
      }
      
      // GIF: 47 49 46 38
      if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38) {
        resolve(true);
        return;
      }
      
      // WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
      if (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46) {
        if (arr.length >= 12 && arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50) {
          resolve(true);
          return;
        }
      }
      
      resolve(false);
    };
    
    reader.onerror = () => resolve(false);
    
    // Read first 12 bytes to check magic numbers
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

export async function resizeAndCompressImage(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    // Validate magic numbers first
    const isValidImage = await validateImageMagicNumbers(file);
    if (!isValidImage) {
      reject(new Error('Invalid image format. Only JPEG, PNG, GIF, and WebP are supported.'));
      return;
    }
    
    const reader = new FileReader();

    reader.onload = async (e) => {
      const img = new Image();
      
      img.onload = async () => {
        try {
          // Reject absurdly large images to prevent DOS
          if (img.width > 10000 || img.height > 10000) {
            reject(new Error('Image dimensions too large (max 10000x10000)'));
            return;
          }
          
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;

          if (width > IMAGE_CONSTANTS.MAX_DIMENSION || height > IMAGE_CONSTANTS.MAX_DIMENSION) {
            if (width > height) {
              height = (height / width) * IMAGE_CONSTANTS.MAX_DIMENSION;
              width = IMAGE_CONSTANTS.MAX_DIMENSION;
            } else {
              width = (width / height) * IMAGE_CONSTANTS.MAX_DIMENSION;
              height = IMAGE_CONSTANTS.MAX_DIMENSION;
            }
          }

          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Try to compress to target size
          let quality = IMAGE_CONSTANTS.INITIAL_QUALITY;
          let result = canvas.toDataURL('image/jpeg', quality);

          // Iteratively reduce quality if needed
          while (result.length > IMAGE_CONSTANTS.TARGET_SIZE * IMAGE_CONSTANTS.BASE64_SIZE_MULTIPLIER && quality > IMAGE_CONSTANTS.MIN_QUALITY) {
            quality -= IMAGE_CONSTANTS.QUALITY_STEP;
            result = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Process multiple images in parallel batches
 */
export async function resizeAndCompressImages(
  files: File[],
  onProgress?: (completed: number, total: number, fileName: string) => void
): Promise<Array<{ file: File; imageData: string; error?: string }>> {
  const results: Array<{ file: File; imageData: string; error?: string }> = [];
  
  // Process files in batches
  for (let i = 0; i < files.length; i += IMAGE_CONSTANTS.PARALLEL_BATCH_SIZE) {
    const batch = files.slice(i, Math.min(i + IMAGE_CONSTANTS.PARALLEL_BATCH_SIZE, files.length));
    
    const batchPromises = batch.map(async (file) => {
      // Validate file first
      const validationError = validateImageFile(file);
      if (validationError) {
        return { file, imageData: '', error: validationError };
      }

      try {
        const imageData = await resizeAndCompressImage(file);
        if (onProgress) {
          const completed = results.filter(r => !r.error).length + 1;
          onProgress(completed, files.length, file.name);
        }
        return { file, imageData };
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to process image';
        return { file, imageData: '', error };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'File must be an image';
  }

  if (file.size > IMAGE_CONSTANTS.MAX_FILE_SIZE) {
    return `File too large (max ${IMAGE_CONSTANTS.MAX_FILE_SIZE / 1024 / 1024}MB)`;
  }

  return null;
}

