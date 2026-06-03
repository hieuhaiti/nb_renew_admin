import apiClient from './common/apiClient'
import type {
  ApiResponse,
  Spot,
  SpotListData,
  SpotListParams,
  SpotFormBody,
} from '@/types/api'
import { serviceSpotPath } from '@/constant/serviceConstant'

// ─── VR / Media local types ────────────────────────────────────────────────

export interface AFrameScene {
  id: string
  spot_id: string
  name: string
  description?: string | null
  equirectangular_image_url: string
  thumbnail_url?: string | null
  camera_position?: object | null
  camera_rotation?: object | null
  camera_fov?: number | null
  ambient_sound_url?: string | null
  ambient_sound_loop?: boolean
  ambient_sound_volume?: number
  narration_audio_url?: string | null
  auto_play_narration?: boolean
  is_main: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AFrameSceneFormBody {
  name: string
  description?: string
  equirectangular_image_url: string
  thumbnail_url?: string
  camera_position?: object
  camera_rotation?: object
  camera_fov?: number
  ambient_sound_url?: string
  ambient_sound_loop?: boolean
  ambient_sound_volume?: number
  narration_audio_url?: string
  auto_play_narration?: boolean
  is_main?: boolean
  is_active?: boolean
}

export interface AFrameHotspotPosition {
  x?: number
  y?: number
  z?: number
  pitch?: number
  yaw?: number
  distance?: number
}

export interface AFrameVector3 {
  x?: number
  y?: number
  z?: number
}

export interface AFrameHotspot {
  id: string
  scene_id: string
  name: string
  description?: string | null
  hotspot_type: string
  position?: AFrameHotspotPosition | null
  scale?: AFrameVector3 | null
  target_scene_id?: string | null
  linked_spot_id?: string | null
  target_url?: string | null
  icon_type?: string | null
  visible?: boolean
  is_active: boolean
  created_at: string
}

export interface AFrameHotspotFormBody {
  name: string
  description?: string
  hotspot_type: string
  position?: AFrameHotspotPosition
  scale?: AFrameVector3
  target_scene_id?: string
  linked_spot_id?: string
  target_url?: string
  icon_type?: string
  visible?: boolean
  is_active?: boolean
}

export interface SpotMedia {
  id: string
  spot_id: string
  media_type: string
  url: string
  thumbnail_url?: string | null
  title_vi?: string | null
  title_en?: string | null
  alt_text?: string | null
  caption?: string | null
  duration_sec?: number | null
  file_size_kb?: number | null
  resolution?: string | null
  is_primary: boolean
  sort_order: number
  language?: string | null
  created_at: string
}

export interface MediaHotspot {
  id: number
  media_id: number
  spot_id: string
  pitch: number
  yaw: number
  label_vi?: string | null
  label_en?: string | null
  linked_spot_id?: string | null
  target_url?: string | null
  icon_type?: string | null
  created_at: string
}

export interface MediaHotspotFormBody {
  pitch: number
  yaw: number
  label_vi?: string
  label_en?: string
  linked_spot_id?: string
  target_url?: string
  icon_type?: string
}

export default {
  // ─── Core CRUD ────────────────────────────────────────────────────────────

  /** GET /spots */
  getAll: (params?: SpotListParams) =>
    apiClient.get<ApiResponse<SpotListData>>(serviceSpotPath, params),

  /** GET /spots/id/:id */
  getById: (id: string, params?: { lang?: string }) =>
    apiClient.get<ApiResponse<{ spot: Spot }>>(`${serviceSpotPath}/id/${id}`, params),

  /** GET /spots/:slug */
  getBySlug: (slug: string, params?: { lang?: string }) =>
    apiClient.get<ApiResponse<{ spot: Spot }>>(`${serviceSpotPath}/${slug}`, params),

  /** POST /spots */
  create: (data: SpotFormBody) =>
    apiClient.post<ApiResponse<Spot>>(serviceSpotPath, data),

  /** PATCH /spots/:id */
  update: (id: string, data: Partial<SpotFormBody>) =>
    apiClient.patch<ApiResponse<Spot>>(`${serviceSpotPath}/${id}`, data),

  /** DELETE /spots/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceSpotPath}/${id}`),

  /** PATCH /spots/:id/featured */
  toggleFeatured: (id: string) =>
    apiClient.patch<ApiResponse<Spot>>(`${serviceSpotPath}/${id}/featured`),

  // ─── Read-only convenience ────────────────────────────────────────────────

  /** GET /spots/map */
  getMap: (params?: { page?: number; lng?: number; lat?: number; radius_km?: number; limit?: number; capacity?: boolean }) =>
    apiClient.get<ApiResponse<SpotListData>>(`${serviceSpotPath}/map`, params),

  /** GET /spots/bbox */
  // TODO: Available in Postman but not used by admin UI yet
  getByBBox: (params: { min_lng: number; min_lat: number; max_lng: number; max_lat: number }) =>
    apiClient.get<ApiResponse<SpotListData>>(`${serviceSpotPath}/bbox`, params),

  /** GET /spots/geojson */
  getGeoJSON: () => apiClient.get<ApiResponse<object>>(`${serviceSpotPath}/geojson`),

  /** GET /spots/nearby */
  getNearby: (params: { lat: number; lng: number; radius_km?: number; limit?: number }) =>
    apiClient.get<ApiResponse<SpotListData>>(`${serviceSpotPath}/nearby`, params),

  /** GET /spots/featured */
  getFeatured: (params?: { limit?: number; category_ids?: number[] }) =>
    apiClient.get<ApiResponse<SpotListData>>(`${serviceSpotPath}/featured`, params),

  /** GET /spots/:spotId/audio-guide */
  getAudioGuide: (spotId: string, params?: { lang?: string }) =>
    apiClient.get<ApiResponse<object>>(`${serviceSpotPath}/${spotId}/audio-guide`, params),

  // ─── Media ────────────────────────────────────────────────────────────────

  /** GET /spots/:spotId/media */
  getMedia: (spotId: string, params?: { media_type?: string }) =>
    apiClient.get<ApiResponse<SpotMedia[]>>(`${serviceSpotPath}/${spotId}/media`, params),

  /** POST /spots/:spotId/media — multipart/form-data (file, media_type, caption) */
  uploadMedia: (spotId: string, data: FormData) =>
    apiClient.post<ApiResponse<SpotMedia>>(`${serviceSpotPath}/${spotId}/media`, data),

  /** POST /spots/:spotId/media/batch — multipart/form-data (files) */
  uploadMediaBatch: (spotId: string, data: FormData) =>
    apiClient.post<ApiResponse<SpotMedia[]>>(`${serviceSpotPath}/${spotId}/media/batch`, data),

  /** DELETE /spots/:spotId/media/:mediaId */
  deleteMedia: (spotId: string, mediaId: string) =>
    apiClient.del<ApiResponse<{}>>(`${serviceSpotPath}/${spotId}/media/${mediaId}`),

  /** PATCH /spots/:spotId/media/:mediaId/primary */
  setPrimaryMedia: (spotId: string, mediaId: string) =>
    apiClient.patch<ApiResponse<SpotMedia>>(`${serviceSpotPath}/${spotId}/media/${mediaId}/primary`),

  /** PATCH /spots/:spotId/media/:mediaId */
  updateMedia: (spotId: string, mediaId: string, data: { alt_text?: string; caption?: string }) =>
    apiClient.patch<ApiResponse<SpotMedia>>(`${serviceSpotPath}/${spotId}/media/${mediaId}`, data),

  // ─── A-Frame VR Scenes ────────────────────────────────────────────────────

  /** GET /spots/:spotId/aframe-scenes */
  getScenes: (spotId: string, params?: { include_inactive?: boolean }) =>
    apiClient.get<ApiResponse<AFrameScene[]>>(`${serviceSpotPath}/${spotId}/aframe-scenes`, params),

  /** GET /spots/:spotId/aframe-scenes/preload */
  // TODO: Available in Postman but not used by admin UI yet
  preloadScenes: (spotId: string) =>
    apiClient.get<ApiResponse<AFrameScene[]>>(`${serviceSpotPath}/${spotId}/aframe-scenes/preload`),

  /** GET /spots/:spotId/aframe-scenes/:sceneId/preload */
  // TODO: Available in Postman but not used by admin UI yet
  preloadScene: (spotId: string, sceneId: string) =>
    apiClient.get<ApiResponse<AFrameScene>>(
      `${serviceSpotPath}/${spotId}/aframe-scenes/${sceneId}/preload`
    ),

  /** GET /spots/:spotId/aframe-scenes/:sceneId */
  getSceneById: (spotId: string, sceneId: string) =>
    apiClient.get<ApiResponse<AFrameScene>>(`${serviceSpotPath}/${spotId}/aframe-scenes/${sceneId}`),

  /** POST /spots/:spotId/aframe-scenes */
  createScene: (spotId: string, data: AFrameSceneFormBody) =>
    apiClient.post<ApiResponse<AFrameScene>>(`${serviceSpotPath}/${spotId}/aframe-scenes`, data),

  /** PATCH /spots/:spotId/aframe-scenes/:sceneId */
  updateScene: (spotId: string, sceneId: string, data: Partial<AFrameSceneFormBody>) =>
    apiClient.patch<ApiResponse<AFrameScene>>(`${serviceSpotPath}/${spotId}/aframe-scenes/${sceneId}`, data),

  /** PATCH /spots/:spotId/aframe-scenes/:sceneId/set-main */
  setMainScene: (spotId: string, sceneId: string) =>
    apiClient.patch<ApiResponse<AFrameScene>>(`${serviceSpotPath}/${spotId}/aframe-scenes/${sceneId}/set-main`),

  /** PATCH /spots/:spotId/aframe-scenes/:sceneId/activate */
  activateScene: (spotId: string, sceneId: string) =>
    apiClient.patch<ApiResponse<AFrameScene>>(`${serviceSpotPath}/${spotId}/aframe-scenes/${sceneId}/activate`),

  /** PATCH /spots/:spotId/aframe-scenes/:sceneId/deactivate */
  deactivateScene: (spotId: string, sceneId: string) =>
    apiClient.patch<ApiResponse<AFrameScene>>(`${serviceSpotPath}/${spotId}/aframe-scenes/${sceneId}/deactivate`),

  /** DELETE /spots/:spotId/aframe-scenes/:sceneId */
  deleteScene: (spotId: string, sceneId: string) =>
    apiClient.del<ApiResponse<{}>>(`${serviceSpotPath}/${spotId}/aframe-scenes/${sceneId}`),

  // ─── Scene Hotspots ───────────────────────────────────────────────────────

  /** GET /spots/:spotId/aframe-scenes/:sceneId/hotspots */
  getSceneHotspots: (spotId: string, sceneId: string, params?: { include_inactive?: boolean }) =>
    apiClient.get<ApiResponse<AFrameHotspot[]>>(
      `${serviceSpotPath}/${spotId}/aframe-scenes/${sceneId}/hotspots`, params
    ),

  /** POST /spots/:spotId/aframe-scenes/:sceneId/hotspots */
  createSceneHotspot: (spotId: string, sceneId: string, data: AFrameHotspotFormBody) =>
    apiClient.post<ApiResponse<AFrameHotspot>>(
      `${serviceSpotPath}/${spotId}/aframe-scenes/${sceneId}/hotspots`, data
    ),

  /** PATCH /spots/:spotId/aframe-scenes/:sceneId/hotspots/:hotspotId */
  updateSceneHotspot: (spotId: string, sceneId: string, hotspotId: string, data: Partial<AFrameHotspotFormBody>) =>
    apiClient.patch<ApiResponse<AFrameHotspot>>(
      `${serviceSpotPath}/${spotId}/aframe-scenes/${sceneId}/hotspots/${hotspotId}`, data
    ),

  /** PATCH /spots/:spotId/aframe-scenes/:sceneId/hotspots/:hotspotId/activate */
  activateSceneHotspot: (spotId: string, sceneId: string, hotspotId: string) =>
    apiClient.patch<ApiResponse<AFrameHotspot>>(
      `${serviceSpotPath}/${spotId}/aframe-scenes/${sceneId}/hotspots/${hotspotId}/activate`
    ),

  /** PATCH /spots/:spotId/aframe-scenes/:sceneId/hotspots/:hotspotId/deactivate */
  deactivateSceneHotspot: (spotId: string, sceneId: string, hotspotId: string) =>
    apiClient.patch<ApiResponse<AFrameHotspot>>(
      `${serviceSpotPath}/${spotId}/aframe-scenes/${sceneId}/hotspots/${hotspotId}/deactivate`
    ),

  /** DELETE /spots/:spotId/aframe-scenes/:sceneId/hotspots/:hotspotId */
  deleteSceneHotspot: (spotId: string, sceneId: string, hotspotId: string) =>
    apiClient.del<ApiResponse<{}>>(
      `${serviceSpotPath}/${spotId}/aframe-scenes/${sceneId}/hotspots/${hotspotId}`
    ),

  // ─── Media Hotspots ───────────────────────────────────────────────────────

  /** GET /spots/:spotId/media/:mediaId/hotspots */
  getMediaHotspots: (spotId: string, mediaId: number) =>
    apiClient.get<ApiResponse<MediaHotspot[]>>(
      `${serviceSpotPath}/${spotId}/media/${mediaId}/hotspots`
    ),

  /** POST /spots/:spotId/media/:mediaId/hotspots */
  createMediaHotspot: (spotId: string, mediaId: number, data: MediaHotspotFormBody) =>
    apiClient.post<ApiResponse<MediaHotspot>>(
      `${serviceSpotPath}/${spotId}/media/${mediaId}/hotspots`, data
    ),

  /** PATCH /spots/:spotId/media/:mediaId/hotspots/:hotspotId */
  updateMediaHotspot: (spotId: string, mediaId: number, hotspotId: number, data: Partial<MediaHotspotFormBody>) =>
    apiClient.patch<ApiResponse<MediaHotspot>>(
      `${serviceSpotPath}/${spotId}/media/${mediaId}/hotspots/${hotspotId}`, data
    ),

  /** DELETE /spots/:spotId/media/:mediaId/hotspots/:hotspotId */
  deleteMediaHotspot: (spotId: string, mediaId: number, hotspotId: number) =>
    apiClient.del<ApiResponse<{}>>(
      `${serviceSpotPath}/${spotId}/media/${mediaId}/hotspots/${hotspotId}`
    ),
}
