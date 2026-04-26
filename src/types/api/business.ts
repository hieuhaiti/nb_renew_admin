export type BusinessStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export interface Business {
  id: string
  business_name: string
  business_type: string
  business_code: string | null
  tax_id: string | null
  license_number: string | null
  description_vi: string | null
  description_en: string | null
  logo_url: string | null
  phone: string | null
  email: string | null
  website: string | null
  address_vi: string | null
  province_code: string | null
  latitude: number | null
  longitude: number | null
  status: BusinessStatus
  rejection_note: string | null
  owner_id: string | null
  created_at: string
  updated_at: string
  owner?: { id: string; full_name: string; email: string }
}

export interface BusinessListData {
  businesses: Business[]
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
  description_vi?: string
  description_en?: string
  logo_url?: string
  phone?: string
  email?: string
  website?: string
  address_vi?: string
  province_code?: string
  lng?: number
  lat?: number
}
