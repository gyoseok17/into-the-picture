import { useCallback, useEffect, useState, type FormEvent, type ReactNode, type RefObject } from 'react'
import { Search } from 'lucide-react'

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

const ALL = '__all__'

type DraftFilters = {
  draft: ContestQuery
  keywordDraft: string
  setKeywordDraft: (value: string) => void
  update: (next: Partial<ContestQuery>) => void
  reset: () => void
  apply: () => void
}

/**
 * Keeps filter changes local until an explicit apply action. Both the full bar and
 * the floating panel use this so their request timing cannot drift apart.
 */
function useContestFilterDraft(value: ContestQuery, onApply: (next: ContestQuery) => void): DraftFilters {
  const [draft, setDraft] = useState<ContestQuery>(value)
  const [keywordDraft, setKeywordDraft] = useState(value.keyword ?? '')

  useEffect(() => {
    setDraft(value)
    setKeywordDraft(value.keyword ?? '')
  }, [value])

  const update = useCallback((next: Partial<ContestQuery>) => {
    setDraft((current) => ({ ...current, ...next }))
  }, [])

  const reset = useCallback(() => {
    setDraft({})
    setKeywordDraft('')
  }, [])

  const apply = useCallback(() => {
    onApply({ ...draft, keyword: keywordDraft.trim() || undefined })
  }, [draft, keywordDraft, onApply])

  return { draft, keywordDraft, setKeywordDraft, update, reset, apply }
}

interface ContestFilterBarProps {
  value: ContestQuery
  options?: FilterOptions
  onChange: (next: ContestQuery) => void
  searchInputRef?: RefObject<HTMLInputElement>
}

export function ContestFilterBar({
  value,
  options,
  onChange,
  searchInputRef,
}: ContestFilterBarProps) {
  const filters = useContestFilterDraft(value, onChange)
  const hasDraftFilter = Boolean(
    filters.draft.season || filters.draft.grade || filters.draft.division || filters.draft.sido || filters.keywordDraft,
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    filters.apply()
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <Input
          ref={searchInputRef}
          value={filters.keywordDraft}
          onChange={(event) => filters.setKeywordDraft(event.target.value)}
          placeholder="제목·장소·키워드 검색"
          aria-label="수상작 키워드 검색"
        />
        <Button type="submit" variant="secondary" size="icon" aria-label="검색 조건 적용">
          <Search />
        </Button>
      </div>

      {options ? (
        <>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <SeasonChip active={!filters.draft.season} onClick={() => filters.update({ season: undefined })}>
              전체
            </SeasonChip>
            {options.seasons.map((season) => (
              <SeasonChip
                key={season}
                active={filters.draft.season === season}
                onClick={() => filters.update({ season })}
              >
                {season}
              </SeasonChip>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <FilterSelect label="등급" value={filters.draft.grade} options={options.grades} onValueChange={(grade) => filters.update({ grade })} />
            <FilterSelect label="부문" value={filters.draft.division} options={options.divisions} onValueChange={(division) => filters.update({ division })} />
            <FilterSelect label="지역" value={filters.draft.sido} options={options.sidos} onValueChange={(sido) => filters.update({ sido })} />
          </div>

          <div className="flex justify-end gap-2">
            {hasDraftFilter ? (
              <Button type="button" variant="ghost" size="sm" onClick={filters.reset}>
                초기화
              </Button>
            ) : null}
            <Button type="submit" size="sm">적용</Button>
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
    </form>
  )
}

/** Compact, staged controls for the floating result-page filter panel. */
export function ContestQuickFilterPanel({
  value,
  options,
  onApply,
}: {
  value: ContestQuery
  options: FilterOptions
  onApply: (next: ContestQuery) => void
}) {
  const filters = useContestFilterDraft(value, onApply)

  return (
    <form
      className="space-y-3 rounded-[1.15rem] bg-secondary/45 p-2"
      onSubmit={(event) => {
        event.preventDefault()
        filters.apply()
      }}
    >
      <div className="flex gap-2">
        <Input
          autoFocus
          value={filters.keywordDraft}
          onChange={(event) => filters.setKeywordDraft(event.target.value)}
          placeholder="제목, 장소, 키워드"
          aria-label="수상작 키워드"
          className="h-11 rounded-full border-transparent bg-background px-4 shadow-sm focus-visible:border-ring"
        />
        <Button type="submit" variant="secondary" size="icon" className="h-11 w-11 shrink-0 rounded-full border border-primary/10 bg-primary text-primary-foreground hover:bg-primary/90" aria-label="검색 조건 적용">
          <Search />
        </Button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto px-0.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SeasonChip active={!filters.draft.season} onClick={() => filters.update({ season: undefined })}>전체</SeasonChip>
        {options.seasons.map((season) => (
          <SeasonChip key={season} active={filters.draft.season === season} onClick={() => filters.update({ season })}>{season}</SeasonChip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <FilterSelect label="등급" value={filters.draft.grade} options={options.grades} onValueChange={(grade) => filters.update({ grade })} />
        <FilterSelect label="부문" value={filters.draft.division} options={options.divisions} onValueChange={(division) => filters.update({ division })} />
        <FilterSelect label="지역" value={filters.draft.sido} options={options.sidos} onValueChange={(sido) => filters.update({ sido })} />
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button type="button" variant="ghost" className="h-10 rounded-full px-3" onClick={filters.reset}>
          초기화
        </Button>
        <Button type="submit" className="h-10 rounded-full px-5">적용</Button>
      </div>
    </form>
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
