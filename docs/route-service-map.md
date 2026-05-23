# Route → File → Service Map

> Source of truth: `@admin/src/App.tsx`
> Cập nhật: 2026-05-23

---

## Ký hiệu

| Ký hiệu | Ý nghĩa |
|---|---|
| **`role`** | Vai trò file (bold monospace) |
| `path/to/file` | Đường dẫn file |
| **ServiceName** | Tên service (bold) |
| `` `#func` `` | Tên hàm service |

---

## Error pages

- `/400` → `@admin/src/pages/Errors/400BadRequestPage.tsx`
- `/401` → `@admin/src/pages/Errors/401UnauthorizedPage.tsx`
- `/403` → `@admin/src/pages/Errors/403ForbiddenPage.tsx`
- `/500` → `@admin/src/pages/Errors/500InternalServerErrorPage.tsx`
- `/503` → `@admin/src/pages/Errors/503ServiceUnavailablePage.tsx`
- `*`    → `@admin/src/pages/Errors/404NotFoundPage.tsx`

---

## Auth

### `/login`

**`LoginPage`** `@admin/src/pages/Login.tsx`
- **authService** → `#login`

---

## Dashboard

### `/dashboard`

**`VisitorStatistics`** `@admin/src/pages/Statistics/VisitorStatistics.tsx`
- **auditLogService** → `#getVisitorStatistics`

---

## Quản lý người dùng

### `/users`

**`index`** `@admin/src/pages/User/index.tsx`
- **userService** → `#getAll` `#create` `#update` `#lock` `#delete`
- **authService** → `#getProfile`

**`UserFormDialog`** `@admin/src/pages/User/UserFormDialog.tsx`
- **userService** → `#getById`
- **roleService** → `#getAll`

**`UserDetailDialog`** `@admin/src/pages/User/UserDetailDialog.tsx`
- **userService** → `#getById`

---

### `/roles`

**`index`** `@admin/src/pages/Roles/index.tsx`
- **roleService** → `#getAll` `#create` `#update` `#delete`

**`RoleFormDialog`** `@admin/src/pages/Roles/RoleFormDialog.tsx`
- _(nhận `role` prop từ parent, không gọi service độc lập)_

**`RoleDetailDialog`** `@admin/src/pages/Roles/RoleDetailDialog.tsx`
- _(hiển thị dữ liệu từ props, không gọi service)_

---

## Điểm du lịch

### `/categories`

**`index`** `@admin/src/pages/Category/index.tsx`
- **spotCategoryService** → `#getAll` `#create` `#update` `#toggle` `#delete`

**`CategoryFormDialog`** `@admin/src/pages/Category/CategoryFormDialog.tsx`
- **spotCategoryService** → `#getById`

**`CategoryDetailDialog`** `@admin/src/pages/Category/CategoryDetailDialog.tsx`
- **spotCategoryService** → `#getById`

---

### `/spots`

**`index`** `@admin/src/pages/Spots/index.tsx`
- **spotService** → `#getAll` `#create` `#update` `#delete` `#toggleFeatured`
- **spotCategoryService** → `#getAll`

**`SpotFormDialog`** `@admin/src/pages/Spots/SpotFormDialog.tsx`
- **spotService** → `#getById`
- **spotCategoryService** → `#getAll`

**`SpotDetailDialog`** `@admin/src/pages/Spots/SpotDetailDialog.tsx`
- **spotService** → `#getById`

---

### `/culinary`

**`index`** `@admin/src/pages/Culinary/index.tsx`
- **culinaryService** → `#getAll` `#create` `#update` `#delete`

**`CulinaryFormDialog`** `@admin/src/pages/Culinary/CulinaryFormDialog.tsx`
- **culinaryService** → `#getById`

**`CulinaryDetailDialog`** `@admin/src/pages/Culinary/CulinaryDetailDialog.tsx`
- **culinaryService** → `#getById`

---

### `/festivals`

**`index`** `@admin/src/pages/Festivals/index.tsx`
- **festivalService** → `#getAll` `#create` `#update` `#delete`

**`FestivalFormDialog`** `@admin/src/pages/Festivals/FestivalFormDialog.tsx`
- **festivalService** → `#getById`

**`FestivalDetailDialog`** `@admin/src/pages/Festivals/FestivalDetailDialog.tsx`
- **festivalService** → `#getById`

---

### `/ocop`

**`index`** `@admin/src/pages/Ocop/index.tsx`
- **ocopService** → `#getAll` `#create` `#update` `#delete`

**`OcopFormDialog`** `@admin/src/pages/Ocop/OcopFormDialog.tsx`
- **ocopService** → `#getById`

**`OcopDetailDialog`** `@admin/src/pages/Ocop/OcopDetailDialog.tsx`
- **ocopService** → `#getById`

---

### `/tours`

**`index`** `@admin/src/pages/Tours/index.tsx`
- **tourService** → `#getAll` `#create` `#update` `#delete`

**`TourFormDialog`** `@admin/src/pages/Tours/TourFormDialog.tsx`
- **tourService** → `#getById`

**`TourDetailDialog`** `@admin/src/pages/Tours/TourDetailDialog.tsx`
- **tourService** → `#getById`

---

### `/capacity`

**`index`** `@admin/src/pages/Capacity/index.tsx`
- **capacityService** → `#getCurrent` `#log` `#updateSettings`
- **spotService** → `#getAll`
- **useCapacityStore** → `#loadSnapshot` `#connectWS` `#disconnectWS`

---

## Doanh nghiệp

### `/businesses`

**`index`** `@admin/src/pages/Businesses/index.tsx`
- **businessService** → `#getAll` `#setApproval`

---

### `/integrations`

**`index`** `@admin/src/pages/Integrations/index.tsx`
- **integrationService** → `#getAll` `#create` `#update` `#delete` `#sync` `#getLogs`

---

## Vlog

### `/vlogs`

**`index`** `@admin/src/pages/Vlogs/index.tsx`
- **vlogService** → `#getAllAdmin` `#moderate` `#delete`

---

## Tin tức

### `/news`

**`index`** `@admin/src/pages/News/index.tsx`
- **newsService** → `#getAllAdmin` `#create` `#update` `#setPublished` `#delete`

**`NewsFormDialog`** `@admin/src/pages/News/NewsFormDialog.tsx`
- **newsService** → `#getByIdAdmin`

**`NewsDetailDialog`** `@admin/src/pages/News/NewsDetailDialog.tsx`
- **newsService** → `#getByIdAdmin`

---

### `/news-comments`

**`index`** `@admin/src/pages/NewsComments/index.tsx`
- **newsCommentService** → `#getByNewsId` `#setApproval` `#delete`

**`NewsCommentDetailDialog`** `@admin/src/pages/NewsComments/NewsCommentDetailDialog.tsx`
- _(hiển thị dữ liệu từ props, không gọi service)_

**`NewsCommentFormDialog`** `@admin/src/pages/NewsComments/NewsCommentFormDialog.tsx`
- **newsCommentService** → `#create` `#setApproval`

---

## Đánh giá

### `/ratings`

**`index`** `@admin/src/pages/Ratings/index.tsx`
- **ratingService** → `#getAll` `#setStatus` `#delete`
- **spotService** → `#getAll` _(lookup filter)_
- **businessService** → `#getAll` _(lookup filter)_

---

## Bản đồ

### `/map-admin-categories`

**`index`** `@admin/src/pages/MapAdminCategories/index.tsx`
- **mapAdminCategoryService** → `#getAll` `#create` `#update` `#delete`

**`MapAdminCategoryFormDialog`** `@admin/src/pages/MapAdminCategories/MapAdminCategoryFormDialog.tsx`
- _(nhận `category` prop từ parent, không gọi getById)_

**`MapAdminCategoryDetailDialog`** `@admin/src/pages/MapAdminCategories/MapAdminCategoryDetailDialog.tsx`
- _(nhận `category` prop từ parent, không gọi getById)_

---

### `/map-layers`

**`index`** `@admin/src/pages/MapLayers/index.tsx`
- **mapLayerService** → `#getAll` `#toggle` `#create` `#update` `#delete`

**`MapLayerFormDialog`** `@admin/src/pages/MapLayers/MapLayerFormDialog.tsx`
- **mapAdminCategoryService** → `#getAll` _(lookup danh mục)_
- _(nhận `layer` prop từ parent, không gọi getById)_

**`MapLayerDetailDialog`** `@admin/src/pages/MapLayers/MapLayerDetailDialog.tsx`
- _(nhận `layer` prop từ parent, không gọi getById)_

---

### `/map-layer-apis/*`

**`index`** `@admin/src/pages/MapLayerApis/index.tsx`
- _(tab router, không gọi service trực tiếp)_

**`MapLayerApiListPage`** `@admin/src/pages/MapLayerApis/MapLayerApiListPage.tsx`
- **mapLayerApiService** → `#getAll` `#delete`

**`MapLayerApiFormDialog`** `@admin/src/pages/MapLayerApis/MapLayerApiFormDialog.tsx`
- **mapLayerApiService** → `#getById` `#create` `#update`

**`MapLayerApiDetailDialog`** `@admin/src/pages/MapLayerApis/MapLayerApiDetailDialog.tsx`
- **mapLayerApiService** → `#getById`

---

### `/public/map-layer-apis`

**`MapLayerApiPublicPage`** `@admin/src/pages/MapLayerApis/MapLayerApiPublicPage.tsx`
- _(public page, không gọi service qua apiClient)_

---

## Quản trị nâng cao

### `/` và `/governance`

**`index`** `@admin/src/pages/Governance/index.tsx`
- _(nav hub, không gọi service trực tiếp)_

---

### `/governance/admin`

**`GovernanceAdminPage`** `@admin/src/pages/Governance/GovernanceAdminPage.tsx`
- **governanceService** → `#getDashboard` `#getTraffic` `#getPermissions` `#createPermission` `#getRolePermissions` `#setRolePermissions`
- **roleService** → `#getAll`

---

### `/governance/ministry`

**`GovernanceMinistryPage`** `@admin/src/pages/Governance/GovernanceMinistryPage.tsx`
- **governanceService** → `#getMinistryOverview` `#getMinistryCapacityAlerts` `#getMinistryConservationSummary`

---

### `/governance/department`

**`GovernanceDepartmentPage`** `@admin/src/pages/Governance/GovernanceDepartmentPage.tsx`
- **governanceService** → `#getDepartmentBusinessRegistrations` `#getDepartmentSpotRegistrations` `#approveDepartmentSpot` `#getDepartmentFeedbacks` `#getDepartmentReports` `#createDepartmentReport` `#sendDepartmentReport` `#getDepartmentCapacityAlerts` `#getDepartmentConservationSummary`

---

### `/governance/enterprise`

**`GovernanceEnterprisePage`** `@admin/src/pages/Governance/GovernanceEnterprisePage.tsx`
- **governanceService** → `#getEnterpriseDashboard` `#getEnterpriseReports` `#createEnterpriseReport` `#getEnterpriseFeedbacks`
- **businessService** → `#getMe`

**`BusinessEnterpriseView`** `@admin/src/pages/Governance/BusinessEnterpriseView.tsx`
- **governanceService** → `#getEnterpriseDashboard` `#getEnterpriseFeedbacks`
- **businessService** → `#getAll`

---

## Phản ánh & Nhật ký

### `/feedbacks`

**`index`** `@admin/src/pages/Feedback/index.tsx`
- **citizenFeedbackService** → `#getAll` `#updateStatus` `#updateModeration` `#delete`

**`FeedbackDetailDialog`** `@admin/src/pages/Feedback/FeedbackDetailDialog.tsx`
- **citizenFeedbackService** → `#getById`

**`FeedbackFormDialog`** `@admin/src/pages/Feedback/FeedbackFormDialog.tsx`
- _(mutation props từ parent, không gọi service độc lập)_

---

### `/audit-logs`

**`index`** `@admin/src/pages/AuditLog/index.tsx`
- **auditLogService** → `#getAll`

**`AuditLogDetailDialog`** `@admin/src/pages/AuditLog/AuditLogDetailDialog.tsx`
- _(hiển thị dữ liệu từ props, không gọi service)_

---

### `/statistics`

**`index`** `@admin/src/pages/Statistics/index.tsx`
- **statisticsService** → `#getDataFiles` `#downloadFile`

---

## Hồ sơ cá nhân

### `/profile`

**`index`** `@admin/src/pages/Profile/index.tsx`
- **authService** → `#updateProfile`

---

### `/change-password`

**`index`** `@admin/src/pages/ChangePassword/index.tsx`
- **authService** → `#changePassword`
