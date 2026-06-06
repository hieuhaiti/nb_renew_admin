import { Link } from 'react-router-dom'
import { Database, Eye, FileText, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'

const policySections = [
  {
    icon: <Database className="size-5" />,
    title: 'Thông tin được thu thập',
    content:
      'Hệ thống có thể lưu thông tin tài khoản, thông tin liên hệ, nhật ký thao tác, nội dung quản trị du lịch và dữ liệu kỹ thuật cần thiết để vận hành dịch vụ.',
  },
  {
    icon: <Eye className="size-5" />,
    title: 'Mục đích sử dụng',
    content:
      'Dữ liệu được dùng để xác thực người dùng, phân quyền truy cập, xử lý nghiệp vụ, hỗ trợ quản trị, cải thiện chất lượng dịch vụ và đáp ứng yêu cầu quản lý nhà nước.',
  },
  {
    icon: <LockKeyhole className="size-5" />,
    title: 'Bảo vệ dữ liệu',
    content:
      'Chúng tôi áp dụng kiểm soát truy cập theo vai trò, quản lý phiên đăng nhập và các biện pháp kỹ thuật phù hợp để hạn chế truy cập trái phép.',
  },
  {
    icon: <FileText className="size-5" />,
    title: 'Lưu trữ và chia sẻ',
    content:
      'Dữ liệu chỉ được lưu trong thời gian cần thiết cho hoạt động hệ thống, nghĩa vụ pháp lý hoặc yêu cầu nghiệp vụ. Việc chia sẻ dữ liệu chỉ thực hiện khi có căn cứ hợp lệ.',
  },
]

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-background min-h-screen text-foreground">
      <section className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-12 sm:py-16">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg">
            <ShieldCheck className="size-7" />
          </div>
          <div className="max-w-3xl space-y-3">
            <p className="text-muted-foreground text-sm font-medium">Cập nhật: 06/06/2026</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Chính sách bảo mật</h1>
            <p className="text-muted-foreground text-base leading-7">
              Chính sách này mô tả cách hệ thống Du lịch Ninh Bình thu thập, sử dụng, lưu trữ và
              bảo vệ dữ liệu trong quá trình cung cấp dịch vụ tại dulich.tourismpj.pro.vn.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 py-8 sm:grid-cols-2">
        {policySections.map((section) => (
          <article key={section.title} className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="text-primary mb-4 flex items-center gap-3">
              {section.icon}
              <h2 className="text-lg font-semibold">{section.title}</h2>
            </div>
            <p className="text-muted-foreground text-sm leading-6">{section.content}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-12">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Quyền của người dùng</h2>
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            Người dùng có thể yêu cầu kiểm tra, cập nhật hoặc hỗ trợ xử lý thông tin tài khoản khi
            phát hiện dữ liệu chưa chính xác. Các yêu cầu sẽ được xem xét theo phạm vi quyền hạn,
            quy định vận hành hệ thống và quy định pháp luật liên quan.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/support"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors"
            >
              <Mail className="size-4" />
              Liên hệ hỗ trợ
            </Link>
            <Link
              to="/login"
              className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors"
            >
              Đăng nhập hệ thống
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
