import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob, type Photo, type Video } from "../backend";
import { useActor } from "./useActor";

export const PHOTOS_QUERY_KEY = ["photos"];
export const VIDEOS_QUERY_KEY = ["videos"];

export function useGetAllPhotos() {
  const { actor, isFetching } = useActor();

  return useQuery<Photo[]>({
    queryKey: PHOTOS_QUERY_KEY,
    queryFn: async () => {
      if (!actor) return [];
      const photos = await actor.getAllPhotos();
      return [...photos].sort(
        (a, b) => Number(b.timestamp) - Number(a.timestamp),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSavePhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      timestamp,
      imageData,
    }: {
      id: string;
      timestamp: bigint;
      imageData: Uint8Array<ArrayBuffer>;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      const blob = ExternalBlob.fromBytes(imageData);
      await actor.savePhoto(id, timestamp, blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHOTOS_QUERY_KEY });
    },
  });
}

export function useDeletePhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not initialized");
      await actor.deletePhoto(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHOTOS_QUERY_KEY });
    },
  });
}

export function useGetAllVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: VIDEOS_QUERY_KEY,
    queryFn: async () => {
      if (!actor) return [];
      const videos = await actor.getAllVideos();
      return [...videos].sort(
        (a, b) => Number(b.timestamp) - Number(a.timestamp),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      timestamp,
      durationSeconds,
      dataUrl,
    }: {
      id: string;
      timestamp: bigint;
      durationSeconds: bigint;
      dataUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      await actor.saveVideo(id, timestamp, durationSeconds, dataUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VIDEOS_QUERY_KEY });
    },
  });
}

export function useDeleteVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not initialized");
      await actor.deleteVideo(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VIDEOS_QUERY_KEY });
    },
  });
}
