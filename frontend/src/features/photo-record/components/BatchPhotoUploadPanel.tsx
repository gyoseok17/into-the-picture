import { MapPin } from "lucide-react";

import { useBatchPhotoUpload } from "../hooks/useBatchPhotoUpload";
import { mapLocationLabel } from "../lib/photoUploadPresentation";
import { PhotoUploadForm } from "./PhotoUploadForm";
import type { PhotoRecordDraft } from "../types";

/** Page-level composition only; preparation and input sections are isolated. */
export function BatchPhotoUploadPanel({
  onComplete,
  initialLocation,
  onUploadStateChange,
}: {
  onComplete: () => void;
  initialLocation?: Pick<PhotoRecordDraft, "mapRegionCode" | "mapCityCode">;
  onUploadStateChange?: (isUploading: boolean) => void;
}) {
  const upload = useBatchPhotoUpload({
    onComplete,
    initialLocation,
    onUploadStateChange,
  });
  return <PhotoUploadForm upload={upload} />;
}

export function SelectedMapLocation({ value }: { value: PhotoRecordDraft }) {
  const label = mapLocationLabel(value) ?? "지역 미선택";
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-sm font-medium text-primary">
      <MapPin className="h-4 w-4" />
      {label}
    </div>
  );
}
