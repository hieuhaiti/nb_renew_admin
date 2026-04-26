import { useSearchParams } from 'react-router-dom'
import PageLayout from '@/layout/pageLayout'
import PublicSlugTester from '@/components/map-layer-apis/PublicSlugTester'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const tabValues = ['tester', 'guide'] as const
type PublicTab = (typeof tabValues)[number]

function toValidTab(value: string | null): PublicTab {
  if (!value) return 'tester'
  return (tabValues.includes(value as PublicTab) ? value : 'tester') as PublicTab
}

export default function MapLayerApiPublicPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = toValidTab(searchParams.get('tab'))

  return (
    <PageLayout
      title="Kiểm tra Public Map Layer API"
      description="Kiểm tra endpoint GET /map-layer-apis/:slug?apikey=... và xem dữ liệu map_layers"
    >
      <Tabs
        value={currentTab}
        onValueChange={(tab) => {
          setSearchParams({ tab })
        }}
      >
        <TabsList>
          <TabsTrigger value="tester">Test API</TabsTrigger>
          <TabsTrigger value="guide">Hướng dẫn</TabsTrigger>
        </TabsList>

        <TabsContent value="tester">
          <PublicSlugTester />
        </TabsContent>

        <TabsContent value="guide">
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl">Cách dùng Public Test</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <StatusDotBadge
                  label="Method: GET"
                  badgeClass="bg-secondary text-secondary-foreground border border-secondary"
                  dotClass="bg-secondary-foreground"
                />
                <StatusDotBadge
                  label="/map-layer-apis/:slug?apikey=..."
                  badgeClass="border border-input bg-background text-foreground"
                  dotClass="bg-foreground"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="bg-muted/30 rounded-md border p-3">
                <p className="font-medium">Bước 1</p>
                <p className="text-muted-foreground mt-1">
                  Nhập đúng <b>slug</b> của API đã publish và <b>apikey</b> còn hiệu lực.
                </p>
              </div>

              <div className="bg-muted/30 rounded-md border p-3">
                <p className="font-medium">Bước 2</p>
                <p className="text-muted-foreground mt-1">
                  Chuyển qua tab <b>Test API</b>, bấm nút <b>Kiểm tra API</b> để gọi endpoint.
                </p>
              </div>

              <div className="bg-muted/30 rounded-md border p-3">
                <p className="font-medium">Bước 3</p>
                <p className="text-muted-foreground mt-1">
                  Xem kết quả JSON ở khung phản hồi, đặc biệt trường <b>map_layers</b>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
