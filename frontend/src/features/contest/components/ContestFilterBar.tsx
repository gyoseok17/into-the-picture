import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Search, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ContestQuery, FilterOptions } from '../types'

// Radix Select는 빈 문자열 value를 못 쓰므로 '전체'용 센티넬을 둔다.
const ALL = '__all__'

interface ContestFilterBarProps {
  value: ContestQuery
  options?: FilterOptions
  onChange: (next: ContestQuery) => void
}

export function ContestFilterBar({
  value,
  options,
  onChange,
}: ContestFilterBarProps) {
  // 키워드는 입력 중 매 글자 요청하지 않도록 로컬 드래프트 → 제출 시 적용.
  const [keywordDraft, setKeywordDraft] = useState(value.keyword ?? '')
  useEffect(() => {
    setKeywordDraft(value.keyword ?? '')
  }, [value.keyword])

  const hasActiveFilter = Boolean(
    value.season || value.grade || value.division || value.sido || value.keyword,
  )

  const submitKeyword = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = keywordDraft.trim()
    onChange({ ...value, keyword: trimmed || undefined })
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submitKeyword} className="flex gap-2">
        <Input
          value={keywordDraft}
          onChange={(event) => setKeywordDraft(event.target.value)}
          placeholder="제목·장소·키워드 검색"
          aria-label="키워드 검색"
        />
        <Button type="submit" variant="secondary" size="icon" aria-label="검색">
          <Search />
        </Button>
      </form>

      {options ? (
        <>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <SeasonChip
              active={!value.season}
              onClick={() => onChange({ ...value, season: undefined })}
            >
              전체
            </SeasonChip>
            {options.seasons.map((season) => (
              <SeasonChip
                key={season}
                active={value.season === season}
                onClick={() => onChange({ ...value, season })}
              >
                {season}
              </SeasonChip>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <FilterSelect
              label="등급"
              value={value.grade}
              options={options.grades}
              onValueChange={(grade) => onChange({ ...value, grade })}
            />
            <FilterSelect
              label="부문"
              value={value.division}
              options={options.divisions}
              onValueChange={(division) => onChange({ ...value, division })}
            />
            <FilterSelect
              label="지역"
              value={value.sido}
              options={options.sidos}
              onValueChange={(sido) => onChange({ ...value, sido })}
            />
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <Skeleton className="h-7 w-2/3" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      )}

      {hasActiveFilter ? (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => onChange({})}>
            <X /> 필터 초기화
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function SeasonChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" onClick={onClick} className="shrink-0">
      <Badge
        variant={active ? 'default' : 'outline'}
        className="cursor-pointer px-3 py-1"
      >
        {children}
      </Badge>
    </button>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string
  value?: string
  options: string[]
  onValueChange: (value: string | undefined) => void
}) {
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) => onValueChange(next === ALL ? undefined : next)}
    >
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label} 전체</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
