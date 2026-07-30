// 촬영월 YYYYMM → "YYYY.MM". 형식이 아니면 원본 반환(방어).
export function formatFilmMonth(filmMonth: string): string {
  if (!/^\d{6}$/.test(filmMonth)) return filmMonth
  return `${filmMonth.slice(0, 4)}.${filmMonth.slice(4, 6)}`
}
