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
    () => spotService.getAll({ limit: 100, sortBy: 'name', sortOrder: 'ASC' }),
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
      title="Cảnh VR A-Frame"
      description="Quản lý cảnh thực tế ảo 360° cho các điểm tham quan"
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
              placeholder="Chọn điểm tham quan..."
              className="w-64"
            />
            <Select value={includeInactive} onValueChange={setIncludeInactive}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Chỉ cảnh hoạt động</SelectItem>
                <SelectItem value="true">Bao gồm vô hiệu</SelectItem>
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
              Thêm cảnh VR
            </Button>
          </div>
        }
        total={scenes.length}
      >
        <Table className="relative">
          <TableHeader className="sticky top-0 z-20">
            <TableRow>
              <TableHead>Tên cảnh</TableHead>
              <TableHead>Cảnh chính</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>FOV</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-36 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!spotId ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-12 text-center">
                  Chọn điểm tham quan để xem danh sách cảnh VR
                </TableCell>
              </TableRow>
            ) : dbQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : dbQuery.isError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-destructive py-8 text-center">
                  Đã xảy ra lỗi, vui lòng thử lại
                </TableCell>
              </TableRow>
            ) : scenes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  Chưa có cảnh VR nào
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
                        Cảnh chính
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {scene.is_active ? (
                      <Badge className="border-success/20 bg-success/10 text-success">Hoạt động</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Vô hiệu
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
                        title="Chỉnh sửa"
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
                          title="Đặt làm cảnh chính"
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
                        title={scene.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
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
                        title="Xóa"
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
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa cảnh VR &quot;{itemToDelete?.name}&quot;? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && deleteMutation.mutate(itemToDelete.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  )
}
