import { Socket } from "socket.io-client";

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;  // ms
  maxDelay: number;      // ms
  backoffMultiplier: number;
  timeout: number;       // ms - timeout for each attempt
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,    // 1 second
  maxDelay: 10000,       // 10 seconds
  backoffMultiplier: 2,
  timeout: 15000,        // 15 seconds per attempt
};

export interface UploadProgress {
  status: 'idle' | 'uploading' | 'retrying' | 'success' | 'error';
  attempt: number;
  maxAttempts: number;
  error?: string;
}

type ProgressCallback = (progress: UploadProgress) => void;

/**
 * Uploads an image with retry logic and exponential backoff
 * 
 * @param socket - Socket.IO socket instance
 * @param imageData - Base64 encoded image data
 * @param onProgress - Callback for progress updates
 * @param config - Retry configuration
 * @returns Promise that resolves on success or rejects on final failure
 */
export async function uploadImageWithRetry(
  socket: Socket | null,
  imageData: string,
  onProgress?: ProgressCallback,
  config: Partial<RetryConfig> = {}
): Promise<{ success: boolean; imageId?: string }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  if (!socket?.connected) {
    const error = 'Not connected to server';
    onProgress?.({
      status: 'error',
      attempt: 0,
      maxAttempts: cfg.maxRetries,
      error,
    });
    throw new Error(error);
  }

  let lastError: string = '';

  for (let attempt = 1; attempt <= cfg.maxRetries; attempt++) {
    onProgress?.({
      status: attempt === 1 ? 'uploading' : 'retrying',
      attempt,
      maxAttempts: cfg.maxRetries,
    });

    try {
      const result = await attemptUpload(socket, imageData, cfg.timeout);
      
      onProgress?.({
        status: 'success',
        attempt,
        maxAttempts: cfg.maxRetries,
      });
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Upload failed';
      console.warn(`Upload attempt ${attempt}/${cfg.maxRetries} failed:`, lastError);

      // Don't retry if socket is disconnected
      if (!socket.connected) {
        lastError = 'Connection lost during upload';
        break;
      }

      // If not the last attempt, wait before retrying
      if (attempt < cfg.maxRetries) {
        const delay = Math.min(
          cfg.initialDelay * Math.pow(cfg.backoffMultiplier, attempt - 1),
          cfg.maxDelay
        );
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  onProgress?.({
    status: 'error',
    attempt: cfg.maxRetries,
    maxAttempts: cfg.maxRetries,
    error: lastError,
  });

  throw new Error(lastError || 'Upload failed after all retries');
}

/**
 * Single upload attempt with timeout
 */
function attemptUpload(
  socket: Socket,
  imageData: string,
  timeout: number
): Promise<{ success: boolean; imageId?: string }> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Upload timeout'));
    }, timeout);

    const handleAck = (data: { success: boolean; imageId?: string; error?: string }) => {
      cleanup();
      if (data.success) {
        resolve(data);
      } else {
        reject(new Error(data.error || 'Upload failed'));
      }
    };

    const handleDisconnect = () => {
      cleanup();
      reject(new Error('Disconnected during upload'));
    };

    const handleError = (error: { message?: string }) => {
      cleanup();
      reject(new Error(error?.message || 'Upload error'));
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      socket.off('uploadImageAck', handleAck);
      socket.off('disconnect', handleDisconnect);
      socket.off('error', handleError);
    };

    socket.once('uploadImageAck', handleAck);
    socket.once('disconnect', handleDisconnect);
    socket.once('error', handleError);

    socket.emit('uploadImage', { imageData });
  });
}

/**
 * Batch upload images with retry logic
 * 
 * @param socket - Socket.IO socket instance
 * @param images - Array of base64 encoded image data
 * @param onProgress - Callback for progress updates (called for each image)
 * @param config - Retry configuration
 * @returns Promise that resolves with results for each image
 */
export async function uploadImagesWithRetry(
  socket: Socket | null,
  images: string[],
  onProgress?: (index: number, total: number, progress: UploadProgress) => void,
  config: Partial<RetryConfig> = {}
): Promise<{ successes: number; failures: number; errors: string[] }> {
  const results = {
    successes: 0,
    failures: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < images.length; i++) {
    try {
      await uploadImageWithRetry(
        socket,
        images[i],
        (progress) => onProgress?.(i, images.length, progress),
        config
      );
      results.successes++;
    } catch (error) {
      results.failures++;
      results.errors.push(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}





