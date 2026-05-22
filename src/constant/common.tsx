import {
  LayoutDashboard,
  MapPin,
  Video,
  Building2,
  Newspaper,
  MessageSquare,
  Map,
  Users,
  AlertTriangle,
  ClipboardList,
  BarChart2,
  Navigation,
  Gauge,
  Star,
  Plug,
  Database,
} from 'lucide-react'
import type { NavItem } from '@/types/common/index'

export const navConfig: NavItem[] = [
  {
    icon: <LayoutDashboard />,
    name: 'Dashboard',
    path: '/dashboard',
    subpath: '/',
    authen: [1, 2],
  },

  {
    icon: <BarChart2 />,
    name: 'Quản trị nâng cao',
    path: '/governance',
    authen: [1, 2, 3, 4, 5, 6],
  },

  {
    icon: <Users />,
    name: 'Quản lý người dùng',
    path: '/users',
    authen: [1],
    subItems: [
      { name: 'Người dùng', path: '/users', authen: [1] },
      { name: 'Vai trò & phân quyền', path: '/roles', authen: [1] },
    ],
  },

  {
    icon: <MapPin />,
    name: 'Điểm du lịch',
    path: '/spots',
    authen: [1, 2, 3, 4],
    subItems: [
      { name: 'Danh mục', path: '/categories', authen: [1, 2, 3] },
      { name: 'Điểm tham quan', path: '/spots', authen: [1, 2, 3, 4] },
      { name: 'Ẩm thực', path: '/culinary', authen: [1, 2, 3, 4] },
      { name: 'Lễ hội & sự kiện', path: '/festivals', authen: [1, 2, 3, 4] },
      // ocop/me → doanh nghiệp quản lý sản phẩm của mình
      { name: 'Sản phẩm OCOP', path: '/ocop', authen: [1, 2, 3, 4, 5, 6] },
    ],
  },

  // /tours – CRUD tour, travel company & spot operator cũng quản lý
  {
    icon: <Navigation />,
    name: 'Tour du lịch',
    path: '/tours',
    authen: [1, 2, 3, 4, 5],
  },

  // /capacity – sức chứa điểm đến theo thời gian thực
  {
    icon: <Gauge />,
    name: 'Sức chứa điểm đến',
    path: '/capacity',
    authen: [1, 2, 3, 4],
  },

  // businesses + businesses/me (enterprise)
  {
    icon: <Building2 />,
    name: 'Doanh nghiệp',
    path: '/businesses',
    authen: [1, 2, 3, 4, 5, 6],
  },

  {
    icon: <Video />,
    name: 'Vlog',
    path: '/vlogs',
    authen: [1, 2, 3],
  },

  {
    icon: <Newspaper />,
    name: 'Tin tức',
    path: '/news',
    authen: [1, 2, 3],
    subItems: [
      { name: 'Bài viết', path: '/news', authen: [1, 2, 3] },
      { name: 'Bình luận', path: '/news-comments', authen: [1, 2, 3] },
    ],
  },

  // ratings/business/my → enterprise xem đánh giá doanh nghiệp của mình
  {
    icon: <Star />,
    name: 'Đánh giá',
    path: '/ratings',
    authen: [1, 2, 3, 4, 5, 6],
  },

  {
    icon: <Map />,
    name: 'Bản đồ',
    path: '/map-layers',
    authen: [1, 2, 3],
    subItems: [
      { name: 'Danh mục bản đồ', path: '/map-admin-categories', authen: [1, 2, 3] },
      { name: 'Lớp bản đồ', path: '/map-layers', authen: [1, 2, 3] },
      { name: 'API & khóa truy cập', path: '/map-layer-apis', authen: [1, 2, 3] },
    ],
  },

  {
    icon: <Plug />,
    name: 'Tích hợp dịch vụ',
    path: '/integrations',
    authen: [1],
  },

  // feedbacks/admin + enterprise xem phản ánh xung quanh location
  {
    icon: <AlertTriangle />,
    name: 'Phản ánh người dân',
    path: '/feedbacks',
    authen: [1, 2, 3, 4, 5, 6],
  },

  {
    icon: <ClipboardList />,
    name: 'Nhật ký hệ thống',
    path: '/audit-logs',
    authen: [1],
  },

  {
    icon: <Database />,
    name: 'Dữ liệu thống kê',
    path: '/statistics',
    authen: [1, 2],
  },

  {
    icon: <MessageSquare />,
    name: 'Tài liệu hệ thống',
    path: 'http://103.163.119.247:8881/uploads/dl_hdsd_admin.docx',
    authen: [],
  },
]
