import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Video {
    id: VideoId;
    dataUrl: string;
    durationSeconds: bigint;
    timestamp: bigint;
}
export interface Photo {
    id: PhotoId;
    blob: ExternalBlob;
    timestamp: bigint;
}
export type PhotoId = string;
export type VideoId = string;
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deletePhoto(id: PhotoId): Promise<void>;
    deleteVideo(id: VideoId): Promise<void>;
    getAllPhotos(): Promise<Array<Photo>>;
    getAllVideos(): Promise<Array<Video>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    savePhoto(id: PhotoId, timestamp: bigint, blob: ExternalBlob): Promise<void>;
    saveVideo(id: VideoId, timestamp: bigint, durationSeconds: bigint, dataUrl: string): Promise<void>;
}
