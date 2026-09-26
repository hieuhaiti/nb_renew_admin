# Role → Route Permission Map

> Source of truth: `DuLichNinhBinh API.postman_collection.json`
> Quy ước đặt tên: prefix trong tên request xác định role được phép truy cập
> Cập nhật: 2026-05-25

---

## Roles

| ID | Key | Tên |
|---|---|---|
| 1 | `system_admin` | Quản trị hệ thống |
| 2 | `ministry_manager` | Bộ Văn hóa Thể thao và Du lịch |
| 3 | `department_manager` | Sở Văn hóa Thể thao và Du lịch |
| 4 | `spot_operator` | Đơn vị vận hành điểm du lịch |
| 5 | `travel_company` | Công ty lữ hành |
| 6 | `service_provider` | Đơn vị cung cấp dịch vụ du lịch |
| 7 | `tourist` | Khách du lịch |

---

## Quy ước đặt tên trong Postman Collection

| Prefix trong tên request | Role được phép |
|---|---|
| `Admin -` | **1** |
| `Bộ -` | **1, 2** |
| `Sở -` | **1, 3** |
| `Doanh nghiệp -` | **1, 4, 5, 6** |
| _(không có prefix)_ | Theo nhóm chức năng bên dưới |
| _(noauth)_ | Public — tất cả kể cả tourist |

---

## Governance — phân quyền theo prefix

### `Admin -` → Role 1

| Tên request | Method | Path |
|---|---|---|
| Admin - Dashboard | GET | `/governance/admin/dashboard` |
| Admin - Lưu lượng | GET | `/governance/admin/traffic` |
| Admin - Danh sách permission | GET | `/governance/admin/permissions` |
| Admin - Tạo permission | POST | `/governance/admin/permissions` |
| Admin - Permission của role | GET | `/governance/admin/roles/:roleId/permissions` |
| Admin - Gán permission cho role | PUT | `/governance/admin/roles/:roleId/permissions` |

---

### `Bộ -` → Role 1, 2

| Tên request | Method | Path |
|---|---|---|
| Bộ - Tổng quan | GET | `/governance/ministry/overview` |
| Bộ - Cảnh báo sức chứa | GET | `/governance/ministry/capacity-alerts` |
| Bộ - Tóm tắt bảo tồn | GET | `/governance/ministry/conservation-summary` |

---

### `Sở -` → Role 1, 3

| Tên request | Method | Path |
|---|---|---|
| Sở - Đăng ký doanh nghiệp | GET | `/governance/department/registrations/businesses` |
| Sở - Duyệt đăng ký doanh nghiệp | PATCH | `/governance/department/registrations/businesses/:businessId` |
| Sở - Đăng ký điểm đến | GET | `/governance/department/registrations/spots` |
| Sở - Duyệt đăng ký điểm đến | PATCH | `/governance/department/registrations/spots/:spotId` |
| Sở - Phản ánh người dân | GET | `/governance/department/feedbacks` |
| Sở - Tạo báo cáo | POST | `/governance/department/reports` |
| Sở - Danh sách báo cáo | GET | `/governance/department/reports` |
| Sở - Gửi báo cáo | POST | `/governance/department/reports/:reportId/send` |
| Sở - Cảnh báo sức chứa | GET | `/governance/department/capacity-alerts` |
| Sở - Tóm tắt bảo tồn | GET | `/governance/department/conservation-summary` |

---

### `Doanh nghiệp -` → Role 1, 4, 5, 6

| Tên request | Method | Path |
|---|---|---|
| Doanh nghiệp - Tạo báo cáo | POST | `/governance/enterprise/reports` |
| Doanh nghiệp - Danh sách báo cáo | GET | `/governance/enterprise/reports` |
| Doanh nghiệp - Dashboard | GET | `/governance/enterprise/businesses/:businessId/dashboard` |
| Doanh nghiệp - Cập nhật profile | PATCH | `/governance/enterprise/businesses/:businessId` |
| Doanh nghiệp - Phản ánh xung quanh | GET | `/governance/enterprise/businesses/:businessId/feedbacks` |

---

## Các module khác — phân quyền theo chức năng

### Role 1 only

| Module | Method | Path |
|---|---|---|
| Danh sách người dùng | GET | `/users` |
| Lấy người dùng theo ID | GET | `/users/:userId` |
| Tạo người dùng | POST | `/users` |
| Cập nhật người dùng | PUT | `/users/:userId` |
| Khoá / Mở khoá tài khoản | PUT/PATCH | `/users/:userId/lock` |
| Xoá người dùng | DELETE | `/users/:userId` |
| Xoá hàng loạt | DELETE | `/users/batch` |
| Gán vai trò | PUT | `/users/:userId/role` |
| Danh sách vai trò | GET | `/roles` |
| Lấy vai trò theo ID | GET | `/roles/:roleId` |
| Tạo vai trò | POST | `/roles` |
| Cập nhật vai trò | PUT | `/roles/:roleId` |
| Xoá vai trò | DELETE | `/roles/:roleId` |
| Danh sách audit log | GET | `/audit-logs` |
| Thống kê lượt truy cập | GET | `/audit-logs/visitor-statistics` |
| Danh sách tích hợp | GET | `/integrations` |
| Lấy tích hợp theo ID | GET | `/integrations/:integrationId` |
| Tạo tích hợp | POST | `/integrations` |
| Cập nhật tích hợp | PATCH | `/integrations/:integrationId` |
| Xoá tích hợp | DELETE | `/integrations/:integrationId` |
| Đồng bộ tích hợp | POST | `/integrations/:integrationId/sync` |
| Nhật ký tích hợp | GET | `/integrations/:integrationId/logs` |

---

### Role 1, 2, 3

| Module | Method | Path |
|---|---|---|
| Thống kê lượt truy cập (dashboard) | GET | `/audit-logs/visitor-statistics` |
| Danh sách file thống kê | GET | `/statistics/data-files` |
| Tải file thống kê | GET | `/statistics/data-files/download/:filename` |
| Danh sách danh mục điểm | GET | `/spot-categories` |
| Lấy danh mục theo ID | GET | `/spot-categories/:categoryId` |
| Tạo danh mục | POST | `/spot-categories` |
| Cập nhật danh mục | PUT | `/spot-categories/:categoryId` |
| Bật/tắt danh mục | PATCH | `/spot-categories/:categoryId/toggle` |
| Xoá danh mục | DELETE | `/spot-categories/:categoryId` |
| Quản trị - Danh sách tin tức | GET | `/news/admin/all` |
| Quản trị - Lấy tin theo ID | GET | `/news/admin/:newsId` |
| Tạo tin tức | POST | `/news` |
| Cập nhật tin tức | PATCH | `/news/:newsId` |
| Đặt trạng thái xuất bản | PATCH | `/news/admin/:newsId/publish` |
| Xoá tin tức | DELETE | `/news/:newsId` |
| Duyệt bình luận tin tức | PATCH | `/news/:newsId/comments/:commentId/approval` |
| Xoá bình luận tin tức | DELETE | `/news/:newsId/comments/:commentId` |
| Quản trị - Danh sách vlog | GET | `/vlogs/admin/all` |
| Quản trị - Lấy vlog theo ID | GET | `/vlogs/admin/:vlogId` |
| Kiểm duyệt vlog | PATCH | `/vlogs/admin/:vlogId/moderate` |
| Xoá vlog | DELETE | `/vlogs/:vlogId` |
| Quản trị - Danh sách doanh nghiệp | GET | `/businesses` |
| Cập nhật trạng thái doanh nghiệp | PATCH | `/businesses/:businessId/status` |
| Danh mục bản đồ - Danh sách | GET | `/map-admin/categories` |
| Danh mục bản đồ - Tạo | POST | `/map-admin/categories` |
| Danh mục bản đồ - Cập nhật | PATCH | `/map-admin/categories/:mapCategoryId` |
| Danh mục bản đồ - Xoá | DELETE | `/map-admin/categories/:mapCategoryId` |
| Lớp bản đồ - Danh sách | GET | `/map-admin/layers` |
| Lớp bản đồ - Tạo | POST | `/map-admin/layers` |
| Lớp bản đồ - Bật/tắt | PATCH | `/map-admin/layers/:mapLayerId/toggle` |
| Lớp bản đồ - Cập nhật | PATCH | `/map-admin/layers/:mapLayerId` |
| Lớp bản đồ - Xoá | DELETE | `/map-admin/layers/:mapLayerId` |
| Map API - Danh sách | GET | `/map-admin/apis` |
| Map API - Tạo | POST | `/map-admin/apis` |
| Map API - Cập nhật | PATCH | `/map-admin/apis/:mapApiId` |
| Map API - Xoá | DELETE | `/map-admin/apis/:mapApiId` |
| Map API - Permission | GET | `/map-admin/apis/:mapApiId/permissions` |
| Map API - Gán permission | PUT | `/map-admin/apis/:mapApiId/permissions` |
| Map API - Xoá permission | DELETE | `/map-admin/apis/:mapApiId/permissions/:permissionId` |
| Map API Key - Danh sách | GET | `/map-admin/api-keys` |
| Map API Key - Tạo | POST | `/map-admin/api-keys` |
| Map API Key - Thu hồi | PATCH | `/map-admin/api-keys/:apiKeyId/revoke` |

---

### Role 1, 2, 3, 4

| Module | Method | Path |
|---|---|---|
| Lấy điểm đến theo ID (admin) | GET | `/spots/id/:id` |
| Tạo điểm đến | POST | `/spots` |
| Cập nhật điểm đến | PATCH | `/spots/:spotId` |
| Xoá điểm đến | DELETE | `/spots/:spotId` |
| Bật/tắt nổi bật | PATCH | `/spots/:spotId/featured` |
| Thêm media | POST | `/spots/:spotId/media` |
| Thêm media hàng loạt | POST | `/spots/:spotId/media/batch` |
| Xoá media | DELETE | `/spots/:spotId/media/:mediaId` |
| Đặt media chính | PATCH | `/spots/:spotId/media/:mediaId/primary` |
| Cập nhật thông tin media | PATCH | `/spots/:spotId/media/:mediaId` |
| VR - Tạo cảnh | POST | `/spots/:spotId/aframe-scenes` |
| VR - Cập nhật cảnh | PATCH | `/spots/:spotId/aframe-scenes/:sceneId` |
| VR - Xoá cảnh | DELETE | `/spots/:spotId/aframe-scenes/:sceneId` |
| VR - Đặt cảnh chính | PATCH | `/spots/:spotId/aframe-scenes/:sceneId/set-main` |
| VR - Kích hoạt / Vô hiệu hoá cảnh | PATCH | `/spots/:spotId/aframe-scenes/:sceneId/activate` |
| VR - Tạo hotspot | POST | `/spots/:spotId/aframe-scenes/:sceneId/hotspots` |
| VR - Cập nhật hotspot | PATCH | `/spots/:spotId/aframe-scenes/:sceneId/hotspots/:hotspotId` |
| VR - Xoá hotspot | DELETE | `/spots/:spotId/aframe-scenes/:sceneId/hotspots/:hotspotId` |
| Hotspot media - Tạo | POST | `/spots/:spotId/media/:mediaId/hotspots` |
| Hotspot media - Cập nhật | PATCH | `/spots/:spotId/media/:mediaId/hotspots/:hotspotId` |
| Hotspot media - Xoá | DELETE | `/spots/:spotId/media/:mediaId/hotspots/:hotspotId` |
| Tạo món ăn | POST | `/culinary` |
| Cập nhật món ăn | PATCH | `/culinary/:culinaryId` |
| Xoá món ăn | DELETE | `/culinary/:culinaryId` |
| Tạo lễ hội | POST | `/festivals` |
| Cập nhật lễ hội | PATCH | `/festivals/:festivalId` |
| Xoá lễ hội | DELETE | `/festivals/:festivalId` |
| Cấu hình sức chứa điểm | PATCH | `/capacity/spots/:spotId/settings` |
| Ghi nhận lượng khách | POST | `/capacity/spots/:spotId/log` |
| Cấu hình cảnh báo sức chứa | GET/POST | `/capacity/configs` |
| Lịch sử / Thống kê sức chứa | GET | `/capacity/spots/:spotId/history` |
| Cập nhật trạng thái đánh giá | PATCH | `/ratings/:ratingId/status` |
| Xoá đánh giá | DELETE | `/ratings/:ratingId` |

---

### Role 1, 2, 3, 4, 5

| Module | Method | Path |
|---|---|---|
| Tạo tour | POST | `/tours` |
| Cập nhật tour | PATCH | `/tours/:tourId` |
| Xoá tour | DELETE | `/tours/:tourId` |
| Thêm điểm dừng | POST | `/tours/:tourId/stops` |
| Cập nhật điểm dừng | PATCH | `/tours/:tourId/stops/:stopId` |
| Xoá điểm dừng | DELETE | `/tours/:tourId/stops/:stopId` |
| Cập nhật thứ tự điểm dừng | PATCH | `/tours/:tourId/stops/reorder` |

---

### Role 1, 2, 3, 4, 5, 6 (tất cả admin)

| Module | Method | Path |
|---|---|---|
| Tạo sản phẩm OCOP | POST | `/ocop` |
| Cập nhật sản phẩm OCOP | PATCH | `/ocop/:ocopId` |
| Xoá sản phẩm OCOP | DELETE | `/ocop/:ocopId` |
| Danh sách sản phẩm OCOP của tôi | GET | `/ocop/me` |
| Quản trị - Danh sách phản ánh | GET | `/feedbacks/admin/all` |
| Cập nhật trạng thái phản ánh | PATCH | `/feedbacks/:feedbackId/status` |
| Cập nhật kiểm duyệt phản ánh | PATCH | `/feedbacks/:feedbackId/moderation` |
| Xoá phản ánh | DELETE | `/feedbacks/:feedbackId` |
| Trả lời đánh giá | POST | `/ratings/:ratingId/reply` |
| Thông báo của tôi | GET | `/notifications/me` |
| Đánh dấu đọc thông báo | PATCH | `/notifications/:id/read` |

---

### Role 5, 6 (enterprise only)

| Module | Method | Path |
|---|---|---|
| Đánh giá doanh nghiệp của tôi | GET | `/ratings/business/my` |
| Đăng ký doanh nghiệp | POST | `/businesses` |
| Doanh nghiệp của tôi | GET | `/businesses/me` |
| Tạo dịch vụ | POST | `/businesses/:businessId/services` |
| Cập nhật dịch vụ | PATCH | `/businesses/:businessId/services/:serviceId` |
| Xoá dịch vụ | DELETE | `/businesses/:businessId/services/:serviceId` |
| Tạo voucher | POST | `/businesses/:businessId/vouchers` |
| Cập nhật voucher | PATCH | `/businesses/:businessId/vouchers/:voucherId` |
| Vô hiệu hoá voucher | DELETE | `/businesses/:businessId/vouchers/:voucherId` |

---

### Public — tất cả role (kể cả tourist / không cần auth)

| Module | Method | Path |
|---|---|---|
| Health check | GET | `/health` |
| Danh sách tỉnh/thành | GET | `/geography/provinces` |
| Tìm tỉnh/thành | GET | `/geography/provinces/search` |
| Lấy tỉnh theo mã | GET | `/geography/provinces/:code` |
| Phường/xã theo tỉnh | GET | `/geography/provinces/:code/wards` |
| Danh sách phường/xã | GET | `/geography/wards` |
| Tìm phường/xã | GET | `/geography/wards/search` |
| Cây danh mục điểm | GET | `/spot-categories/tree` |
| Danh sách điểm đến | GET | `/spots` |
| Bản đồ điểm đến | GET | `/spots/map` |
| Điểm đến gần đây | GET | `/spots/nearby` |
| Điểm đến trong bbox | GET | `/spots/bbox` |
| Dữ liệu GeoJSON điểm | GET | `/spots/geojson` |
| Điểm đến nổi bật | GET | `/spots/featured` |
| Lấy điểm đến theo slug | GET | `/spots/:slug` |
| Media của điểm đến | GET | `/spots/:spotId/media` |
| Thuyết minh âm thanh | GET | `/spots/:spotId/audio-guide` |
| VR - Danh sách cảnh | GET | `/spots/:spotId/aframe-scenes` |
| VR - Lấy cảnh theo ID | GET | `/spots/:spotId/aframe-scenes/:sceneId` |
| VR - Preload cảnh | GET | `/spots/:spotId/aframe-scenes/:sceneId/preload` |
| VR - Hotspot trong cảnh | GET | `/spots/:spotId/aframe-scenes/:sceneId/hotspots` |
| Hotspot media - Danh sách | GET | `/spots/:spotId/media/:mediaId/hotspots` |
| Sức chứa hiện tại | GET | `/capacity/current` |
| Sức chứa GeoJSON | GET | `/capacity/current/geojson` |
| Stream sức chứa (SSE) | GET | `/capacity/stream` |
| Gợi ý điểm thay thế | GET | `/capacity/spots/:spotId/alternatives` |
| Danh sách tour | GET | `/tours` |
| Lấy tour theo slug | GET | `/tours/slug/:slug` |
| Lấy tour theo ID | GET | `/tours/:tourId` |
| Danh sách điểm dừng tour | GET | `/tours/:tourId/stops` |
| Lịch trình chia sẻ | GET | `/itineraries/shared/:token` |
| Xuất lịch trình PDF | GET | `/itineraries/:itineraryId/export/pdf` |
| Danh sách ngày lịch trình | GET | `/itineraries/:itineraryId/days` |
| Lịch lễ hội | GET | `/festivals/calendar` |
| Loại lễ hội | GET | `/festivals/types` |
| Danh sách lễ hội | GET | `/festivals` |
| Lấy lễ hội theo ID | GET | `/festivals/:festivalId` |
| Danh sách món ăn | GET | `/culinary` |
| Danh mục ẩm thực | GET | `/culinary/categories` |
| Lấy món ăn theo ID | GET | `/culinary/:culinaryId` |
| Danh sách OCOP | GET | `/ocop` |
| Danh sách OCOP GeoJSON | GET | `/ocop/geojson` |
| Danh mục OCOP | GET | `/ocop/categories` |
| Lấy OCOP theo ID | GET | `/ocop/:ocopId` |
| Danh sách tin tức | GET | `/news` |
| Lấy tin theo slug | GET | `/news/:slug` |
| Bình luận của tin | GET | `/news/:newsId/comments` |
| Danh sách vlog | GET | `/vlogs` |
| Lấy vlog theo ID | GET | `/vlogs/:vlogId` |
| Danh sách đánh giá | GET | `/ratings` |
| Đánh giá theo điểm | GET | `/ratings/spots/:spotId` |
| Danh sách doanh nghiệp công khai | GET | `/businesses/public` |
| Voucher gần đây | GET | `/businesses/vouchers/nearby` |
| Kiểm tra voucher | POST | `/businesses/vouchers/validate` |
| Dịch vụ của doanh nghiệp | GET | `/businesses/:businessId/services` |
| Voucher của doanh nghiệp | GET | `/businesses/:businessId/vouchers` |
| Danh sách phản ánh | GET | `/feedbacks` |
| Lấy phản ánh theo ID | GET | `/feedbacks/:feedbackId` |
| Loại đối tượng tìm kiếm | GET | `/search/types` |
| Tìm kiếm tổng hợp | GET | `/search` |
| Tìm kiếm theo loại | GET | `/search/spots` |
| Tạo phiên chatbot | POST | `/chatbot/sessions` |
| Gửi tin nhắn chatbot | POST | `/chatbot/sessions/:sessionId/messages` |
| Lấy tin nhắn phiên chat | GET | `/chatbot/sessions/:sessionId` |
| Dữ liệu bản đồ (api key) | GET | `/map-data/apis` |
| Lớp bản đồ (api key) | GET | `/map-data/layers` |
| Dữ liệu API bản đồ (api key) | GET | `/map-data/apis/:apiId/data` |

---

## Ma trận tóm tắt theo nhóm

| Nhóm route | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `Admin -` Governance | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Users / Roles / Audit / Integrations | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `Bộ -` Governance | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dashboard / Statistics / Map admin / Tin tức / Vlog / Doanh nghiệp | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `Sở -` Governance | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Spots / Culinary / Festivals / Capacity / Ratings | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tours | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| OCOP / Feedbacks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `Doanh nghiệp -` Governance | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Business self-management / My ratings | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Public endpoints | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
