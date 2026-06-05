import { lazy, Suspense, useEffect } from 'react'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { MainLayout } from './layout/mainLayout'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { RoleGuard } from './components/common/RoleGuard'
import { useAuthStore } from './stores/common/useAuthStore'
import { tokenManager } from './lib/tokenManager'
import { ToastContainer } from 'react-toastify'
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary'
import ImageLightbox from '@/components/common/ImageLightbox'
import { canAccessPage, PAGE_ACCESS } from '@/constant/permissionConstant'
import {
  BUSINESS_APPROVAL_ROLE_IDS,
  BUSINESS_REGISTRATION_ROLE_IDS,
} from '@/constant/businessRegistrationConstant'
import { ROLE_IDS } from '@/constant/roleConstant'
import { navConfig } from '@/constant/common'
import 'react-toastify/dist/ReactToastify.css'
import { lazyWithRetry } from './lib/lazyWithRetry'

const NotFoundPage = lazy(() => import('@/pages/Errors/404NotFoundPage'))
const BadRequestPage = lazy(() => import('@/pages/Errors/400BadRequestPage'))
const UnauthorizedPage = lazy(() => import('@/pages/Errors/401UnauthorizedPage'))
const ForbiddenPage = lazy(() => import('@/pages/Errors/403ForbiddenPage'))
const InternalServerErrorPage = lazy(() => import('@/pages/Errors/500InternalServerErrorPage'))
const ServiceUnavailablePage = lazy(() => import('@/pages/Errors/503ServiceUnavailablePage'))

const LoginPage = lazy(() => import('@/pages/Login'))
const UserPage = lazy(() => import('@/pages/User'))
const RolePage = lazy(() => import('@/pages/Roles'))
const CategoryPage = lazy(() => import('@/pages/Category'))
const SpotPage = lazy(() => import('@/pages/Spots'))
const CulinaryPage = lazy(() => import('@/pages/Culinary'))
const FestivalPage = lazy(() => import('@/pages/Festivals'))
const OcopPage = lazy(() => import('@/pages/Ocop'))
const VlogPage = lazy(() => import('@/pages/Vlogs'))
const BusinessPage = lazy(() => import('@/pages/Businesses'))
const NewsPage = lazy(() => import('@/pages/News'))
const NewsCommentsPage = lazy(() => import('@/pages/NewsComments'))
const RatingSpotPage = lazy(() => import('@/pages/Ratings/RatingSpotPage'))
const RatingBusinessPage = lazy(() => import('@/pages/Ratings/RatingBusinessPage'))
const RatingMyBusinessPage = lazy(() => import('@/pages/Ratings/RatingMyBusinessPage'))
const MapLayerPage = lazy(() => import('@/pages/MapLayers'))
const MapLayerApisPage = lazyWithRetry(
  () => import('@/pages/MapLayerApis'),
  'retry:page:map-layer-apis'
)
const MapLayerApiPublicPage = lazy(() => import('@/pages/MapLayerApis/MapLayerApiPublicPage'))
const FeedbackPage = lazy(() => import('@/pages/Feedback'))
const AuditLogPage = lazy(() => import('@/pages/AuditLog'))
const GovernancePage = lazy(() => import('@/pages/Governance'))
const GovernanceAdminPage = lazy(() => import('@/pages/Governance/GovernanceAdminPage'))
const GovernanceMinistryPage = lazy(() => import('@/pages/Governance/GovernanceMinistryPage'))
const GovernanceDepartmentPage = lazy(() => import('@/pages/Governance/GovernanceDepartmentPage'))
const GovernanceEnterprisePage = lazy(() => import('@/pages/Governance/GovernanceEnterprisePage'))
const VisitorStatisticsPage = lazy(() => import('@/pages/Statistics/VisitorStatistics'))
const StatisticsPage = lazy(() => import('@/pages/Statistics'))
const MapAdminCategoriesPage = lazy(() => import('@/pages/MapAdminCategories'))
const TourPage = lazy(() => import('@/pages/Tours'))
const AframeScenePage = lazy(() => import('@/pages/AframeScenes'))
const CapacityPage = lazy(() => import('@/pages/Capacity'))
// const IntegrationPage = lazy(() => import('@/pages/Integrations'))
const ProfilePage = lazy(() => import('@/pages/Profile'))
const ChangePasswordPage = lazy(() => import('@/pages/ChangePassword'))

function DefaultRedirect() {
  const permissions = useAuthStore((s) => s.permissions)
  const firstAllowedItem = navConfig.find((item) => {
    if (!item.access || !canAccessPage(permissions, item.access)) return false
    if (!item.subItems?.length) return true
    return item.subItems.some((sub) => !sub.access || canAccessPage(permissions, sub.access))
  })

  const firstAllowedSubItem = firstAllowedItem?.subItems?.find(
    (sub) => !sub.access || canAccessPage(permissions, sub.access)
  )
  const fallbackPath = firstAllowedSubItem?.path ?? firstAllowedItem?.path

  if (!fallbackPath || /^https?:\/\//i.test(fallbackPath)) {
    return <Navigate to="/403" replace />
  }

  return <Navigate to={fallbackPath} replace />
}

function App() {
  const location = useLocation()
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <>
      <AppErrorBoundary>
        <Suspense fallback={<LoadingOverlay />} key={location.pathname}>
          <Routes location={location}>
            <Route
              path="/login"
              element={tokenManager.getAccessToken() ? <Navigate to="/" replace /> : <LoginPage />}
            />

            <Route path="/400" element={<BadRequestPage />} />
            <Route path="/401" element={<UnauthorizedPage />} />
            <Route path="/403" element={<ForbiddenPage />} />
            <Route path="/500" element={<InternalServerErrorPage />} />
            <Route path="/503" element={<ServiceUnavailablePage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                {/* Home redirect theo permission động từ backend */}
                <Route path="/" element={<DefaultRedirect />} />
                <Route path="/governance" element={<GovernancePage />} />

                {/* Hồ sơ cá nhân — tất cả role admin đều truy cập được */}
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/change-password" element={<ChangePasswordPage />} />

                {/* Public map page — không cần role guard */}
                <Route path="/public/map-layer-apis" element={<MapLayerApiPublicPage />} />

                {/* === Người dùng: users:read === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.users} />}>
                  <Route path="/users" element={<UserPage />} />
                </Route>

                {/* === Vai trò & phân quyền: cần quyền cập nhật role/permission === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.roles} />}>
                  <Route path="/roles" element={<RolePage />} />
                  <Route path="/governance/admin" element={<GovernanceAdminPage />} />
                </Route>

                {/* === Nhật ký hệ thống: audit_logs:read === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.auditLogs} />}>
                  <Route path="/audit-logs" element={<AuditLogPage />} />
                  {/* <Route path="/integrations" element={<IntegrationPage />} /> */}
                </Route>

                {/* === Dashboard truy cập thống kê audit log: audit_logs:read === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.dashboard} />}>
                  <Route path="/dashboard" element={<VisitorStatisticsPage />} />
                </Route>

                {/* === Dữ liệu thống kê: analytics:read === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.statistics} />}>
                  <Route path="/statistics" element={<StatisticsPage />} />
                </Route>

                {/* === Vlog: cần quyền quản trị vlogs:create/update/delete === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.vlogs} />}>
                  <Route path="/vlogs" element={<VlogPage />} />
                </Route>

                {/* === Tin tức: cần quyền quản trị news:create/update/delete === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.news} />}>
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/news-comments" element={<NewsCommentsPage />} />
                </Route>

                {/* === Ẩm thực: culinary:* === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.culinary} />}>
                  <Route path="/culinary" element={<CulinaryPage />} />
                </Route>

                {/* === Lễ hội: festivals:read === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.festivals} />}>
                  <Route path="/festivals" element={<FestivalPage />} />
                </Route>

                {/* === Doanh nghiệp: businesses:read === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.businesses} />}>
                  <Route path="/businesses" element={<BusinessPage />} />
                </Route>

                {/* === Danh mục điểm: cần quyền quản trị spot_categories:create/update/delete === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.categories} />}>
                  <Route path="/categories" element={<CategoryPage />} />
                </Route>

                {/* === Bản đồ: map_admin:read === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.mapAdmin} />}>
                  <Route path="/map-layers" element={<MapLayerPage />} />
                  <Route path="/map-admin-categories" element={<MapAdminCategoriesPage />} />
                  <Route path="/map-layer-apis/*" element={<MapLayerApisPage />} />
                </Route>

                {/* === Điểm du lịch: spots:read === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.spots} />}>
                  <Route path="/spots" element={<SpotPage />} />
                </Route>

                {/* === Media/VR/hotspot điểm: spots:update === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.aframeScenes} />}>
                  <Route path="/aframe-scenes" element={<AframeScenePage />} />
                </Route>

                {/* === Sức chứa: cần capacity:create hoặc capacity:update theo scope backend === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.capacity} />}>
                  <Route path="/capacity" element={<CapacityPage />} />
                </Route>

                {/* === Đánh giá cấp quản lý/đơn vị vận hành === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.ratingSpots} />}>
                  <Route path="/ratings/spots" element={<RatingSpotPage />} />
                </Route>

                {/* === Đánh giá doanh nghiệp cấp quản lý === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.ratingBusinesses} />}>
                  <Route path="/ratings/businesses" element={<RatingBusinessPage />} />
                </Route>

                {/* === Tour du lịch: tours:* theo scope backend === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.tours} />}>
                  <Route path="/tours" element={<TourPage />} />
                </Route>

                {/* === OCOP: ocop:* theo scope backend === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.ocop} />}>
                  <Route path="/ocop" element={<OcopPage />} />
                </Route>

                {/* === Phản ánh: cần feedbacks:update/delete === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.feedbacks} />}>
                  <Route path="/feedbacks" element={<FeedbackPage />} />
                </Route>

                {/* === Đánh giá doanh nghiệp của tôi — Công ty lữ hành + Dịch vụ === */}
                <Route element={<RoleGuard access={PAGE_ACCESS.ratingMyBusiness} />}>
                  <Route path="/ratings/businesses/my" element={<RatingMyBusinessPage />} />
                </Route>

                {/* === Governance sub-routes theo từng nhóm role nghiệp vụ === */}
                <Route
                  element={
                    <RoleGuard
                      access={PAGE_ACCESS.governance}
                      allowedRoles={[ROLE_IDS.SYSTEM_ADMIN, ROLE_IDS.MINISTRY]}
                    />
                  }
                >
                  <Route path="/governance/ministry" element={<GovernanceMinistryPage />} />
                </Route>
                <Route
                  element={
                    <RoleGuard
                      access={PAGE_ACCESS.governance}
                      allowedRoles={BUSINESS_APPROVAL_ROLE_IDS}
                    />
                  }
                >
                  <Route path="/governance/department" element={<GovernanceDepartmentPage />} />
                </Route>
                <Route
                  element={
                    <RoleGuard
                      access={PAGE_ACCESS.governance}
                      allowedRoles={BUSINESS_REGISTRATION_ROLE_IDS}
                    />
                  }
                >
                  <Route path="/governance/enterprise" element={<GovernanceEnterprisePage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
      <ToastContainer position="top-right" className="z-9999" autoClose={3000} />
      <ImageLightbox />
    </>
  )
}

export default App
