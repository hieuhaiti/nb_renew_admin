### Sở VHTTDL
| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| GET | `/department/registrations/businesses` | Đăng ký doanh nghiệp chờ duyệt | `governance:read` |
| PATCH | `/department/registrations/businesses/:id` | Duyệt/từ chối doanh nghiệp | `governance:update` |
| GET | `/department/registrations/spots` | Đăng ký điểm DL chờ duyệt | `governance:read` |
| PATCH | `/department/registrations/spots/:id` | Duyệt/từ chối điểm DL | `governance:update` |
| GET | `/department/feedbacks` | Phản ánh người dân | `governance:read` |
| POST | `/department/reports` | Tạo báo cáo | `governance:create` |
| GET | `/department/reports` | Danh sách báo cáo | `governance:read` |
| POST | `/department/reports/:id/send` | Gửi báo cáo lên Bộ | `governance:update` |
| GET | `/department/capacity-alerts` | Cảnh báo quá tải (Sở) | `governance:read` |
| GET | `/department/conservation-summary` | Giám sát khu bảo tồn (Sở) | `governance:read` |

### Doanh nghiệp
| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| POST | `/enterprise/reports` | Tạo báo cáo hoạt động | `governance:create` |
| GET | `/enterprise/reports` | Danh sách báo cáo | `governance:read` |
| GET | `/enterprise/businesses/:businessId/dashboard` | Dashboard doanh thu/tải | `governance:read` |
| PATCH | `/enterprise/businesses/:businessId` | Cập nhật thông tin DN | `governance:update` |
| GET | `/enterprise/businesses/:businessId/feedbacks` | Phản ánh gần doanh nghiệp | `governance:read` |

### Quản trị hệ thống
| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| GET | `/admin/dashboard` | Dashboard tổng quan hệ thống | `governance:read` |
| GET | `/admin/traffic` | Phân tích lưu lượng truy cập | `governance:read` |
| GET | `/admin/permissions` | Danh sách quyền hệ thống | `permissions:read` |
| POST | `/admin/permissions` | Tạo quyền mới | `permissions:create` |
| GET | `/admin/roles/:roleId/permissions` | Quyền của role | `roles:read` |
| PUT | `/admin/roles/:roleId/permissions` | Thay thế toàn bộ quyền của role | `roles:update` |

---


api/v1/governance/admin/dashboard

{
"message": "Dashboard quản trị hệ thống",
"status": 200,
"data": {
"total_users": 14,
"active_users": 14,
"total_news": 18,
"total_map_categories": 0,
"total_map_layers": 0,
"total_map_apis": 0,
"total_permissions": 74,
"audit_logs_in_range": 228,
"visits_in_range": 0,
"total_cuisine_items": 0,
"total_festivals": 8,
"total_ocop_products": 12
}
}

api/v1/governance/ministry/overview
{
"message": "Tổng quan điều hành cấp Bộ",
"status": 200,
"data": {
"period": {
"fromDate": "2026-05-01T05:00:00.000Z",
"toDate": "2026-05-20T12:31:00.326Z"
},
"aggregate": {
"total_spots": 119,
"total_service_units": 10,
"new_businesses": 10,
"reported_revenue_vnd": 0
},
"provinces": [
{
"province_code": "37",
"province_name": "Ninh Bình",
"spot_count": "119",
"service_unit_count": "10",
"new_business_count": "10",
"reported_revenue_vnd": "0"
},
{
"province_code": "04",
"province_name": "Cao Bằng",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "08",
"province_name": "Tuyên Quang",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "11",
"province_name": "Điện Biên",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "12",
"province_name": "Lai Châu",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "14",
"province_name": "Sơn La",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "15",
"province_name": "Lào Cai",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "19",
"province_name": "Thái Nguyên",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "20",
"province_name": "Lạng Sơn",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "22",
"province_name": "Quảng Ninh",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "24",
"province_name": "Bắc Ninh",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "25",
"province_name": "Phú Thọ",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "31",
"province_name": "Hải Phòng",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "33",
"province_name": "Hưng Yên",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "38",
"province_name": "Thanh Hóa",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "40",
"province_name": "Nghệ An",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "42",
"province_name": "Hà Tĩnh",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "44",
"province_name": "Quảng Trị",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "46",
"province_name": "Huế",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "48",
"province_name": "Đà Nẵng",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "51",
"province_name": "Quảng Ngãi",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "52",
"province_name": "Gia Lai",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "56",
"province_name": "Khánh Hòa",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "66",
"province_name": "Đắk Lắk",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "68",
"province_name": "Lâm Đồng",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "75",
"province_name": "Đồng Nai",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "79",
"province_name": "Hồ Chí Minh",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "80",
"province_name": "Tây Ninh",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "82",
"province_name": "Đồng Tháp",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "86",
"province_name": "Vĩnh Long",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "91",
"province_name": "An Giang",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "92",
"province_name": "Cần Thơ",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "01",
"province_name": "Hà Nội",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
},
{
"province_code": "96",
"province_name": "Cà Mau",
"spot_count": "0",
"service_unit_count": "0",
"new_business_count": "0",
"reported_revenue_vnd": "0"
}
],
"overload_alerts": {
"total": 0,
"items": []
},
"conservation_monitoring": {
"total": 0,
"items": []
}
}
}
