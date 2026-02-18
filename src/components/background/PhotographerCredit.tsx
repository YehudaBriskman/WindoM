import { Heart } from "lucide-react";
import { useBackgroundContext } from "../../contexts/BackgroundContext";

export function PhotographerCredit() {
  const { photographer, currentPhotoId, photoHistory } = useBackgroundContext();
  const { history, toggleLike } = photoHistory;

  if (!photographer) return null;

  const currentPhoto = currentPhotoId
    ? history.find((p) => p.id === currentPhotoId)
    : null;
  const isLiked = currentPhoto?.liked ?? false;

  return (
    <div className="photographer-credit glass-credit text-shadow-credit">
      <button
        className={`photo-credit-like-btn ${isLiked ? "liked" : ""}`}
        onClick={() => currentPhotoId && toggleLike(currentPhotoId)}
        title={isLiked ? "Unlike photo" : "Like photo"}
      >
        <Heart size={13} fill={isLiked ? "currentColor" : "none"} />
      </button>
      Photo by{" "}
      <a
        href={`${photographer.url}?utm_source=momentum-clone&utm_medium=referral`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {photographer.name}
      </a>{" "}
      on{" "}
      <a
        href="https://unsplash.com?utm_source=momentum-clone&utm_medium=referral"
        target="_blank"
        rel="noopener noreferrer"
      >
        Unsplash
      </a>
    </div>
  );
}
