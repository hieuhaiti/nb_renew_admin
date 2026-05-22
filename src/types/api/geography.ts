export interface Province {
  code: string
  name_vi: string
  name_en?: string | null
}

export interface Ward {
  code: string
  name_vi: string
  name_en?: string | null
  province_code: string
}

export interface ProvinceListData {
  provinces: Province[]
}

export interface WardListData {
  wards: Ward[]
}

export interface GeographySearchParams {
  q: string
  province_code?: string
}
