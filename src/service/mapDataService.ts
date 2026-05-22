import { serviceMapDataPath } from '@/constant/serviceConstant'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

/**
 * Map data endpoints use x-api-key header authentication, not Bearer token.
 * They are separate from the main apiClient which uses Bearer tokens.
 */
async function fetchWithApiKey<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'x-api-key': apiKey },
  })
  if (!res.ok) throw new Error(`Map data request failed: ${res.status}`)
  return res.json() as Promise<T>
}

// TODO: Admin UI for map data (external API key access) not yet implemented — service available per Postman

export default {
  /** GET /map-data/apis — requires x-api-key */
  getApis: (apiKey: string) =>
    fetchWithApiKey(`${serviceMapDataPath}/apis`, apiKey),

  /** GET /map-data/layers — requires x-api-key */
  getLayers: (apiKey: string) =>
    fetchWithApiKey(`${serviceMapDataPath}/layers`, apiKey),

  /** GET /map-data/apis/:apiId/data — requires x-api-key */
  getApiData: (apiId: string, apiKey: string) =>
    fetchWithApiKey(`${serviceMapDataPath}/apis/${apiId}/data`, apiKey),
}
