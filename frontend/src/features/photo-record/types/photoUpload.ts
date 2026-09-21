import type { ImageTakenAtResult } from "../lib/extractJpegTakenAt";
export const MAX_PHOTO_UPLOAD_SELECTION = 3;
export const MAX_PHOTO_UPLOAD_FILE_SIZE = 10 * 1024 * 1024;
export const PHOTO_UPLOAD_FILE_SIZE_LABEL = "10MB";
export const ACCEPTED_PHOTO_IMAGES =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
export type UploadItemStatus = "ready" | "uploading" | "success" | "failed";
export interface PhotoUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  takenAt: string | null;
  manualTakenAt: string | null;
  exif: ImageTakenAtResult["status"];
  status: UploadItemStatus;
}
