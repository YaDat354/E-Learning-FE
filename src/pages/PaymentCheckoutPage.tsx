import type { User } from '../domain/index.ts'

const PENDING_PAYMENT_CHECKOUT_KEY = 'pendingPaymentCheckout'

type PaymentCheckoutPageProps = {
  user: User | null
  onGoHome: () => void
  onGoToStudentCourses: () => void
}

type PendingCheckout = {
  orderId?: string
  qrCodeUrl?: string
  deeplink?: string
  paymentUrl?: string
}

function normalizeQrSource(value: string | undefined): string {
  if (!value) {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  if (trimmed.startsWith('data:image')) {
    return trimmed
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length > 120) {
    return `data:image/png;base64,${trimmed.replace(/\s+/g, '')}`
  }

  return ''
}

function PaymentCheckoutPage({ user, onGoHome, onGoToStudentCourses }: PaymentCheckoutPageProps) {
  const raw = sessionStorage.getItem(PENDING_PAYMENT_CHECKOUT_KEY)
  const data: PendingCheckout = raw ? JSON.parse(raw) : {}
  const orderId = typeof data.orderId === 'string' ? data.orderId : ''
  const deeplink = typeof data.deeplink === 'string' ? data.deeplink : ''
  const paymentUrl = typeof data.paymentUrl === 'string' ? data.paymentUrl : ''
  const qrSource = normalizeQrSource(typeof data.qrCodeUrl === 'string' ? data.qrCodeUrl : '')

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 10 }}>Thanh toán VNPAY</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
        Mở trang VNPAY hoặc quét mã QR (nếu BE trả về) để hoàn tất thanh toán khóa học.
      </p>

      {orderId && <p style={{ marginBottom: 12 }}>Mã đơn: <strong>{orderId}</strong></p>}

      {qrSource ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'inline-block', marginBottom: 16 }}>
          <img src={qrSource} alt="VNPAY QR" style={{ width: 280, height: 280, objectFit: 'contain', display: 'block' }} />
        </div>
      ) : (
        <p style={{ marginBottom: 16, color: '#b45309' }}>
          BE chưa trả ảnh QR. Bạn có thể mở liên kết VNPAY bên dưới nếu có.
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {paymentUrl && /^https?:\/\//i.test(paymentUrl) && (
          <a href={paymentUrl} target="_blank" rel="noreferrer" style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--brand)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
            Mở trang thanh toán
          </a>
        )}
        {deeplink && (
          <a href={deeplink} style={{ padding: '10px 14px', borderRadius: 10, background: '#ecfeff', color: '#0f766e', textDecoration: 'none', fontWeight: 600, border: '1px solid #99f6e4' }}>
            Mở ứng dụng ngân hàng/VNPAY
          </a>
        )}
      </div>

      <p style={{ marginBottom: 20, color: 'var(--muted)' }}>
        {user ? 'Sau khi thanh toán xong, bạn quay lại ứng dụng để vào Khóa học của tôi.' : 'Sau khi thanh toán xong, hãy đăng nhập để xem khóa học đã mua.'}
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onGoToStudentCourses} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: 'var(--brand)', color: '#fff', cursor: 'pointer' }}>
          Vào khóa học của tôi
        </button>
        <button onClick={onGoHome} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>
          Về trang chủ
        </button>
      </div>
    </div>
  )
}

export default PaymentCheckoutPage