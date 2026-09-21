import { getAlbumMapCityPosition } from "./albumMapCityPositions";
import type { PhotoRecordBundleMapPin } from "../types";
import type {
  PhotoRecordMapPinGroup,
  PhotoRecordMapStageSize,
} from "../types/photoRecordMap";

export function groupPhotoRecordMapPins(
  pins: PhotoRecordBundleMapPin[],
): PhotoRecordMapPinGroup[] {
  const groups = new Map<string, PhotoRecordMapPinGroup>();

  for (const pin of pins) {
    const position =
      getAlbumMapCityPosition(pin.mapCityCode) ?? legacyPosition(pin.lat, pin.lng);
    const id =
      pin.mapRegionCode && pin.mapCityCode
        ? `city-${pin.mapRegionCode}-${pin.mapCityCode}`
        : `place-${pin.lat.toFixed(3)}-${pin.lng.toFixed(3)}`;
    const group = groups.get(id);

    if (group) group.pins.push(pin);
    else groups.set(id, { id, ...position, pins: [pin] });
  }

  return [...groups.values()];
}

export function pinMatchesRegion(
  pin: Pick<PhotoRecordBundleMapPin, "mapRegionCode" | "lat" | "lng">,
  regionCode: string,
): boolean {
  if (pin.mapRegionCode) return pin.mapRegionCode === regionCode;

  const { lat, lng } = pin;
  if (regionCode === "JEJU") return lat < 34.6;
  if (regionCode === "GANGWON") return lat >= 37.2 && lng >= 127.1;
  if (regionCode === "CAPITAL") return lat >= 37 && lng < 127.7;
  if (regionCode === "CHUNGCHEONG")
    return lat >= 35.7 && lat < 37.2 && lng >= 126.3 && lng < 128.1;
  if (regionCode === "JEOLLA") return lat < 36.2 && lng < 128;
  return regionCode === "GYEONGSANG" && lat < 37.4 && lng >= 127.5;
}

export function getPhotoRecordMapStageSize(
  viewportWidth: number,
  viewportHeight: number,
): PhotoRecordMapStageSize {
  const width = Math.min(viewportWidth, viewportHeight * (2 / 3));
  return { width, height: width * (3 / 2) };
}

function legacyPosition(lat: number, lng: number) {
  return {
    left: clamp(24 + ((lng - 125.8) / 6.3) * 60, 8, 92),
    top: clamp(78 - ((lat - 33) / 5.8) * 67, 8, 92),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
