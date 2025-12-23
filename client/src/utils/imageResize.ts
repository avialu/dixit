import { IMAGE_CONSTANTS } from './imageConstants';

export async function resizeAndCompressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const img = new Image();
      
      img.onload = async () => {
        try {
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

