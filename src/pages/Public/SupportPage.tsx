import { Link } from 'react-router-dom'
import { AlertCircle, Clock, LifeBuoy, Mail, MessageSquareText, ShieldCheck } from 'lucide-react'

const supportItems = [
  {
    icon: <MessageSquareText className="size-5" />,
    title: 'Sự cố đăng nhập',
    content:
      'Kiểm tra email hoặc tên đăng nhập, mật khẩu và trạng thái tài khoản. Nếu tài khoản bị khóa, hãy liên hệ quản trị viên đơn vị.',
  },
  {
    icon: <ShieldCheck className="size-5" />,
    title: 'Phân quyền truy cập',
    content:
      'Nếu không thấy chức năng cần dùng, tài khoản có thể chưa được cấp đúng vai trò hoặc quyền thao tác cho nghiệp vụ đó.',
  },
  {
    icon: <AlertCircle className="size-5" />,
    title: 'Lỗi dữ liệu hoặc thao tác',
    content:
      'Ghi lại màn hình, đường dẫn trang, thời điểm phát sinh lỗi và thao tác vừa thực hiện để đội hỗ trợ kiểm tra nhanh hơn.',
  },
  {
    icon: <Clock className="size-5" />,
    title: 'Theo dõi yêu cầu',
    content:
      'Các yêu cầu hỗ trợ được ưu tiên theo mức độ ảnh hưởng đến vận hành, quản lý dữ liệu và trải nghiệm người dùng.',
  },
]

export default function SupportPage() {
  return (
    <main className="bg-background min-h-screen text-foreground">
      <section className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-12 sm:py-16">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg">
            <LifeBuoy className="size-7" />
          </div>
          <div className="max-w-3xl space-y-3">
            <p className="text-muted-foreground text-sm font-medium">Trung tâm hỗ trợ</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Hỗ trợ người dùng</h1>
            <p className="text-muted-foreground text-base leading-7">
              Trang này cung cấp thông tin hỗ trợ cho người dùng hệ thống Du lịch Ninh Bình khi cần
              xử lý sự cố tài khoản, phân quyền, dữ liệu hoặc thao tác quản trị.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 py-8 sm:grid-cols-2">
        {supportItems.map((item) => (
          <article key={item.title} className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="text-primary mb-4 flex items-center gap-3">
              {item.icon}
              <h2 className="text-lg font-semibold">{item.title}</h2>
            </div>
            <p className="text-muted-foreground text-sm leading-6">{item.content}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-12">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Gửi yêu cầu hỗ trợ</h2>
            <p className="text-muted-foreground mt-3 text-sm leading-6">
              Khi gửi yêu cầu, vui lòng cung cấp họ tên, đơn vị, tài khoản đăng nhập, mô tả lỗi và
              ảnh chụp màn hình nếu có. Thông tin càng đầy đủ thì thời gian xử lý càng nhanh.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:support@tourismpj.pro.vn"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors"
              >
                <Mail className="size-4" />
                support@tourismpj.pro.vn
              </a>
              <Link
                to="/login"
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors"
              >
                Đăng nhập hệ thống
              </Link>
            </div>
          </article>

          <aside className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Thông tin cần chuẩn bị</h2>
            <ul className="text-muted-foreground mt-3 space-y-2 text-sm leading-6">
              <li>Tài khoản hoặc email đăng nhập.</li>
              <li>Vai trò và đơn vị đang sử dụng.</li>
              <li>Đường dẫn trang phát sinh lỗi.</li>
              <li>Thời điểm và thao tác gây lỗi.</li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  )
}
