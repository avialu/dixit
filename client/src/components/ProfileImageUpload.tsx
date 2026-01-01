import { handleImageUploadEvent } from "../utils/imageResize";
import { Button } from "./ui";

interface ProfileImageUploadProps {
  imageUrl: string | null;
  onUpload: (imageData: string) => void;
  onRemove: () => void;
  playerColor: string;
  size?: "small" | "large";
}

export function ProfileImageUpload({
  imageUrl,
  onUpload,
  onRemove,
  playerColor,
  size = "small",
}: ProfileImageUploadProps) {
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUploadEvent(
      event,
      onUpload,
      () => alert("Failed to process image. Please try another image.")
    );
  };

  const wrapperClass = size === "large" 
    ? "profile-upload-wrapper profile-upload-wrapper-large"
    : "profile-upload-wrapper";

  return (
    <div className={wrapperClass} onClick={(e) => e.stopPropagation()}>
      <label className="profile-upload-label" title="Click to upload profile image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Profile"
            className="profile-upload-image"
          />
        ) : (
          <div
            className="profile-upload-placeholder"
            style={{ background: playerColor }}
          >
            <div className="profile-upload-plus">+</div>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          style={{ display: "none" }}
        />
      </label>
      {imageUrl && (
        <Button
          type="button"
          className="x-button profile-upload-remove"
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          title="Remove image"
        >
          ×
        </Button>
      )}
    </div>
  );
}

