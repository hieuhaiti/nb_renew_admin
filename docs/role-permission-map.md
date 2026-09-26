# Role → Permission Map

> Source of truth: `src/App.tsx` + `src/constant/roleConstant.ts`
> Cập nhật: 2026-05-25

---

## Danh sách role

| ID | Key | Tên hiển thị |
|---|---|---|
| 1 | `system_admin` | Quản trị hệ thống |
| 2 | `ministry_manager` | Bộ Văn hóa Thể thao và Du lịch |
| 3 | `department_manager` | Sở Văn hóa Thể thao và Du lịch |
| 4 | `spot_operator` | Đơn vị vận hành điểm du lịch |
| 5 | `travel_company` | Công ty lữ hành |
| 6 | `service_provider` | Đơn vị cung cấp dịch vụ du lịch |
| 7 | `tourist` | Khách du lịch _(không vào được admin panel)_ |

---

## Nhóm role (ROLE_GROUPS)

| Tên nhóm | Roles | Mô tả |
|---|---|---|
| `ALL_ADMIN` | 1, 2, 3, 4, 5, 6 | Tất cả role vào được admin (trừ tourist) |
| `MANAGEMENT` | 1, 2, 3 | Admin + Bộ + Sở — quản lý nội dung hệ thống |
| `CATALOG` | 1 | Chỉ Admin — danh mục điểm & bản đồ (Bộ & Sở đều bị backend block) |
| `NATIONAL` | 1, 2 | Admin + Bộ — dashboard & thống kê quốc gia (Sở bị backend block) |
| `CONTENT` | 1, 2, 3, 4 | Management + Đơn vị vận hành — quản lý điểm |
| `TOUR` | 1, 2, 3, 4, 5 | Content + Công ty lữ hành — quản lý tour |
| `ENTERPRISE` | 5, 6 | Công ty lữ hành + Dịch vụ — xem đánh giá doanh nghiệp |

---

## Bảng route → roles

| Route | Roles được phép | Nhóm |
|---|---|---|
| `/` `/governance` | 1–6 | ALL_ADMIN (redirect theo role) |
| `/profile` `/change-password` | 1–6 | ALL_ADMIN |
| `/public/map-layer-apis` | 1–6 | ALL_ADMIN (public map) |
| **— Quản trị hệ thống —** | | |
| `/users` | **1** | system_admin only |
| `/roles` | **1** | system_admin only |
| `/audit-logs` | **1** | system_admin only |
| `/integrations` | **1** | system_admin only |
| `/governance/admin` | **1** | system_admin only |
| **— Dashboard & Nội dung —** | | |
| `/dashboard` | 1, 2 | NATIONAL |
| `/statistics` | 1, 2 | NATIONAL |
| `/categories` | 1, 3 | CATALOG |
| `/vlogs` | 1, 2, 3 | MANAGEMENT |
| `/news` | 1, 2, 3 | MANAGEMENT |
| `/news-comments` | 1, 2, 3 | MANAGEMENT |
| `/businesses` | 1, 2, 3 | MANAGEMENT |
| `/map-layers` | 1, 3 | CATALOG |
| `/map-admin-categories` | 1, 3 | CATALOG |
| `/map-layer-apis/*` | 1, 3 | CATALOG |
| **— Điểm du lịch —** | | |
| `/spots` | 1, 2, 3, 4 | CONTENT |
| `/culinary` | 1, 2, 3, 4 | CONTENT |
| `/festivals` | 1, 2, 3, 4 | CONTENT |
| `/capacity` | 1, 2, 3, 4 | CONTENT |
| `/ratings/spots` | 1, 2, 3, 4 | CONTENT |
| `/ratings/businesses` | 1, 2, 3, 4 | CONTENT |
| **— Tour —** | | |
| `/tours` | 1, 2, 3, 4, 5 | TOUR |
| **— Chung cho tất cả admin —** | | |
| `/ocop` | 1, 2, 3, 4, 5, 6 | ALL_ADMIN |
| `/feedbacks` | 1, 2, 3, 4, 5, 6 | ALL_ADMIN |
| **— Doanh nghiệp —** | | |
| `/ratings/businesses/my` | **5, 6** | ENTERPRISE |
| **— Governance —** | | |
| `/governance/ministry` | **1, 2** | system_admin + ministry |
| `/governance/department` | **1, 3** | system_admin + department |
| `/governance/enterprise` | **1, 4, 5, 6** | system_admin + operators |

---

## Quyền hạn chi tiết theo từng role

### 1 — `system_admin` · Quản trị hệ thống

Truy cập **tất cả** route trong admin panel.

| Nhóm tính năng | Route |
|---|---|
| Quản lý người dùng & role | `/users`, `/roles` |
| Nhật ký kiểm toán | `/audit-logs` |
| Tích hợp bên thứ 3 | `/integrations` |
| Dashboard toàn hệ thống | `/governance/admin` |
| Dashboard thống kê | `/dashboard`, `/statistics` |
| Danh mục & Điểm | `/categories`, `/spots`, `/culinary`, `/festivals` |
| Sức chứa | `/capacity` |
| Tour | `/tours` |
| Nội dung | `/news`, `/news-comments`, `/vlogs`, `/ocop` |
| Doanh nghiệp | `/businesses`, `/ratings/businesses`, `/ratings/businesses/my` |
| Đánh giá điểm | `/ratings/spots` |
| Phản ánh | `/feedbacks` |
| Bản đồ | `/map-layers`, `/map-admin-categories`, `/map-layer-apis/*` |
| Governance | `/governance/admin`, `/governance/ministry`, `/governance/department`, `/governance/enterprise` |

---

### 2 — `ministry_manager` · Bộ Văn hóa Thể thao và Du lịch

Quản lý nội dung cấp quốc gia + tổng quan Bộ. Không có quyền quản lý user/role/audit/integrations. Backend block danh mục điểm và bản đồ.

| Nhóm tính năng | Route |
|---|---|
| Dashboard & thống kê | `/dashboard`, `/statistics` |
| Nội dung | `/news`, `/news-comments`, `/vlogs` |
| Doanh nghiệp | `/businesses` |
| Điểm & Sức chứa | `/spots`, `/culinary`, `/festivals`, `/capacity` |
| Đánh giá | `/ratings/spots`, `/ratings/businesses` |
| Tour | `/tours` |
| OCOP & Phản ánh | `/ocop`, `/feedbacks` |
| Governance Bộ | `/governance/ministry` |
| ~~Danh mục điểm~~ | ~~`/categories`~~ _(403 từ backend)_ |
| ~~Bản đồ~~ | ~~`/map-layers`, `/map-admin-categories`, `/map-layer-apis/*`~~ _(403 từ backend)_ |

---

### 3 — `department_manager` · Sở Văn hóa Thể thao và Du lịch

Quản lý nội dung cấp tỉnh + phê duyệt đăng ký doanh nghiệp/điểm. Không xem được Dashboard quốc gia, Governance Bộ, hoặc quản lý danh mục/bản đồ.

| Nhóm tính năng | Route |
|---|---|
| Nội dung | `/news`, `/news-comments`, `/vlogs` |
| Doanh nghiệp | `/businesses` |
| Điểm & Sức chứa | `/spots` _(yêu cầu `province_code`)_, `/culinary`, `/festivals`, `/capacity` |
| Đánh giá | `/ratings/spots`, `/ratings/businesses` |
| Tour | `/tours` |
| OCOP & Phản ánh | `/ocop`, `/feedbacks` |
| Governance Sở | `/governance/department` _(phê duyệt đăng ký, báo cáo, alerts)_ |
| ~~Dashboard & thống kê~~ | ~~`/dashboard`, `/statistics`~~ _(403 từ backend)_ |
| ~~Danh mục điểm~~ | ~~`/categories`~~ _(403 từ backend)_ |
| ~~Bản đồ~~ | ~~`/map-layers`, `/map-admin-categories`, `/map-layer-apis/*`~~ _(403 từ backend)_ |

---

### 4 — `spot_operator` · Đơn vị vận hành điểm du lịch

Quản lý điểm du lịch, sức chứa, tour. Không xem dashboard tổng hợp hoặc nội dung tin tức/bản đồ.

| Nhóm tính năng | Route |
|---|---|
| Điểm & Sức chứa | `/spots`, `/culinary`, `/festivals`, `/capacity` |
| Đánh giá điểm/doanh nghiệp | `/ratings/spots`, `/ratings/businesses` |
| Tour | `/tours` |
| OCOP & Phản ánh | `/ocop`, `/feedbacks` |
| Governance Enterprise | `/governance/enterprise` _(dashboard doanh nghiệp của mình)_ |

---

### 5 — `travel_company` · Công ty lữ hành

Quản lý tour và xem đánh giá doanh nghiệp của mình.

| Nhóm tính năng | Route |
|---|---|
| Tour | `/tours` |
| OCOP & Phản ánh | `/ocop`, `/feedbacks` |
| Đánh giá doanh nghiệp của mình | `/ratings/businesses/my` |
| Governance Enterprise | `/governance/enterprise` |

---

### 6 — `service_provider` · Đơn vị cung cấp dịch vụ du lịch

Quyền hạn tối thiểu trong admin panel: OCOP, phản ánh và đánh giá doanh nghiệp của mình.

| Nhóm tính năng | Route |
|---|---|
| OCOP & Phản ánh | `/ocop`, `/feedbacks` |
| Đánh giá doanh nghiệp của mình | `/ratings/businesses/my` |
| Governance Enterprise | `/governance/enterprise` |

---

### 7 — `tourist` · Khách du lịch

**Không truy cập được admin panel.** Chỉ dùng ứng dụng mobile/web công khai.

---

## Ma trận quyền tóm tắt

| Route | SA(1) | MI(2) | DE(3) | SO(4) | TC(5) | SP(6) | TU(7) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `/users` `/roles` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/audit-logs` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/integrations` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/governance/admin` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/dashboard` `/statistics` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/categories` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/vlogs` `/news` `/news-comments` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/businesses` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/map-layers` `/map-admin-categories` `/map-layer-apis` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/spots` `/culinary` `/festivals` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/capacity` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/ratings/spots` `/ratings/businesses` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/tours` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/ocop` `/feedbacks` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/ratings/businesses/my` | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `/governance/ministry` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/governance/department` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/governance/enterprise` | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| `/profile` `/change-password` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

> SA=system_admin · MI=ministry_manager · DE=department_manager · SO=spot_operator · TC=travel_company · SP=service_provider · TU=tourist

---

## Governance API mapping

| Governance endpoint | Role | Mô tả |
|---|---|---|
| `GET /governance/admin/dashboard` | SA | Tổng quan toàn hệ thống |
| `GET /governance/admin/traffic` | SA | Lưu lượng truy cập |
| `GET/POST /governance/admin/permissions` | SA | Quản lý permission |
| `GET/PUT /governance/admin/roles/{id}/permissions` | SA | Gán permission vào role |
| `GET /governance/ministry/overview` | SA, MI | Tổng quan cấp Bộ |
| `GET /governance/ministry/capacity-alerts` | SA, MI | Cảnh báo sức chứa |
| `GET /governance/ministry/conservation-summary` | SA, MI | Tóm tắt bảo tồn |
| `GET /governance/department/registrations/businesses` | SA, DE | Đăng ký doanh nghiệp chờ duyệt |
| `PATCH /governance/department/registrations/businesses/{id}` | SA, DE | Phê duyệt doanh nghiệp |
| `GET /governance/department/registrations/spots` | SA, DE | Đăng ký điểm chờ duyệt |
| `PATCH /governance/department/registrations/spots/{id}` | SA, DE | Phê duyệt điểm |
| `GET /governance/department/feedbacks` | SA, DE | Phản ánh cấp Sở |
| `GET/POST /governance/department/reports` | SA, DE | Báo cáo cấp Sở |
| `POST /governance/department/reports/{id}/send` | SA, DE | Gửi báo cáo |
| `GET /governance/enterprise/businesses/{id}/dashboard` | SA, SO, TC, SP | Dashboard doanh nghiệp |
| `GET /governance/enterprise/businesses/{id}/feedbacks` | SA, SO, TC, SP | Phản ánh về doanh nghiệp |
| `GET/POST /governance/enterprise/reports` | SA, SO, TC, SP | Báo cáo doanh nghiệp |
