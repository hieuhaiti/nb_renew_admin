export interface ApiResponse<T = any> {
  message: string
  status: number
  data?: T
  metadata?: T
  errors?: string[]
  options?: Record<string, any>
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type * from './authen'
export type * from './user'
export type * from './spotCategory'
export type * from './spot'
export type * from './news'
export type * from './newsComment'
export type * from './culinary'
export type * from './festival'
export type * from './ocop'
export type * from './vlog'
export type * from './citizenFeedback'
export type * from './business'
export type * from './rating'
export type * from './notification'
export type * from './mapLayer'
export type * from './mapLayerApi'
export type * from './apiKey'
export type * from './mapAdminCategory'
export type * from './auditLog'
export type * from './role'
export type * from './search'
export type * from './geography'
export type * from './capacity'
export type * from './tour'
export type * from './itinerary'
export type * from './integration'
export type * from './chatbot'
export type * from './arSession'
export type * from './gps'
export type * from './governance'
