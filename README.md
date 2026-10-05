# 🔧 Nền Tảng Du Lịch Số Ninh Bình - Phân Hệ Quản Trị (Admin)

<p align="center">
  <strong>Hệ thống quản trị dữ liệu du lịch, WebGIS và nội dung số</strong>
</p>

---

## 📋 Giới thiệu

Ứng dụng **Admin Panel** cung cấp giao diện quản trị cho:

- 🛰️ Quản lý ảnh vệ tinh
- 🗺️ Quản lý lớp dữ liệu GIS
- 👥 Quản lý người dùng & phân quyền
- 📰 Quản lý tin tức
- 📝 Xử lý phản ánh người dân
- 📊 Báo cáo & thống kê

---

## 🛠️ Tech Stack

| Loại            | Công nghệ                    |
| --------------- | ---------------------------- |
| **Framework**   | React 19.2 + Vite 7.2        |
| **Language**    | TypeScript 5.9 (Strict mode) |
| **Styling**     | Tailwind CSS 4.1 + shadcn/ui |
| **State**       | Zustand 5 + TanStack Query 5 |
| **Tables**      | TanStack Table 8             |
| **Forms**       | React Hook Form 7 + Zod 3    |
| **Routing**     | React Router 7               |
| **Rich Text**   | TipTap                       |
| **File Upload** | react-dropzone               |
| **Export**      | jsPDF + xlsx                 |
| **Icons**       | Lucide React                 |

---

## 🚀 Cài đặt

### Yêu cầu

- Node.js >= 20.x
- npm >= 10.x

### Cài đặt dependencies

```bash
npm install
```

### Chạy development server

```bash
npm run dev
```

Mở trình duyệt tại: `http://localhost:5174`

### Build production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

---

## 📁 Cấu trúc thư mục

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── common/          # Shared components (DataTable, FileUpload, etc.)
│   ├── layout/          # Layout components (Sidebar, Header, etc.)
│   └── features/        # Feature-specific components
│       ├── satellite/   # Satellite management
│       ├── layers/      # Layer management
│       ├── users/       # User management
│       ├── categories/  # Category management
│       ├── news/        # News management
│       ├── feedback/    # Feedback management
│       ├── api-management/  # API management
│       └── monitoring/  # Activity logs & stats
├── schemas/             # Zod validation schemas
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── pages/               # Route pages
├── stores/              # Zustand stores
├── types/               # TypeScript types
├── constants/           # Constants (roles, permissions, routes)
└── styles/              # CSS styles
```

---

## 🔧 Environment Variables

Tạo file `.env` tại thư mục gốc:

```env
VITE_API_BASE_URL=https://api.example.com
VITE_MAX_FILE_SIZE=52428800
```

---

## 👥 Vai trò & Phân quyền

| Vai trò | Mã vai trò (code) | Mô tả & Trách nhiệm chính |
|---|---|---|
| **Quản trị hệ thống** | `system_admin` | Quản trị toàn diện: người dùng, vai trò, audit log, cấu hình bản đồ |
| **Bộ Văn hóa Thể thao và Du lịch** | `ministry_manager` | Giám sát tổng thể du lịch cấp quốc gia/ngành, xem báo cáo tổng hợp |
| **Sở Văn hóa Thể thao và Du lịch** | `department_manager` | Quản lý nhà nước địa phương: phê duyệt hồ sơ DN, xử lý phản ánh, thống kê tỉnh |
| **Đơn vị vận hành điểm du lịch** | `spot_operator` | Quản lý điểm du lịch, giám sát sức chứa, tiếp nhận phản ánh điểm đến |
| **Công ty lữ hành** | `travel_company` | Quản lý tour du lịch, điều phối đoàn, theo dõi sức chứa & cảnh báo ùn tắc |
| **Đơn vị cung cấp dịch vụ du lịch** | `service_provider` | Quản lý cơ sở kinh doanh, dịch vụ, sản phẩm OCOP, voucher ưu đãi |
| **Khách du lịch** | `tourist` | Người dùng cuối ứng dụng client: tra cứu điểm đến, đặt dịch vụ, gửi phản ánh |

---

## ✨ Tính năng chính

### 🛰️ Quản lý ảnh vệ tinh

- Upload ảnh vệ tinh
- Quản lý metadata (ngày chụp, độ phân giải, etc.)
- Phân loại (optical, radar, thermal, multispectral)

### 🗺️ Quản lý lớp dữ liệu

- CRUD lớp GIS
- Import Shapefile (.zip)
- Cấu hình style (màu, độ dày, etc.)
- Phân quyền xem/sửa theo vai trò

### 👥 Quản lý người dùng

- CRUD người dùng
- Gán vai trò
- Xem lịch sử hoạt động
- Khóa/mở khóa tài khoản

### 📰 Quản lý tin tức

- Rich text editor (TipTap)
- Upload hình ảnh
- Trạng thái: draft, published, archived
- Featured articles

### 📝 Quản lý phản ánh

- Danh sách phản ánh từ người dân
- Duyệt/từ chối phản ánh
- Ghi chú xử lý
- Xem vị trí trên bản đồ

### 📊 Báo cáo & Export

- Dashboard thống kê
- Export PDF với jsPDF
- Export Excel với xlsx
- Activity logs

---

## 📝 Scripts

| Script            | Mô tả                                       |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Chạy development server                     |
| `npm run build`   | Build production (bao gồm TypeScript check) |
| `npm run preview` | Preview production build                    |
| `npm run lint`    | Kiểm tra ESLint                             |

---

## 🔐 RBAC Permissions

```typescript
// Ví dụ permission constants
const PERMISSIONS = {
  SATELLITE_VIEW: "satellite.view",
  SATELLITE_CREATE: "satellite.create",
  SATELLITE_EDIT: "satellite.edit",
  SATELLITE_DELETE: "satellite.delete",

  LAYER_VIEW: "layer.view",
  LAYER_CREATE: "layer.create",
  // ...
};
```

---

## 📝 License

Copyright © 2026 Du Lịch Ninh Bình. All rights reserved.
