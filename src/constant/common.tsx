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
  // Plug,
  Database,
} from 'lucide-react'
import type { NavItem } from '@/types/common/index'
import { ROLE_GROUPS, ROLE_IDS } from '@/constant/roleConstant'

const ADMIN = [ROLE_IDS.SYSTEM_ADMIN] as number[]

export const navConfig: NavItem[] = [
  {
    icon: <LayoutDashboard />,
    name: 'Dashboard',
    path: '/dashboard',
    subpath: '/',
    authen: [...ROLE_GROUPS.NATIONAL],
  },

  {
    icon: <BarChart2 />,
    name: 'Quản trị nâng cao',
    path: '/governance',
    authen: [...ROLE_GROUPS.ALL_ADMIN],
  },

  {
    icon: <Users />,
    name: 'Quản lý người dùng',
    path: '/users',
    authen: ADMIN,
    subItems: [
      { name: 'Người dùng', path: '/users', authen: ADMIN },
      { name: 'Vai trò & phân quyền', path: '/roles', authen: ADMIN },
    ],
  },

  {
    icon: <MapPin />,
    name: 'Điểm du lịch',
    path: '/spots',
    authen: [...ROLE_GROUPS.CONTENT],
    subItems: [
      { name: 'Danh mục', path: '/categories', authen: [...ROLE_GROUPS.CATALOG] },
      { name: 'Điểm tham quan', path: '/spots', authen: [...ROLE_GROUPS.CONTENT] },
      { name: 'Cảnh VR A-Frame', path: '/aframe-scenes', authen: [...ROLE_GROUPS.CONTENT] },
      { name: 'Ẩm thực', path: '/culinary', authen: [...ROLE_GROUPS.CONTENT] },
      { name: 'Lễ hội & sự kiện', path: '/festivals', authen: [...ROLE_GROUPS.CONTENT] },
      { name: 'Sản phẩm OCOP', path: '/ocop', authen: [...ROLE_GROUPS.ALL_ADMIN] },
      { name: 'Đánh giá', path: '/ratings/spots', authen: [...ROLE_GROUPS.CONTENT] },
    ],
  },

  // /tours – CRUD tour, travel company & spot operator cũng quản lý
  {
    icon: <Navigation />,
    name: 'Tour du lịch',
    path: '/tours',
    authen: [...ROLE_GROUPS.TOUR],
  },

  // /capacity – sức chứa điểm đến theo thời gian thực
  {
    icon: <Gauge />,
    name: 'Sức chứa điểm đến',
    path: '/capacity',
    authen: [...ROLE_GROUPS.CONTENT],
  },

  {
    icon: <Building2 />,
    name: 'Doanh nghiệp',
    path: '/businesses',
    authen: [...ROLE_GROUPS.ALL_ADMIN],
    subItems: [
      { name: 'Doanh nghiệp', path: '/businesses', authen: [...ROLE_GROUPS.MANAGEMENT] },
      { name: 'Đánh giá', path: '/ratings/businesses', authen: [...ROLE_GROUPS.CONTENT] },
      {
        name: 'Đánh giá của tôi',
        path: '/ratings/businesses/my',
        authen: [...ROLE_GROUPS.ENTERPRISE],
      },
    ],
  },

  {
    icon: <Video />,
    name: 'Vlog',
    path: '/vlogs',
    authen: [...ROLE_GROUPS.MANAGEMENT],
  },

  {
    icon: <Newspaper />,
    name: 'Tin tức',
    path: '/news',
    authen: [...ROLE_GROUPS.MANAGEMENT],
    subItems: [
      { name: 'Bài viết', path: '/news', authen: [...ROLE_GROUPS.MANAGEMENT] },
      { name: 'Bình luận', path: '/news-comments', authen: [...ROLE_GROUPS.MANAGEMENT] },
    ],
  },

  {
    icon: <Map />,
    name: 'Bản đồ',
    path: '/map-layers',
    authen: [...ROLE_GROUPS.CATALOG],
    subItems: [
      { name: 'Danh mục bản đồ', path: '/map-admin-categories', authen: [...ROLE_GROUPS.CATALOG] },
      { name: 'Lớp bản đồ', path: '/map-layers', authen: [...ROLE_GROUPS.CATALOG] },
      { name: 'API & khóa truy cập', path: '/map-layer-apis', authen: [...ROLE_GROUPS.CATALOG] },
    ],
  },

  // {
  //   icon: <Plug />,
  //   name: 'Tích hợp dịch vụ',
  //   path: '/integrations',
  //   authen: ADMIN,
  // },

  // feedbacks/admin + enterprise xem phản ánh xung quanh location
  {
    icon: <AlertTriangle />,
    name: 'Phản ánh người dân',
    path: '/feedbacks',
    authen: [...ROLE_GROUPS.ALL_ADMIN],
  },

  {
    icon: <ClipboardList />,
    name: 'Nhật ký hệ thống',
    path: '/audit-logs',
    authen: ADMIN,
  },

  {
    icon: <Database />,
    name: 'Dữ liệu thống kê',
    path: '/statistics',
    authen: [...ROLE_GROUPS.NATIONAL],
  },

  // {
  //   icon: <MessageSquare />,
  //   name: 'Tài liệu hệ thống',
  //   path: 'http://103.163.119.247:8881/uploads/dl_hdsd_admin.docx',
  //   authen: [],
  // },
]
