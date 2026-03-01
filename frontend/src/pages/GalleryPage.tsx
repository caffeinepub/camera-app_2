import React, { useState, useMemo } from 'react';
import { ImageIcon, Film } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type Photo, type Video } from '../backend';
import PhotoLightbox from '../components/PhotoLightbox';
import VideoLightbox from '../components/VideoLightbox';
import VideoThumbnail from '../components/VideoThumbnail';
import { useGetAllPhotos, useDeletePhoto, useGetAllVideos, useDeleteVideo } from '../hooks/useQueries';

type GalleryItem =
  | { kind: 'photo'; data: Photo }
  | { kind: 'video'; data: Video };

export default function GalleryPage() {
  const { data: photos = [], isLoading: photosLoading } = useGetAllPhotos();
  const { data: videos = [], isLoading: videosLoading } = useGetAllVideos();
  const deletePhotoMutation = useDeletePhoto();
  const deleteVideoMutation = useDeleteVideo();

  const [lightboxPhotoIndex, setLightboxPhotoIndex] = useState<number | null>(null);
  const [lightboxVideo, setLightboxVideo] = useState<Video | null>(null);

  const isLoading = photosLoading || videosLoading;

  // Merge and sort by timestamp descending
  const items = useMemo<GalleryItem[]>(() => {
    const photoItems: GalleryItem[] = photos.map(p => ({ kind: 'photo', data: p }));
    const videoItems: GalleryItem[] = videos.map(v => ({ kind: 'video', data: v }));
    return [...photoItems, ...videoItems].sort(
      (a, b) => Number(b.data.timestamp) - Number(a.data.timestamp)
    );
  }, [photos, videos]);

  const lightboxVideoIndex = lightboxVideo
    ? videos.findIndex(v => v.id === lightboxVideo.id)
    : -1;

  // Photo lightbox navigation
  const handlePhotoNext = () => {
    if (lightboxPhotoIndex === null) return;
    setLightboxPhotoIndex((lightboxPhotoIndex + 1) % photos.length);
  };
  const handlePhotoPrev = () => {
    if (lightboxPhotoIndex === null) return;
    setLightboxPhotoIndex((lightboxPhotoIndex - 1 + photos.length) % photos.length);
  };
  const handlePhotoDeleteFromLightbox = () => {
    if (lightboxPhotoIndex === null) return;
    if (photos.length <= 1) {
      setLightboxPhotoIndex(null);
    } else {
      const newIndex = lightboxPhotoIndex >= photos.length - 1 ? lightboxPhotoIndex - 1 : lightboxPhotoIndex;
      setLightboxPhotoIndex(newIndex);
    }
  };

  return (
    <div className="min-h-full bg-black pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 glass border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-foreground">Gallery</h2>
          <div className="flex items-center gap-3 text-muted-foreground text-xs">
            {photos.length > 0 && (
              <span className="flex items-center gap-1 bg-surface-2 px-2.5 py-1 rounded-full">
                <ImageIcon className="w-3 h-3" />
                {photos.length}
              </span>
            )}
            {videos.length > 0 && (
              <span className="flex items-center gap-1 bg-surface-2 px-2.5 py-1 rounded-full">
                <Film className="w-3 h-3" />
                {videos.length}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-3">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No photos or videos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {items.map(item => {
              if (item.kind === 'photo') {
                const photo = item.data;
                const photoIndex = photos.findIndex(p => p.id === photo.id);
                const url = photo.blob.getDirectURL();
                return (
                  <button
                    key={`photo-${photo.id}`}
                    className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group bg-surface-2 focus:outline-none focus:ring-2 focus:ring-amber"
                    onClick={() => setLightboxPhotoIndex(photoIndex)}
                    aria-label="Open photo"
                  >
                    <img
                      src={url}
                      alt="Photo"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                  </button>
                );
              } else {
                const video = item.data;
                return (
                  <VideoThumbnail
                    key={`video-${video.id}`}
                    video={video}
                    onClick={() => setLightboxVideo(video)}
                  />
                );
              }
            })}
          </div>
        )}
      </div>

      {/* Photo lightbox */}
      {lightboxPhotoIndex !== null && photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          currentIndex={lightboxPhotoIndex}
          onClose={() => setLightboxPhotoIndex(null)}
          onNext={handlePhotoNext}
          onPrev={handlePhotoPrev}
          onDelete={handlePhotoDeleteFromLightbox}
        />
      )}

      {/* Video lightbox */}
      {lightboxVideo && (
        <VideoLightbox
          video={lightboxVideo}
          onClose={() => setLightboxVideo(null)}
          onDelete={async (id) => {
            await deleteVideoMutation.mutateAsync(id);
            setLightboxVideo(null);
          }}
          isDeleting={deleteVideoMutation.isPending}
          hasPrev={lightboxVideoIndex > 0}
          hasNext={lightboxVideoIndex < videos.length - 1}
          onPrev={() => {
            if (lightboxVideoIndex > 0) setLightboxVideo(videos[lightboxVideoIndex - 1]);
          }}
          onNext={() => {
            if (lightboxVideoIndex < videos.length - 1) setLightboxVideo(videos[lightboxVideoIndex + 1]);
          }}
        />
      )}
    </div>
  );
}
