import { lazy, Suspense, useEffect } from 'react'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { MainLayout } from './layout/mainLayout'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { useAuthStore } from './stores/common/useAuthStore'
import { tokenManager } from './lib/tokenManager'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

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
const RatingPage = lazy(() => import('@/pages/Ratings'))
const MapLayerPage = lazy(() => import('@/pages/MapLayers'))
const MapLayerApisPage = lazy(() => import('@/pages/MapLayerApis'))
const MapLayerApiPublicPage = lazy(() => import('@/pages/MapLayerApis/MapLayerApiPublicPage'))
const FeedbackPage = lazy(() => import('@/pages/Feedback'))
const AuditLogPage = lazy(() => import('@/pages/AuditLog'))
const VisitorStatisticsPage = lazy(() => import('@/pages/Statistics/VisitorStatistics'))
const ProfilePage = lazy(() => import('@/pages/Profile'))
const ChangePasswordPage = lazy(() => import('@/pages/ChangePassword'))

function App() {
  const location = useLocation()
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <>
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
              <Route path="/" element={<VisitorStatisticsPage />} />
              <Route path="/dashboard" element={<VisitorStatisticsPage />} />

              {/* Quản lý người dùng */}
              <Route path="/users" element={<UserPage />} />
              <Route path="/roles" element={<RolePage />} />

              {/* Du lịch */}
              <Route path="/categories" element={<CategoryPage />} />
              <Route path="/spots" element={<SpotPage />} />
              <Route path="/culinary" element={<CulinaryPage />} />
              <Route path="/festivals" element={<FestivalPage />} />
              <Route path="/ocop" element={<OcopPage />} />
              <Route path="/vlogs" element={<VlogPage />} />
              <Route path="/businesses" element={<BusinessPage />} />

              {/* Tin tức & đánh giá */}
              <Route path="/news" element={<NewsPage />} />
              <Route path="/news-comments" element={<NewsCommentsPage />} />
              <Route path="/ratings" element={<RatingPage />} />

              {/* Bản đồ */}
              <Route path="/map-layers" element={<MapLayerPage />} />
              <Route path="/map-layer-apis/*" element={<MapLayerApisPage />} />
              <Route path="/public/map-layer-apis" element={<MapLayerApiPublicPage />} />

              {/* Phản ánh & nhật ký */}
              <Route path="/feedbacks" element={<FeedbackPage />} />
              <Route path="/audit-logs" element={<AuditLogPage />} />

              {/* Hồ sơ */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <ToastContainer position="top-right" className="z-9999" autoClose={3000} />
    </>
  )
}

export default App
