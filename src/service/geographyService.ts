import apiClient from './common/apiClient'
import type {
  ApiResponse,
  Province,
  ProvinceListData,
  Ward,
  WardListData,
  GeographySearchParams,
} from '@/types/api'
import { serviceGeographyPath } from '@/constant/serviceConstant'

export default {
  /** GET /geography/provinces */
  getProvinces: () =>
    apiClient.get<ApiResponse<ProvinceListData>>(`${serviceGeographyPath}/provinces`),

  /** GET /geography/provinces/search?q= */
  searchProvinces: (params: Pick<GeographySearchParams, 'q'>) =>
    apiClient.get<ApiResponse<ProvinceListData>>(`${serviceGeographyPath}/provinces/search`, params),

  /** GET /geography/provinces/:code */
  getProvinceByCode: (code: string) =>
    apiClient.get<ApiResponse<Province>>(`${serviceGeographyPath}/provinces/${code}`),

  /** GET /geography/provinces/:code/wards */
  getWardsByProvince: (code: string) =>
    apiClient.get<ApiResponse<WardListData>>(`${serviceGeographyPath}/provinces/${code}/wards`),

  /** GET /geography/wards */
  getWards: () =>
    apiClient.get<ApiResponse<WardListData>>(`${serviceGeographyPath}/wards`),

  /** GET /geography/wards/search?q=&province_code= */
  searchWards: (params: GeographySearchParams) =>
    apiClient.get<ApiResponse<WardListData>>(`${serviceGeographyPath}/wards/search`, params),

  /** GET /geography/wards/:code */
  getWardByCode: (code: string) =>
    apiClient.get<ApiResponse<Ward>>(`${serviceGeographyPath}/wards/${code}`),
}
