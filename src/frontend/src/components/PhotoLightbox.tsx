import { ChevronLeft, ChevronRight, Loader2, Trash2, X } from "lucide-react";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { Photo } from "../backend";
import { useDeletePhoto } from "../hooks/useQueries";

interface PhotoLightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onDelete: () => void;
}

function formatTimestamp(timestamp: bigint): string {
  const ms = Number(timestamp);
  const date = new Date(ms);
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PhotoLightbox({
  photos,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onDelete,
}: PhotoLightboxProps) {
  const deletePhotoMutation = useDeletePhoto();
  const currentPhoto = photos[currentIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onNext();
      else if (e.key === "ArrowLeft") onPrev();
    },
    [onClose, onNext, onPrev],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleDelete = async () => {
    if (!currentPhoto) return;
    try {
      await deletePhotoMutation.mutateAsync(currentPhoto.id);
      toast.success("Photo deleted");
      onDelete();
    } catch {
      toast.error("Failed to delete photo");
    }
  };

  if (!currentPhoto) return null;

  const imageUrl = currentPhoto.blob.getDirectURL();

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex flex-col bg-black/96 animate-fade-in m-0 max-w-none max-h-none w-full h-full p-0 border-0"
      aria-label="Photo viewer"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 glass border-b border-border shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-foreground hover:text-amber transition-colors"
          aria-label="Close lightbox"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {currentIndex + 1} / {photos.length}
          </p>
          <p className="text-xs text-foreground font-medium">
            {formatTimestamp(currentPhoto.timestamp)}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deletePhotoMutation.isPending}
          className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
          aria-label="Delete photo"
        >
          {deletePhotoMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </div>

      {/* Image area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0">
        <img
          key={currentPhoto.id}
          src={imageUrl}
          alt={`Taken on ${formatTimestamp(currentPhoto.timestamp)}`}
          className="max-w-full max-h-full object-contain animate-fade-in select-none"
          style={{ maxHeight: "calc(100dvh - 160px)" }}
          draggable={false}
        />

        {/* Prev button */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-light flex items-center justify-center text-foreground hover:text-amber transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Next button */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={onNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-light flex items-center justify-center text-foreground hover:text-amber transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="shrink-0 glass border-t border-border px-4 py-3">
          <div className="flex gap-2 overflow-x-auto justify-center pb-0.5">
            {photos.map((photo, index) => (
              <ThumbnailButton
                key={photo.id}
                photo={photo}
                index={index}
                isActive={index === currentIndex}
                currentIndex={currentIndex}
                onNext={onNext}
                onPrev={onPrev}
              />
            ))}
          </div>
        </div>
      )}
    </dialog>
  );
}

interface ThumbnailButtonProps {
  photo: Photo;
  index: number;
  isActive: boolean;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
}

function ThumbnailButton({
  photo,
  index,
  isActive,
  currentIndex,
  onNext,
  onPrev,
}: ThumbnailButtonProps) {
  const handleClick = () => {
    const diff = index - currentIndex;
    if (diff === 0) return;
    const steps = Math.abs(diff);
    const fn = diff > 0 ? onNext : onPrev;
    for (let i = 0; i < steps; i++) fn();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`shrink-0 w-12 h-12 rounded overflow-hidden transition-all duration-200 ${
        isActive ? "ring-2 ring-amber scale-105" : "opacity-50 hover:opacity-80"
      }`}
      aria-label={`Go to photo ${index + 1}`}
      aria-current={isActive ? "true" : undefined}
    >
      <img
        src={photo.blob.getDirectURL()}
        alt=""
        className="w-full h-full object-cover"
      />
    </button>
  );
}
