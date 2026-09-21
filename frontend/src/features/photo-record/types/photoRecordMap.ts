import type { PhotoRecordBundleMapPin } from "../types";

/** Marker groups share one city anchor or a legacy coordinate anchor. */
export interface PhotoRecordMapPinGroup {
  id: string;
  left: number;
  top: number;
  pins: PhotoRecordBundleMapPin[];
}

export interface PhotoRecordMapStageSize {
  width: number;
  height: number;
}
