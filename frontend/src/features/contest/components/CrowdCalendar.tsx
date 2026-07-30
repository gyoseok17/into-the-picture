import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CrowdForecast } from '../types'

type Level = 'low' | 'medium' | 'high'

// 혼잡도(rate, 0~100) → 단계. 낮을수록 여유.
function levelOf(rate: number): Level {
  if (rate < 40) return 'low'
  if (rate <= 70) return 'medium'
  return 'high'
}

const LEVEL_LABEL: Record<Level, string> = {
  low: '여유',
  medium: '보통',
  high: '혼잡',
}

const LEVEL_DOT: Record<Level, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-rose-500',
}

const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

export function CrowdCalendar({ forecast }: { forecast: CrowdForecast }) {
  const view = useMemo(() => {
    const rateByKey = new Map<string, number>()
    const low: Date[] = []
    const medium: Date[] = []
    const high: Date[] = []

    for (const entry of forecast.daily) {
      rateByKey.set(entry.date, entry.rate)
      const date = parseISO(entry.date)
      const level = levelOf(entry.rate)
      if (level === 'low') low.push(date)
      else if (level === 'medium') medium.push(date)
      else high.push(date)
    }

    const recommended = forecast.recommendedDates.map((date) => parseISO(date))
    const sortedKeys = forecast.daily.map((entry) => entry.date).sort()
    const fromDate = sortedKeys.length ? parseISO(sortedKeys[0]) : undefined
    const toDate = sortedKeys.length
      ? parseISO(sortedKeys[sortedKeys.length - 1])
      : undefined

    return {
      rateByKey,
      fromDate,
      toDate,
      numberOfMonths: fromDate && toDate && !isSameMonth(fromDate, toDate) ? 2 : 1,
      modifiers: { low, medium, high, recommended },
      modifiersClassNames: {
        low: 'bg-emerald-100 text-emerald-900',
        medium: 'bg-amber-100 text-amber-900',
        high: 'bg-rose-100 text-rose-900',
        recommended: 'font-bold ring-2 ring-inset ring-primary',
      },
    }
  }, [forecast])

  const [selected, setSelected] = useState<Date | undefined>(view.fromDate)

  const selectedKey = selected ? format(selected, 'yyyy-MM-dd') : null
  const selectedRate = selectedKey ? view.rateByKey.get(selectedKey) : undefined

  return (
    <div className="space-y-3">
      {forecast.recommendedDates.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm text-muted-foreground">추천일</span>
          {forecast.recommendedDates.map((date) => (
            <Badge key={date}>
              {format(parseISO(date), 'M.d(EEE)', { locale: ko })}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="rounded-lg border">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          defaultMonth={view.fromDate}
          fromDate={view.fromDate}
          toDate={view.toDate}
          numberOfMonths={view.numberOfMonths}
          locale={ko}
          modifiers={view.modifiers}
          modifiersClassNames={view.modifiersClassNames}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {(['low', 'medium', 'high'] as Level[]).map((level) => (
          <span key={level} className="flex items-center gap-1">
            <span className={cn('h-2.5 w-2.5 rounded-full', LEVEL_DOT[level])} />
            {LEVEL_LABEL[level]}
          </span>
        ))}
      </div>

      {selected && selectedRate != null ? (
        <p className="text-sm">
          <span className="font-medium">
            {format(selected, 'M월 d일 (EEE)', { locale: ko })}
          </span>
          {` · ${LEVEL_LABEL[levelOf(selectedRate)]} (혼잡도 ${Math.round(selectedRate)}%)`}
          {selectedKey && forecast.recommendedDates.includes(selectedKey)
            ? ' · 추천일'
            : ''}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          날짜를 선택하면 혼잡도를 확인할 수 있어요.
        </p>
      )}
    </div>
  )
}
