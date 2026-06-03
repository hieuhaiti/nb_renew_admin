import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchSelect } from '@/components/common/SearchSelect'
import AframeScenePreview from '@/components/aframe/AframeScenePreview'
import type { PreviewHotspot } from '@/components/aframe/AframeScenePreview'
import { spotService, useApiMutation, useApiQuery } from '@/service'
import type {
  AFrameHotspot,
  AFrameHotspotFormBody,
  AFrameScene,
  AFrameSceneFormBody,
} from '@/service/spotService'
import type { ApiResponse, Spot, SpotListData } from '@/types/api'
import { formatDateTime } from '@/lib/date'
import { Crown, Eye, EyeOff, Pen, Plus, Trash2 } from 'lucide-react'
import { STALE_REF } from '@/constant/queryConstant'
import { parseLink } from '@/lib/utils'

interface NestedScene {
  camera?: { position?: object | null; rotation?: object | null; fov?: number | null } | null
  audio?: {
    ambient?: { url?: string | null; loop?: boolean; volume?: number } | null
    narration?: { url?: string | null; auto_play?: boolean } | null
  } | null
  hotspots?: AFrameHotspot[]
}
type Scene = AFrameScene & NestedScene

const normPos = (s: Scene) => s.camera_position ?? s.camera?.position ?? null
const normRot = (s: Scene) => s.camera_rotation ?? s.camera?.rotation ?? null
const normFov = (s: Scene) => s.camera_fov ?? s.camera?.fov ?? null
const normAUrl = (s: Scene) => s.ambient_sound_url ?? s.audio?.ambient?.url ?? null
const normVol = (s: Scene) => s.ambient_sound_volume ?? s.audio?.ambient?.volume ?? null
const normLoop = (s: Scene) => s.ambient_sound_loop ?? s.audio?.ambient?.loop ?? false
const normNUrl = (s: Scene) => s.narration_audio_url ?? s.audio?.narration?.url ?? null
const normAuto = (s: Scene) => s.auto_play_narration ?? s.audio?.narration?.auto_play ?? false

const num = (v: unknown, def = 0) => {
  const x = Number(v)
  return Number.isNaN(x) ? def : x
}

interface Vec3Like {
  x?: number | null
  y?: number | null
  z?: number | null
}

interface HotspotPositionLike extends Vec3Like {
  pitch?: number | null
  yaw?: number | null
  distance?: number | null
}

const HOTSPOT_EYE_LEVEL = 1.6
const HOTSPOT_DEFAULT_DISTANCE = 3

function toWorldHotspotPosition(position?: object | null): { x: number; y: number; z: number } {
  const p = (position ?? {}) as HotspotPositionLike
  const hasXyz = p.x != null || p.y != null || p.z != null
  if (hasXyz) {
    return {
      x: num(p.x),
      y: num(p.y, HOTSPOT_EYE_LEVEL),
      z: num(p.z, -HOTSPOT_DEFAULT_DISTANCE),
    }
  }

  const pitch = num(p.pitch)
  const yaw = num(p.yaw)
  const radius = num(p.distance, HOTSPOT_DEFAULT_DISTANCE)
  const pitchRad = (pitch * Math.PI) / 180
  const yawRad = (yaw * Math.PI) / 180
  const horizontal = radius * Math.cos(pitchRad)

  return {
    x: Number((horizontal * Math.sin(yawRad)).toFixed(6)),
    y: Number((HOTSPOT_EYE_LEVEL + radius * Math.sin(pitchRad)).toFixed(6)),
    z: Number((-horizontal * Math.cos(yawRad)).toFixed(6)),
  }
}

const normalizeAngle = (value: number) => {
  const wrapped = ((value + 180) % 360 + 360) % 360 - 180
  return Number(wrapped.toFixed(6))
}

function toPositionWithAngles(position: Vec3Like): {
  x: number
  y: number
  z: number
  pitch: number
  yaw: number
} {
  const x = num(position.x)
  const y = num(position.y, HOTSPOT_EYE_LEVEL)
  const z = num(position.z, -HOTSPOT_DEFAULT_DISTANCE)
  const relY = y - HOTSPOT_EYE_LEVEL
  const horizontal = Math.sqrt(x * x + z * z)
  const pitch = Number(((Math.atan2(relY, horizontal) * 180) / Math.PI).toFixed(6))
  const yaw = normalizeAngle((Math.atan2(x, -z) * 180) / Math.PI)
  return { x, y, z, pitch, yaw }
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] items-start gap-2 py-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-xs break-all">
        {children ?? <span className="text-muted-foreground">—</span>}
      </span>
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground mt-3 mb-1 text-xs font-semibold tracking-wider uppercase">
      {children}
    </p>
  )
}

const HOTSPOT_TYPES = [
  { value: 'navigate', label: 'Điều hướng' },
  { value: 'info', label: 'Thông tin' },
  { value: 'url', label: 'Liên kết URL' },
  { value: 'media', label: 'Media' },
]

const ICON_TYPES = [
  { value: 'arrow', label: 'Mũi tên' },
  { value: 'info', label: 'Thông tin' },
  { value: 'link', label: 'Liên kết' },
  { value: 'media', label: 'Media' },
  { value: 'plus', label: 'Thêm' },
]

const HOTSPOT_TYPE_VALUES = new Set(HOTSPOT_TYPES.map((item) => item.value))
const ICON_TYPE_VALUES = new Set(ICON_TYPES.map((item) => item.value))

function sanitizeOptionValue(value?: string | null): string {
  return (value ?? '').trim().toLowerCase()
}

function normalizeHotspotType(value?: string | null): string {
  const normalized = sanitizeOptionValue(value)
  return HOTSPOT_TYPE_VALUES.has(normalized) ? normalized : 'navigate'
}

function normalizeIconType(value?: string | null): string {
  const normalized = sanitizeOptionValue(value)
  return ICON_TYPE_VALUES.has(normalized) ? normalized : 'arrow'
}

interface SceneFormState {
  name: string
  description: string
  equirectangular_image_url: string
  thumbnail_url: string
  camera_fov: string
  cam_pos_x: string
  cam_pos_y: string
  cam_pos_z: string
  cam_rot_x: string
  cam_rot_y: string
  cam_rot_z: string
  ambient_sound_url: string
  ambient_sound_loop: boolean
  ambient_sound_volume: string
  narration_audio_url: string
  auto_play_narration: boolean
  is_main: boolean
  is_active: boolean
}

const DEFAULT_SCENE_FORM: SceneFormState = {
  name: '',
  description: '',
  equirectangular_image_url: '',
  thumbnail_url: '',
  camera_fov: '80',
  cam_pos_x: '0',
  cam_pos_y: '1.6',
  cam_pos_z: '0',
  cam_rot_x: '0',
  cam_rot_y: '0',
  cam_rot_z: '0',
  ambient_sound_url: '',
  ambient_sound_loop: false,
  ambient_sound_volume: '',
  narration_audio_url: '',
  auto_play_narration: false,
  is_main: false,
  is_active: true,
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  spotId: string
  sceneId: string | null
  onSceneSaved?: (sceneId: string) => void
}

function parseOptionalNumber(value: string): number | null {
  const raw = value.trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isNaN(n) ? null : n
}

function toVec3(x: string, y: string, z: string): { x: number; y: number; z: number } | null {
  const px = parseOptionalNumber(x)
  const py = parseOptionalNumber(y)
  const pz = parseOptionalNumber(z)
  if (px == null && py == null && pz == null) return null
  return { x: px ?? 0, y: py ?? 0, z: pz ?? 0 }
}

function normalizeLabel(v?: string | null) {
  return (v ?? '').trim() || 'Hotspot'
}

export default function AframeSceneDetailDialog({
  open,
  onOpenChange,
  spotId,
  sceneId,
  onSceneSaved,
}: Props) {
  const debug = import.meta.env.DEV
  const [createdSceneId, setCreatedSceneId] = useState<string | null>(null)
  const effectiveSceneId = sceneId ?? createdSceneId
  const isCreateMode = !effectiveSceneId
  const [isEditingScene, setIsEditingScene] = useState(false)

  const [sceneForm, setSceneForm] = useState<SceneFormState>(DEFAULT_SCENE_FORM)
  const [sceneFormError, setSceneFormError] = useState<string | null>(null)
  const hydratedRef = useRef<string | null>(null)

  const dbQuery = useApiQuery(
    ['aframe-scene', spotId, effectiveSceneId],
    () => spotService.getSceneById(spotId, effectiveSceneId!),
    { enabled: !!spotId && !!effectiveSceneId && open, staleTime: 0 },
    false,
    false
  )
  const raw = (dbQuery.data as any)?.data
  const scene: Scene | null = raw
    ? 'id' in raw
      ? (raw as Scene)
      : ((raw?.scene ?? raw?.aframe_scene ?? null) as Scene | null)
    : null

  const hotspotQuery = useApiQuery(
    ['aframe-hotspots', spotId, effectiveSceneId],
    () => spotService.getSceneHotspots(spotId, effectiveSceneId!, { include_inactive: true }),
    { enabled: !!spotId && !!effectiveSceneId && open, staleTime: 0 },
    false,
    false
  )
  const hotspotRaw = (hotspotQuery.data as any)?.data
  const hotspots: AFrameHotspot[] =
    hotspotRaw?.hotspots ?? (Array.isArray(hotspotRaw) ? hotspotRaw : (scene?.hotspots ?? []))
  const normalizedHotspots = useMemo<AFrameHotspot[]>(
    () =>
      hotspots.map((hotspot) => ({
        ...hotspot,
        position: toWorldHotspotPosition(hotspot.position),
      })),
    [hotspots]
  )

  const scenesQuery = useApiQuery(
    ['aframe-scenes', spotId, 'all'],
    () => spotService.getScenes(spotId, { include_inactive: true }),
    { enabled: !!spotId && open, staleTime: STALE_REF },
    false,
    false
  )
  const scenesRaw = (scenesQuery.data as any)?.data
  const allScenes: AFrameScene[] = scenesRaw?.scenes ?? (Array.isArray(scenesRaw) ? scenesRaw : [])
  const otherScenes = allScenes.filter((s) => s.id !== effectiveSceneId)

  const spotsQuery = useApiQuery(
    ['spots-ref'],
    () => spotService.getAll({ limit: 100, sortBy: 'name', sortOrder: 'ASC' }),
    { staleTime: STALE_REF },
    false,
    false
  )
  const allSpots: Spot[] = (spotsQuery.data as ApiResponse<SpotListData>)?.data?.spots ?? []
  const spotSelectOptions = allSpots.map((s) => ({ value: s.id, label: s.name || s.id }))

  function hydrateFormFromScene(s: Scene) {
    const pos = normPos(s) as Vec3Like | null
    const rot = normRot(s) as Vec3Like | null
    setSceneForm({
      name: s.name ?? '',
      description: s.description ?? '',
      equirectangular_image_url: s.equirectangular_image_url ?? '',
      thumbnail_url: s.thumbnail_url ?? '',
      camera_fov: String(normFov(s) ?? 80),
      cam_pos_x: String(pos?.x ?? 0),
      cam_pos_y: String(pos?.y ?? 1.6),
      cam_pos_z: String(pos?.z ?? 0),
      cam_rot_x: String(rot?.x ?? 0),
      cam_rot_y: String(rot?.y ?? 0),
      cam_rot_z: String(rot?.z ?? 0),
      ambient_sound_url: normAUrl(s) ?? '',
      ambient_sound_loop: !!normLoop(s),
      ambient_sound_volume: normVol(s) != null ? String(normVol(s)) : '',
      narration_audio_url: normNUrl(s) ?? '',
      auto_play_narration: !!normAuto(s),
      is_main: !!s.is_main,
      is_active: !!s.is_active,
    })
  }

  const createSceneMutation = useApiMutation(
    (data: AFrameSceneFormBody) => spotService.createScene(spotId, data),
    {
      onSuccess: (res) => {
        const created = (res as any)?.data
        const nextSceneId = created?.id ?? created?.scene?.id ?? created?.aframe_scene?.id
        if (nextSceneId) {
          setCreatedSceneId(nextSceneId)
          onSceneSaved?.(nextSceneId)
        }
      },
    },
    false
  )
  const updateSceneMutation = useApiMutation(
    (data: Partial<AFrameSceneFormBody>) =>
      spotService.updateScene(spotId, effectiveSceneId!, data),
    {
      onSuccess: () => {
        hydratedRef.current = null
        dbQuery.refetch()
        if (effectiveSceneId) onSceneSaved?.(effectiveSceneId)
        setIsEditingScene(false)
      },
    },
    false
  )

  const setMainMutation = useApiMutation(
    (id: string) => spotService.setMainScene(spotId, id),
    {
      onSuccess: () => {
        hydratedRef.current = null
        dbQuery.refetch()
      },
    },
    false
  )
  const toggleActiveMutation = useApiMutation(
    ({ id, active }: { id: string; active: boolean }) =>
      active ? spotService.activateScene(spotId, id) : spotService.deactivateScene(spotId, id),
    {
      onSuccess: () => {
        hydratedRef.current = null
        dbQuery.refetch()
      },
    },
    false
  )

  const [selectedHsId, setSelectedHsId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editType, setEditType] = useState('navigate')
  const [editPos, setEditPos] = useState({ x: '', y: '', z: '' })
  const [editScale, setEditScale] = useState({ x: '1', y: '1', z: '1' })
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [editLinkedSpotId, setEditLinkedSpotId] = useState<string | null>(null)
  const [editTargetUrl, setEditTargetUrl] = useState('')
  const [editIconType, setEditIconType] = useState('arrow')
  const [editVisible, setEditVisible] = useState(true)
  const [editActive, setEditActive] = useState(true)
  const [deleteHsOpen, setDeleteHsOpen] = useState(false)
  const [hsToDelete, setHsToDelete] = useState<AFrameHotspot | null>(null)
  const pendingSelectRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open) {
      setCreatedSceneId(null)
      setSceneForm(DEFAULT_SCENE_FORM)
      setSceneFormError(null)
      hydratedRef.current = null
      setIsEditingScene(false)
      setSelectedHsId(null)
      setEditingId(null)
      setDeleteHsOpen(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (!effectiveSceneId) {
      hydratedRef.current = 'create'
      setSceneForm(DEFAULT_SCENE_FORM)
      return
    }
    if (!scene) return
    if (hydratedRef.current === effectiveSceneId) return
    hydrateFormFromScene(scene)
    hydratedRef.current = effectiveSceneId
  }, [open, scene, effectiveSceneId])

  useEffect(() => {
    if (debug) {
      console.debug('[AframeSceneDetailDialog] hotspots loaded', {
        sceneId: effectiveSceneId,
        count: hotspots.length,
        hotspots: hotspots.map((hotspot) => ({
          id: hotspot.id,
          hotspot_type: hotspot.hotspot_type,
          icon_type: hotspot.icon_type,
          position: hotspot.position,
        })),
      })
    }
  }, [hotspots, effectiveSceneId, debug])

  useEffect(() => {
    const id = pendingSelectRef.current
    if (!id) return
    const hs = hotspots.find((h) => h.id === id)
    if (hs) {
      pendingSelectRef.current = null
      startEditing(hs)
    }
  }, [hotspots])

  const displayedHotspots = useMemo<PreviewHotspot[]>(() => {
    if (!normalizedHotspots.length) return []
    if (editingId && selectedHsId === editingId) {
      return normalizedHotspots.map((h) => {
        if (h.id !== editingId) return h
        const basePos = toWorldHotspotPosition(h.position)
        return {
          ...h,
          name: editName || h.name,
          visible: editVisible,
          position: {
            x: editPos.x !== '' ? num(editPos.x) : basePos.x,
            y: editPos.y !== '' ? num(editPos.y) : basePos.y,
            z: editPos.z !== '' ? num(editPos.z) : basePos.z,
          },
          scale: {
            x: num(editScale.x, 1),
            y: num(editScale.y, 1),
            z: num(editScale.z, 1),
          },
        }
      })
    }
    return normalizedHotspots
  }, [normalizedHotspots, selectedHsId, editingId, editName, editVisible, editPos, editScale])

  const createHsMutation = useApiMutation(
    (data: AFrameHotspotFormBody) =>
      spotService.createSceneHotspot(spotId, effectiveSceneId!, data),
    {
      onSuccess: (res) => {
        const d = (res as any)?.data
        const hs = d?.hotspot ?? (d && 'id' in d ? d : null)
        if (hs?.id) pendingSelectRef.current = hs.id
        hotspotQuery.refetch()
      },
    },
    true
  )
  const updateHsMutation = useApiMutation(
    ({ id, data }: { id: string; data: Partial<AFrameHotspotFormBody> }) =>
      spotService.updateSceneHotspot(spotId, effectiveSceneId!, id, data),
    {
      onSuccess: () => {
        hotspotQuery.refetch()
        cancelEditing()
      },
    },
    true
  )
  const deleteHsMutation = useApiMutation(
    (id: string) => spotService.deleteSceneHotspot(spotId, effectiveSceneId!, id),
    {
      onSuccess: () => {
        hotspotQuery.refetch()
        setSelectedHsId(null)
        cancelEditing()
        setDeleteHsOpen(false)
        setHsToDelete(null)
      },
    },
    true
  )

  function startEditing(hs: AFrameHotspot) {
    const nextType = normalizeHotspotType(hs.hotspot_type)
    const nextIcon = normalizeIconType(hs.icon_type)
    if (debug) {
      console.debug('[AframeSceneDetailDialog] startEditing', {
        hotspotId: hs.id,
        rawHotspotType: hs.hotspot_type,
        rawIconType: hs.icon_type,
        boundHotspotType: nextType,
        boundIconType: nextIcon,
      })
    }
    setSelectedHsId(hs.id)
    setEditingId(hs.id)
    setEditName(hs.name || '')
    setEditDesc(hs.description || '')
    setEditType(nextType)
    setEditTarget(hs.target_scene_id ?? null)
    setEditLinkedSpotId(hs.linked_spot_id ?? null)
    setEditTargetUrl(hs.target_url ?? '')
    setEditIconType(nextIcon)
    setEditVisible(hs.visible !== false)
    setEditActive(hs.is_active)

    const pos = toWorldHotspotPosition(hs.position)
    const scl = hs.scale as Vec3Like | null
    setEditPos({ x: String(pos.x), y: String(pos.y), z: String(pos.z) })
    setEditScale({ x: String(scl?.x ?? 1), y: String(scl?.y ?? 1), z: String(scl?.z ?? 1) })
  }

  function cancelEditing() {
    setEditingId(null)
    setEditName('')
    setEditDesc('')
    setEditType('navigate')
    setEditPos({ x: '', y: '', z: '' })
    setEditScale({ x: '1', y: '1', z: '1' })
    setEditTarget(null)
    setEditLinkedSpotId(null)
    setEditTargetUrl('')
    setEditIconType('arrow')
    setEditVisible(true)
    setEditActive(true)
  }

  function handleCreateHotspot() {
    if (!effectiveSceneId) return
    createHsMutation.mutate({
      name: 'Hotspot mới',
      hotspot_type: 'navigate',
      position: toPositionWithAngles({
        x: 0,
        y: HOTSPOT_EYE_LEVEL,
        z: -HOTSPOT_DEFAULT_DISTANCE,
      }),
      scale: { x: 1, y: 1, z: 1 },
      icon_type: 'arrow',
      visible: true,
      is_active: true,
    })
  }

  function handleSaveHotspot() {
    if (!editingId) return
    const orig = hotspots.find((h) => h.id === editingId)
    if (!orig) return

    const payload: Partial<AFrameHotspotFormBody> = {}
    const origType = normalizeHotspotType(orig.hotspot_type)
    const origIcon = normalizeIconType(orig.icon_type)
    if (editName !== (orig.name || '')) payload.name = editName
    if (editDesc !== (orig.description || '')) payload.description = editDesc
    if (editType !== origType) payload.hotspot_type = editType
    if (editVisible !== (orig.visible !== false)) payload.visible = editVisible
    if (editActive !== orig.is_active) payload.is_active = editActive
    if (editTarget !== (orig.target_scene_id ?? null))
      payload.target_scene_id = editTarget ?? undefined
    if (editLinkedSpotId !== (orig.linked_spot_id ?? null))
      payload.linked_spot_id = editLinkedSpotId ?? undefined
    if (editTargetUrl !== (orig.target_url ?? '')) payload.target_url = editTargetUrl || undefined
    if (editIconType !== origIcon) payload.icon_type = editIconType

    const origPos = toWorldHotspotPosition(orig.position)
    const px = editPos.x !== '' ? num(editPos.x) : origPos.x
    const py = editPos.y !== '' ? num(editPos.y) : origPos.y
    const pz = editPos.z !== '' ? num(editPos.z) : origPos.z
    if (px !== origPos.x || py !== origPos.y || pz !== origPos.z) {
      payload.position = toPositionWithAngles({ x: px, y: py, z: pz })
    }

    const origScl = orig.scale as Vec3Like | null
    const sx = num(editScale.x, 1)
    const sy = num(editScale.y, 1)
    const sz = num(editScale.z, 1)
    if (sx !== num(origScl?.x, 1) || sy !== num(origScl?.y, 1) || sz !== num(origScl?.z, 1)) {
      payload.scale = { x: sx, y: sy, z: sz }
    }

    if (Object.keys(payload).length === 0) {
      cancelEditing()
      return
    }

    updateHsMutation.mutate({ id: editingId, data: payload })
  }

  function setSceneField<K extends keyof SceneFormState>(key: K, value: SceneFormState[K]) {
    setSceneForm((prev) => ({ ...prev, [key]: value }))
  }

  function buildScenePayload(values: SceneFormState): AFrameSceneFormBody {
    const fov = parseOptionalNumber(values.camera_fov)
    const ambientVolume = parseOptionalNumber(values.ambient_sound_volume)
    const cameraPosition = toVec3(values.cam_pos_x, values.cam_pos_y, values.cam_pos_z)
    const cameraRotation = toVec3(values.cam_rot_x, values.cam_rot_y, values.cam_rot_z)

    return {
      name: values.name.trim(),
      equirectangular_image_url: values.equirectangular_image_url.trim(),
      ...(values.description.trim() && { description: values.description.trim() }),
      ...(values.thumbnail_url.trim() && { thumbnail_url: values.thumbnail_url.trim() }),
      ...(fov != null && { camera_fov: fov }),
      ...(cameraPosition && { camera_position: cameraPosition }),
      ...(cameraRotation && { camera_rotation: cameraRotation }),
      ...(values.ambient_sound_url.trim() && {
        ambient_sound_url: values.ambient_sound_url.trim(),
      }),
      ambient_sound_loop: values.ambient_sound_loop,
      ...(ambientVolume != null && { ambient_sound_volume: ambientVolume }),
      ...(values.narration_audio_url.trim() && {
        narration_audio_url: values.narration_audio_url.trim(),
      }),
      auto_play_narration: values.auto_play_narration,
      is_main: values.is_main,
      is_active: values.is_active,
    }
  }

  function validateSceneForm(values: SceneFormState): string | null {
    if (!values.name.trim()) return 'Tên cảnh không được để trống'
    if (!values.equirectangular_image_url.trim()) return 'URL ảnh 360° không được để trống'
    const fov = parseOptionalNumber(values.camera_fov)
    if (fov != null && (fov < 10 || fov > 180)) return 'FOV phải nằm trong khoảng 10–180'
    const ambientVolume = parseOptionalNumber(values.ambient_sound_volume)
    if (ambientVolume != null && (ambientVolume < 0 || ambientVolume > 1))
      return 'Âm lượng phải nằm trong khoảng 0–1'
    return null
  }

  function handleSaveScene() {
    const error = validateSceneForm(sceneForm)
    setSceneFormError(error)
    if (debug) {
      console.debug('[AframeSceneDetailDialog] save scene form', {
        sceneId: effectiveSceneId,
        error,
        sceneForm,
        payload: error ? null : buildScenePayload(sceneForm),
      })
    }
    if (error) return
    const payload = buildScenePayload(sceneForm)
    if (effectiveSceneId) {
      updateSceneMutation.mutate(payload)
      return
    }
    createSceneMutation.mutate(payload)
  }

  useEffect(() => {
    if (!debug || !editingId) return
    console.debug('[AframeSceneDetailDialog] edit select current values', {
      editingId,
      editType,
      editIconType,
      hasHotspotTypeOption: HOTSPOT_TYPE_VALUES.has(editType),
      hasIconTypeOption: ICON_TYPE_VALUES.has(editIconType),
    })
  }, [debug, editingId, editType, editIconType])

  const previewPosition = {
    x: parseOptionalNumber(sceneForm.cam_pos_x) ?? 0,
    y: parseOptionalNumber(sceneForm.cam_pos_y) ?? 1.6,
    z: parseOptionalNumber(sceneForm.cam_pos_z) ?? 0,
  }
  const previewRotation = {
    x: parseOptionalNumber(sceneForm.cam_rot_x) ?? 0,
    y: parseOptionalNumber(sceneForm.cam_rot_y) ?? 0,
    z: parseOptionalNumber(sceneForm.cam_rot_z) ?? 0,
  }
  const previewFov = parseOptionalNumber(sceneForm.camera_fov) ?? 80
  const isSavingScene = createSceneMutation.isPending || updateSceneMutation.isPending
  const showSceneForm = isCreateMode || isEditingScene

  useEffect(() => {
    if (!debug || !open) return
    console.debug('[AframeSceneDetailDialog] scene form -> preview', {
      sceneId: effectiveSceneId,
      isCreateMode,
      isEditingScene,
      rawCameraForm: {
        position: {
          x: sceneForm.cam_pos_x,
          y: sceneForm.cam_pos_y,
          z: sceneForm.cam_pos_z,
        },
        rotation: {
          x: sceneForm.cam_rot_x,
          y: sceneForm.cam_rot_y,
          z: sceneForm.cam_rot_z,
        },
        fov: sceneForm.camera_fov,
      },
      parsedPreview: {
        position: previewPosition,
        rotation: previewRotation,
        fov: previewFov,
      },
      persistedSceneCamera: scene
        ? {
            position: normPos(scene),
            rotation: normRot(scene),
            fov: normFov(scene),
          }
        : null,
      imageUrl: sceneForm.equirectangular_image_url,
      hotspotCount: displayedHotspots.length,
    })
  }, [
    debug,
    open,
    effectiveSceneId,
    isCreateMode,
    isEditingScene,
    sceneForm,
    previewPosition,
    previewRotation,
    previewFov,
    scene,
    displayedHotspots.length,
  ])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
          <DialogTitle>{isCreateMode ? 'Tạo cảnh VR mới' : 'Chi tiết cảnh VR'}</DialogTitle>
          <DialogDescription>
            Quản lý cảnh, camera, âm thanh và hotspot trong một màn hình duy nhất
          </DialogDescription>

          {!isCreateMode && dbQuery.isLoading ? (
            <div className="text-muted-foreground py-12 text-center">Đang tải...</div>
          ) : !isCreateMode && !scene ? (
            <div className="text-muted-foreground py-12 text-center">Không có dữ liệu</div>
          ) : (
            <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-stretch">
              {/* Left 2/3: preview + scene card */}
              <div className="space-y-3 lg:col-span-2">
                <AframeScenePreview
                  imageUrl={sceneForm.equirectangular_image_url}
                  cameraPosition={previewPosition}
                  cameraRotation={previewRotation}
                  cameraFov={previewFov}
                  hotspots={displayedHotspots}
                  selectedHotspotId={selectedHsId}
                  height="420px"
                />

                {/* Edit / create form */}
                {showSceneForm && (
                  <div className="rounded border p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {isCreateMode ? 'Thông tin cảnh mới' : 'Chỉnh sửa cảnh'}
                      </p>
                      <div className="flex items-center gap-2">
                        {!!effectiveSceneId && scene?.is_main && (
                          <Badge className="border-warning/20 bg-warning/10 text-warning">
                            <Crown className="mr-1 size-3" /> Cảnh chính
                          </Badge>
                        )}
                        {!!effectiveSceneId && !scene?.is_main && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={setMainMutation.isPending}
                            onClick={() => setMainMutation.mutate(effectiveSceneId)}
                          >
                            <Crown className="mr-1 size-4" /> Đặt làm cảnh chính
                          </Button>
                        )}
                        {!!effectiveSceneId && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={toggleActiveMutation.isPending}
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: effectiveSceneId,
                                active: !(scene?.is_active ?? sceneForm.is_active),
                              })
                            }
                          >
                            {(scene?.is_active ?? sceneForm.is_active) ? (
                              <>
                                <EyeOff className="mr-1 size-4" /> Vô hiệu hóa
                              </>
                            ) : (
                              <>
                                <Eye className="mr-1 size-4" /> Kích hoạt
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-1 md:col-span-2">
                        <Label>Tên cảnh *</Label>
                        <Input
                          value={sceneForm.name}
                          onChange={(e) => setSceneField('name', e.target.value)}
                          placeholder="Ví dụ: Cảnh chính Tràng An"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <Label>Mô tả</Label>
                        <Textarea
                          rows={2}
                          value={sceneForm.description}
                          onChange={(e) => setSceneField('description', e.target.value)}
                          placeholder="Mô tả ngắn về cảnh VR"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <Label>URL ảnh 360° *</Label>
                        <Input
                          value={sceneForm.equirectangular_image_url}
                          onChange={(e) =>
                            setSceneField('equirectangular_image_url', e.target.value)
                          }
                          placeholder="https://example.com/panorama.jpg"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>URL thumbnail</Label>
                        <Input
                          value={sceneForm.thumbnail_url}
                          onChange={(e) => setSceneField('thumbnail_url', e.target.value)}
                          placeholder="https://example.com/thumb.jpg"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>FOV (10–180)</Label>
                        <Input
                          type="number"
                          min={10}
                          max={180}
                          step={1}
                          value={sceneForm.camera_fov}
                          onChange={(e) => setSceneField('camera_fov', e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Vị trí camera (X Y Z)</Label>
                        <div className="grid grid-cols-3 gap-1">
                          {(['cam_pos_x', 'cam_pos_y', 'cam_pos_z'] as const).map((k) => (
                            <Input
                              key={k}
                              type="number"
                              step={1}
                              value={sceneForm[k]}
                              onChange={(e) => setSceneField(k, e.target.value)}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label>Hướng nhìn camera (X Y Z)</Label>
                        <div className="grid grid-cols-3 gap-1">
                          {(['cam_rot_x', 'cam_rot_y', 'cam_rot_z'] as const).map((k) => (
                            <Input
                              key={k}
                              type="number"
                              step={1}
                              value={sceneForm[k]}
                              onChange={(e) => setSceneField(k, e.target.value)}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <Label>URL âm thanh nền</Label>
                        <Input
                          value={sceneForm.ambient_sound_url}
                          onChange={(e) => setSceneField('ambient_sound_url', e.target.value)}
                          placeholder="https://example.com/ambient.mp3"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Âm lượng nền (0–1)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={1}
                          value={sceneForm.ambient_sound_volume}
                          onChange={(e) => setSceneField('ambient_sound_volume', e.target.value)}
                          placeholder="0.5"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>URL thuyết minh</Label>
                        <Input
                          value={sceneForm.narration_audio_url}
                          onChange={(e) => setSceneField('narration_audio_url', e.target.value)}
                          placeholder="https://example.com/narration.mp3"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={sceneForm.ambient_sound_loop}
                          onCheckedChange={(v) => setSceneField('ambient_sound_loop', !!v)}
                        />
                        Lặp lại âm thanh nền
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={sceneForm.auto_play_narration}
                          onCheckedChange={(v) => setSceneField('auto_play_narration', !!v)}
                        />
                        Tự động phát thuyết minh
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={sceneForm.is_main}
                          onCheckedChange={(v) => setSceneField('is_main', !!v)}
                        />
                        Cảnh chính
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={sceneForm.is_active}
                          onCheckedChange={(v) => setSceneField('is_active', !!v)}
                        />
                        Kích hoạt
                      </label>
                    </div>

                    {sceneFormError && (
                      <p className="text-destructive mt-2 text-xs">{sceneFormError}</p>
                    )}

                    <div className="mt-3 flex items-center justify-end gap-2">
                      {isEditingScene ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingScene(false)
                            setSceneFormError(null)
                            if (scene) hydrateFormFromScene(scene)
                          }}
                          disabled={isSavingScene}
                        >
                          Hủy
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => onOpenChange(false)}
                          disabled={isSavingScene}
                        >
                          Đóng
                        </Button>
                      )}
                      <Button onClick={handleSaveScene} disabled={isSavingScene || !spotId}>
                        {isSavingScene ? 'Đang lưu...' : isCreateMode ? 'Tạo cảnh' : 'Lưu thay đổi'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Detail view — shown when not editing and scene exists */}
                {!showSceneForm && scene && (
                  <div className="rounded border p-3">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">Chi tiết cảnh</p>
                        {scene.is_main && (
                          <Badge className="border-warning/20 bg-warning/10 text-warning">
                            <Crown className="mr-1 size-3" /> Cảnh chính
                          </Badge>
                        )}
                        {scene.is_active ? (
                          <Badge className="border-success/20 bg-success/10 text-success">
                            Hoạt động
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Vô hiệu
                          </Badge>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {!scene.is_main && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={setMainMutation.isPending}
                            onClick={() => setMainMutation.mutate(effectiveSceneId!)}
                          >
                            <Crown className="mr-1 size-4" /> Đặt cảnh chính
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={toggleActiveMutation.isPending}
                          onClick={() =>
                            toggleActiveMutation.mutate({
                              id: effectiveSceneId!,
                              active: !scene.is_active,
                            })
                          }
                        >
                          {scene.is_active ? (
                            <>
                              <EyeOff className="mr-1 size-4" /> Vô hiệu hóa
                            </>
                          ) : (
                            <>
                              <Eye className="mr-1 size-4" /> Kích hoạt
                            </>
                          )}
                        </Button>
                        <Button size="sm" onClick={() => setIsEditingScene(true)}>
                          <Pen className="mr-1 size-4" /> Chỉnh sửa
                        </Button>
                      </div>
                    </div>

                    <SectionLabel>Thông tin cơ bản</SectionLabel>
                    <InfoRow label="Tên cảnh">{scene.name}</InfoRow>
                    <InfoRow label="Mô tả">{scene.description || null}</InfoRow>

                    <SectionLabel>Hình ảnh</SectionLabel>
                    <InfoRow label="URL ảnh 360°">
                      {scene.equirectangular_image_url ? (
                        <a
                          href={parseLink(scene.equirectangular_image_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary line-clamp-1 underline"
                        >
                          {scene.equirectangular_image_url}
                        </a>
                      ) : null}
                    </InfoRow>
                    <InfoRow label="Thumbnail">
                      {scene.thumbnail_url ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={parseLink(scene.thumbnail_url)}
                            alt="thumbnail"
                            className="size-10 rounded object-cover"
                          />
                          <a
                            href={parseLink(scene.thumbnail_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary text-xs underline"
                          >
                            Xem ảnh
                          </a>
                        </div>
                      ) : null}
                    </InfoRow>

                    <SectionLabel>Camera</SectionLabel>
                    <InfoRow label="Vị trí (X, Y, Z)">
                      {(() => {
                        const pos = normPos(scene) as Vec3Like | null
                        return pos ? `${pos.x ?? 0}, ${pos.y ?? 1.6}, ${pos.z ?? 0}` : null
                      })()}
                    </InfoRow>
                    <InfoRow label="Hướng nhìn (X, Y, Z)">
                      {(() => {
                        const rot = normRot(scene) as Vec3Like | null
                        return rot ? `${rot.x ?? 0}, ${rot.y ?? 0}, ${rot.z ?? 0}` : null
                      })()}
                    </InfoRow>
                    <InfoRow label="FOV">
                      {normFov(scene) != null ? `${normFov(scene)}°` : null}
                    </InfoRow>

                    <SectionLabel>Âm thanh nền</SectionLabel>
                    <InfoRow label="URL">
                      {normAUrl(scene) ? (
                        <a
                          href={parseLink(normAUrl(scene)!)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary line-clamp-1 underline"
                        >
                          {normAUrl(scene)}
                        </a>
                      ) : null}
                    </InfoRow>
                    <InfoRow label="Âm lượng">
                      {normVol(scene) != null ? String(normVol(scene)) : null}
                    </InfoRow>
                    <InfoRow label="Lặp lại">{normLoop(scene) ? 'Có' : 'Không'}</InfoRow>

                    <SectionLabel>Thuyết minh</SectionLabel>
                    <InfoRow label="URL">
                      {normNUrl(scene) ? (
                        <a
                          href={normNUrl(scene)!}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary line-clamp-1 underline"
                        >
                          {normNUrl(scene)}
                        </a>
                      ) : null}
                    </InfoRow>
                    <InfoRow label="Tự động phát">{normAuto(scene) ? 'Có' : 'Không'}</InfoRow>

                    <SectionLabel>Siêu dữ liệu</SectionLabel>
                    <InfoRow label="ID">
                      <span className="font-mono">{scene.id}</span>
                    </InfoRow>
                    <InfoRow label="Ngày tạo">{formatDateTime(scene.created_at)}</InfoRow>
                    <InfoRow label="Cập nhật">{formatDateTime(scene.updated_at)}</InfoRow>

                    <div className="mt-3 flex justify-end">
                      <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right 1/3: hotspot panel */}
              <div className="flex min-h-0 flex-col gap-3 lg:col-span-1 lg:h-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Hotspot{' '}
                    {!hotspotQuery.isLoading && (
                      <span className="text-muted-foreground font-normal">({hotspots.length})</span>
                    )}
                  </span>
                  <Button
                    size="sm"
                    onClick={handleCreateHotspot}
                    disabled={!effectiveSceneId || createHsMutation.isPending}
                  >
                    <Plus className="mr-1 size-3" />
                    {createHsMutation.isPending ? '...' : 'Tạo mới'}
                  </Button>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  {!effectiveSceneId ? (
                    <p className="text-muted-foreground text-xs">
                      Bạn cần lưu cảnh trước khi tạo hotspot.
                    </p>
                  ) : hotspotQuery.isLoading ? (
                    <p className="text-muted-foreground text-xs">Đang tải hotspot...</p>
                  ) : hotspots.length === 0 ? (
                    <p className="text-muted-foreground text-xs">Chưa có hotspot nào</p>
                  ) : (
                    <div className="space-y-1 rounded border p-1">
                      {hotspots.map((h) => {
                        const active = selectedHsId === h.id
                        return (
                          <button
                            key={h.id}
                            type="button"
                            className={`w-full rounded px-2 py-1.5 text-left text-xs transition ${
                              active
                                ? 'bg-primary/12 text-primary border-primary/30 border'
                                : 'hover:bg-muted border border-transparent'
                            }`}
                            onClick={() => startEditing(h)}
                          >
                            {normalizeLabel(h.name) || `Hotspot #${h.id.slice(0, 8)}`}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {editingId && (
                    <div className="space-y-2.5 rounded border p-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Tên hotspot</Label>
                        <Input
                          className="h-7 text-xs"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Mô tả</Label>
                        <Textarea
                          className="text-xs"
                          rows={2}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Loại hotspot</Label>
                          <Select value={editType} onValueChange={setEditType}>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Chọn loại hotspot" />
                            </SelectTrigger>
                            <SelectContent>
                              {HOTSPOT_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value} className="text-xs">
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Biểu tượng</Label>
                          <Select value={editIconType} onValueChange={setEditIconType}>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Chọn biểu tượng" />
                            </SelectTrigger>
                            <SelectContent>
                              {ICON_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value} className="text-xs">
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Vị trí X Y Z</Label>
                        <div className="grid grid-cols-3 gap-1">
                          {(['x', 'y', 'z'] as const).map((axis) => (
                            <Input
                              key={axis}
                              type="number"
                              step={1}
                              className="h-7 text-center text-xs"
                              placeholder={axis.toUpperCase()}
                              value={editPos[axis]}
                              onChange={(e) =>
                                setEditPos((p) => ({ ...p, [axis]: e.target.value }))
                              }
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Tỉ lệ X Y Z</Label>
                        <div className="grid grid-cols-3 gap-1">
                          {(['x', 'y', 'z'] as const).map((axis) => (
                            <Input
                              key={axis}
                              type="number"
                              step={1}
                              min="0.1"
                              className="h-7 text-center text-xs"
                              placeholder={axis.toUpperCase()}
                              value={editScale[axis]}
                              onChange={(e) =>
                                setEditScale((s) => ({ ...s, [axis]: e.target.value }))
                              }
                            />
                          ))}
                        </div>
                      </div>

                      {otherScenes.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs">Liên kết cảnh</Label>
                          <SearchSelect
                            options={[
                              { value: '', label: '-- Không liên kết --' },
                              ...otherScenes.map((s) => ({ value: s.id, label: s.name })),
                            ]}
                            value={editTarget ?? ''}
                            onValueChange={(v) => setEditTarget(v || null)}
                            placeholder="Không liên kết"
                            className="h-7 w-full text-xs"
                          />
                        </div>
                      )}

                      <div className="w-full space-y-1">
                        <Label className="text-xs">Liên kết điểm tham quan</Label>
                        <SearchSelect
                          options={[
                            { value: '', label: '-- Không liên kết --' },
                            ...spotSelectOptions,
                          ]}
                          value={editLinkedSpotId ?? ''}
                          onValueChange={(v) => setEditLinkedSpotId(v || null)}
                          placeholder="Không liên kết"
                          className="h-7 w-full text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">URL đích</Label>
                        <Input
                          className="h-7 text-xs"
                          value={editTargetUrl}
                          onChange={(e) => setEditTargetUrl(e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>

                      <div className="flex gap-4">
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                          <Checkbox
                            checked={editVisible}
                            onCheckedChange={(v) => setEditVisible(!!v)}
                          />
                          Hiển thị
                        </label>
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                          <Checkbox
                            checked={editActive}
                            onCheckedChange={(v) => setEditActive(!!v)}
                          />
                          Kích hoạt
                        </label>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setHsToDelete(hotspots.find((h) => h.id === editingId) ?? null)
                            setDeleteHsOpen(true)
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          Hủy
                        </Button>
                        <Button
                          size="sm"
                          className="ml-auto"
                          onClick={handleSaveHotspot}
                          disabled={updateHsMutation.isPending}
                        >
                          {updateHsMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteHsOpen} onOpenChange={setDeleteHsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa hotspot</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa &quot;{hsToDelete?.name || `Hotspot #${hsToDelete?.id?.slice(0, 8) ?? ''}`}&quot;?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteHsMutation.isPending}
              onClick={() => hsToDelete && deleteHsMutation.mutate(hsToDelete.id)}
            >
              {deleteHsMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

