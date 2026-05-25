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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchSelect } from '@/components/common/SearchSelect'
import AframeScenePreview from '@/components/aframe/AframeScenePreview'
import type { PreviewHotspot } from '@/components/aframe/AframeScenePreview'
import { spotService, useApiMutation, useApiQuery } from '@/service'
import type { AFrameHotspot, AFrameHotspotFormBody, AFrameScene, AFrameSceneFormBody } from '@/service/spotService'
import { formatDateTime } from '@/lib/date'
import { Crown, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { STALE_REF } from '@/constant/queryConstant'

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

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-xs font-semibold">{label}:</span>
      <span className="col-span-2 text-xs">{children}</span>
    </div>
  )
}

const HOTSPOT_TYPES = [
  { value: 'navigation', label: 'Navigation' },
  { value: 'info', label: 'Info' },
  { value: 'url', label: 'URL' },
  { value: 'media', label: 'Media' },
]

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
  const [createdSceneId, setCreatedSceneId] = useState<string | null>(null)
  const effectiveSceneId = sceneId ?? createdSceneId
  const isCreateMode = !effectiveSceneId

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
    ? ('id' in raw ? (raw as Scene) : ((raw?.scene ?? raw?.aframe_scene ?? null) as Scene | null))
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
    (data: Partial<AFrameSceneFormBody>) => spotService.updateScene(spotId, effectiveSceneId!, data),
    {
      onSuccess: () => {
        dbQuery.refetch()
        if (effectiveSceneId) onSceneSaved?.(effectiveSceneId)
      },
    },
    false
  )

  const setMainMutation = useApiMutation(
    (id: string) => spotService.setMainScene(spotId, id),
    { onSuccess: () => dbQuery.refetch() },
    false
  )
  const toggleActiveMutation = useApiMutation(
    ({ id, active }: { id: string; active: boolean }) =>
      active ? spotService.activateScene(spotId, id) : spotService.deactivateScene(spotId, id),
    { onSuccess: () => dbQuery.refetch() },
    false
  )

  const [selectedHsId, setSelectedHsId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editType, setEditType] = useState('navigation')
  const [editPos, setEditPos] = useState({ x: '', y: '', z: '' })
  const [editScale, setEditScale] = useState({ x: '1', y: '1', z: '1' })
  const [editTarget, setEditTarget] = useState<string | null>(null)
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

    const pos = normPos(scene) as Vec3Like | null
    const rot = normRot(scene) as Vec3Like | null
    setSceneForm({
      name: scene.name ?? '',
      description: scene.description ?? '',
      equirectangular_image_url: scene.equirectangular_image_url ?? '',
      thumbnail_url: scene.thumbnail_url ?? '',
      camera_fov: String(normFov(scene) ?? 80),
      cam_pos_x: String(pos?.x ?? 0),
      cam_pos_y: String(pos?.y ?? 1.6),
      cam_pos_z: String(pos?.z ?? 0),
      cam_rot_x: String(rot?.x ?? 0),
      cam_rot_y: String(rot?.y ?? 0),
      cam_rot_z: String(rot?.z ?? 0),
      ambient_sound_url: normAUrl(scene) ?? '',
      ambient_sound_loop: !!normLoop(scene),
      ambient_sound_volume: normVol(scene) != null ? String(normVol(scene)) : '',
      narration_audio_url: normNUrl(scene) ?? '',
      auto_play_narration: !!normAuto(scene),
      is_main: !!scene.is_main,
      is_active: !!scene.is_active,
    })
    hydratedRef.current = effectiveSceneId
  }, [open, scene, effectiveSceneId])

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
    if (!hotspots.length) return []
    if (editingId && selectedHsId === editingId) {
      return hotspots.map((h) => {
        if (h.id !== editingId) return h
        return {
          ...h,
          name: editName || h.name,
          visible: editVisible,
          position: {
            x: editPos.x !== '' ? num(editPos.x) : num((h.position as Vec3Like)?.x),
            y: editPos.y !== '' ? num(editPos.y) : num((h.position as Vec3Like)?.y, 1.6),
            z: editPos.z !== '' ? num(editPos.z) : num((h.position as Vec3Like)?.z),
          },
          scale: {
            x: num(editScale.x, 1),
            y: num(editScale.y, 1),
            z: num(editScale.z, 1),
          },
        }
      })
    }
    return hotspots
  }, [hotspots, selectedHsId, editingId, editName, editVisible, editPos, editScale])

  const createHsMutation = useApiMutation(
    (data: AFrameHotspotFormBody) => spotService.createSceneHotspot(spotId, effectiveSceneId!, data),
    {
      onSuccess: (res) => {
        const d = (res as any)?.data
        const hs = d?.hotspot ?? (d && 'id' in d ? d : null)
        if (hs?.id) pendingSelectRef.current = hs.id
        hotspotQuery.refetch()
      },
    },
    false
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
    false
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
    false
  )

  function startEditing(hs: AFrameHotspot) {
    setSelectedHsId(hs.id)
    setEditingId(hs.id)
    setEditName(hs.name || '')
    setEditDesc(hs.description || '')
    setEditType(hs.hotspot_type || 'navigation')
    setEditTarget(hs.target_scene_id ?? null)
    setEditVisible(hs.visible !== false)
    setEditActive(hs.is_active)

    const pos = hs.position as Vec3Like | null
    const scl = hs.scale as Vec3Like | null
    setEditPos({ x: String(pos?.x ?? ''), y: String(pos?.y ?? ''), z: String(pos?.z ?? '') })
    setEditScale({ x: String(scl?.x ?? 1), y: String(scl?.y ?? 1), z: String(scl?.z ?? 1) })
  }

  function cancelEditing() {
    setEditingId(null)
    setEditName('')
    setEditDesc('')
    setEditType('navigation')
    setEditPos({ x: '', y: '', z: '' })
    setEditScale({ x: '1', y: '1', z: '1' })
    setEditTarget(null)
    setEditVisible(true)
    setEditActive(true)
  }

  function handleCreateHotspot() {
    if (!effectiveSceneId) return
    createHsMutation.mutate({
      name: 'Hotspot moi',
      hotspot_type: 'navigation',
      position: { x: 0, y: 1.6, z: -3 },
      scale: { x: 1, y: 1, z: 1 },
      visible: true,
      is_active: true,
    })
  }

  function handleSaveHotspot() {
    if (!editingId) return
    const orig = hotspots.find((h) => h.id === editingId)
    if (!orig) return

    const payload: Partial<AFrameHotspotFormBody> = {}
    if (editName !== (orig.name || '')) payload.name = editName
    if (editDesc !== (orig.description || '')) payload.description = editDesc
    if (editType !== orig.hotspot_type) payload.hotspot_type = editType
    if (editVisible !== (orig.visible !== false)) payload.visible = editVisible
    if (editActive !== orig.is_active) payload.is_active = editActive
    if (editTarget !== (orig.target_scene_id ?? null)) payload.target_scene_id = editTarget ?? undefined

    const origPos = orig.position as Vec3Like | null
    const px = editPos.x !== '' ? num(editPos.x) : num(origPos?.x)
    const py = editPos.y !== '' ? num(editPos.y) : num(origPos?.y, 1.6)
    const pz = editPos.z !== '' ? num(editPos.z) : num(origPos?.z)
    if (px !== num(origPos?.x) || py !== num(origPos?.y, 1.6) || pz !== num(origPos?.z)) {
      payload.position = { x: px, y: py, z: pz }
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
      ...(values.ambient_sound_url.trim() && { ambient_sound_url: values.ambient_sound_url.trim() }),
      ambient_sound_loop: values.ambient_sound_loop,
      ...(ambientVolume != null && { ambient_sound_volume: ambientVolume }),
      ...(values.narration_audio_url.trim() && { narration_audio_url: values.narration_audio_url.trim() }),
      auto_play_narration: values.auto_play_narration,
      is_main: values.is_main,
      is_active: values.is_active,
    }
  }

  function validateSceneForm(values: SceneFormState): string | null {
    if (!values.name.trim()) return 'Ten canh khong duoc de trong'
    if (!values.equirectangular_image_url.trim()) return 'URL anh 360 khong duoc de trong'

    const fov = parseOptionalNumber(values.camera_fov)
    if (fov != null && (fov < 10 || fov > 180)) return 'FOV phai nam trong khoang 10-180'

    const ambientVolume = parseOptionalNumber(values.ambient_sound_volume)
    if (ambientVolume != null && (ambientVolume < 0 || ambientVolume > 1)) {
      return 'Volume phai nam trong khoang 0-1'
    }

    return null
  }

  function handleSaveScene() {
    const error = validateSceneForm(sceneForm)
    setSceneFormError(error)
    if (error) return

    const payload = buildScenePayload(sceneForm)
    if (effectiveSceneId) {
      updateSceneMutation.mutate(payload)
      return
    }
    createSceneMutation.mutate(payload)
  }

  const selectedHs = hotspots.find((h) => h.id === selectedHsId)

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
          <DialogTitle>{isCreateMode ? 'Tao canh VR moi' : 'Chi tiet canh VR'}</DialogTitle>
          <DialogDescription>
            Quan ly scene, camera, am thanh va hotspot trong mot man hinh duy nhat
          </DialogDescription>

          {!isCreateMode && dbQuery.isLoading ? (
            <div className="text-muted-foreground py-12 text-center">Dang tai...</div>
          ) : !isCreateMode && !scene ? (
            <div className="text-muted-foreground py-12 text-center">Khong co du lieu</div>
          ) : (
            <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-3 lg:col-span-2">
                <AframeScenePreview
                  imageUrl={sceneForm.equirectangular_image_url}
                  cameraPosition={previewPosition}
                  cameraRotation={previewRotation}
                  cameraFov={previewFov}
                  hotspots={displayedHotspots}
                  height="420px"
                />

                <div className="rounded border p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Chinh sua scene</p>
                    <div className="flex items-center gap-2">
                      {!!effectiveSceneId && scene?.is_main && (
                        <Badge className="border-warning/20 bg-warning/10 text-warning">
                          <Crown className="mr-1 size-3" /> Canh chinh
                        </Badge>
                      )}
                      {!!effectiveSceneId && !scene?.is_main && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={setMainMutation.isPending}
                          onClick={() => setMainMutation.mutate(effectiveSceneId)}
                        >
                          <Crown className="mr-1 size-4" /> Dat lam canh chinh
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
                              <EyeOff className="mr-1 size-4" /> Vo hieu hoa
                            </>
                          ) : (
                            <>
                              <Eye className="mr-1 size-4" /> Kich hoat
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1 md:col-span-2">
                      <Label>Ten canh *</Label>
                      <Input
                        value={sceneForm.name}
                        onChange={(e) => setSceneField('name', e.target.value)}
                        placeholder="Canh chinh"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label>URL anh 360 *</Label>
                      <Input
                        value={sceneForm.equirectangular_image_url}
                        onChange={(e) => setSceneField('equirectangular_image_url', e.target.value)}
                        placeholder="https://example.com/panorama.jpg"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Thumbnail URL</Label>
                      <Input
                        value={sceneForm.thumbnail_url}
                        onChange={(e) => setSceneField('thumbnail_url', e.target.value)}
                        placeholder="https://example.com/thumb.jpg"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>FOV (10-180)</Label>
                      <Input
                        type="number"
                        min={10}
                        max={180}
                        value={sceneForm.camera_fov}
                        onChange={(e) => setSceneField('camera_fov', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label>Mo ta</Label>
                      <Textarea
                        rows={2}
                        value={sceneForm.description}
                        onChange={(e) => setSceneField('description', e.target.value)}
                        placeholder="Mo ta canh VR"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Camera Position (X Y Z)</Label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['cam_pos_x', 'cam_pos_y', 'cam_pos_z'] as const).map((k) => (
                          <Input
                            key={k}
                            type="number"
                            step="0.01"
                            value={sceneForm[k]}
                            onChange={(e) => setSceneField(k, e.target.value)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>Camera Rotation (X Y Z)</Label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['cam_rot_x', 'cam_rot_y', 'cam_rot_z'] as const).map((k) => (
                          <Input
                            key={k}
                            type="number"
                            step="0.01"
                            value={sceneForm[k]}
                            onChange={(e) => setSceneField(k, e.target.value)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label>Ambient Sound URL</Label>
                      <Input
                        value={sceneForm.ambient_sound_url}
                        onChange={(e) => setSceneField('ambient_sound_url', e.target.value)}
                        placeholder="https://example.com/ambient.mp3"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Ambient Volume (0-1)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step="0.1"
                        value={sceneForm.ambient_sound_volume}
                        onChange={(e) => setSceneField('ambient_sound_volume', e.target.value)}
                        placeholder="0.6"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Narration URL</Label>
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
                      Loop ambient
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={sceneForm.auto_play_narration}
                        onCheckedChange={(v) => setSceneField('auto_play_narration', !!v)}
                      />
                      Auto play narration
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox checked={sceneForm.is_main} onCheckedChange={(v) => setSceneField('is_main', !!v)} />
                      Canh chinh
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox checked={sceneForm.is_active} onCheckedChange={(v) => setSceneField('is_active', !!v)} />
                      Kich hoat
                    </label>
                  </div>

                  {sceneFormError && (
                    <p className="text-destructive mt-2 text-xs">{sceneFormError}</p>
                  )}

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSavingScene}>
                      Dong
                    </Button>
                    <Button onClick={handleSaveScene} disabled={isSavingScene || !spotId}>
                      {isSavingScene ? 'Dang luu...' : isCreateMode ? 'Tao scene' : 'Luu scene'}
                    </Button>
                  </div>
                </div>

                {!!scene && (
                  <details className="rounded border">
                    <summary className="text-muted-foreground cursor-pointer select-none px-3 py-2 text-xs font-semibold hover:underline">
                      Thong tin scene
                    </summary>
                    <div className="space-y-2 border-t p-3">
                      <Row label="ID">{scene.id}</Row>
                      <Row label="Trang thai">{scene.is_active ? 'Hoat dong' : 'Vo hieu'}</Row>
                      <Row label="Main">{scene.is_main ? 'Co' : 'Khong'}</Row>
                      <Row label="Ngay tao">{formatDateTime(scene.created_at)}</Row>
                      <Row label="Cap nhat">{formatDateTime(scene.updated_at)}</Row>
                    </div>
                  </details>
                )}
              </div>

              <div className="space-y-3 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Hotspots{' '}
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
                    {createHsMutation.isPending ? '...' : 'Tao moi'}
                  </Button>
                </div>

                {!effectiveSceneId ? (
                  <p className="text-muted-foreground text-xs">
                    Ban can luu scene truoc khi tao hotspot.
                  </p>
                ) : hotspotQuery.isLoading ? (
                  <p className="text-muted-foreground text-xs">Dang tai hotspot...</p>
                ) : hotspots.length === 0 ? (
                  <p className="text-muted-foreground text-xs">Chua co hotspot nao</p>
                ) : (
                  <select
                    className="border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm"
                    value={selectedHsId ?? ''}
                    onChange={(e) => {
                      const id = e.target.value || null
                      setSelectedHsId(id)
                      if (editingId && editingId !== id) cancelEditing()
                    }}
                  >
                    <option value="">-- Chon hotspot --</option>
                    {hotspots.map((h) => (
                      <option key={h.id} value={h.id}>
                        {normalizeLabel(h.name) || `Hotspot #${h.id.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                )}

                {selectedHs && !editingId && (
                  <div className="space-y-1.5 rounded border p-2.5">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <p className="text-sm font-medium">{normalizeLabel(selectedHs.name)}</p>
                        {selectedHs.description && (
                          <p className="text-muted-foreground text-xs">{selectedHs.description}</p>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => startEditing(selectedHs)}>
                        Sua
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {selectedHs.hotspot_type}
                      </Badge>
                      {selectedHs.is_active ? (
                        <Badge className="border-success/20 bg-success/10 text-xs text-success">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {editingId && (
                  <div className="space-y-2.5 rounded border p-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Ten hotspot</Label>
                      <Input className="h-7 text-xs" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Mo ta</Label>
                      <Textarea
                        className="text-xs"
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Loai</Label>
                      <Select value={editType} onValueChange={setEditType}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
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
                      <Label className="text-xs">Vi tri X Y Z</Label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['x', 'y', 'z'] as const).map((axis) => (
                          <Input
                            key={axis}
                            type="number"
                            step="0.01"
                            className="h-7 text-center text-xs"
                            placeholder={axis.toUpperCase()}
                            value={editPos[axis]}
                            onChange={(e) => setEditPos((p) => ({ ...p, [axis]: e.target.value }))}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Scale X Y Z</Label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['x', 'y', 'z'] as const).map((axis) => (
                          <Input
                            key={axis}
                            type="number"
                            step="0.1"
                            min="0.1"
                            className="h-7 text-center text-xs"
                            placeholder={axis.toUpperCase()}
                            value={editScale[axis]}
                            onChange={(e) => setEditScale((s) => ({ ...s, [axis]: e.target.value }))}
                          />
                        ))}
                      </div>
                    </div>

                    {otherScenes.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs">Lien ket scene</Label>
                        <SearchSelect
                          options={[
                            { value: '', label: '-- Khong lien ket --' },
                            ...otherScenes.map((s) => ({ value: s.id, label: s.name })),
                          ]}
                          value={editTarget ?? ''}
                          onValueChange={(v) => setEditTarget(v || null)}
                          placeholder="Khong lien ket"
                          className="h-7 text-xs"
                        />
                      </div>
                    )}

                    <div className="flex gap-4">
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                        <Checkbox checked={editVisible} onCheckedChange={(v) => setEditVisible(!!v)} />
                        Hien thi
                      </label>
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                        <Checkbox checked={editActive} onCheckedChange={(v) => setEditActive(!!v)} />
                        Kich hoat
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
                        Huy
                      </Button>
                      <Button
                        size="sm"
                        className="ml-auto"
                        onClick={handleSaveHotspot}
                        disabled={updateHsMutation.isPending}
                      >
                        {updateHsMutation.isPending ? 'Dang luu...' : 'Luu'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteHsOpen} onOpenChange={setDeleteHsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoa hotspot</AlertDialogTitle>
            <AlertDialogDescription>
              Xoa "{hsToDelete?.name || `Hotspot #${hsToDelete?.id?.slice(0, 8) ?? ''}`}"? Hanh dong nay
              khong the hoan tac.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteHsMutation.isPending}
              onClick={() => hsToDelete && deleteHsMutation.mutate(hsToDelete.id)}
            >
              {deleteHsMutation.isPending ? 'Dang xoa...' : 'Xoa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
