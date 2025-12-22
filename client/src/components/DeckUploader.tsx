import { useState, useRef, useEffect } from "react";
import { resizeAndCompressImages } from "../utils/imageResize";
import { RoomState } from "../hooks/useGameState";
import { Button } from "./ui";

interface DeckUploaderProps {
  roomState: RoomState;
  playerId: string;
  onUpload: (imageData: string) => void;
  onDelete: (imageId: string) => void;
  onSetAllowPlayerUploads: (allow: boolean) => void;
}

export function DeckUploader({
  roomState,
  playerId,
  onUpload,
  onDelete,
  onSetAllowPlayerUploads,
}: DeckUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadStats, setUploadStats] = useState({
    completed: 0,
    total: 0,
    failed: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [imageCache, setImageCache] = useState<Record<string, string>>({});

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load cached images from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(`image-cache-${playerId}`);
      if (cached) {
        setImageCache(JSON.parse(cached));
      }
    } catch (err) {
      console.error("Failed to load image cache:", err);
    }
  }, [playerId]);

  // Save image to cache
  const cacheImage = (imageId: string, imageData: string) => {
    console.log("📸 Caching image:", imageId, "Data length:", imageData.length);
    setImageCache((prev) => {
      const newCache = { ...prev, [imageId]: imageData };
      try {
        // Store in localStorage (but be careful of size limits)
        localStorage.setItem(
          `image-cache-${playerId}`,
          JSON.stringify(newCache)
        );
        console.log(
          "✅ Cached successfully. Total cached:",
          Object.keys(newCache).length
        );
      } catch (err) {
        console.error("❌ Failed to cache image:", err);
        // If localStorage is full, clear old entries
        if (err instanceof Error && err.name === "QuotaExceededError") {
          const limitedCache = { [imageId]: imageData };
          localStorage.setItem(
            `image-cache-${playerId}`,
            JSON.stringify(limitedCache)
          );
          return limitedCache;
        }
      }
      return newCache;
    });
  };

  const myPlayer = roomState.players.find((p) => p.id === playerId);
  const isAdmin = myPlayer?.isAdmin || false;
  const myImages = roomState.deckImages.filter(
    (img) => img.uploadedBy === playerId
  );
  // Admins can always upload. Players and spectators can upload if admin allows it.
  const canUpload = isAdmin || roomState.allowPlayerUploads;

  // Simple hash function for image data
  const hashImageData = async (imageData: string): Promise<string> => {
    // Use crypto API if available for better hashing
    if (crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(imageData);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } else {
      // Fallback to simple hash for older browsers
      let hash = 0;
      for (let i = 0; i < imageData.length; i++) {
        const char = imageData.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return hash.toString(36);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const remainingSlots = 200 - myImages.length;

    if (fileArray.length > remainingSlots) {
      const proceed = confirm(
        `You can only upload ${remainingSlots} more images. ` +
          `The first ${remainingSlots} images will be processed.`
      );
      if (!proceed) return;
      fileArray.splice(remainingSlots);
    }

    setUploading(true);
    setUploadStats({ completed: 0, total: fileArray.length, failed: 0 });

    try {
      // Process images in parallel batches
      const results = await resizeAndCompressImages(
        fileArray,
        (completed, total, fileName) => {
          setUploadProgress(`${fileName} (${completed}/${total})`);
          setUploadStats((prev) => ({ ...prev, completed }));
        }
      );

      // Load existing image hashes to check for duplicates
      let existingHashes: string[] = [];
      try {
        const stored = localStorage.getItem(`image-hashes-${playerId}`);
        if (stored) {
          existingHashes = JSON.parse(stored);
        }
      } catch (err) {
        console.error("Failed to load image hashes:", err);
      }

      // Upload successful results and cache images immediately
      let failedCount = 0;
      let duplicateCount = 0;
      const uploadedImages: string[] = []; // Store the actual image data
      const newHashes: string[] = [];

      for (const result of results) {
        if (result.error) {
          console.error(`Failed to process ${result.file.name}:`, result.error);
          failedCount++;
        } else {
          // Check for duplicate
          const imageHash = await hashImageData(result.imageData);

          if (existingHashes.includes(imageHash)) {
            console.warn(`⚠️ Duplicate image detected: ${result.file.name}`);
            duplicateCount++;
          } else {
            uploadedImages.push(result.imageData);
            newHashes.push(imageHash);
            onUpload(result.imageData);
          }
        }
      }

      // Store the new hashes
      if (newHashes.length > 0) {
        try {
          const allHashes = [...existingHashes, ...newHashes];
          localStorage.setItem(
            `image-hashes-${playerId}`,
            JSON.stringify(allHashes)
          );
        } catch (err) {
          console.error("Failed to store image hashes:", err);
        }
      }

      // After upload, map the images to their server-assigned IDs
      // We'll check for new images that appeared in the deck
      if (uploadedImages.length > 0) {
        setTimeout(() => {
          const currentImages = roomState.deckImages.filter(
            (img) => img.uploadedBy === playerId
          );

          // Store uploaded images by assuming they map to the most recent deck images
          // This works because uploads are processed in order
          const startIndex = Math.max(
            0,
            currentImages.length - uploadedImages.length
          );

          uploadedImages.forEach((imageData, idx) => {
            const deckImage = currentImages[startIndex + idx];
            if (deckImage) {
              cacheImage(deckImage.id, imageData);
            }
          });
        }, 500);
      }

      setUploadStats((prev) => ({ ...prev, failed: failedCount }));

      // Show summary if there were any failures or duplicates
      if (failedCount > 0 || duplicateCount > 0) {
        const messages = [];
        if (uploadedImages.length > 0) {
          messages.push(
            `✅ Uploaded ${uploadedImages.length} new image${
              uploadedImages.length === 1 ? "" : "s"
            }`
          );
        }
        if (duplicateCount > 0) {
          messages.push(
            `⚠️ Skipped ${duplicateCount} duplicate${
              duplicateCount === 1 ? "" : "s"
            }`
          );
        }
        if (failedCount > 0) {
          messages.push(
            `❌ ${failedCount} image${
              failedCount === 1 ? "" : "s"
            } failed to process`
          );
        }
        alert(messages.join("\n"));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("An error occurred during upload. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress("");
      setUploadStats({ completed: 0, total: 0, failed: 0 });

      // Reset both inputs
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (folderInputRef.current) {
        folderInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAll = async () => {
    if (myImages.length === 0) return;

    const confirmed = confirm(
      `Are you sure you want to delete all ${myImages.length} images?`
    );
    if (!confirmed) return;

    // Delete all images
    myImages.forEach((img) => {
      onDelete(img.id);
    });

    // Clear cache and hashes
    setImageCache({});
    try {
      localStorage.removeItem(`image-cache-${playerId}`);
      localStorage.removeItem(`image-hashes-${playerId}`);
      console.log("🗑️ Cleared all images, cache, and hashes");
    } catch (err) {
      console.error("Failed to clear cache:", err);
    }
  };

  return (
    <div className="deck-uploader">
      <div className="upload-section">
        {/* Header with counts and admin toggle */}
        <div className="upload-header">
          <div className="upload-stats">
            <span className="stat-icon">📦</span>
            <span className="stat-text">
              Deck: <strong>{roomState.deckSize}</strong>
            </span>
            <span className="stat-divider">•</span>
            <span className="stat-text">
              My images: <strong>{myImages.length}/200</strong>
            </span>
          </div>

          {/* Admin Toggle */}
          {isAdmin && (
            <div className="admin-toggle-inline">
              <label className="toggle-label-inline">
                <input
                  type="checkbox"
                  checked={roomState.allowPlayerUploads}
                  onChange={(e) => onSetAllowPlayerUploads(e.target.checked)}
                  className="toggle-checkbox-small"
                />
                <span className="toggle-text-small">
                  {roomState.allowPlayerUploads
                    ? "🔓 Players can upload"
                    : "🔒 Only admin uploads"}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* File input for multiple images */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={uploading || myImages.length >= 200 || !canUpload}
          style={{ display: "none" }}
          id={`file-input-${playerId}`}
        />

        {/* Folder input */}
        <input
          ref={folderInputRef}
          type="file"
          accept="image/*"
          // @ts-ignore - webkitdirectory is not in TS types but widely supported
          webkitdirectory=""
          directory=""
          onChange={handleFileSelect}
          disabled={uploading || myImages.length >= 200 || !canUpload}
          style={{ display: "none" }}
          id={`folder-input-${playerId}`}
        />

        <div className="upload-buttons">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || myImages.length >= 200 || !canUpload}
            className="btn-upload"
            title="Select one or multiple image files"
          >
            {uploading ? (
              <>
                <span className="btn-icon">⏳</span>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <span className="btn-icon">📁</span>
                <span>Upload Images</span>
              </>
            )}
          </Button>

          {!isMobile && (
            <Button
              onClick={() => folderInputRef.current?.click()}
              disabled={uploading || myImages.length >= 200 || !canUpload}
              className="btn-upload"
              title="Select an entire folder of images"
            >
              {uploading ? (
                <>
                  <span className="btn-icon">⏳</span>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">📂</span>
                  <span>Upload Folder</span>
                </>
              )}
            </Button>
          )}
        </div>

        {!canUpload && !isAdmin && (
          <p className="upload-disabled-message">
            🔒 Only the host can upload images
          </p>
        )}

        {uploading && uploadProgress && (
          <div className="upload-progress">
            <div className="progress-text">{uploadProgress}</div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{
                  width: `${
                    (uploadStats.completed / uploadStats.total) * 100
                  }%`,
                }}
              />
            </div>
            <div className="progress-stats">
              {uploadStats.completed} of {uploadStats.total} processed
              {uploadStats.failed > 0 && ` (${uploadStats.failed} failed)`}
            </div>
          </div>
        )}
      </div>

      {/* Images Grid Section */}
      {myImages.length > 0 && (
        <div className="images-actions">
          <Button
            onClick={handleDeleteAll}
            className="btn-delete-all"
            title="Delete all your images"
          >
            <span className="btn-icon">🗑️</span>
            <span>Delete All ({myImages.length})</span>
          </Button>
        </div>
      )}

      <div className="deck-images-container">
        {myImages.length === 0 ? (
          <div className="no-images-message">
            <span className="empty-icon">🖼️</span>
            <p>No images uploaded yet</p>
          </div>
        ) : (
          <div className="images-preview-grid">
            {myImages.map((img) => {
              const cachedImage = imageCache[img.id];
              return (
                <div key={img.id} className="image-preview-card">
                  {cachedImage ? (
                    <img
                      src={cachedImage}
                      alt="Uploaded image"
                      className="preview-image"
                    />
                  ) : (
                    <div className="preview-placeholder">
                      <span className="placeholder-icon">🖼️</span>
                    </div>
                  )}
                  <Button
                    onClick={async () => {
                      const cachedImage = imageCache[img.id];

                      // Delete the image
                      onDelete(img.id);

                      // Remove from cache
                      setImageCache((prev) => {
                        const { [img.id]: _, ...rest } = prev;
                        try {
                          localStorage.setItem(
                            `image-cache-${playerId}`,
                            JSON.stringify(rest)
                          );
                        } catch (err) {
                          console.error("Failed to update cache:", err);
                        }
                        return rest;
                      });

                      // Remove hash from stored hashes
                      if (cachedImage) {
                        try {
                          const imageHash = await hashImageData(cachedImage);
                          const stored = localStorage.getItem(
                            `image-hashes-${playerId}`
                          );
                          if (stored) {
                            const hashes: string[] = JSON.parse(stored);
                            const updatedHashes = hashes.filter(
                              (h) => h !== imageHash
                            );
                            localStorage.setItem(
                              `image-hashes-${playerId}`,
                              JSON.stringify(updatedHashes)
                            );
                            console.log(
                              "🗑️ Removed image hash from duplicate detection"
                            );
                          }
                        } catch (err) {
                          console.error("Failed to remove image hash:", err);
                        }
                      }
                    }}
                    className="x-button preview-delete-btn"
                    title="Delete image"
                  >
                    ×
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
