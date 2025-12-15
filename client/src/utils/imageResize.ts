const MAX_DIMENSION = 1024;
const TARGET_SIZE = 500 * 1024; // 500KB
const INITIAL_QUALITY = 0.9;

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

          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = (height / width) * MAX_DIMENSION;
              width = MAX_DIMENSION;
            } else {
              width = (width / height) * MAX_DIMENSION;
              height = MAX_DIMENSION;
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
          let quality = INITIAL_QUALITY;
          let result = canvas.toDataURL('image/jpeg', quality);

          // Iteratively reduce quality if needed
          while (result.length > TARGET_SIZE * 1.37 && quality > 0.1) {
            // base64 is ~1.37x the binary size
            quality -= 0.1;
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

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'File must be an image';
  }

  if (file.size > 10 * 1024 * 1024) {
    return 'File too large (max 10MB)';
  }

  return null;
}

