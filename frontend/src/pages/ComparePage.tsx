import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ImagePlus, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { AspectImage, ImageSource } from '@/components/AspectImage'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { LoadingState } from '@/components/state/LoadingState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ComparisonErrorNotice } from '@/features/comparison/components/ComparisonErrorNotice'
import { useComparisons, useCreateComparison, useDeleteComparison, useReplaceComparisonPhoto, useUploadUserPhoto, useUserPhotos } from '@/features/comparison/hooks/useComparison'
import type { PhotoComparison, UserPhoto } from '@/features/comparison/types'
import { useFavoriteContests } from '@/features/favorite/hooks/useFavorites'

export default function ComparePage() {
  const [params] = useSearchParams()
  const [contestId, setContestId] = useState(() => Number(params.get('contestId')) || 0)
  const [photoId, setPhotoId] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState<string | null>(null)
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false)
  const [isComposerOpen, setIsComposerOpen] = useState(() => Boolean(params.get('contestId')))
  const [selectedResult, setSelectedResult] = useState<number | null>(null)
  const favorites = useFavoriteContests()
  const photos = useUserPhotos()
  const comparisons = useComparisons()
  const upload = useUploadUserPhoto()
  const create = useCreateComparison()
  const selectedContest = favorites.data?.find((item) => item.contestId === contestId)?.contest
  const selectedPhoto = photos.data?.find((item) => item.id === photoId)
  const result = useMemo(() => comparisons.data?.find((item) => item.id === selectedResult), [comparisons.data, selectedResult])
  const availablePhotos = useMemo(() => {
    const usedPhotoIds = new Set(comparisons.data?.map((comparison) => comparison.userPhoto.id) ?? [])
    return (photos.data ?? []).filter((photo) => !usedPhotoIds.has(photo.id))
  }, [comparisons.data, photos.data])

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  function chooseFile(file: File | undefined): void {
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setPreviewName(file.name)
    upload.mutate(file, {
      onSuccess: (photo) => {
        setPhotoId(photo.id)
        setPreviewUrl(null)
        setPreviewName(null)
        setIsPhotoPickerOpen(false)
      },
    })
  }

  function selectPhoto(id: number): void {
    setPhotoId(id)
    setPreviewUrl(null)
    setPreviewName(null)
    setIsPhotoPickerOpen(false)
  }

  function saveComparison(): void {
    if (contestId && photoId) {
      create.mutate({ contestId, userPhotoId: photoId }, { onSuccess: (created) => { setSelectedResult(created.id); setIsComposerOpen(false) } })
    }
  }

  const photoSource = previewUrl ?? selectedPhoto?.url ?? null

  return <section className="flex flex-col gap-6">
    <header className="order-0 space-y-1">
      <p className="text-sm font-medium text-primary">내 사진 작업실</p>
      <h1 className="text-2xl font-semibold tracking-tight">사진 놓기</h1>
      <p className="text-sm text-muted-foreground">좋아하는 수상작을 기준으로 내 시선과 나란히 비교해 보세요.</p>
    </header>

    {isComposerOpen ? <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background p-0">
      <div className="flex items-center justify-between border-b bg-background/70 px-4 py-3">
        <div><h2 className="font-semibold">새 사진 놓기</h2><p className="text-xs text-muted-foreground">두 사진을 고르면 바로 비교판이 열려요.</p></div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsComposerOpen(false)}>접기</Button>
      </div>
      <div className="grid min-w-0 gap-0 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
        <SelectionPanel title="기준 수상작" hint="저장한 수상작에서 선택" items={favorites.data?.map((item) => ({ id: item.contestId, title: item.contest.title, image: item.contest.thumbUrl })) ?? []} loading={favorites.isPending} selected={contestId} onSelect={setContestId} />
        <ArrowRight className="m-auto hidden h-5 w-5 text-muted-foreground md:block" />
        <PhotoAlbumStrip photos={availablePhotos} loading={photos.isPending || comparisons.isPending} selectedId={photoId} onOpen={() => setIsPhotoPickerOpen(true)} />
      </div>
      <div className="grid border-t bg-background/70 md:grid-cols-2">
        <PreviewPane label="수상작" title={selectedContest?.title ?? '수상작을 선택해 주세요.'} image={selectedContest?.thumbUrl ?? null} />
        <PreviewPane label="내 사진" title={previewName ?? selectedPhoto?.originalFilename ?? '내 앨범에서 사진을 골라 주세요.'} image={photoSource} pending={upload.isPending} />
      </div>
      <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">비교판은 바로 보이며, 저장하면 나중에 다시 꺼내 볼 수 있어요.</p>
        <Button disabled={!selectedContest || !selectedPhoto || create.isPending} onClick={saveComparison}>{create.isPending ? '저장 중…' : '저장'}</Button>
      </div>
    </Card> : null}

    {isPhotoPickerOpen ? <PhotoPickerDialog photos={availablePhotos} loading={photos.isPending || comparisons.isPending} uploadPending={upload.isPending} selectedId={photoId} onClose={() => setIsPhotoPickerOpen(false)} onSelect={selectPhoto} onFile={chooseFile} /> : null}
    {result ? <ComparisonView comparison={result} onClose={() => setSelectedResult(null)} /> : null}
    {!isComposerOpen ? <button type="button" onClick={() => setIsComposerOpen(true)} className="flex min-h-24 items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/15 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"><ImagePlus className="h-5 w-5" />사진 놓기</button> : null}
    <section className="space-y-3">
      <div><p className="text-sm font-medium text-primary">HISTORY</p><h2 className="text-lg font-semibold">비교 결과</h2></div>
      {comparisons.isPending ? <LoadingState label="비교 결과를 불러오는 중…" /> : comparisons.isError ? <ErrorState error={comparisons.error} onRetry={() => void comparisons.refetch()} /> : comparisons.data?.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{comparisons.data.map((item) => <button type="button" key={item.id} onClick={() => setSelectedResult(item.id)} className="overflow-hidden rounded-xl border bg-card text-left transition-shadow hover:shadow-md"><div className="grid grid-cols-2"><AspectImage src={item.contest.thumbUrl} alt={item.contest.title} /><AspectImage src={item.userPhoto.url} alt="내 사진" /></div><div className="space-y-1 p-3"><p className="text-xs text-muted-foreground">수상작 · 내 사진</p><p className="line-clamp-1 text-sm font-medium">{item.contest.title}</p></div></button>)}</div> : <EmptyState title="아직 저장한 비교가 없어요" description="위에서 내 사진을 고르고 첫 비교를 만들어 보세요." />}
    </section>
    <ComparisonErrorNotice message={upload.isError ? '사진 업로드에 실패했어요. JPEG, PNG, WebP 10MB 이하인지 확인해 주세요.' : create.isError ? '비교 결과를 저장하지 못했어요. 다시 시도해 주세요.' : null} onClose={() => { upload.reset(); create.reset() }} />
  </section>
}

function SelectionPanel({ title, hint, items, loading, selected, onSelect }: { title: string; hint: string; items: { id: number; title: string; image: string }[]; loading: boolean; selected: number; onSelect: (id: number) => void }) {
  return <div className="min-w-0 space-y-3 p-4"><div><h3 className="font-medium">{title}</h3><p className="text-xs text-muted-foreground">{hint}</p></div>{loading ? <div className="h-28 animate-pulse rounded-lg bg-muted" /> : <div className="flex min-w-0 items-start gap-2 overflow-x-auto pb-2">{items.map((item) => <button type="button" key={item.id} onClick={() => onSelect(item.id)} className={`w-28 shrink-0 overflow-hidden rounded-lg border text-left sm:w-32 ${selected === item.id ? 'ring-2 ring-primary' : ''}`}><AspectImage src={item.image} alt={item.title} /><p className="line-clamp-2 min-h-10 p-1.5 text-xs leading-5">{item.title}</p></button>)}</div>}</div>
}

function PhotoAlbumStrip({ photos, loading, selectedId, onOpen }: { photos: UserPhoto[]; loading: boolean; selectedId: number; onOpen: () => void }) {
  const cover = photos.find((photo) => photo.id === selectedId) ?? photos[0]
  return <div className="min-w-0 space-y-3 p-4"><div><h3 className="font-medium">내 사진</h3><p className="text-xs text-muted-foreground">내 앨범에서 비교할 사진을 골라 보세요.</p></div>{loading ? <div className="h-24 animate-pulse rounded-lg bg-muted" /> : <button type="button" onClick={onOpen} className="relative flex h-24 w-full min-w-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/20 text-center transition-colors hover:bg-muted/50">{cover ? <><ImageSource src={cover.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" /><span className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/75 to-background/90" /></> : null}<span className="relative flex min-w-0 items-center gap-2"><ImagePlus className="h-5 w-5 shrink-0 text-primary" /><span className="min-w-0"><span className="block text-sm font-medium">사진 고르기</span><span className="mt-0.5 block text-xs text-muted-foreground">사진 {photos.length}장</span></span></span></button>}</div>
}

function PhotoPickerDialog({ photos, loading, uploadPending, selectedId, onClose, onSelect, onFile }: { photos: UserPhoto[]; loading: boolean; uploadPending: boolean; selectedId: number; onClose: () => void; onSelect: (id: number) => void; onFile: (file: File | undefined) => void }) {
  return <div role="dialog" aria-modal className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}><Card className="w-full max-w-md overflow-hidden p-0 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b px-4 py-3"><div><h2 className="font-semibold">내 앨범</h2><p className="text-xs text-muted-foreground">비교할 사진을 고르거나 새 사진을 올려 주세요.</p></div><Button type="button" variant="ghost" size="icon" aria-label="닫기" onClick={onClose}><X className="h-4 w-4" /></Button></div><div className="max-h-[60vh] overflow-y-auto p-4">{loading ? <div className="grid grid-cols-3 gap-2">{[1, 2, 3].map((item) => <div key={item} className="aspect-square animate-pulse rounded-lg bg-muted" />)}</div> : <div className="grid grid-cols-3 gap-2"><label className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-center text-xs text-muted-foreground transition-colors ${uploadPending ? 'cursor-wait opacity-60' : 'hover:bg-muted/60'}`}><ImagePlus className="h-5 w-5" />{uploadPending ? '업로드 중…' : '추가하기'}<input className="sr-only" disabled={uploadPending} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; onFile(file) }} /></label>{photos.map((photo) => <button key={photo.id} type="button" onClick={() => onSelect(photo.id)} className={`relative overflow-hidden rounded-lg border text-left ${selectedId === photo.id ? 'ring-2 ring-primary' : ''}`}><AspectImage src={photo.url} alt={photo.originalFilename ?? '내 사진'} /><span className="sr-only">{photo.originalFilename ?? '내 사진'} 선택</span></button>)}</div>}{!loading && photos.length === 0 ? <p className="mt-3 text-center text-sm text-muted-foreground">아직 내 앨범에 사진이 없어요. 위에서 사진을 올려 보세요.</p> : null}</div></Card></div>
}

function PreviewPane({ label, title, image, pending }: { label: string; title: string; image: string | null; pending?: boolean }) { return <div className="space-y-2 p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground">{label}</p>{pending ? <span className="text-xs text-primary">업로드 중…</span> : null}</div>{image ? <AspectImage src={image} alt={title} className="rounded-lg" /> : <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 text-center text-sm text-muted-foreground">{title}</div>}<p className="line-clamp-1 text-sm font-medium">{title}</p></div> }

function ComparisonView({ comparison, onClose }: { comparison: PhotoComparison; onClose: () => void }) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteChoiceOpen, setIsDeleteChoiceOpen] = useState(false)
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false)
  const remove = useDeleteComparison()
  const replace = useReplaceComparisonPhoto()
  const photos = useUserPhotos()
  const comparisons = useComparisons()
  const upload = useUploadUserPhoto()
  const usedPhotoIds = new Set(comparisons.data?.map((item) => item.userPhoto.id) ?? [])
  const availablePhotos = (photos.data ?? []).filter((photo) => !usedPhotoIds.has(photo.id))
  const actionError = upload.isError ? '새 사진을 올리지 못했어요. 파일과 연결 상태를 확인해 주세요.' : replace.isError ? '사진을 바꾸지 못했어요. 다시 시도해 주세요.' : remove.isError ? '삭제하지 못했어요. 다시 시도해 주세요.' : null

  function deleteComparison(deletePhoto: boolean): void {
    remove.mutate({ id: comparison.id, deletePhoto }, { onSuccess: onClose })
  }
  function replacePhoto(photoId: number): void {
    replace.mutate({ id: comparison.id, userPhotoId: photoId }, { onSuccess: onClose })
  }
  function addAndReplace(file: File | undefined): void {
    if (!file) return
    upload.mutate(file, { onSuccess: (photo) => replacePhoto(photo.id) })
  }

  return <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}><section className="w-full max-w-3xl space-y-3 rounded-xl border bg-card p-4 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-primary">SAVED COMPARISON</p><h2 className="text-lg font-semibold">{comparison.contest.title}</h2></div><Button variant="ghost" size="icon" aria-label="닫기" onClick={onClose}><X className="h-4 w-4" /></Button></div><div className="grid gap-3 md:grid-cols-2"><PreviewPane label="수상작" title={comparison.contest.title} image={comparison.contest.thumbUrl} /><PreviewPane label="내 사진" title={comparison.userPhoto.originalFilename ?? '내 사진'} image={comparison.userPhoto.url} /></div><div className="flex justify-end border-t pt-3"><Button variant="ghost" disabled={remove.isPending || replace.isPending || upload.isPending} onClick={() => setIsEditOpen(true)}>수정</Button></div>{isPhotoPickerOpen ? <PhotoPickerDialog photos={availablePhotos} loading={photos.isPending || comparisons.isPending} uploadPending={upload.isPending || replace.isPending} selectedId={0} onClose={() => setIsPhotoPickerOpen(false)} onSelect={replacePhoto} onFile={addAndReplace} /> : null}{isEditOpen ? <div role="dialog" aria-modal className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4" onClick={() => setIsEditOpen(false)}><section className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-4 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-primary">사진 놓기 수정</p><h3 className="font-semibold">현재 내 사진</h3></div><Button variant="ghost" size="icon" aria-label="닫기" onClick={() => setIsEditOpen(false)}><X className="h-4 w-4" /></Button></div><AspectImage src={comparison.userPhoto.url} alt={comparison.userPhoto.originalFilename ?? '내 사진'} className="rounded-lg" /><p className="line-clamp-1 text-sm text-muted-foreground">{comparison.userPhoto.originalFilename ?? '내 사진'}</p>{actionError ? <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</p> : null}{isDeleteChoiceOpen ? <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3"><p className="font-medium">사진도 함께 삭제할까요?</p><p className="mt-1 text-sm text-muted-foreground">결과만 지우면 사진은 사진첩에 남습니다.</p><div className="mt-3 flex flex-wrap justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setIsDeleteChoiceOpen(false)}>취소</Button><Button variant="outline" size="sm" disabled={remove.isPending} onClick={() => deleteComparison(false)}>결과만 삭제</Button><Button variant="destructive" size="sm" disabled={remove.isPending} onClick={() => deleteComparison(true)}>사진도 삭제</Button></div></div> : <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setIsPhotoPickerOpen(true)}>사진 변경</Button><Button variant="destructive" onClick={() => setIsDeleteChoiceOpen(true)}>삭제</Button></div>}</section></div> : null}</section></div>
}
