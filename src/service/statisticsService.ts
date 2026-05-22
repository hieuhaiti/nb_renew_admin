import apiClient from './common/apiClient'
import type { ApiResponse } from '@/types/api'
import { serviceStatisticsPath } from '@/constant/serviceConstant'

export interface StatisticsDataFile {
  filename: string
  size_bytes: number
  created_at: string
  download_url?: string
}

// TODO: Admin UI for statistics data files not yet implemented — service available per Postman

export default {
  /** GET /statistics/data-files */
  getDataFiles: () =>
    apiClient.get<ApiResponse<StatisticsDataFile[]>>(`${serviceStatisticsPath}/data-files`),

  /** GET /statistics/data-files/download/:filename */
  downloadFile: (filename: string) =>
    apiClient.get<ApiResponse<object>>(`${serviceStatisticsPath}/data-files/download/${filename}`),
}
