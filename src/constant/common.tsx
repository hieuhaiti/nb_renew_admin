import {
  LayoutDashboard,
  Tag,
  MapPin,
  Utensils,
  PartyPopper,
  Award,
  Video,
  Building2,
  Newspaper,
  MessageSquare,
  Star,
  Map,
  Key,
  Users,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react'
import type { NavItem } from '@/types/common/index'

export const navConfig: NavItem[] = [
  {
    icon: <LayoutDashboard />,
    name: 'Dashboard',
    path: '/dashboard',
    subpath: '/',
  },

  {
    icon: <Users />,
    name: 'Quản lý người dùng',
    path: '/users',
    subItems: [
      { name: 'Người dùng', path: '/users' },
      { name: 'Vai trò & phân quyền', path: '/roles' },
    ],
  },

  {
    icon: <MapPin />,
    name: 'Điểm du lịch',
    path: '/spots',
    subItems: [
      { name: 'Danh mục', path: '/categories' },
      { name: 'Điểm tham quan', path: '/spots' },
      { name: 'Ẩm thực', path: '/culinary' },
      { name: 'Lễ hội & sự kiện', path: '/festivals' },
      { name: 'Sản phẩm OCOP', path: '/ocop' },
    ],
  },

  {
    icon: <Building2 />,
    name: 'Doanh nghiệp',
    path: '/businesses',
  },

  {
    icon: <Video />,
    name: 'Vlog',
    path: '/vlogs',
  },

  {
    icon: <Newspaper />,
    name: 'Tin tức',
    path: '/news',
    subItems: [
      { name: 'Tin tức', path: '/news' },
      { name: 'Bình luận', path: '/news-comments' },
      { name: 'Đánh giá', path: '/ratings' },
    ],
  },

  {
    icon: <Map />,
    name: 'Bản đồ',
    path: '/map-layers',
    subItems: [
      { name: 'Lớp bản đồ', path: '/map-layers' },
      { name: 'API & khóa truy cập', path: '/map-layer-apis' },
    ],
  },

  {
    icon: <AlertTriangle />,
    name: 'Phản ánh người dân',
    path: '/feedbacks',
  },

  {
    icon: <ClipboardList />,
    name: 'Nhật ký hệ thống',
    path: '/audit-logs',
  },

  {
    icon: <MessageSquare />,
    name: 'Tài liệu hệ thống',
    path: 'http://103.163.119.247:8881/uploads/dl_hdsd_admin.docx',
  },
]
