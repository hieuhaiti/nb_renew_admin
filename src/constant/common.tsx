import {
  LayoutDashboard,
  MapPin,
  Video,
  Building2,
  Newspaper,
  // MessageSquare,
  Map,
  Users,
  AlertTriangle,
  ClipboardList,
  BarChart2,
  Navigation,
  Gauge,
  ShoppingBag,
  // ShieldCheck,
  // LifeBuoy,
  // Plug,
  Database,
} from 'lucide-react'
import type { NavItem } from '@/types/common/index'
import { combineAccess, PAGE_ACCESS } from '@/constant/permissionConstant'
import { BUSINESS_REPRESENTATIVE_ROLE_IDS, ROLE_IDS } from '@/constant/roleConstant'

// Sidebar chỉ đọc PAGE_ACCESS: page nào cần permission nào.
// Role -> permission nằm trong permissionConstant.ts; không gọi endpoint admin-only tại đây.
const tourismAccess = combineAccess(
  PAGE_ACCESS.categories,
  PAGE_ACCESS.spots,
  PAGE_ACCESS.aframeScenes,
  PAGE_ACCESS.culinary,
  PAGE_ACCESS.festivals,
  PAGE_ACCESS.ocop,
  PAGE_ACCESS.ratingSpots
)

const businessAccess = combineAccess(
  PAGE_ACCESS.businesses,
  PAGE_ACCESS.ratingBusinesses,
  PAGE_ACCESS.ratingMyBusiness
)

const businessRepresentativeRoleNames = Object.fromEntries(
  BUSINESS_REPRESENTATIVE_ROLE_IDS.map((roleId) => [roleId, 'Doanh nghiệp của tôi'])
) as Partial<Record<number, string>>

export const navConfig: NavItem[] = [
  {
    icon: <LayoutDashboard />,
    name: 'Dashboard',
    path: '/dashboard',
    subpath: '/',
    access: PAGE_ACCESS.dashboard,
  },

  {
    icon: <BarChart2 />,
    name: 'Quản trị nâng cao',
    path: '/governance',
    access: PAGE_ACCESS.governance,
    subItems: [
      { name: 'Tổng quan', path: '/governance', access: PAGE_ACCESS.governance },
      { name: 'Báo cáo', path: '/governance/reports', access: PAGE_ACCESS.governance },
    ],
  },

  {
    icon: <Users />,
    name: 'Quản lý người dùng',
    path: '/users',
    access: PAGE_ACCESS.users,
    subItems: [
      { name: 'Người dùng', path: '/users', access: PAGE_ACCESS.users },
      { name: 'Vai trò & phân quyền', path: '/roles', access: PAGE_ACCESS.roles },
    ],
  },

  {
    icon: <MapPin />,
    name: 'Điểm du lịch',
    roleNames: {
      [ROLE_IDS.SERVICE_PROVIDER]: 'Dịch vụ',
    },
    path: '/spots',
    access: tourismAccess,
    subItems: [
      { name: 'Danh mục', path: '/categories', access: PAGE_ACCESS.categories },
      { name: 'Điểm tham quan', path: '/spots', access: PAGE_ACCESS.spots },
      { name: 'Cảnh VR A-Frame', path: '/aframe-scenes', access: PAGE_ACCESS.aframeScenes },
      { name: 'Ẩm thực', path: '/culinary', access: PAGE_ACCESS.culinary },
      { name: 'Lễ hội & sự kiện', path: '/festivals', access: PAGE_ACCESS.festivals },
      { name: 'Đánh giá', path: '/ratings/spots', access: PAGE_ACCESS.ratingSpots },
    ],
  },

  // /ocop - trang quản trị sản phẩm OCOP, cần quyền thao tác ocop:create/update/delete
  {
    icon: <ShoppingBag />,
    name: 'Sản phẩm OCOP',
    path: '/ocop',
    access: PAGE_ACCESS.ocop,
  },

  // /tours - trang quản trị tour, cần quyền thao tác tours:create/update/delete
  {
    icon: <Navigation />,
    name: 'Tour du lịch',
    path: '/tours',
    access: PAGE_ACCESS.tours,
  },

  // /capacity - xem sức chứa điểm bằng spots_capacity:read; thao tác ghi/sửa kiểm tra riêng trong page
  {
    icon: <Gauge />,
    name: 'Sức chứa điểm đến',
    path: '/capacity',
    access: PAGE_ACCESS.capacity,
    subItems: [
      { name: 'Điểm đến', path: '/capacity', access: PAGE_ACCESS.spots_capacity },
      { name: 'Tuyến du lịch', path: '/capacity/routes', access: PAGE_ACCESS.tour_capacity },
    ],
  },

  {
    icon: <Building2 />,
    name: 'Doanh nghiệp',
    path: '/businesses',
    access: businessAccess,
    subItems: [
      {
        name: 'Doanh nghiệp',
        path: '/businesses',
        access: PAGE_ACCESS.businesses,
        roleNames: businessRepresentativeRoleNames,
      },
      { name: 'Đánh giá', path: '/ratings/businesses', access: PAGE_ACCESS.ratingBusinesses },
      {
        name: 'Đánh giá của tôi',
        path: '/ratings/businesses/my',
        access: PAGE_ACCESS.ratingMyBusiness,
      },
    ],
  },

  {
    icon: <Video />,
    name: 'Vlog',
    path: '/vlogs',
    access: PAGE_ACCESS.vlogs,
  },

  {
    icon: <Newspaper />,
    name: 'Tin tức',
    path: '/news',
    access: PAGE_ACCESS.news,
    subItems: [
      { name: 'Bài viết', path: '/news', access: PAGE_ACCESS.news },
      { name: 'Bình luận', path: '/news-comments', access: PAGE_ACCESS.news },
    ],
  },

  {
    icon: <Map />,
    name: 'Bản đồ',
    path: '/map-layers',
    access: PAGE_ACCESS.mapAdmin,
    subItems: [
      { name: 'Danh mục bản đồ', path: '/map-admin-categories', access: PAGE_ACCESS.mapAdmin },
      { name: 'Lớp bản đồ', path: '/map-layers', access: PAGE_ACCESS.mapAdmin },
      { name: 'API & khóa truy cập', path: '/map-layer-apis', access: PAGE_ACCESS.mapAdmin },
    ],
  },

  // {
  //   icon: <Plug />,
  //   name: 'Tích hợp dịch vụ',
  //   path: '/integrations',
  //   ...PAGE_ACCESS.integrations,
  // },

  // feedbacks - trang xử lý phản ánh, cần feedbacks:update hoặc feedbacks:delete
  {
    icon: <AlertTriangle />,
    name: 'Phản ánh người dân',
    path: '/feedbacks',
    access: PAGE_ACCESS.feedbacks,
  },

  {
    icon: <ClipboardList />,
    name: 'Nhật ký hệ thống',
    path: '/audit-logs',
    access: PAGE_ACCESS.auditLogs,
  },

  {
    icon: <Database />,
    name: 'Dữ liệu thống kê',
    path: '/statistics',
    access: PAGE_ACCESS.statistics,
  },

  // {
  //   icon: <ShieldCheck />,
  //   name: 'Chính sách bảo mật',
  //   path: 'https://dulich.tourismpj.pro.vn/privacy-policy',
  // },

  // {
  //   icon: <LifeBuoy />,
  //   name: 'Hỗ trợ',
  //   path: 'https://dulich.tourismpj.pro.vn/support',
  // },

  // {
  //   icon: <MessageSquare />,
  //   name: 'Tài liệu hệ thống',
  //   path: 'http://103.163.119.247:8881/uploads/dl_hdsd_admin.docx',
  // },
]
