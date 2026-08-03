export interface Photo {
  id: string
  title: string
  imageUrl: string | null
  location: string | null
  photographer: string | null
  filmMonth: string | null
  keywords: string[]
}
