import type { User } from '../domain/index.ts'

type PaymentReturnPageProps = {
	user: User | null
	onGoHome: () => void
	onGoToStudentCourses: () => void
	onRefreshStatus: () => void
}

function PaymentReturnPage({ user, onGoHome, onGoToStudentCourses, onRefreshStatus }: PaymentReturnPageProps) {
	const searchParams = new URLSearchParams(window.location.search)
	const orderId =
		searchParams.get('orderId')
		?? searchParams.get('orderIdPay')
		?? searchParams.get('requestId')
		?? searchParams.get('vnp_TxnRef')
		?? ''
	const status = (
		searchParams.get('status')
		?? searchParams.get('resultCode')
		?? searchParams.get('vnp_ResponseCode')
		?? ''
	).toLowerCase()
	const isSuccess =
		status === 'paid'
		|| status === 'success'
		|| status === '0'
		|| searchParams.get('resultCode') === '0'
		|| searchParams.get('vnp_ResponseCode') === '00'

	return (
		<div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
			<h1 style={{ marginBottom: 12 }}>Thanh toán VNPAY</h1>
			<p style={{ marginBottom: 8, color: 'var(--muted)' }}>
				{isSuccess ? 'Thanh toán đã được ghi nhận.' : 'Đang chờ xác nhận thanh toán từ hệ thống.'}
			</p>
			{orderId && <p style={{ marginBottom: 16 }}>Mã đơn: <strong>{orderId}</strong></p>}
			<p style={{ marginBottom: 24 }}>
				{user ? 'Bạn có thể quay lại danh sách khóa học để học tiếp.' : 'Hãy đăng nhập lại để xem khóa học đã mua.'}
			</p>
			<p style={{ marginBottom: 16, color: 'var(--muted)' }}>
				Nếu vừa thanh toán xong nhưng chưa thấy cập nhật, bấm "Kiểm tra lại trạng thái" (BE có thể xử lý webhook chậm vài giây).
			</p>
			<div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
				<button onClick={onRefreshStatus} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: '#f8fafc', cursor: 'pointer' }}>
					Kiểm tra lại trạng thái
				</button>
				<button onClick={onGoToStudentCourses} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--brand)', color: '#fff', cursor: 'pointer' }}>
					Vào khóa học của tôi
				</button>
				<button onClick={onGoHome} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>
					Về trang chủ
				</button>
			</div>
		</div>
	)
}

export default PaymentReturnPage