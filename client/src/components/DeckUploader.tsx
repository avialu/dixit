import { useState, useRef, useEffect } from "react";
import { resizeAndCompressImages } from "../utils/imageResize";
import { RoomState } from "../hooks/useGameState";
import { Button } from "./ui";
import { ConfirmModal } from "./ConfirmModal";

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
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);


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
      setConfirmModal({
        isOpen: true,
        title: "Too Many Images",
        message: `You can only upload ${remainingSlots} more images. The first ${remainingSlots} images will be processed.`,
        onConfirm: () => {
          fileArray.splice(remainingSlots);
          processUpload(fileArray);
        },
      });
      return;
    }

    await processUpload(fileArray);
  };

  const processUpload = async (fileArray: File[]) => {
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
      let uploadedCount = 0;

      for (const result of results) {
        if (result.error) {
          console.error(`Failed to process ${result.file.name}:`, result.error);
          failedCount++;
        } else {
          onUpload(result.imageData);
          uploadedCount++;
        }
      }

      setUploadStats((prev) => ({ ...prev, failed: failedCount }));

      // Show summary if there were any failures
      if (failedCount > 0) {
        const messages = [];
        if (uploadedCount > 0) {
          messages.push(
            `✅ Uploaded ${uploadedCount} image${
              uploadedCount === 1 ? "" : "s"
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

    setConfirmModal({
      isOpen: true,
      title: "Delete All Images",
      message: `Are you sure you want to delete all ${myImages.length} images?`,
      onConfirm: () => {
        // Delete all images
        myImages.forEach((img) => {
          onDelete(img.id);
        });
        console.log("🗑️ Deleted all images");
      },
    });
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
            {myImages.map((img) => (
              <div key={img.id} className="image-preview-card">
                {img.imageData ? (
                  <img
                    src={img.imageData}
                    alt="Uploaded image"
                    className="preview-image"
                  />
                ) : (
                  <div className="preview-placeholder">
                    <span className="placeholder-icon">🖼️</span>
                  </div>
                )}
                <Button
                  onClick={() => onDelete(img.id)}
                  className="x-button preview-delete-btn"
                  title="Delete image"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Confirm"
        confirmVariant="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}
