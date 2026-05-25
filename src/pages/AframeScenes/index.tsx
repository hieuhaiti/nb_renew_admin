import type { JSX } from 'react'
import { useState } from 'react'
import { useApiMutation, useApiQuery, spotService } from '@/service'
import type { AFrameScene } from '@/service/spotService'
import type { ApiResponse, Spot, SpotListData } from '@/types/api'
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
import { SearchSelect } from '@/components/common/SearchSelect'
import ToolTableCustom from '@/components/features/ToolTableCustom'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Crown, Eye, EyeOff, Pen, Plus, Trash2 } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatDate } from '@/lib/date'
import { STALE_DEFAULT, STALE_REF } from '@/constant/queryConstant'
import AframeSceneDetailDialog from './AframeSceneDetailDialog'

export default function AframeScenePage(): JSX.Element {
  const [spotId, setSpotId] = useState<string>('')
  const [includeInactive, setIncludeInactive] = useState<string>('false')
  const [searchValue, setSearchValue] = useState<string>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<AFrameScene | null>(null)

  const spotsQuery = useApiQuery(
    ['spots-all-for-aframe'],
    () => spotService.getAll({ limit: 100, sortBy: 'name_vi', sortOrder: 'ASC' }),
    { staleTime: STALE_REF },
    false,
    false
  )
  const spots: Spot[] = (spotsQuery.data as ApiResponse<SpotListData>)?.data?.spots ?? []
  const spotOptions = spots.map((s) => ({ value: s.id, label: s.name || s.id }))

  const dbQuery = useApiQuery(
    ['aframe-scenes', spotId, includeInactive],
    () => spotService.getScenes(spotId, { include_inactive: includeInactive === 'true' }),
    { enabled: !!spotId, staleTime: STALE_DEFAULT },
    false,
    false
  )
  const rawData = (dbQuery.data as any)?.data
  const allScenes: AFrameScene[] = rawData?.scenes ?? (Array.isArray(rawData) ? rawData : [])
  const scenes = searchValue.trim()
    ? allScenes.filter((s) => s.name.toLowerCase().includes(searchValue.toLowerCase()))
    : allScenes

  const deleteMutation = useApiMutation(
    (id: string) => spotService.deleteScene(spotId, id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteOpen(false)
        setItemToDelete(null)
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

  return (
    <PageLayout
      title="Canh VR A-Frame"
      description="Quan ly canh thuc te ao 360 do cho cac diem tham quan"
    >
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        dataUpdatedAt={dbQuery.dataUpdatedAt}
        onRefresh={() => dbQuery.refetch()}
        isRefreshing={dbQuery.isFetching && !dbQuery.isLoading}
        filter={
          <div className="flex flex-wrap items-center gap-2">
            <SearchSelect
              options={spotOptions}
              value={spotId}
              onValueChange={(v) => {
                setSpotId(v)
                setSelectedId(null)
              }}
              placeholder="Chon diem tham quan..."
              className="w-64"
            />
            <Select value={includeInactive} onValueChange={setIncludeInactive}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Chi canh hoat dong</SelectItem>
                <SelectItem value="true">Bao gom vo hieu</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!spotId}
              onClick={() => {
                setSelectedId(null)
                setDetailOpen(true)
              }}
            >
              <Plus className="mr-1 size-4" />
              Them canh VR
            </Button>
          </div>
        }
        total={scenes.length}
      >
        <Table className="relative">
          <TableHeader className="sticky top-0 z-20">
            <TableRow>
              <TableHead>Ten canh</TableHead>
              <TableHead>Canh chinh</TableHead>
              <TableHead>Trang thai</TableHead>
              <TableHead>FOV</TableHead>
              <TableHead>Ngay tao</TableHead>
              <TableHead className="w-36 text-right">Hanh dong</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!spotId ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-12 text-center">
                  Chon diem tham quan de xem danh sach canh VR
                </TableCell>
              </TableRow>
            ) : dbQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  Dang tai...
                </TableCell>
              </TableRow>
            ) : dbQuery.isError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-destructive py-8 text-center">
                  Da xay ra loi, vui long thu lai
                </TableCell>
              </TableRow>
            ) : scenes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  Chua co canh VR nao
                </TableCell>
              </TableRow>
            ) : (
              scenes.map((scene) => (
                <TableRow
                  key={scene.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedId(scene.id)
                    setDetailOpen(true)
                  }}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{scene.name}</p>
                      {scene.description && (
                        <p className="text-muted-foreground line-clamp-1 text-xs">{scene.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {scene.is_main ? (
                      <Badge className="border-warning/20 bg-warning/10 text-warning">
                        <Crown className="mr-1 size-3" />
                        Canh chinh
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {scene.is_active ? (
                      <Badge className="border-success/20 bg-success/10 text-success">Hoat dong</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Vo hieu
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {scene.camera_fov != null ? `${scene.camera_fov}°` : '-'}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(scene.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedId(scene.id)
                          setDetailOpen(true)
                        }}
                        title="Chinh sua"
                      >
                        <Pen className="size-4" />
                      </Button>
                      {!scene.is_main && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setMainMutation.mutate(scene.id)
                          }}
                          title="Dat lam canh chinh"
                          disabled={setMainMutation.isPending}
                        >
                          <Crown className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleActiveMutation.mutate({ id: scene.id, active: !scene.is_active })
                        }}
                        title={scene.is_active ? 'Vo hieu hoa' : 'Kich hoat'}
                        disabled={toggleActiveMutation.isPending}
                      >
                        {scene.is_active ? (
                          <EyeOff className="text-muted-foreground size-4" />
                        ) : (
                          <Eye className="text-success size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setItemToDelete(scene)
                          setDeleteOpen(true)
                        }}
                        title="Xoa"
                      >
                        <Trash2 className="text-destructive size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ToolTableCustom>

      <AframeSceneDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        spotId={spotId}
        sceneId={selectedId}
        onSceneSaved={() => dbQuery.refetch()}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xac nhan xoa</AlertDialogTitle>
            <AlertDialogDescription>
              Ban co chac chan muon xoa canh VR "{itemToDelete?.name}"? Hanh dong nay khong the hoan tac.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && deleteMutation.mutate(itemToDelete.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Dang xoa...' : 'Xoa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  )
}
