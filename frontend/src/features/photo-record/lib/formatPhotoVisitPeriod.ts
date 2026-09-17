function toCalendarDay(value: string | null | undefined): string | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null
}

function toDateParts(value: string): { year: number; month: number; day: number } {
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

function formatFullDate(value: string): string {
  const { year, month, day } = toDateParts(value)
  return `${year}년 ${month}월 ${day}일`
}

/** Formats a bundle visit period without losing month/year context at boundaries. */
export function formatPhotoVisitPeriod(
  takenAt: string | null | undefined,
  endedAt: string | null | undefined,
): string | null {
  const start = toCalendarDay(takenAt)
  const end = toCalendarDay(endedAt)
  if (!start) return null
  if (!end || end <= start) return formatFullDate(start)

  const startParts = toDateParts(start)
  const endParts = toDateParts(end)
  if (startParts.year === endParts.year && startParts.month === endParts.month) {
    return `${formatFullDate(start)}–${endParts.day}일`
  }
  if (startParts.year === endParts.year) {
    return `${formatFullDate(start)}–${endParts.month}월 ${endParts.day}일`
  }
  return `${formatFullDate(start)}–${formatFullDate(end)}`
}
