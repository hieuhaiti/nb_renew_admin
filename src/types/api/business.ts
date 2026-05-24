export type BusinessStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export interface Business {
  id: string
  business_name: string
  business_type: string
  business_code: string | null
  tax_id: string | null
  license_number: string | null
  description: string | null
  logo_url: string | null
  phone: string | null
  email: string | null
  website: string | null
  address_vi: string | null
  province_code: string | null
  ward_code: string | null
  geom: { type: string; coordinates: [number, number] } | null
  status: BusinessStatus
  rejection_note: string | null
  owner_id: string | null
  owner_name: string | null
  owner_email: string | null
  approved_at: string | null
  approved_by_name: string | null
  rating_avg: string | null
  rating_count: number
  created_at: string
  updated_at: string
}

export interface BusinessListData {
  items: Business[]
  pagination: import('./index').Pagination
}

export interface BusinessListParams {
  page?: number
  limit?: number
  search?: string
  status?: BusinessStatus
  business_type?: string
  province_code?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface BusinessApprovalBody {
  status: 'approved' | 'rejected' | 'pending' | 'suspended'
  rejection_note?: string
}

export interface BusinessFormBody {
  business_name: string
  business_type: string
  business_code?: string
  tax_id?: string
  license_number?: string
  description?: string
  logo_url?: string
  phone?: string
  email?: string
  website?: string
  address_vi?: string
  province_code?: string
  lng?: number
  lat?: number
}
