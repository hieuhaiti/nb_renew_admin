# API Route Coverage Audit

> Đối chiếu Postman Collection (`DuLichNinhBinh API`) vs Admin UI  
> Source: `@admin/src/service/*.ts` + `@admin/src/pages/**`  
> Cập nhật: 2026-05-22

---

## Ký hiệu

- ✅ **Đang dùng** — endpoint được gọi từ admin page hoặc layout component
- 🔧 **Có service** — service function tồn tại nhưng chưa được gọi trong admin
- ❌ **Chưa có** — chưa có service function nào map đến endpoint này

---

## 1. Sức khoẻ hệ thống (Health)

- 🔧 `GET /health` — `healthService.check` — chưa dùng trong admin

---

## 2. Xác thực (Auth)

- ✅ `POST /auth/login` — `authService.login` → `/login`
- ✅ `POST /auth/logout` — `authService.logout` → `UserMenu` (layout)
- ✅ `POST /auth/refresh` — `authService.refreshToken` → interceptor tự động
- ✅ `GET  /auth/me` — `authService.getProfile` → `useAuthStore` + `/users`
- ✅ `PUT  /auth/me` — `authService.updateProfile` → `/profile`
- ✅ `POST /auth/change-password` — `authService.changePassword` → `/change-password`
- 🔧 `POST /auth/register` — `authService.register` — chưa có trang admin
- 🔧 `POST /auth/forgot-password` — `authService.forgotPassword` — chưa có trang admin
- 🔧 `POST /auth/reset-password` — `authService.resetPassword` — chưa có trang admin
- 🔧 `POST /auth/verify-email/send` — `authService.sendVerificationEmail`
- 🔧 `GET  /auth/verify-email/:token` — `authService.verifyEmail`
- 🔧 `GET  /auth/google` — `authService.googleLogin`
- 🔧 `GET  /auth/google/callback` — `authService.googleCallback`
- 🔧 `GET  /auth/2fa/status` — `authService.get2FAStatus`
- 🔧 `POST /auth/2fa/setup` — `authService.setup2FA`
- 🔧 `POST /auth/2fa/enable` — `authService.enable2FA`
- 🔧 `POST /auth/2fa/disable` — `authService.disable2FA`
- 🔧 `POST /auth/2fa/verify-login` — `authService.verify2FALogin`

---

## 3. Người dùng (Users)

- ✅ `GET    /users` — `userService.getAll` → `/users`
- ✅ `GET    /users/:id` — `userService.getById` → `UserFormDialog`, `UserDetailDialog`
- ✅ `POST   /users` — `userService.create` → `/users`
- ✅ `PUT    /users/:id` — `userService.update` → `/users`
- ✅ `PUT    /users/:id/lock` — `userService.lock` → `/users`
- ✅ `DELETE /users/:id` — `userService.delete` → `/users`
- 🔧 `DELETE /users/:id/lock` — `userService.unlock` — có service, chưa dùng trong admin UI
- 🔧 `DELETE /users/batch` — `userService.batchDelete`
- 🔧 `PUT    /users/:id/role` — `userService.assignRole`

---

## 4. Vai trò (Roles)

- ✅ `GET    /roles` — `roleService.getAll` → `/roles`, `UserFormDialog`
- ✅ `POST   /roles` — `roleService.create` → `/roles`
- ✅ `PUT    /roles/:id` — `roleService.update` → `/roles`
- ✅ `DELETE /roles/:id` — `roleService.delete` → `/roles`
- 🔧 `GET    /roles/:id` — `roleService.getById` — có service, chưa dùng

---

## 5. Nhật ký kiểm toán (Audit Logs)

- ✅ `GET /audit-logs` — `auditLogService.getAll` → `/audit-logs`
- ✅ `GET /audit-logs/visitor-statistics` — `auditLogService.getVisitorStatistics` → `/dashboard`

---

## 6. Địa lý hành chính (Geography)

- 🔧 `GET /geography/provinces` — `geographyService.getProvinces`
- 🔧 `GET /geography/provinces/search` — `geographyService.searchProvinces`
- 🔧 `GET /geography/provinces/:code` — `geographyService.getProvinceByCode`
- 🔧 `GET /geography/provinces/:code/wards` — `geographyService.getWardsByProvince`
- 🔧 `GET /geography/wards` — `geographyService.getWards`
- 🔧 `GET /geography/wards/search` — `geographyService.searchWards`

---

## 7. Danh mục điểm đến (Spot Categories)

- ✅ `GET    /spot-categories` — `spotCategoryService.getAll` → `/categories`, `/spots`
- ✅ `GET    /spot-categories/:id` — `spotCategoryService.getById` → `CategoryFormDialog`, `CategoryDetailDialog`
- ✅ `POST   /spot-categories` — `spotCategoryService.create` → `/categories`
- ✅ `PUT    /spot-categories/:id` — `spotCategoryService.update` → `/categories`
- ✅ `PATCH  /spot-categories/:id/toggle` — `spotCategoryService.toggle` → `/categories`
- ✅ `DELETE /spot-categories/:id` — `spotCategoryService.delete` → `/categories`
- 🔧 `GET    /spot-categories/tree` — `spotCategoryService.getTree`

---

## 8. Điểm đến (Spots)

- ✅ `GET    /spots` — `spotService.getAll` → `/spots`, `/ratings`, `/capacity`
- ✅ `GET    /spots/id/:id` — `spotService.getById` → `SpotFormDialog`, `SpotDetailDialog`
- ✅ `POST   /spots` — `spotService.create` → `/spots`
- ✅ `PATCH  /spots/:id` — `spotService.update` → `/spots`
- ✅ `DELETE /spots/:id` — `spotService.delete` → `/spots`
- ✅ `PATCH  /spots/:id/featured` — `spotService.toggleFeatured` → `/spots`
- 🔧 `GET    /spots/map` — `spotService.getMap`
- 🔧 `GET    /spots/nearby` — `spotService.getNearby`
- 🔧 `GET    /spots/bbox` — `spotService.getByBBox`
- 🔧 `GET    /spots/geojson` — `spotService.getGeoJSON`
- 🔧 `GET    /spots/featured` — `spotService.getFeatured`
- 🔧 `GET    /spots/:slug` — `spotService.getBySlug`
- 🔧 `GET    /spots/:spotId/media` — `spotService.getMedia`
- 🔧 `GET    /spots/:spotId/audio-guide` — `spotService.getAudioGuide`
- 🔧 `POST   /spots/:spotId/media` — `spotService.uploadMedia`
- 🔧 `POST   /spots/:spotId/media/batch` — `spotService.uploadMediaBatch`
- 🔧 `DELETE /spots/:spotId/media/:mediaId` — `spotService.deleteMedia`
- 🔧 `PATCH  /spots/:spotId/media/:mediaId/primary` — `spotService.setPrimaryMedia`
- 🔧 `PATCH  /spots/:spotId/media/:mediaId` — `spotService.updateMedia`

---

## 9. Cảnh A-Frame VR (Spots)

- 🔧 `GET    /spots/:spotId/aframe-scenes` — `spotService.getScenes`
- 🔧 `GET    /spots/:spotId/aframe-scenes/:sceneId` — `spotService.getSceneById`
- 🔧 `GET    /spots/:spotId/aframe-scenes/:sceneId/preload` — `spotService.preloadScene`
- 🔧 `POST   /spots/:spotId/aframe-scenes` — `spotService.createScene`
- 🔧 `PATCH  /spots/:spotId/aframe-scenes/:sceneId` — `spotService.updateScene`
- 🔧 `PATCH  /spots/:spotId/aframe-scenes/:sceneId/set-main` — `spotService.setMainScene`
- 🔧 `PATCH  /spots/:spotId/aframe-scenes/:sceneId/activate` — `spotService.activateScene`
- 🔧 `PATCH  /spots/:spotId/aframe-scenes/:sceneId/deactivate` — `spotService.deactivateScene`
- 🔧 `DELETE /spots/:spotId/aframe-scenes/:sceneId` — `spotService.deleteScene`
- 🔧 `GET    /spots/:spotId/aframe-scenes/:sceneId/hotspots` — `spotService.getSceneHotspots`
- 🔧 `POST   /spots/:spotId/aframe-scenes/:sceneId/hotspots` — `spotService.createSceneHotspot`
- 🔧 `PATCH  /spots/:spotId/aframe-scenes/:sceneId/hotspots/:hotspotId` — `spotService.updateSceneHotspot`
- 🔧 `PATCH  /spots/:spotId/aframe-scenes/:sceneId/hotspots/:hotspotId/activate` — `spotService.activateSceneHotspot`
- 🔧 `PATCH  /spots/:spotId/aframe-scenes/:sceneId/hotspots/:hotspotId/deactivate` — `spotService.deactivateSceneHotspot`
- 🔧 `DELETE /spots/:spotId/aframe-scenes/:sceneId/hotspots/:hotspotId` — `spotService.deleteSceneHotspot`

---

## 10. Hotspot trên Media VR (Spots)

- 🔧 `GET    /spots/:spotId/media/:mediaId/hotspots` — `spotService.getMediaHotspots`
- 🔧 `POST   /spots/:spotId/media/:mediaId/hotspots` — `spotService.createMediaHotspot`
- 🔧 `PATCH  /spots/:spotId/media/:mediaId/hotspots/:hotspotId` — `spotService.updateMediaHotspot`
- 🔧 `DELETE /spots/:spotId/media/:mediaId/hotspots/:hotspotId` — `spotService.deleteMediaHotspot`

---

## 11. Sức chứa điểm đến (Capacity)

- ✅ `GET    /capacity/current` — `capacityService.getCurrent` → `/capacity`
- ✅ `POST   /capacity/spots/:spotId/log` — `capacityService.log` → `/capacity`
- ✅ `PATCH  /capacity/spots/:spotId/settings` — `capacityService.updateSettings` → `/capacity`
- ✅ `GET    /capacity/stream` (SSE) — `capacityRealtimeService.subscribeCapacitySSE` → `useCapacityStore`
- ✅ WebSocket (`/ws?token=...`) — `capacityRealtimeService.connectCapacitySocket` → `useCapacityStore`
- 🔧 `GET    /capacity/current/geojson` — `capacityService.getCurrentGeoJSON`
- 🔧 `GET    /capacity/spots/:spotId/history` — `capacityService.getHistory`
- 🔧 `GET    /capacity/spots/:spotId/stats` — `capacityService.getStats`
- 🔧 `GET    /capacity/spots/:spotId/alternatives` — `capacityService.getAlternatives`
- 🔧 `GET    /capacity/configs` — `capacityService.getConfigs`
- 🔧 `POST   /capacity/configs` — `capacityService.saveConfig`

---

## 12. Tour du lịch (Tours)

- ✅ `GET    /tours` — `tourService.getAll` → `/tours`
- ✅ `GET    /tours/:id` — `tourService.getById` → `TourFormDialog`, `TourDetailDialog`
- ✅ `POST   /tours` — `tourService.create` → `/tours`
- ✅ `PATCH  /tours/:id` — `tourService.update` → `/tours`
- ✅ `DELETE /tours/:id` — `tourService.delete` → `/tours`
- 🔧 `GET    /tours/slug/:slug` — `tourService.getBySlug`
- 🔧 `GET    /tours/:id/stops` — `tourService.getStops`
- 🔧 `POST   /tours/:id/stops` — `tourService.addStop`
- 🔧 `PATCH  /tours/:tourId/stops/:stopId` — `tourService.updateStop`
- 🔧 `DELETE /tours/:tourId/stops/:stopId` — `tourService.deleteStop`

---

## 13. Lịch trình (Itineraries)

> Không có admin page. Tất cả endpoints phục vụ end-user app.

- 🔧 `GET    /itineraries/shared/:token` — `itineraryService.getShared`
- 🔧 `POST   /itineraries/ai-generate` — `itineraryService.aiGenerate`
- 🔧 `GET    /itineraries` — `itineraryService.getAll`
- 🔧 `POST   /itineraries` — `itineraryService.create`
- 🔧 `GET    /itineraries/:id` — `itineraryService.getById`
- 🔧 `PATCH  /itineraries/:id` — `itineraryService.update`
- 🔧 `DELETE /itineraries/:id` — `itineraryService.delete`
- 🔧 `POST   /itineraries/:id/share` — `itineraryService.share`
- 🔧 `DELETE /itineraries/:id/share` — `itineraryService.unshare`
- 🔧 `GET    /itineraries/:id/export/pdf` — `itineraryService.exportPDF`
- 🔧 `GET    /itineraries/:id/days` — `itineraryService.getDays`
- 🔧 `POST   /itineraries/:id/days` — `itineraryService.addDay`
- 🔧 `PATCH  /itineraries/:id/days/:dayId` — `itineraryService.updateDay`
- 🔧 `DELETE /itineraries/:id/days/:dayId` — `itineraryService.deleteDay`
- 🔧 `POST   /itineraries/:id/days/:dayId/stops` — `itineraryService.addStop`
- 🔧 `PATCH  /itineraries/:id/stops/:stopId` — `itineraryService.updateStop`
- 🔧 `DELETE /itineraries/:id/stops/:stopId` — `itineraryService.deleteStop`

---

## 14. Lễ hội (Festivals)

- ✅ `GET    /festivals` — `festivalService.getAll` → `/festivals`
- ✅ `GET    /festivals/:id` — `festivalService.getById` → `FestivalFormDialog`, `FestivalDetailDialog`
- ✅ `POST   /festivals` — `festivalService.create` → `/festivals`
- ✅ `PATCH  /festivals/:id` — `festivalService.update` → `/festivals`
- ✅ `DELETE /festivals/:id` — `festivalService.delete` → `/festivals`
- 🔧 `GET    /festivals/types` — `festivalService.getTypes`
- 🔧 `GET    /festivals/calendar` — `festivalService.getCalendar`

---

## 15. Ẩm thực (Culinary)

- ✅ `GET    /culinary` — `culinaryService.getAll` → `/culinary`
- ✅ `GET    /culinary/:id` — `culinaryService.getById` → `CulinaryFormDialog`, `CulinaryDetailDialog`
- ✅ `POST   /culinary` — `culinaryService.create` → `/culinary`
- ✅ `PATCH  /culinary/:id` — `culinaryService.update` → `/culinary`
- ✅ `DELETE /culinary/:id` — `culinaryService.delete` → `/culinary`
- 🔧 `GET    /culinary/categories` — `culinaryService.getCategories`

---

## 16. Sản phẩm OCOP

- ✅ `GET    /ocop` — `ocopService.getAll` → `/ocop`
- ✅ `GET    /ocop/:id` — `ocopService.getById` → `OcopFormDialog`, `OcopDetailDialog`
- ✅ `POST   /ocop` — `ocopService.create` → `/ocop`
- ✅ `PATCH  /ocop/:id` — `ocopService.update` → `/ocop`
- ✅ `DELETE /ocop/:id` — `ocopService.delete` → `/ocop`
- 🔧 `GET    /ocop/me` — `ocopService.getMe`
- 🔧 `GET    /ocop/categories` — `ocopService.getCategories`

---

## 17. Tin tức (News)

- ✅ `GET    /news/admin/all` — `newsService.getAllAdmin` → `/news`
- ✅ `GET    /news/admin/:id` — `newsService.getByIdAdmin` → `NewsFormDialog`, `NewsDetailDialog`
- ✅ `POST   /news` — `newsService.create` → `/news`
- ✅ `PATCH  /news/:id` — `newsService.update` → `/news`
- ✅ `PATCH  /news/admin/:id/publish` — `newsService.setPublished` → `/news`
- ✅ `DELETE /news/:id` — `newsService.delete` → `/news`
- ✅ `GET    /news/:newsId/comments` — `newsCommentService.getByNewsId` → `/news-comments`
- ✅ `POST   /news/:newsId/comments` — `newsCommentService.create` → `NewsCommentReplyDialog`
- ✅ `PATCH  /news/:newsId/comments/:commentId/approval` — `newsCommentService.setApproval` → `/news-comments`
- ✅ `DELETE /news/:newsId/comments/:commentId` — `newsCommentService.delete` → `/news-comments`
- 🔧 `GET    /news` — `newsService.getAll` — public list, chưa dùng trong admin
- 🔧 `GET    /news/:slug` — `newsService.getBySlug`
- 🔧 `PATCH  /news/:newsId/comments/:commentId` — `newsCommentService.update`

---

## 18. Vlog

- ✅ `GET    /vlogs/admin/all` — `vlogService.getAllAdmin` → `/vlogs`
- ✅ `PATCH  /vlogs/admin/:id/moderate` — `vlogService.moderate` → `/vlogs`
- ✅ `DELETE /vlogs/:id` — `vlogService.delete` → `/vlogs`
- 🔧 `GET    /vlogs` — `vlogService.getAll`
- 🔧 `GET    /vlogs/:id` — `vlogService.getById`
- 🔧 `GET    /vlogs/admin/:id` — `vlogService.getByIdAdmin`
- 🔧 `GET    /vlogs/:vlogId/comments` — `vlogService.getComments`
- 🔧 `GET    /vlogs/user/saved` — `vlogService.getSaved`
- 🔧 `POST   /vlogs` — `vlogService.create`
- 🔧 `PATCH  /vlogs/:id` — `vlogService.update`
- 🔧 `POST   /vlogs/:vlogId/comments` — `vlogService.createComment`
- 🔧 `DELETE /vlogs/:vlogId/comments/:commentId` — `vlogService.deleteComment`
- 🔧 `PUT    /vlogs/:id/like` — `vlogService.like`
- 🔧 `DELETE /vlogs/:id/like` — `vlogService.unlike`
- 🔧 `PUT    /vlogs/:id/save` — `vlogService.save`
- 🔧 `DELETE /vlogs/:id/save` — `vlogService.unsave`

---

## 19. Đánh giá (Ratings)

- ✅ `GET    /ratings` — `ratingService.getAll` → `/ratings`
- ✅ `PATCH  /ratings/:id/status` — `ratingService.setStatus` → `/ratings`
- ✅ `DELETE /ratings/:id` — `ratingService.delete` → `/ratings`
- 🔧 `POST   /ratings` — `ratingService.create`
- 🔧 `PATCH  /ratings/:id` — `ratingService.update`
- 🔧 `GET    /ratings/business/my` — `ratingService.getMyBusiness`
- 🔧 `POST   /ratings/:id/reply` — `ratingService.reply`
- 🔧 `POST   /ratings/:id/helpful` — `ratingService.markHelpful`

---

## 20. Doanh nghiệp (Businesses)

- ✅ `GET    /businesses` — `businessService.getAll` → `/businesses`, `/ratings`, `/governance/enterprise`
- ✅ `GET    /businesses/me` — `businessService.getMe` → `/governance/enterprise`
- ✅ `PATCH  /governance/department/registrations/businesses/:id` — `businessService.setApproval` → `/businesses`
- 🔧 `GET    /businesses/public` — `businessService.getPublic`
- 🔧 `POST   /businesses` — `businessService.create`
- 🔧 `GET    /businesses/:id` — `businessService.getById`
- 🔧 `PATCH  /businesses/:id` — `businessService.update`
- 🔧 `PATCH  /businesses/:id/status` — `businessService.updateStatus`
- 🔧 `GET    /businesses/:businessId/services` — `businessService.getServices`
- 🔧 `POST   /businesses/:businessId/services` — `businessService.createService`
- 🔧 `PATCH  /businesses/:businessId/services/:serviceId` — `businessService.updateService`
- 🔧 `DELETE /businesses/:businessId/services/:serviceId` — `businessService.deleteService`
- 🔧 `GET    /businesses/:businessId/vouchers` — `businessService.getVouchers`
- 🔧 `POST   /businesses/:businessId/vouchers` — `businessService.createVoucher`
- 🔧 `PATCH  /businesses/:businessId/vouchers/:voucherId` — `businessService.updateVoucher`
- 🔧 `DELETE /businesses/:businessId/vouchers/:voucherId` — `businessService.deleteVoucher`
- 🔧 `GET    /businesses/vouchers/nearby` — `businessService.getNearbyVouchers`
- 🔧 `POST   /businesses/vouchers/validate` — `businessService.validateVoucher`

---

## 21. Phản ánh người dân (Citizen Feedbacks)

- ✅ `GET    /feedbacks/admin/all` — `citizenFeedbackService.getAll` → `/feedbacks`
- ✅ `GET    /feedbacks/:id` — `citizenFeedbackService.getById` → `FeedbackDetailDialog`
- ✅ `PATCH  /feedbacks/:id/status` — `citizenFeedbackService.updateStatus` → `/feedbacks`
- ✅ `PATCH  /feedbacks/:id/moderation` — `citizenFeedbackService.updateModeration` → `/feedbacks`
- ✅ `DELETE /feedbacks/:id` — `citizenFeedbackService.delete` → `/feedbacks`
- 🔧 `GET    /feedbacks` — `citizenFeedbackService.getPublic`
- 🔧 `POST   /feedbacks` — `citizenFeedbackService.create`
- 🔧 `PUT    /feedbacks/:id` — `citizenFeedbackService.update`

---

## 22. Tìm kiếm (Search)

> Không có admin page. Phục vụ end-user app.

- 🔧 `GET /search/types` — `searchService.getTypes`
- 🔧 `GET /search` — `searchService.search`
- 🔧 `GET /search/spots` — `searchService.searchSpots`

---

## 23. Trợ lý ảo (Chatbot)

> Không có admin page. Phục vụ end-user app.

- 🔧 `POST   /chatbot/sessions` — `chatbotService.createSession`
- 🔧 `GET    /chatbot/sessions` — `chatbotService.getSessions`
- 🔧 `GET    /chatbot/sessions/:id` — `chatbotService.getSession`
- 🔧 `POST   /chatbot/sessions/:id/messages` — `chatbotService.sendMessage`
- 🔧 `DELETE /chatbot/sessions/:id` — `chatbotService.deleteSession`

---

## 24. Thông báo (Notifications)

- ✅ `GET    /notifications/me` — `notificationService.getMy` → `NotificationMenu` (layout)
- ✅ `GET    /notifications/unread-count` — `notificationService.getUnreadCount` → `NotificationMenu`
- ✅ `PATCH  /notifications/read-all` — `notificationService.markAllAsRead` → `NotificationMenu`
- ✅ `PATCH  /notifications/:id/read` — `notificationService.markAsRead` → `NotificationMenu`
- ✅ `DELETE /notifications/:id` — `notificationService.delete` → `NotificationMenu`
- 🔧 `POST   /notifications` — `notificationService.send` — gửi thông báo, chưa có trang admin
- 🔧 `DELETE /notifications` — `notificationService.deleteAll`

---

## 25. Phiên AR (AR Sessions)

> Không có admin page. Phục vụ end-user app.

- 🔧 `POST /ar-sessions` — `arSessionService.create`
- 🔧 `GET  /ar-sessions/my` — `arSessionService.getMy`
- 🔧 `GET  /ar-sessions/stats` — `arSessionService.getStats`
- 🔧 `GET  /ar-sessions/spots/:spotId` — `arSessionService.getBySpot`
- 🔧 `GET  /ar-sessions/:id` — `arSessionService.getById`

---

## 26. GPS Tracking

> Không có admin page. Phục vụ end-user app.

- 🔧 `POST  /gps/start` — `gpsService.start`
- 🔧 `POST  /gps/:trackId/sync` — `gpsService.sync`
- 🔧 `PATCH /gps/:trackId/end` — `gpsService.end`

---

## 27. Bản đồ Offline

> Không có admin page.

- 🔧 `POST   /offline/download` — `offlineMapService.download`
- 🔧 `GET    /offline` — `offlineMapService.getAll`
- 🔧 `GET    /offline/:id` — `offlineMapService.getById`
- 🔧 `DELETE /offline/:id` — `offlineMapService.delete`

---

## 28. Đo đạc bản đồ (Map Measure)

> Không có admin page.

- 🔧 `POST /map/measure/distance` — `mapMeasureService.measureDistance`
- 🔧 `POST /map/measure/area` — `mapMeasureService.measureArea`

---

## 29. Quản trị bản đồ (Map Admin)

### Danh mục (Categories)
- ✅ `GET    /map-admin/categories` — `mapAdminCategoryService.getAll` → `CategorySelectField` (dùng trong MapLayerApiListPage, form dialogs)
- 🔧 `POST   /map-admin/categories` — `mapAdminCategoryService.create`
- 🔧 `PATCH  /map-admin/categories/:id` — `mapAdminCategoryService.update`
- 🔧 `DELETE /map-admin/categories/:id` — `mapAdminCategoryService.delete`

### Lớp bản đồ (Layers)
- ✅ `GET    /map-admin/layers` — `mapLayerService.getAll` → `/map-layers`
- ✅ `PATCH  /map-admin/layers/:id/toggle` — `mapLayerService.toggle` → `/map-layers`
- 🔧 `POST   /map-admin/layers` — `mapLayerService.create`
- 🔧 `PATCH  /map-admin/layers/:id` — `mapLayerService.update`
- 🔧 `DELETE /map-admin/layers/:id` — `mapLayerService.delete`

### Map Layer APIs
- ✅ `GET    /map-admin/apis` — `mapLayerApiService.getAll` → `/map-layer-apis`
- ✅ `GET    /map-admin/apis/:id` — `mapLayerApiService.getById` → `MapLayerApiFormDialog`, `MapLayerApiDetailDialog`
- ✅ `POST   /map-admin/apis` — `mapLayerApiService.create` → `MapLayerApiFormDialog`
- ✅ `PATCH  /map-admin/apis/:id` — `mapLayerApiService.update` → `MapLayerApiFormDialog`
- ✅ `DELETE /map-admin/apis/:id` — `mapLayerApiService.delete` → `/map-layer-apis`
- ✅ `GET    /map-admin/apis/:id/permissions` — `mapLayerApiService.getPermissions` → `PermissionsTab`
- ✅ `PUT    /map-admin/apis/:id/permissions` — `mapLayerApiService.setPermission` → `PermissionsTab`
- ✅ `DELETE /map-admin/apis/:id/permissions/:permId` — `mapLayerApiService.deletePermission` → `PermissionsTab`
- 🔧 `POST   /map-admin/apis/:id/permissions` — `mapLayerApiService.addPermission`

### API Keys
- ✅ `GET    /map-admin/api-keys` — `mapLayerApiService.getApiKeys` → `ApiKeysTab`
- ✅ `POST   /map-admin/api-keys` — `mapLayerApiService.createApiKey` → `ApiKeysTab`
- ✅ `PATCH  /map-admin/api-keys/:id/revoke` — `mapLayerApiService.revokeApiKey` → `ApiKeysTab`
- 🔧 `GET    /map-admin/api-keys/:id` — `mapLayerApiService.getApiKeyById`
- 🔧 `DELETE /map-admin/api-keys/:id` — `mapLayerApiService.deleteApiKey`

---

## 30. Dữ liệu bản đồ (Map Data - API Key)

- ✅ `GET /map-data/apis` — `mapDataService.getApis` → `MapLayerApiPublicPage` (public test page)
- ✅ `GET /map-data/layers` — `mapDataService.getLayers` → `MapLayerApiPublicPage`
- ✅ `GET /map-data/apis/:apiId/data` — `mapDataService.getApiData` → `MapLayerApiPublicPage`

---

## 31. Tích hợp bên thứ 3 (Integrations)

- ✅ `GET    /integrations` — `integrationService.getAll` → `/integrations`
- ✅ `POST   /integrations` — `integrationService.create` → `/integrations`
- ✅ `PATCH  /integrations/:id` — `integrationService.update` → `/integrations`
- ✅ `DELETE /integrations/:id` — `integrationService.delete` → `/integrations`
- ✅ `POST   /integrations/:id/sync` — `integrationService.sync` → `/integrations`
- ✅ `GET    /integrations/:id/logs` — `integrationService.getLogs` → `/integrations`
- 🔧 `GET    /integrations/:id` — `integrationService.getById`

---

## 32. Quản trị nâng cao (Governance)

- ✅ `GET    /governance/admin/dashboard` — `governanceService.getDashboard` → `/governance/admin`
- ✅ `GET    /governance/admin/traffic` — `governanceService.getTraffic` → `/governance/admin`
- ✅ `GET    /governance/admin/permissions` — `governanceService.getPermissions` → `/governance/admin`
- ✅ `POST   /governance/admin/permissions` — `governanceService.createPermission` → `/governance/admin`
- ✅ `GET    /governance/admin/roles/:roleId/permissions` — `governanceService.getRolePermissions` → `/governance/admin`
- ✅ `PUT    /governance/admin/roles/:roleId/permissions` — `governanceService.setRolePermissions` → `/governance/admin`
- ✅ `GET    /governance/ministry/overview` — `governanceService.getMinistryOverview` → `/governance/ministry`
- ✅ `GET    /governance/ministry/capacity-alerts` — `governanceService.getMinistryCapacityAlerts` → `/governance/ministry`
- ✅ `GET    /governance/ministry/conservation-summary` — `governanceService.getMinistryConservationSummary` → `/governance/ministry`
- ✅ `GET    /governance/department/registrations/businesses` — `governanceService.getDepartmentBusinessRegistrations` → `/governance/department`
- ✅ `GET    /governance/department/registrations/spots` — `governanceService.getDepartmentSpotRegistrations` → `/governance/department`
- ✅ `PATCH  /governance/department/registrations/spots/:id` — `governanceService.approveDepartmentSpot` → `/governance/department`
- ✅ `GET    /governance/department/feedbacks` — `governanceService.getDepartmentFeedbacks` → `/governance/department`
- ✅ `GET    /governance/department/reports` — `governanceService.getDepartmentReports` → `/governance/department`
- ✅ `POST   /governance/department/reports` — `governanceService.createDepartmentReport` → `/governance/department`
- ✅ `POST   /governance/department/reports/:id/send` — `governanceService.sendDepartmentReport` → `/governance/department`
- ✅ `GET    /governance/department/capacity-alerts` — `governanceService.getDepartmentCapacityAlerts` → `/governance/department`
- ✅ `GET    /governance/department/conservation-summary` — `governanceService.getDepartmentConservationSummary` → `/governance/department`
- ✅ `GET    /governance/enterprise/businesses/:id/dashboard` — `governanceService.getEnterpriseDashboard` → `/governance/enterprise`
- ✅ `GET    /governance/enterprise/businesses/:id/feedbacks` — `governanceService.getEnterpriseFeedbacks` → `/governance/enterprise`
- ✅ `GET    /governance/enterprise/reports` — `governanceService.getEnterpriseReports` → `/governance/enterprise`
- ✅ `POST   /governance/enterprise/reports` — `governanceService.createEnterpriseReport` → `/governance/enterprise`
- 🔧 `PATCH  /governance/enterprise/businesses/:id` — `governanceService.updateEnterpriseBusiness`
- 🔧 `PATCH  /governance/department/registrations/businesses/:id` — trùng với `businessService.setApproval` (dùng ở `/businesses`)

---

## 33. Thống kê & Báo cáo (Statistics)

> Không có admin page.

- 🔧 `GET /statistics/data-files` — `statisticsService.getDataFiles`
- 🔧 `GET /statistics/data-files/download/:filename` — `statisticsService.downloadFile`

---

## 34. Ảnh vệ tinh (Satellite)

> Không có admin page.

- 🔧 `POST /satellite/rgb` — `satelliteService.getRGB`
- 🔧 `POST /satellite/ndvi` — `satelliteService.getNDVI`
- 🔧 `POST /satellite/heat-map` — `satelliteService.getHeatMap`
- 🔧 `POST /satellite/classified` — `satelliteService.getClassified`
- 🔧 `POST /satellite/compare` — `satelliteService.compare`
- 🔧 `POST /satellite/change` — `satelliteService.detectChange`

---

## Tổng kết

| Trạng thái | Số endpoint |
|------------|-------------|
| ✅ Đang dùng trong admin | ~75 |
| 🔧 Có service, chưa dùng trong admin | ~105 |
| ❌ Chưa có service | 0 |

### Nhóm chưa có trang admin đáng chú ý

| Nhóm | Endpoint đại diện | Ghi chú |
|------|-------------------|---------|
| Spot Media & VR | `/spots/:id/media`, `/spots/:id/aframe-scenes` | Quản lý ảnh/video/VR của điểm đến |
| Capacity nâng cao | `/capacity/spots/:id/history`, `/capacity/configs` | Lịch sử + cấu hình cảnh báo |
| Tour Stops | `/tours/:id/stops` | Quản lý điểm dừng trong tour |
| Business detail | `/businesses/:id/services`, `/businesses/:id/vouchers` | Dịch vụ + voucher của doanh nghiệp |
| Map Admin Categories | `/map-admin/categories` (CRUD) | Chỉ có GET được dùng qua `CategorySelectField` |
| Map Layers CRUD | `/map-admin/layers` (POST/PATCH/DELETE) | Trang `/map-layers` chỉ list + toggle |
| 2FA | `/auth/2fa/*` | Quản lý xác thực 2 yếu tố |
| Statistics | `/statistics/data-files` | File dữ liệu thống kê |
| Satellite | `/satellite/*` | Ảnh vệ tinh / phân tích rừng |
| User unlock/batch | `/users/:id/lock` (DELETE), `/users/batch` | Mở khoá, xoá hàng loạt |
