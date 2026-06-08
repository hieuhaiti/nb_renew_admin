import apiClient from './common/apiClient'
import type { ApiResponse } from '@/types/api'
import { serviceStatisticsPath } from '@/constant/serviceConstant'

export interface StatisticsDataFile {
  name: string
  title: string
  format: string
  rows: number
  size_bytes: number
  last_modified: string
  generated_at: string
  download_url?: string
}

export interface StatisticsDataFilesPayload {
  total: number
  files: StatisticsDataFile[]
}

export default {
  /** GET /statistics/data-files */
  getDataFiles: () =>
    apiClient.get<ApiResponse<StatisticsDataFilesPayload>>(`${serviceStatisticsPath}/data-files`),

  /** GET /statistics/data-files/download/:filename */
  downloadFile: (filename: string) =>
    apiClient.get<ApiResponse<object>>(`${serviceStatisticsPath}/data-files/download/${filename}`),
}
