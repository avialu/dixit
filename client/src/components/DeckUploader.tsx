import { useState, useRef, useEffect } from "react";
import type { Socket } from "socket.io-client";
import { resizeAndCompressImages } from "../utils/imageResize";
import { RoomState } from "../hooks/useGameState";
import { Button } from "./ui";
import { ConfirmModal } from "./ConfirmModal";
import { getMinimumDeckSize } from "../utils/imageConstants";
import { uploadImageWithRetry, UploadProgress } from "../utils/uploadRetry";

interface DeckUploaderProps {
  roomState: RoomState;
  playerId: string;
  socket?: Socket | null;  // Optional socket for retry support
  onUpload: (imageData: string) => void;
  onDelete: (imageId: string) => void;
  onSetAllowPlayerUploads: (allow: boolean) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function DeckUploader({
  roomState,
  playerId,
  socket,
  onUpload,
  onDelete,
  onSetAllowPlayerUploads,
  t,
}: DeckUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadStats, setUploadStats] = useState({
    completed: 0,
    total: 0,
    failed: 0,
  });
  const [retryStatus, setRetryStatus] = useState<string | null>(null);
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
        title: t('deckUploader.tooManyImages'),
        message: t('deckUploader.tooManyImagesMessage', { remaining: remainingSlots }),
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

      // Upload successful results with retry support
      let failedCount = 0;
      let uploadedCount = 0;
      const uploadErrors: string[] = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        
        if (result.error) {
          console.error(`Failed to process ${result.file.name}:`, result.error);
          failedCount++;
          uploadErrors.push(`${result.file.name}: ${result.error}`);
          continue;
        }

        // If socket is available, use retry logic
        if (socket?.connected) {
          try {
            await uploadImageWithRetry(
              socket,
              result.imageData,
              (progress: UploadProgress) => {
                if (progress.status === 'retrying') {
                  setRetryStatus(
                    t('deckUploader.retrying', { 
                      attempt: progress.attempt, 
                      max: progress.maxAttempts,
                      name: result.file.name
                    })
                  );
                } else {
                  setRetryStatus(null);
                }
              }
            );
            uploadedCount++;
            setUploadStats((prev) => ({ ...prev, completed: prev.completed + 1 }));
          } catch (error) {
            console.error(`Upload failed for ${result.file.name}:`, error);
            failedCount++;
            uploadErrors.push(
              `${result.file.name}: ${error instanceof Error ? error.message : 'Upload failed'}`
            );
          }
        } else {
          // Fallback to original non-retry behavior
          onUpload(result.imageData);
          uploadedCount++;
        }
      }

      setUploadStats((prev) => ({ ...prev, failed: failedCount }));
      setRetryStatus(null);

      // Show summary if there were any failures
      if (failedCount > 0) {
        const messages = [];
        if (uploadedCount > 0) {
          messages.push(
            uploadedCount === 1 
              ? t('deckUploader.uploadedSuccessSingular', { count: uploadedCount })
              : t('deckUploader.uploadedSuccess', { count: uploadedCount })
          );
        }
        if (failedCount > 0) {
          messages.push(
            failedCount === 1
              ? t('deckUploader.failedToProcessSingular', { count: failedCount })
              : t('deckUploader.failedToProcess', { count: failedCount })
          );
        }
        alert(messages.join("\n"));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(t('deckUploader.uploadError'));
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
      title: t('deckUploader.deleteAllImages'),
      message: t('deckUploader.deleteAllConfirm', { count: myImages.length }),
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
              {t('deckUploader.deck')}: <strong>{roomState.deckSize}</strong>
              <span style={{ color: '#95a5a6', fontSize: '0.9em' }}>
                /{getMinimumDeckSize(roomState.players.length, roomState.winTarget)}
              </span>
              {roomState.deckSize < getMinimumDeckSize(roomState.players.length, roomState.winTarget) && (
                <span style={{ color: '#f39c12', marginLeft: '0.5rem' }}>
                  ({t('deckUploader.needMore', { count: getMinimumDeckSize(roomState.players.length, roomState.winTarget) - roomState.deckSize })})
                </span>
              )}
            </span>
            <span className="stat-divider">•</span>
            <span className="stat-text">
              {t('deckUploader.myImages')}: <strong>{myImages.length}/200</strong>
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
                    ? `🔓 ${t('deckUploader.playersCanUpload')}`
                    : `🔒 ${t('deckUploader.onlyAdminUploads')}`}
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
            title={t('deckUploader.selectFiles')}
          >
            {uploading ? (
              <>
                <span className="btn-icon">⏳</span>
                <span>{t('deckUploader.uploading')}</span>
              </>
            ) : (
              <>
                <span className="btn-icon">📁</span>
                <span>{t('deckUploader.uploadImages')}</span>
              </>
            )}
          </Button>

          {!isMobile && (
            <Button
              onClick={() => folderInputRef.current?.click()}
              disabled={uploading || myImages.length >= 200 || !canUpload}
              className="btn-upload"
              title={t('deckUploader.selectFolder')}
            >
              {uploading ? (
                <>
                  <span className="btn-icon">⏳</span>
                  <span>{t('deckUploader.uploading')}</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">📂</span>
                  <span>{t('deckUploader.uploadFolder')}</span>
                </>
              )}
            </Button>
          )}
        </div>

        {!canUpload && !isAdmin && (
          <p className="upload-disabled-message">
            🔒 {t('deckUploader.onlyHostCanUpload')}
          </p>
        )}

        {uploading && uploadProgress && (
          <div className="upload-progress">
            <div className="progress-text">
              {retryStatus || uploadProgress}
            </div>
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
              {t('deckUploader.processed', { completed: uploadStats.completed, total: uploadStats.total })}
              {uploadStats.failed > 0 && ` (${t('deckUploader.failed', { count: uploadStats.failed })})`}
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
            title={t('deckUploader.deleteAllImages')}
          >
            <span className="btn-icon">🗑️</span>
            <span>{t('deckUploader.deleteAll', { count: myImages.length })}</span>
          </Button>
        </div>
      )}

      <div className="deck-images-container">
        {myImages.length === 0 ? (
          <div className="no-images-message">
            <span className="empty-icon">🖼️</span>
            <p>{t('deckUploader.noImagesYet')}</p>
          </div>
        ) : (
          <div className="images-preview-grid">
            {myImages.map((img) => (
              <div key={img.id} className="image-preview-card">
                {img.imageData ? (
                  <img
                    src={img.imageData}
                    alt={t('deckUploader.uploadedImage')}
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
                  title={t('deckUploader.deleteImageTitle')}
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
