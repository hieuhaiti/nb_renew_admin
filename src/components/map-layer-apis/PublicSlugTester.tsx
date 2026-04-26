import { useState } from 'react'
import { toast } from 'react-toastify'
import { Copy, KeyRound, Layers, Link2, Play, RotateCcw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mapLayerApiService } from '@/service'
import type { ApiResponse } from '@/types/api'
import { getMappedErrorMessage } from '@/validators/mapLayerApiValidators'

type PublicTestMeta = {
  fetchedAt?: string
}

function normalizePublicLayers(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const record = data as { map_layers?: unknown[]; mapLayers?: unknown[]; items?: unknown[] }
    if (Array.isArray(record.map_layers)) return record.map_layers
    if (Array.isArray(record.mapLayers)) return record.mapLayers
    if (Array.isArray(record.items)) return record.items
  }
  return []
}

export default function PublicSlugTester() {
  const [slug, setSlug] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [json, setJson] = useState<unknown[]>([])
  const [error, setError] = useState<string>('')
  const [meta, setMeta] = useState<PublicTestMeta>({})

  const endpointPreview = `/map-layer-apis/${slug.trim() || ':slug'}?apikey=${apiKey.trim() || '...'}`
  const resultCount = json.length

  function resetAll() {
    setSlug('')
    setApiKey('')
    setJson([])
    setError('')
    setMeta({})
  }

  async function handleCopyData() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(json, null, 2))
      toast.success('Đã copy dữ liệu')
    } catch {
      toast.error('Không thể copy dữ liệu')
    }
  }

  async function handleTest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setJson([])
    setMeta({})

    if (!slug.trim() || !apiKey.trim()) {
      setError('Vui lòng nhập đầy đủ slug và apikey')
      return
    }

    try {
      setLoading(true)
      const response = await mapLayerApiService.getBySlugWithKey(slug.trim(), apiKey.trim())
      const data = (response as ApiResponse<unknown>).data
      const mapLayers = normalizePublicLayers(data)

      setJson(mapLayers)
      setMeta({ fetchedAt: new Date().toISOString() })

      if (mapLayers.length === 0) {
        toast.info('API trả về thành công nhưng dữ liệu đang rỗng')
      }
    } catch (err) {
      setError(getMappedErrorMessage(err, 'Không gọi được API public'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Card className="border-primary/25 from-primary/10 via-primary/5 bg-gradient-to-b to-transparent">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5" />
              Kiểm tra API Public
            </CardTitle>
            <Badge variant="secondary">GET</Badge>
          </div>
          <CardDescription>
            Nhập `slug` và `apikey` để gọi endpoint public theo thời gian thực.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleTest}>
            <div className="space-y-2">
              <Label htmlFor="public-slug">Slug</Label>
              <Input
                id="public-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="map-layer-api-slug"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="public-apikey" className="inline-flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                API Key
              </Label>
              <Input
                id="public-apikey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Nhập apikey"
              />
            </div>

            <div className="bg-background/70 rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium">Xem trước endpoint</p>
              <p className="text-foreground mt-1 font-mono text-xs break-all">{endpointPreview}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading} className="min-w-[140px]">
                <Play className="mr-2 h-4 w-4" />
                {loading ? 'Đang gọi...' : 'Kiểm tra API'}
              </Button>
              <Button type="button" variant="outline" onClick={resetAll}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Làm mới
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5" />
              Kết quả dữ liệu
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={error ? 'destructive' : 'secondary'}>
                {error ? 'Lỗi' : `Bản ghi: ${resultCount}`}
              </Badge>
              {meta.fetchedAt && (
                <span className="text-muted-foreground text-xs">
                  {new Date(meta.fetchedAt).toLocaleTimeString('vi-VN')}
                </span>
              )}
            </div>
          </div>
          <CardDescription className="inline-flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Dữ liệu lấy từ endpoint public theo slug + apikey
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-md border bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-xs text-slate-300">
              <span>Phản hồi JSON</span>
              <div className="flex items-center gap-2">
                <span>{resultCount} bản ghi</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyData}
                  className="h-7 border-slate-700 bg-slate-900 px-2 text-slate-200 hover:bg-slate-800 hover:text-white"
                >
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  Copy data
                </Button>
              </div>
            </div>
            <pre className="max-h-[500px] overflow-auto p-4 text-xs text-slate-100">
              {JSON.stringify(json, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
