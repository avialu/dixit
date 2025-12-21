import { useState, useRef } from "react";
import { resizeAndCompressImages } from "../utils/imageResize";
import { RoomState } from "../hooks/useGameState";

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

  const myPlayer = roomState.players.find((p) => p.id === playerId);
  const isAdmin = myPlayer?.isAdmin || false;
  const myImages = roomState.deckImages.filter(
    (img) => img.uploadedBy === playerId
  );
  // Admins can always upload. Players and spectators can upload if admin allows it.
  const canUpload = isAdmin || roomState.allowPlayerUploads;

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

      // Upload successful results
      let failedCount = 0;
      for (const result of results) {
        if (result.error) {
          console.error(`Failed to process ${result.file.name}:`, result.error);
          failedCount++;
        } else {
          onUpload(result.imageData);
        }
      }

      setUploadStats((prev) => ({ ...prev, failed: failedCount }));

      // Show summary if there were any failures
      if (failedCount > 0) {
        alert(
          `Uploaded ${results.length - failedCount} images successfully.\n` +
            `${failedCount} images failed to process.`
        );
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

  return (
    <div className="deck-uploader">
      <div className="deck-info">
        <h3>Deck: {roomState.deckSize} images</h3>
        <p>My images: {myImages.length}/200</p>
      </div>

      {/* Admin Toggle - Only visible to admin */}
      {isAdmin && (
        <div className="deck-controls" style={{ marginBottom: "1rem" }}>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={roomState.allowPlayerUploads}
              onChange={(e) => onSetAllowPlayerUploads(e.target.checked)}
              className="toggle-checkbox"
            />
            <span className="toggle-text">Allow players to upload images</span>
          </label>
          <p className="toggle-hint">
            {roomState.allowPlayerUploads
              ? "✅ Players can upload images (you can always upload)"
              : "🔒 Only you can upload images"}
          </p>
        </div>
      )}

      <div className="upload-section">
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
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || myImages.length >= 200 || !canUpload}
            className="btn-primary"
            title="Select one or multiple image files"
          >
            {uploading ? "⏳ Uploading..." : "📁 Upload Images"}
          </button>

          <button
            onClick={() => folderInputRef.current?.click()}
            disabled={uploading || myImages.length >= 200 || !canUpload}
            className="btn-primary"
            title="Select an entire folder of images"
          >
            {uploading ? "⏳ Uploading..." : "📂 Upload Folder"}
          </button>
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

      <div className="deck-images">
        {myImages.map((img) => (
          <div key={img.id} className="deck-image-item">
            <span className="image-id">{img.id.slice(0, 8)}</span>
            <button onClick={() => onDelete(img.id)} className="btn-delete">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
