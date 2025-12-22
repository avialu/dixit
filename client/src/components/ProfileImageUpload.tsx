import { resizeAndCompressImage } from "../utils/imageResize";

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
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.log("Processing profile image:", file.name);
      const imageData = await resizeAndCompressImage(file);
      console.log("Profile image processed successfully, data length:", imageData.length);
      onUpload(imageData);
    } catch (error) {
      console.error("Error processing profile image:", error);
      alert("Failed to process image. Please try another image.");
    } finally {
      // Reset the input
      event.target.value = "";
    }
  };

  const wrapperClass = size === "large" 
    ? "profile-upload-wrapper profile-upload-wrapper-large"
    : "profile-upload-wrapper";

  return (
    <div className={wrapperClass}>
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
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
      </label>
      {imageUrl && (
        <button
          type="button"
          className="profile-upload-remove"
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          title="Remove image"
        >
          ×
        </button>
      )}
    </div>
  );
}

