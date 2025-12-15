import { useState, useRef } from 'react';
import { resizeAndCompressImage, validateImageFile } from '../utils/imageResize';
import { RoomState } from '../hooks/useGameState';

interface DeckUploaderProps {
  roomState: RoomState;
  playerId: string;
  onUpload: (imageData: string) => void;
  onDelete: (imageId: string) => void;
  onSetMode: (mode: string) => void;
  onLock: () => void;
}

export function DeckUploader({
  roomState,
  playerId,
  onUpload,
  onDelete,
  onSetMode,
  onLock,
}: DeckUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = roomState.players.find(p => p.id === playerId)?.isAdmin || false;
  const myImages = roomState.deckImages.filter(img => img.uploadedBy === playerId);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Processing ${i + 1}/${files.length}...`);

      const error = validateImageFile(file);
      if (error) {
        alert(error);
        continue;
      }

      try {
        const imageData = await resizeAndCompressImage(file);
        onUpload(imageData);
      } catch (err) {
        console.error('Failed to process image:', err);
        alert('Failed to process image: ' + file.name);
      }
    }

    setUploading(false);
    setUploadProgress('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="deck-uploader">
      <div className="deck-info">
        <h3>Deck: {roomState.deckSize} images</h3>
        <p>My images: {myImages.length}/20</p>
        {roomState.deckLocked && <p className="locked">🔒 Deck Locked</p>}
      </div>

      {isAdmin && !roomState.deckLocked && (
        <div className="deck-controls">
          <label>
            Deck Mode:
            <select
              value={roomState.deckMode}
              onChange={(e) => onSetMode(e.target.value)}
            >
              <option value="MIXED">Mixed (Host + Players)</option>
              <option value="HOST_ONLY">Host Only</option>
              <option value="PLAYERS_ONLY">Players Only</option>
            </select>
          </label>
        </div>
      )}

      {!roomState.deckLocked && (
        <div className="upload-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading || myImages.length >= 20}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || myImages.length >= 20}
            className="btn-primary"
          >
            {uploading ? uploadProgress : 'Upload Images'}
          </button>

          {isAdmin && (
            <button onClick={onLock} className="btn-secondary">
              Lock Deck
            </button>
          )}
        </div>
      )}

      <div className="deck-images">
        {myImages.map((img) => (
          <div key={img.id} className="deck-image-item">
            <span className="image-id">{img.id.slice(0, 8)}</span>
            {!roomState.deckLocked && (
              <button
                onClick={() => onDelete(img.id)}
                className="btn-delete"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

