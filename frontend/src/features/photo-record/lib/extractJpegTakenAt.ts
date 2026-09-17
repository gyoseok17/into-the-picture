export type ImageTakenAtResult =
  | { status: 'found'; takenAt: string }
  | { status: 'not-found' | 'invalid' | 'not-supported' }

const JPEG_SOI = 0xffd8
const APP1_MARKER = 0xe1
const SOS_MARKER = 0xda
const EOI_MARKER = 0xd9
const EXIF_HEADER = 'Exif\u0000\u0000'
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const TIFF_TAG_EXIF_IFD = 0x8769
const TIFF_TAG_DATE_TIME = 0x0132
const EXIF_TAG_DATE_TIME_ORIGINAL = 0x9003
const EXIF_TAG_DATE_TIME_DIGITIZED = 0x9004
const TIFF_TYPE_ASCII = 2

/**
 * Reads only the date tags from JPEG APP1, PNG eXIf and WebP EXIF chunks.
 * GPS and any other EXIF data are intentionally ignored.
 */
export async function extractImageTakenAt(
  file: File,
): Promise<ImageTakenAtResult> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  if (isJpeg(bytes)) return extractJpegTakenAt(bytes)
  if (isPng(bytes)) return extractPngTakenAt(bytes)
  if (isWebp(bytes)) return extractWebpTakenAt(bytes)
  if (isHeif(file, bytes)) return { status: 'not-supported' }
  return { status: 'not-supported' }
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && readUint16(bytes, 0, false) === JPEG_SOI
}

function isPng(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((value, index) => bytes[index] === value)
}

function isWebp(bytes: Uint8Array): boolean {
  return asciiAt(bytes, 0, 'RIFF') && asciiAt(bytes, 8, 'WEBP')
}

function isHeif(file: File, bytes: Uint8Array): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/heic' || type === 'image/heif') return true
  const filename = file.name.toLowerCase()
  if (filename.endsWith('.heic') || filename.endsWith('.heif')) return true
  return asciiAt(bytes, 4, 'ftyp')
}

function extractJpegTakenAt(bytes: Uint8Array): ImageTakenAtResult {
  let offset = 2
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return { status: 'invalid' }
    while (bytes[offset] === 0xff) offset += 1

    const marker = bytes[offset]
    offset += 1
    if (marker === SOS_MARKER || marker === EOI_MARKER) break
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    if (offset + 2 > bytes.length) return { status: 'invalid' }

    const length = readUint16(bytes, offset, false)
    if (length < 2 || offset + length > bytes.length)
      return { status: 'invalid' }
    if (marker === APP1_MARKER && hasExifHeader(bytes, offset + 2)) {
      const date = extractExifDate(bytes, offset + 2 + EXIF_HEADER.length)
      return date ? { status: 'found', takenAt: date } : { status: 'not-found' }
    }
    offset += length
  }

  return { status: 'not-found' }
}

function extractPngTakenAt(bytes: Uint8Array): ImageTakenAtResult {
  let offset = PNG_SIGNATURE.length
  while (offset + 12 <= bytes.length) {
    const length = readUint32(bytes, offset, false)
    const typeOffset = offset + 4
    const dataOffset = offset + 8
    if (!Number.isFinite(length) || dataOffset + length + 4 > bytes.length)
      return { status: 'invalid' }
    if (asciiAt(bytes, typeOffset, 'eXIf')) {
      const tiffOffset = hasExifHeader(bytes, dataOffset)
        ? dataOffset + EXIF_HEADER.length
        : dataOffset
      const date = extractExifDate(bytes, tiffOffset)
      return date ? { status: 'found', takenAt: date } : { status: 'not-found' }
    }
    offset = dataOffset + length + 4
  }
  return { status: 'not-found' }
}

function extractWebpTakenAt(bytes: Uint8Array): ImageTakenAtResult {
  let offset = 12
  while (offset + 8 <= bytes.length) {
    const chunkLength = readUint32(bytes, offset + 4, true)
    const dataOffset = offset + 8
    if (
      !Number.isFinite(chunkLength) ||
      dataOffset + chunkLength > bytes.length
    )
      return { status: 'invalid' }
    if (asciiAt(bytes, offset, 'EXIF')) {
      const tiffOffset = hasExifHeader(bytes, dataOffset)
        ? dataOffset + EXIF_HEADER.length
        : dataOffset
      const date = extractExifDate(bytes, tiffOffset)
      return date ? { status: 'found', takenAt: date } : { status: 'not-found' }
    }
    offset = dataOffset + chunkLength + (chunkLength % 2)
  }
  return { status: 'not-found' }
}

function hasExifHeader(bytes: Uint8Array, offset: number): boolean {
  return EXIF_HEADER.split('').every(
    (character, index) => bytes[offset + index] === character.charCodeAt(0),
  )
}

function asciiAt(bytes: Uint8Array, offset: number, value: string): boolean {
  return value
    .split('')
    .every(
      (character, index) => bytes[offset + index] === character.charCodeAt(0),
    )
}

function extractExifDate(bytes: Uint8Array, tiffOffset: number): string | null {
  if (tiffOffset + 8 > bytes.length) return null
  const byteOrder = String.fromCharCode(
    bytes[tiffOffset],
    bytes[tiffOffset + 1],
  )
  if (byteOrder !== 'II' && byteOrder !== 'MM') return null
  const littleEndian = byteOrder === 'II'
  if (readUint16(bytes, tiffOffset + 2, littleEndian) !== 42) return null

  const ifdOffset = readUint32(bytes, tiffOffset + 4, littleEndian)
  const ifd = readIfd(bytes, tiffOffset, ifdOffset, littleEndian)
  if (!ifd) return null

  const dateTimeOriginal = findAsciiTag(
    bytes,
    tiffOffset,
    ifd,
    EXIF_TAG_DATE_TIME_ORIGINAL,
    littleEndian,
  )
  if (dateTimeOriginal) return toDateTimeLocal(dateTimeOriginal)

  const exifPointer = findLongTag(bytes, ifd, TIFF_TAG_EXIF_IFD, littleEndian)
  if (exifPointer !== null) {
    const exifIfd = readIfd(bytes, tiffOffset, exifPointer, littleEndian)
    if (exifIfd) {
      const original = findAsciiTag(
        bytes,
        tiffOffset,
        exifIfd,
        EXIF_TAG_DATE_TIME_ORIGINAL,
        littleEndian,
      )
      if (original) return toDateTimeLocal(original)
      const digitized = findAsciiTag(
        bytes,
        tiffOffset,
        exifIfd,
        EXIF_TAG_DATE_TIME_DIGITIZED,
        littleEndian,
      )
      if (digitized) return toDateTimeLocal(digitized)
    }
  }

  const fallback = findAsciiTag(
    bytes,
    tiffOffset,
    ifd,
    TIFF_TAG_DATE_TIME,
    littleEndian,
  )
  return fallback ? toDateTimeLocal(fallback) : null
}

interface Ifd {
  offset: number
  entryCount: number
}

function readIfd(
  bytes: Uint8Array,
  tiffOffset: number,
  relativeOffset: number,
  littleEndian: boolean,
): Ifd | null {
  const offset = tiffOffset + relativeOffset
  if (offset + 2 > bytes.length) return null
  const entryCount = readUint16(bytes, offset, littleEndian)
  if (offset + 2 + entryCount * 12 > bytes.length) return null
  return { offset: offset + 2, entryCount }
}

function findAsciiTag(
  bytes: Uint8Array,
  tiffOffset: number,
  ifd: Ifd,
  tag: number,
  littleEndian: boolean,
): string | null {
  for (let index = 0; index < ifd.entryCount; index += 1) {
    const offset = ifd.offset + index * 12
    if (
      readUint16(bytes, offset, littleEndian) !== tag ||
      readUint16(bytes, offset + 2, littleEndian) !== TIFF_TYPE_ASCII
    )
      continue
    const count = readUint32(bytes, offset + 4, littleEndian)
    if (count < 1 || count > 128) return null
    const valueOffset =
      count <= 4
        ? offset + 8
        : tiffOffset + readUint32(bytes, offset + 8, littleEndian)
    if (valueOffset + count > bytes.length) return null
    const value = String.fromCharCode(
      ...bytes.slice(valueOffset, valueOffset + count),
    ).replace(/\0+$/, '')
    return value || null
  }
  return null
}

function findLongTag(
  bytes: Uint8Array,
  ifd: Ifd,
  tag: number,
  littleEndian: boolean,
): number | null {
  for (let index = 0; index < ifd.entryCount; index += 1) {
    const offset = ifd.offset + index * 12
    if (readUint16(bytes, offset, littleEndian) === tag)
      return readUint32(bytes, offset + 8, littleEndian)
  }
  return null
}

function toDateTimeLocal(value: string): string | null {
  const matched = /^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2})(?::\d{2})?$/.exec(
    value.trim(),
  )
  if (!matched) return null
  const [, year, month, day, hour, minute] = matched
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  )
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  )
    return null
  return `${year}-${month}-${day}T${hour}:${minute}`
}

function readUint16(
  bytes: Uint8Array,
  offset: number,
  littleEndian: boolean,
): number {
  if (offset + 2 > bytes.length) return Number.NaN
  return littleEndian
    ? bytes[offset] | (bytes[offset + 1] << 8)
    : (bytes[offset] << 8) | bytes[offset + 1]
}

function readUint32(
  bytes: Uint8Array,
  offset: number,
  littleEndian: boolean,
): number {
  if (offset + 4 > bytes.length) return Number.NaN
  return littleEndian
    ? bytes[offset] +
        bytes[offset + 1] * 0x100 +
        bytes[offset + 2] * 0x10000 +
        bytes[offset + 3] * 0x1000000
    : bytes[offset] * 0x1000000 +
        bytes[offset + 1] * 0x10000 +
        bytes[offset + 2] * 0x100 +
        bytes[offset + 3]
}
