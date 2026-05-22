# Service Audit Report

## A. Tong quan
- Da doc: `DuLichNinhBinh API.postman_collection.json`, `docs/standard-service-flow.md`, `capacity-realtime-fe.md`.
- File `.github/nb_renew.admin.instructions.md` khong ton tai trong workspace hien tai.
- So API groups trong Postman: 34.
- Tong endpoint Postman: 296.
- Endpoint da map service: 295.
- Service file moi tao: 16.
- Service file cap nhat: 18.
- Realtime da tao: `capacityService`, `capacityRealtimeService`, `useCapacityStore`.

## B. Bang doi chieu API -> Service

| API Group | Method | Endpoint | Service Function | File | Status |
|---|---|---|---|---|---|
| 1. Sức khoẻ hệ thống (Health) | GET | /health | check | src/service/healthService.ts | CREATED |
| 10. Hotspot trên Media VR (Spots) | DELETE | /spots/{{spotId}}/media/{{mediaId}}/hotspots/{{hotspotId}} | deleteMediaHotspot | src/service/spotService.ts | UPDATED |
| 10. Hotspot trên Media VR (Spots) | GET | /spots/{{spotId}}/media/{{mediaId}}/hotspots | getMediaHotspots | src/service/spotService.ts | UPDATED |
| 10. Hotspot trên Media VR (Spots) | PATCH | /spots/{{spotId}}/media/{{mediaId}}/hotspots/{{hotspotId}} | updateMediaHotspot | src/service/spotService.ts | UPDATED |
| 10. Hotspot trên Media VR (Spots) | POST | /spots/{{spotId}}/media/{{mediaId}}/hotspots | createMediaHotspot | src/service/spotService.ts | UPDATED |
| 11. Sức chứa điểm đến (Capacity) | GET | /capacity/configs | getConfigs | src/service/capacityService.ts | CREATED |
| 11. Sức chứa điểm đến (Capacity) | GET | /capacity/current | getCurrent | src/service/capacityService.ts | CREATED |
| 11. Sức chứa điểm đến (Capacity) | GET | /capacity/current/geojson | getCurrentGeoJSON | src/service/capacityService.ts | CREATED |
| 11. Sức chứa điểm đến (Capacity) | GET | /capacity/spots/{{spotId}}/alternatives | getAlternatives | src/service/capacityService.ts | CREATED |
| 11. Sức chứa điểm đến (Capacity) | GET | /capacity/spots/{{spotId}}/history | getHistory | src/service/capacityService.ts | CREATED |
| 11. Sức chứa điểm đến (Capacity) | GET | /capacity/spots/{{spotId}}/stats | getStats | src/service/capacityService.ts | CREATED |
| 11. Sức chứa điểm đến (Capacity) | GET | /capacity/stream |  | src/service/capacityRealtimeService.ts | CREATED |
| 11. Sức chứa điểm đến (Capacity) | PATCH | /capacity/spots/:spotId/settings | updateSettings | src/service/capacityService.ts | CREATED |
| 11. Sức chứa điểm đến (Capacity) | POST | /capacity/configs | saveConfig | src/service/capacityService.ts | CREATED |
| 11. Sức chứa điểm đến (Capacity) | POST | /capacity/spots/{{spotId}}/log | log | src/service/capacityService.ts | CREATED |
| 12. Tour du lịch (Tours) | DELETE | /tours/{{tourId}} | delete | src/service/tourService.ts | CREATED |
| 12. Tour du lịch (Tours) | DELETE | /tours/{{tourId}}/stops/{{stopId}} | deleteStop | src/service/tourService.ts | CREATED |
| 12. Tour du lịch (Tours) | GET | /tours | getAll | src/service/tourService.ts | CREATED |
| 12. Tour du lịch (Tours) | GET | /tours/{{tourId}} | getById | src/service/tourService.ts | CREATED |
| 12. Tour du lịch (Tours) | GET | /tours/{{tourId}}/stops | getStops | src/service/tourService.ts | CREATED |
| 12. Tour du lịch (Tours) | GET | /tours/slug/:slug | getBySlug | src/service/tourService.ts | CREATED |
| 12. Tour du lịch (Tours) | PATCH | /tours/{{tourId}} | update | src/service/tourService.ts | CREATED |
| 12. Tour du lịch (Tours) | PATCH | /tours/{{tourId}}/stops/{{stopId}} | updateStop | src/service/tourService.ts | CREATED |
| 12. Tour du lịch (Tours) | POST | /tours | create | src/service/tourService.ts | CREATED |
| 12. Tour du lịch (Tours) | POST | /tours/{{tourId}}/stops | addStop | src/service/tourService.ts | CREATED |
| 13. Lịch trình (Itineraries) | DELETE | /itineraries/{{itineraryId}} | delete | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | DELETE | /itineraries/{{itineraryId}}/days/{{dayId}} | deleteDay | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | DELETE | /itineraries/{{itineraryId}}/share | unshare | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | DELETE | /itineraries/{{itineraryId}}/stops/{{stopId}} | deleteStop | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | GET | /itineraries | getAll | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | GET | /itineraries/{{itineraryId}} | getById | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | GET | /itineraries/{{itineraryId}}/days | getDays | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | GET | /itineraries/{{itineraryId}}/export/pdf | exportPDF | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | GET | /itineraries/shared/:token | getShared | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | PATCH | /itineraries/{{itineraryId}} | update | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | PATCH | /itineraries/{{itineraryId}}/days/{{dayId}} | updateDay | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | PATCH | /itineraries/{{itineraryId}}/stops/{{stopId}} | updateStop | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | POST | /itineraries | create | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | POST | /itineraries/{{itineraryId}}/days | addDay | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | POST | /itineraries/{{itineraryId}}/days/{{dayId}}/stops | addStop | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | POST | /itineraries/{{itineraryId}}/share | share | src/service/itineraryService.ts | CREATED |
| 13. Lịch trình (Itineraries) | POST | /itineraries/ai-generate | aiGenerate | src/service/itineraryService.ts | CREATED |
| 14. Lễ hội (Festivals) | DELETE | /festivals/{{festivalId}} | delete | src/service/festivalService.ts | UPDATED |
| 14. Lễ hội (Festivals) | GET | /festivals | getAll | src/service/festivalService.ts | UPDATED |
| 14. Lễ hội (Festivals) | GET | /festivals/{{festivalId}} | getById | src/service/festivalService.ts | UPDATED |
| 14. Lễ hội (Festivals) | GET | /festivals/calendar | getCalendar | src/service/festivalService.ts | UPDATED |
| 14. Lễ hội (Festivals) | GET | /festivals/types | getTypes | src/service/festivalService.ts | UPDATED |
| 14. Lễ hội (Festivals) | PATCH | /festivals/{{festivalId}} | update | src/service/festivalService.ts | UPDATED |
| 14. Lễ hội (Festivals) | POST | /festivals | create | src/service/festivalService.ts | UPDATED |
| 15. Ẩm thực (Culinary) | DELETE | /culinary/{{culinaryId}} | delete | src/service/culinaryService.ts | UPDATED |
| 15. Ẩm thực (Culinary) | GET | /culinary | getAll | src/service/culinaryService.ts | UPDATED |
| 15. Ẩm thực (Culinary) | GET | /culinary/{{culinaryId}} | getById | src/service/culinaryService.ts | UPDATED |
| 15. Ẩm thực (Culinary) | GET | /culinary/categories | getCategories | src/service/culinaryService.ts | UPDATED |
| 15. Ẩm thực (Culinary) | PATCH | /culinary/{{culinaryId}} | update | src/service/culinaryService.ts | UPDATED |
| 15. Ẩm thực (Culinary) | POST | /culinary | create | src/service/culinaryService.ts | UPDATED |
| 16. Sản phẩm OCOP | DELETE | /ocop/{{ocopId}} | delete | src/service/ocopService.ts | UPDATED |
| 16. Sản phẩm OCOP | GET | /ocop | getAll | src/service/ocopService.ts | UPDATED |
| 16. Sản phẩm OCOP | GET | /ocop/{{ocopId}} | getMe | src/service/ocopService.ts | UPDATED |
| 16. Sản phẩm OCOP | GET | /ocop/categories | getCategories | src/service/ocopService.ts | UPDATED |
| 16. Sản phẩm OCOP | GET | /ocop/me | getMe | src/service/ocopService.ts | UPDATED |
| 16. Sản phẩm OCOP | PATCH | /ocop/{{ocopId}} | update | src/service/ocopService.ts | UPDATED |
| 16. Sản phẩm OCOP | POST | /ocop | create | src/service/ocopService.ts | UPDATED |
| 17. Tin tức (News) | DELETE | /news/{{newsId}} | delete | src/service/newsService.ts | UPDATED |
| 17. Tin tức (News) | DELETE | /news/{{newsId}}/comments/{{commentId}} | delete | src/service/newsCommentService.ts | UPDATED |
| 17. Tin tức (News) | GET | /news | getAll | src/service/newsService.ts | UPDATED |
| 17. Tin tức (News) | GET | /news/:slug | getBySlug | src/service/newsService.ts | UPDATED |
| 17. Tin tức (News) | GET | /news/{{newsId}}/comments | getByNewsId | src/service/newsCommentService.ts | UPDATED |
| 17. Tin tức (News) | GET | /news/admin/{{newsId}} | getAllAdmin | src/service/newsService.ts | UPDATED |
| 17. Tin tức (News) | GET | /news/admin/all | getAllAdmin | src/service/newsService.ts | UPDATED |
| 17. Tin tức (News) | PATCH | /news/{{newsId}} | update | src/service/newsService.ts | UPDATED |
| 17. Tin tức (News) | PATCH | /news/{{newsId}}/comments/{{commentId}} | update | src/service/newsCommentService.ts | UPDATED |
| 17. Tin tức (News) | PATCH | /news/{{newsId}}/comments/{{commentId}}/approval | setApproval | src/service/newsCommentService.ts | UPDATED |
| 17. Tin tức (News) | PATCH | /news/admin/{{newsId}}/publish | setPublished | src/service/newsService.ts | UPDATED |
| 17. Tin tức (News) | POST | /news | create | src/service/newsService.ts | UPDATED |
| 17. Tin tức (News) | POST | /news/{{newsId}}/comments | create | src/service/newsCommentService.ts | UPDATED |
| 18. Vlog | DELETE | /vlogs/{{vlogId}} | delete | src/service/vlogService.ts | UPDATED |
| 18. Vlog | DELETE | /vlogs/{{vlogId}}/comments/{{commentId}} | deleteComment | src/service/vlogService.ts | UPDATED |
| 18. Vlog | DELETE | /vlogs/{{vlogId}}/like | unlike | src/service/vlogService.ts | UPDATED |
| 18. Vlog | DELETE | /vlogs/{{vlogId}}/save | unsave | src/service/vlogService.ts | UPDATED |
| 18. Vlog | GET | /vlogs | getAll | src/service/vlogService.ts | UPDATED |
| 18. Vlog | GET | /vlogs/{{vlogId}} | getById | src/service/vlogService.ts | UPDATED |
| 18. Vlog | GET | /vlogs/{{vlogId}}/comments | getComments | src/service/vlogService.ts | UPDATED |
| 18. Vlog | GET | /vlogs/admin/{{vlogId}} | getAllAdmin | src/service/vlogService.ts | UPDATED |
| 18. Vlog | GET | /vlogs/admin/all | getAllAdmin | src/service/vlogService.ts | UPDATED |
| 18. Vlog | GET | /vlogs/user/saved | getSaved | src/service/vlogService.ts | UPDATED |
| 18. Vlog | PATCH | /vlogs/{{vlogId}} | update | src/service/vlogService.ts | UPDATED |
| 18. Vlog | PATCH | /vlogs/admin/{{vlogId}}/moderate | moderate | src/service/vlogService.ts | UPDATED |
| 18. Vlog | POST | /vlogs | create | src/service/vlogService.ts | UPDATED |
| 18. Vlog | POST | /vlogs/{{vlogId}}/comments | createComment | src/service/vlogService.ts | UPDATED |
| 18. Vlog | PUT | /vlogs/{{vlogId}}/like | like | src/service/vlogService.ts | UPDATED |
| 18. Vlog | PUT | /vlogs/{{vlogId}}/save | save | src/service/vlogService.ts | UPDATED |
| 19. Đánh giá (Ratings) | DELETE | /ratings/{{ratingId}} | delete | src/service/ratingService.ts | UPDATED |
| 19. Đánh giá (Ratings) | GET | /ratings | getAll | src/service/ratingService.ts | UPDATED |
| 19. Đánh giá (Ratings) | GET | /ratings/business/my | getMyBusiness | src/service/ratingService.ts | UPDATED |
| 19. Đánh giá (Ratings) | PATCH | /ratings/{{ratingId}} | update | src/service/ratingService.ts | UPDATED |
| 19. Đánh giá (Ratings) | PATCH | /ratings/{{ratingId}}/status | setStatus | src/service/ratingService.ts | UPDATED |
| 19. Đánh giá (Ratings) | POST | /ratings | create | src/service/ratingService.ts | UPDATED |
| 19. Đánh giá (Ratings) | POST | /ratings/{{ratingId}}/helpful | markHelpful | src/service/ratingService.ts | UPDATED |
| 19. Đánh giá (Ratings) | POST | /ratings/{{ratingId}}/reply | reply | src/service/ratingService.ts | UPDATED |
| 2. Xác thực (Auth) | GET | /auth/2fa/status | get2FAStatus | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | GET | /auth/google | googleLogin | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | GET | /auth/google/callback | googleCallback | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | GET | /auth/me | getProfile | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | GET | /auth/verify-email/:token | verifyEmail | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | POST | /auth/2fa/disable | disable2FA | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | POST | /auth/2fa/enable | enable2FA | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | POST | /auth/2fa/setup | setup2FA | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | POST | /auth/2fa/verify-login | verify2FALogin | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | POST | /auth/change-password | changePassword | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | POST | /auth/forgot-password | forgotPassword | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | POST | /auth/login | login | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | POST | /auth/logout | logout | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | POST | /auth/refresh | refreshToken | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | POST | /auth/register | register | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | POST | /auth/reset-password | resetPassword | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | POST | /auth/verify-email/send | sendVerificationEmail | src/service/authService.ts | UPDATED |
| 2. Xác thực (Auth) | PUT | /auth/me | updateProfile | src/service/authService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | DELETE | /businesses/{{businessId}}/services/{{serviceId}} | deleteService | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | DELETE | /businesses/{{businessId}}/vouchers/{{voucherId}} | deleteVoucher | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | GET | /businesses | getAll | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | GET | /businesses/{{businessId}} | getMe | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | GET | /businesses/{{businessId}}/services | getServices | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | GET | /businesses/{{businessId}}/vouchers | getVouchers | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | GET | /businesses/me | getMe | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | GET | /businesses/public | getPublic | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | GET | /businesses/vouchers/nearby | getNearbyVouchers | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | PATCH | /businesses/{{businessId}} | update | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | PATCH | /businesses/{{businessId}}/services/{{serviceId}} | updateService | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | PATCH | /businesses/{{businessId}}/status | updateStatus | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | PATCH | /businesses/{{businessId}}/vouchers/{{voucherId}} | updateVoucher | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | POST | /businesses | create | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | POST | /businesses/{{businessId}}/services | createService | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | POST | /businesses/{{businessId}}/vouchers | createVoucher | src/service/businessService.ts | UPDATED |
| 20. Doanh nghiệp (Businesses) | POST | /businesses/vouchers/validate | validateVoucher | src/service/businessService.ts | UPDATED |
| 21. Phản ánh người dân (Citizen Feedbacks) | DELETE | /feedbacks/{{feedbackId}} | delete | src/service/citizenFeedbackService.ts | UPDATED |
| 21. Phản ánh người dân (Citizen Feedbacks) | GET | /feedbacks | getPublic | src/service/citizenFeedbackService.ts | UPDATED |
| 21. Phản ánh người dân (Citizen Feedbacks) | GET | /feedbacks/{{feedbackId}} | getById | src/service/citizenFeedbackService.ts | UPDATED |
| 21. Phản ánh người dân (Citizen Feedbacks) | GET | /feedbacks/admin/all | getAll | src/service/citizenFeedbackService.ts | UPDATED |
| 21. Phản ánh người dân (Citizen Feedbacks) | PATCH | /feedbacks/{{feedbackId}}/moderation | updateModeration | src/service/citizenFeedbackService.ts | UPDATED |
| 21. Phản ánh người dân (Citizen Feedbacks) | PATCH | /feedbacks/{{feedbackId}}/status | updateStatus | src/service/citizenFeedbackService.ts | UPDATED |
| 21. Phản ánh người dân (Citizen Feedbacks) | POST | /feedbacks | create | src/service/citizenFeedbackService.ts | UPDATED |
| 21. Phản ánh người dân (Citizen Feedbacks) | PUT | /feedbacks/{{feedbackId}} | update | src/service/citizenFeedbackService.ts | UPDATED |
| 22. Tìm kiếm (Search) | GET | /search | search | src/service/searchService.ts | CREATED |
| 22. Tìm kiếm (Search) | GET | /search/spots | searchSpots | src/service/searchService.ts | CREATED |
| 22. Tìm kiếm (Search) | GET | /search/types | getTypes | src/service/searchService.ts | CREATED |
| 23. Trợ lý ảo (Chatbot) | DELETE | /chatbot/sessions/{{sessionId}} | deleteSession | src/service/chatbotService.ts | CREATED |
| 23. Trợ lý ảo (Chatbot) | GET | /chatbot/sessions | getSessions | src/service/chatbotService.ts | CREATED |
| 23. Trợ lý ảo (Chatbot) | GET | /chatbot/sessions/{{sessionId}} | getSession | src/service/chatbotService.ts | CREATED |
| 23. Trợ lý ảo (Chatbot) | POST | /chatbot/sessions | createSession | src/service/chatbotService.ts | CREATED |
| 23. Trợ lý ảo (Chatbot) | POST | /chatbot/sessions/{{sessionId}}/messages | sendMessage | src/service/chatbotService.ts | CREATED |
| 24. Thông báo (Notifications) | DELETE | /notifications | deleteAll | src/service/notificationService.ts | UPDATED |
| 24. Thông báo (Notifications) | DELETE | /notifications/{{notificationId}} | delete | src/service/notificationService.ts | UPDATED |
| 24. Thông báo (Notifications) | GET | /notifications/me | getMy | src/service/notificationService.ts | UPDATED |
| 24. Thông báo (Notifications) | GET | /notifications/unread-count | getUnreadCount | src/service/notificationService.ts | UPDATED |
| 24. Thông báo (Notifications) | PATCH | /notifications/{{notificationId}}/read | markAsRead | src/service/notificationService.ts | UPDATED |
| 24. Thông báo (Notifications) | PATCH | /notifications/read-all | markAllAsRead | src/service/notificationService.ts | UPDATED |
| 24. Thông báo (Notifications) | POST | /notifications | send | src/service/notificationService.ts | UPDATED |
| 25. Phiên AR (AR Sessions) | GET | /ar-sessions/{{arSessionId}} | getMy | src/service/arSessionService.ts | CREATED |
| 25. Phiên AR (AR Sessions) | GET | /ar-sessions/my | getMy | src/service/arSessionService.ts | CREATED |
| 25. Phiên AR (AR Sessions) | GET | /ar-sessions/spots/{{spotId}} | getBySpot | src/service/arSessionService.ts | CREATED |
| 25. Phiên AR (AR Sessions) | GET | /ar-sessions/stats | getStats | src/service/arSessionService.ts | CREATED |
| 25. Phiên AR (AR Sessions) | POST | /ar-sessions | create | src/service/arSessionService.ts | CREATED |
| 26. GPS Tracking | PATCH | /gps/{{trackId}}/end | end | src/service/gpsService.ts | CREATED |
| 26. GPS Tracking | POST | /gps/{{trackId}}/sync | sync | src/service/gpsService.ts | CREATED |
| 26. GPS Tracking | POST | /gps/start | start | src/service/gpsService.ts | CREATED |
| 27. Bản đồ Offline (Offline) | DELETE | /offline/{{offlineMapId}} | delete | src/service/offlineMapService.ts | CREATED |
| 27. Bản đồ Offline (Offline) | GET | /offline | getAll | src/service/offlineMapService.ts | CREATED |
| 27. Bản đồ Offline (Offline) | GET | /offline/{{offlineMapId}} | getById | src/service/offlineMapService.ts | CREATED |
| 27. Bản đồ Offline (Offline) | POST | /offline/download | download | src/service/offlineMapService.ts | CREATED |
| 28. Đo đạc bản đồ (Map Measure) | POST | /map/measure/area | measureArea | src/service/mapMeasureService.ts | CREATED |
| 28. Đo đạc bản đồ (Map Measure) | POST | /map/measure/distance | measureDistance | src/service/mapMeasureService.ts | CREATED |
| 29. Quản trị bản đồ (Map Admin) | DELETE | /map-admin/apis/{{mapApiId}} | delete | src/service/mapLayerApiService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | DELETE | /map-admin/apis/{{mapApiId}}/permissions/{{permissionId}} | deletePermission | src/service/mapLayerApiService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | DELETE | /map-admin/categories/{{mapCategoryId}} | delete | src/service/mapAdminCategoryService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | DELETE | /map-admin/layers/{{mapLayerId}} | delete | src/service/mapLayerService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | GET | /map-admin/api-keys | getApiKeys | src/service/mapLayerApiService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | GET | /map-admin/apis | getAll | src/service/mapLayerApiService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | GET | /map-admin/apis/{{mapApiId}}/permissions | getPermissions | src/service/mapLayerApiService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | GET | /map-admin/categories | getAll | src/service/mapAdminCategoryService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | GET | /map-admin/layers | getAll | src/service/mapLayerService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | PATCH | /map-admin/api-keys/{{apiKeyId}}/revoke | revokeApiKey | src/service/mapLayerApiService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | PATCH | /map-admin/apis/{{mapApiId}} | update | src/service/mapLayerApiService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | PATCH | /map-admin/categories/{{mapCategoryId}} | update | src/service/mapAdminCategoryService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | PATCH | /map-admin/layers/{{mapLayerId}} | update | src/service/mapLayerService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | PATCH | /map-admin/layers/{{mapLayerId}}/toggle | toggle | src/service/mapLayerService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | POST | /map-admin/api-keys | createApiKey | src/service/mapLayerApiService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | POST | /map-admin/apis | create | src/service/mapLayerApiService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | POST | /map-admin/categories | create | src/service/mapAdminCategoryService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | POST | /map-admin/layers | create | src/service/mapLayerService.ts | UPDATED |
| 29. Quản trị bản đồ (Map Admin) | PUT | /map-admin/apis/{{mapApiId}}/permissions | setPermission | src/service/mapLayerApiService.ts | UPDATED |
| 3. Người dùng (Users) | DELETE | /users/{{userId}} | delete | src/service/userService.ts | UPDATED |
| 3. Người dùng (Users) | DELETE | /users/{{userId}}/lock | unlock | src/service/userService.ts | UPDATED |
| 3. Người dùng (Users) | DELETE | /users/batch | batchDelete | src/service/userService.ts | UPDATED |
| 3. Người dùng (Users) | GET | /users | getAll | src/service/userService.ts | UPDATED |
| 3. Người dùng (Users) | GET | /users/{{userId}} | getById | src/service/userService.ts | UPDATED |
| 3. Người dùng (Users) | POST | /users | create | src/service/userService.ts | UPDATED |
| 3. Người dùng (Users) | PUT | /users/{{userId}} | update | src/service/userService.ts | UPDATED |
| 3. Người dùng (Users) | PUT | /users/{{userId}}/lock | lock | src/service/userService.ts | UPDATED |
| 3. Người dùng (Users) | PUT | /users/{{userId}}/role | assignRole | src/service/userService.ts | UPDATED |
| 30. Dữ liệu bản đồ (Map Data - API Key) | GET | /map-data/apis | getApis | src/service/mapDataService.ts | CREATED |
| 30. Dữ liệu bản đồ (Map Data - API Key) | GET | /map-data/apis/:apiId/data | getApiData | src/service/mapDataService.ts | CREATED |
| 30. Dữ liệu bản đồ (Map Data - API Key) | GET | /map-data/layers | getLayers | src/service/mapDataService.ts | CREATED |
| 31. Tích hợp bên thứ 3 (Integrations) | DELETE | /integrations/{{integrationId}} | delete | src/service/integrationService.ts | CREATED |
| 31. Tích hợp bên thứ 3 (Integrations) | GET | /integrations | getAll | src/service/integrationService.ts | CREATED |
| 31. Tích hợp bên thứ 3 (Integrations) | GET | /integrations/{{integrationId}} | getById | src/service/integrationService.ts | CREATED |
| 31. Tích hợp bên thứ 3 (Integrations) | GET | /integrations/{{integrationId}}/logs | getLogs | src/service/integrationService.ts | CREATED |
| 31. Tích hợp bên thứ 3 (Integrations) | PATCH | /integrations/{{integrationId}} | update | src/service/integrationService.ts | CREATED |
| 31. Tích hợp bên thứ 3 (Integrations) | POST | /integrations | create | src/service/integrationService.ts | CREATED |
| 31. Tích hợp bên thứ 3 (Integrations) | POST | /integrations/{{integrationId}}/sync | sync | src/service/integrationService.ts | CREATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/admin/dashboard | getDashboard | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/admin/permissions | getPermissions | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/admin/roles/{{roleId}}/permissions | getRolePermissions | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/admin/traffic | getTraffic | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/department/capacity-alerts | getDepartmentCapacityAlerts | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/department/conservation-summary | getDepartmentConservationSummary | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/department/feedbacks | getDepartmentFeedbacks | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/department/registrations/businesses | getDepartmentBusinessRegistrations | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/department/registrations/spots | getDepartmentSpotRegistrations | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/department/reports | getDepartmentReports | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/enterprise/businesses/{{businessId}}/dashboard | getEnterpriseDashboard | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/enterprise/businesses/{{businessId}}/feedbacks | getEnterpriseFeedbacks | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/enterprise/reports | getEnterpriseReports | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/ministry/capacity-alerts | getMinistryCapacityAlerts | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/ministry/conservation-summary | getMinistryConservationSummary | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | GET | /governance/ministry/overview | getMinistryOverview | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | PATCH | /governance/department/registrations/businesses/{{businessId}} | setApproval | src/service/businessService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | PATCH | /governance/department/registrations/spots/{{spotId}} | approveDepartmentSpot | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | PATCH | /governance/enterprise/businesses/{{businessId}} | updateEnterpriseBusiness | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | POST | /governance/admin/permissions | createPermission | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | POST | /governance/department/reports | createDepartmentReport | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | POST | /governance/department/reports/{{reportId}}/send | sendDepartmentReport | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | POST | /governance/enterprise/reports | createEnterpriseReport | src/service/governanceService.ts | UPDATED |
| 32. Quản trị nâng cao (Governance) | PUT | /governance/admin/roles/{{roleId}}/permissions | setRolePermissions | src/service/governanceService.ts | UPDATED |
| 33. Thống kê & Báo cáo (Statistics) | GET | /statistics/data-files | getDataFiles | src/service/statisticsService.ts | CREATED |
| 33. Thống kê & Báo cáo (Statistics) | GET | /statistics/data-files/download/:filename | downloadFile | src/service/statisticsService.ts | CREATED |
| 34. Ảnh vệ tinh (Satellite) | POST | /satellite/change | detectChange | src/service/satelliteService.ts | CREATED |
| 34. Ảnh vệ tinh (Satellite) | POST | /satellite/classified | getClassified | src/service/satelliteService.ts | CREATED |
| 34. Ảnh vệ tinh (Satellite) | POST | /satellite/compare | compare | src/service/satelliteService.ts | CREATED |
| 34. Ảnh vệ tinh (Satellite) | POST | /satellite/heat-map | getHeatMap | src/service/satelliteService.ts | CREATED |
| 34. Ảnh vệ tinh (Satellite) | POST | /satellite/ndvi | getNDVI | src/service/satelliteService.ts | CREATED |
| 34. Ảnh vệ tinh (Satellite) | POST | /satellite/rgb | getRGB | src/service/satelliteService.ts | CREATED |
| 4. Vai trò (Roles) | DELETE | /roles/{{roleId}} | delete | src/service/roleService.ts | UPDATED |
| 4. Vai trò (Roles) | GET | /roles | getAll | src/service/roleService.ts | UPDATED |
| 4. Vai trò (Roles) | GET | /roles/{{roleId}} | getById | src/service/roleService.ts | UPDATED |
| 4. Vai trò (Roles) | POST | /roles | create | src/service/roleService.ts | UPDATED |
| 4. Vai trò (Roles) | PUT | /roles/{{roleId}} | update | src/service/roleService.ts | UPDATED |
| 5. Nhật ký kiểm toán (Audit Logs) | GET | /audit-logs | getAll | src/service/auditLogService.ts | UPDATED |
| 5. Nhật ký kiểm toán (Audit Logs) | GET | /audit-logs/visitor-statistics | getVisitorStatistics | src/service/auditLogService.ts | UPDATED |
| 6. Địa lý hành chính (Geography) | GET | /geography/provinces | getProvinces | src/service/geographyService.ts | CREATED |
| 6. Địa lý hành chính (Geography) | GET | /geography/provinces/NB | getProvinceByCode | src/service/geographyService.ts | CREATED |
| 6. Địa lý hành chính (Geography) | GET | /geography/provinces/NB/wards | getWardsByProvince | src/service/geographyService.ts | CREATED |
| 6. Địa lý hành chính (Geography) | GET | /geography/provinces/search | searchProvinces | src/service/geographyService.ts | CREATED |
| 6. Địa lý hành chính (Geography) | GET | /geography/wards | getWards | src/service/geographyService.ts | CREATED |
| 6. Địa lý hành chính (Geography) | GET | /geography/wards/search | searchWards | src/service/geographyService.ts | CREATED |
| 7. Danh mục điểm đến (Spot Categories) | DELETE | /spot-categories/{{categoryId}} | delete | src/service/spotCategoryService.ts | UPDATED |
| 7. Danh mục điểm đến (Spot Categories) | GET | /spot-categories | getAll | src/service/spotCategoryService.ts | UPDATED |
| 7. Danh mục điểm đến (Spot Categories) | GET | /spot-categories/{{categoryId}} | getById | src/service/spotCategoryService.ts | UPDATED |
| 7. Danh mục điểm đến (Spot Categories) | GET | /spot-categories/tree | getTree | src/service/spotCategoryService.ts | UPDATED |
| 7. Danh mục điểm đến (Spot Categories) | PATCH | /spot-categories/{{categoryId}}/toggle | toggle | src/service/spotCategoryService.ts | UPDATED |
| 7. Danh mục điểm đến (Spot Categories) | POST | /spot-categories | create | src/service/spotCategoryService.ts | UPDATED |
| 7. Danh mục điểm đến (Spot Categories) | PUT | /spot-categories/{{categoryId}} | update | src/service/spotCategoryService.ts | UPDATED |
| 8. Điểm đến (Spots) | DELETE | /spots/{{spotId}} | delete | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | DELETE | /spots/{{spotId}}/media/{{mediaId}} | deleteMedia | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | GET | /spots | getAll | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | GET | /spots/:slug | getBySlug | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | GET | /spots/{{spotId}}/audio-guide | getAudioGuide | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | GET | /spots/{{spotId}}/media | getMedia | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | GET | /spots/bbox | getByBBox | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | GET | /spots/featured | getFeatured | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | GET | /spots/geojson | getGeoJSON | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | GET | /spots/id/:id | getById | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | GET | /spots/map | getBySlug | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | GET | /spots/nearby | getNearby | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | PATCH | /spots/{{spotId}} | update | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | PATCH | /spots/{{spotId}}/featured | toggleFeatured | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | PATCH | /spots/{{spotId}}/media/{{mediaId}} | updateMedia | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | PATCH | /spots/{{spotId}}/media/{{mediaId}}/primary | setPrimaryMedia | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | POST | /spots | create | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | POST | /spots/{{spotId}}/media | uploadMedia | src/service/spotService.ts | UPDATED |
| 8. Điểm đến (Spots) | POST | /spots/{{spotId}}/media/batch | uploadMediaBatch | src/service/spotService.ts | UPDATED |
| 9. Cảnh A-Frame VR (Spots) | DELETE | /spots/{{spotId}}/aframe-scenes/{{sceneId}} | deleteScene | src/service/spotService.ts | UPDATED |
| 9. Cảnh A-Frame VR (Spots) | DELETE | /spots/{{spotId}}/aframe-scenes/{{sceneId}}/hotspots/{{hotspotId}} | deleteSceneHotspot | src/service/spotService.ts | UPDATED |
| 9. Cảnh A-Frame VR (Spots) | GET | /spots/{{spotId}}/aframe-scenes | getScenes | src/service/spotService.ts | UPDATED |
| 9. Cảnh A-Frame VR (Spots) | GET | /spots/{{spotId}}/aframe-scenes/{{sceneId}} | getSceneById | src/service/spotService.ts | UPDATED |
| 9. Cảnh A-Frame VR (Spots) | GET | /spots/{{spotId}}/aframe-scenes/{{sceneId}}/hotspots | getSceneHotspots | src/service/spotService.ts | UPDATED |
| 9. Cảnh A-Frame VR (Spots) | GET | /spots/{{spotId}}/aframe-scenes/{{sceneId}}/preload | preloadScene | src/service/spotService.ts | UPDATED |
| 9. Cảnh A-Frame VR (Spots) | PATCH | /spots/{{spotId}}/aframe-scenes/{{sceneId}} | updateScene | src/service/spotService.ts | UPDATED |
| 9. Cảnh A-Frame VR (Spots) | PATCH | /spots/{{spotId}}/aframe-scenes/{{sceneId}}/activate | activateScene | src/service/spotService.ts | UPDATED |
| 9. Cảnh A-Frame VR (Spots) | PATCH | /spots/{{spotId}}/aframe-scenes/{{sceneId}}/deactivate | deactivateScene | src/service/spotService.ts | UPDATED |
| 9. Cảnh A-Frame VR (Spots) | PATCH | /spots/{{spotId}}/aframe-scenes/{{sceneId}}/hotspots/{{hotspotId}} | updateSceneHotspot | src/service/spotService.ts | UPDATED |
| 9. Cảnh A-Frame VR (Spots) | PATCH | /spots/{{spotId}}/aframe-scenes/{{sceneId}}/hotspots/{{hotspotId}}/activate | activateSceneHotspot | src/service/spotService.ts | UPDATED |
| 9. Cảnh A-Frame VR (Spots) | PATCH | /spots/{{spotId}}/aframe-scenes/{{sceneId}}/hotspots/{{hotspotId}}/deactivate | deactivateSceneHotspot | src/service/spotService.ts | UPDATED |
| 9. Cảnh A-Frame VR (Spots) | PATCH | /spots/{{spotId}}/aframe-scenes/{{sceneId}}/set-main | setMainScene | src/service/spotService.ts | UPDATED |
| 9. Cảnh A-Frame VR (Spots) | POST | /spots/{{spotId}}/aframe-scenes | createScene | src/service/spotService.ts | UPDATED |
| 9. Cảnh A-Frame VR (Spots) | POST | /spots/{{spotId}}/aframe-scenes/{{sceneId}}/hotspots | createSceneHotspot | src/service/spotService.ts | UPDATED |

## C. Danh sach service da tao/cap nhat

### Created
- src/service/arSessionService.ts
- src/service/capacityRealtimeService.ts
- src/service/capacityService.ts
- src/service/chatbotService.ts
- src/service/geographyService.ts
- src/service/gpsService.ts
- src/service/healthService.ts
- src/service/integrationService.ts
- src/service/itineraryService.ts
- src/service/mapDataService.ts
- src/service/mapMeasureService.ts
- src/service/offlineMapService.ts
- src/service/satelliteService.ts
- src/service/searchService.ts
- src/service/statisticsService.ts
- src/service/tourService.ts

### Updated
- src/service/authService.ts
- src/service/businessService.ts
- src/service/citizenFeedbackService.ts
- src/service/common/apiClient.ts
- src/service/culinaryService.ts
- src/service/festivalService.ts
- src/service/governanceService.ts
- src/service/index.ts
- src/service/mapAdminCategoryService.ts
- src/service/mapLayerApiService.ts
- src/service/mapLayerService.ts
- src/service/newsCommentService.ts
- src/service/newsService.ts
- src/service/ocopService.ts
- src/service/ratingService.ts
- src/service/spotService.ts
- src/service/userService.ts
- src/service/vlogService.ts

## D. Service chua duoc UI su dung

| API Group | Endpoint | Service Function | File | Note |
|---|---|---|---|---|
| Auth | /auth/register | authService.register | src/service/authService.ts | Available in Postman but not used by UI yet |
| Auth | /auth/google | authService.googleLogin | src/service/authService.ts | Available in Postman but not used by UI yet |
| Auth | /auth/google/callback | authService.googleCallback | src/service/authService.ts | Available in Postman but not used by UI yet |
| Capacity | /capacity/stream | subscribeCapacitySSE | src/service/capacityRealtimeService.ts | Available in Postman but not used by UI yet |
| Vlog | /vlogs | vlogService.create | src/service/vlogService.ts | Available in Postman but not used by UI yet |
| Vlog | /vlogs/:id | vlogService.update | src/service/vlogService.ts | Available in Postman but not used by UI yet |
| Ratings | /ratings | ratingService.create | src/service/ratingService.ts | Available in Postman but not used by UI yet |
| Ratings | /ratings/:id | ratingService.update | src/service/ratingService.ts | Available in Postman but not used by UI yet |
| Businesses | /businesses | businessService.create | src/service/businessService.ts | Available in Postman but not used by UI yet |
| Feedbacks | /feedbacks | citizenFeedbackService.getPublic/create | src/service/citizenFeedbackService.ts | Available in Postman but not used by UI yet |

## E. Dropdown/select da xu ly

| Field | API options | Label hien thi | Value submit |
|---|---|---|---|
| role_id | GET /roles | role.name | role.id |
| category_id | GET /spot-categories | category.name | category.id |
| spot_id | GET /spots | spot.name_vi / slug | spot.id |
| business_id | GET /businesses | business.business_name | business.id |

## F. Realtime capacity da xu ly

| Feature | Endpoint/Channel | File | Status |
|---|---|---|---|
| REST snapshot current | GET /capacity/current | src/service/capacityService.ts | CREATED |
| REST snapshot geojson | GET /capacity/current/geojson | src/service/capacityService.ts | CREATED |
| SSE stream | GET /capacity/stream | src/service/capacityRealtimeService.ts | CREATED |
| WebSocket / subscribe capacity | WS /ws?token=<access_token> + subscribe capacity | src/service/capacityRealtimeService.ts | CREATED |
| Handle capacity_update | realtime event | src/service/capacityRealtimeService.ts + src/stores/common/useCapacityStore.ts | CREATED |
| Handle capacity_alert | realtime event | src/service/capacityRealtimeService.ts + src/stores/common/useCapacityStore.ts | CREATED |
| Reconnect/backoff | SSE + WS | src/service/capacityRealtimeService.ts | CREATED |
| Cleanup | close/disconnect APIs | src/service/capacityRealtimeService.ts | CREATED |

## G. TODO
- npm run lint khong chay duoc do thieu package eslint-plugin-react-x trong eslint.config.js (ENV dependency issue).
- .github/nb_renew.admin.instructions.md khong ton tai trong workspace; can bo sung neu day la file bat buoc.

