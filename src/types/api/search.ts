export type SearchType = 'spots' | 'news' | 'businesses' | 'vlogs' | 'culinary' | 'festivals' | 'ocop'

export interface SearchResult {
  type: SearchType
  items: any[]
  total: number
}
