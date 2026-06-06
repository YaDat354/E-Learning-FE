import api from '../lib/api.ts'

export type PaymentGateway = 'vnpay'

export type VnpayCheckoutRequest = {
	courseId: string
	courseTitle: string
	amount: number
	customerName: string
	customerEmail: string
}

export type VnpayCheckoutResult = {
	orderId: string
	paymentUrl?: string
	deeplink?: string
	qrCodeUrl?: string
	gateway: PaymentGateway
	status: 'pending' | 'paid' | 'failed'
	message?: string
}

type CheckoutPayload = {
	orderId?: unknown
	order_id?: unknown
	requestId?: unknown
	request_id?: unknown
	transId?: unknown
	trans_id?: unknown
	partnerRefId?: unknown
	partner_ref_id?: unknown
	paymentUrl?: unknown
	payment_url?: unknown
	vnpUrl?: unknown
	vnpayUrl?: unknown
	vnp_url?: unknown
	vnpay_url?: unknown
	payUrl?: unknown
	checkoutUrl?: unknown
	checkout_url?: unknown
	redirectUrl?: unknown
	redirect_url?: unknown
	paymentLink?: unknown
	url?: unknown
	deeplink?: unknown
	deepLink?: unknown
	deep_link?: unknown
	deeplinkMiniApp?: unknown
	qrCodeUrl?: unknown
	qr_code_url?: unknown
	qrImageUrl?: unknown
	qr_image_url?: unknown
	qrCode?: unknown
	qr_code?: unknown
	qrDataUrl?: unknown
	qr_data_url?: unknown
	status?: unknown
	responseCode?: unknown
	response_code?: unknown
	message?: unknown
	error?: unknown
}

const VNPAY_CHECKOUT_ENDPOINTS = [
	'/payments/vnpay/checkout',
	'/payments/vnpay/create-payment-url',
	'/payments/vnpay/create',
	'/payments/checkout/vnpay',
]

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function extractCheckoutPayload(payload: unknown): CheckoutPayload {
	const root = asRecord(payload)
	const data = asRecord(root.data)

	return {
		orderId: data.orderId ?? data.order_id ?? data.requestId ?? data.request_id ?? data.transId ?? data.trans_id ?? data.partnerRefId ?? data.partner_ref_id ?? root.orderId ?? root.order_id ?? root.requestId ?? root.request_id ?? root.transId ?? root.trans_id ?? root.partnerRefId ?? root.partner_ref_id,
		requestId: data.requestId ?? root.requestId,
		transId: data.transId ?? root.transId,
		partnerRefId: data.partnerRefId ?? root.partnerRefId,
		paymentUrl: data.paymentUrl ?? data.payment_url ?? data.vnpUrl ?? data.vnpayUrl ?? data.vnp_url ?? data.vnpay_url ?? data.payUrl ?? data.checkoutUrl ?? data.checkout_url ?? data.redirectUrl ?? data.redirect_url ?? data.paymentLink ?? data.url ?? root.paymentUrl ?? root.payment_url ?? root.vnpUrl ?? root.vnpayUrl ?? root.vnp_url ?? root.vnpay_url ?? root.payUrl ?? root.checkoutUrl ?? root.checkout_url ?? root.redirectUrl ?? root.redirect_url ?? root.paymentLink ?? root.url,
		deeplink: data.deeplink ?? data.deepLink ?? data.deep_link ?? data.deeplinkMiniApp ?? root.deeplink ?? root.deepLink ?? root.deep_link ?? root.deeplinkMiniApp,
		qrCodeUrl: data.qrCodeUrl ?? data.qr_code_url ?? data.qrImageUrl ?? data.qr_image_url ?? data.qrCode ?? data.qr_code ?? data.qrDataUrl ?? data.qr_data_url ?? root.qrCodeUrl ?? root.qr_code_url ?? root.qrImageUrl ?? root.qr_image_url ?? root.qrCode ?? root.qr_code ?? root.qrDataUrl ?? root.qr_data_url,
		status: data.status ?? data.responseCode ?? data.response_code ?? root.status ?? root.responseCode ?? root.response_code,
		message: data.message ?? data.error ?? root.message ?? root.error,
	}
}

function buildUrl(path: string) {
	return `${window.location.origin}${path}`
}

function normalizeCheckoutRequestBody(request: VnpayCheckoutRequest) {
	return {
		...request,
		gateway: 'vnpay',
		courseName: request.courseTitle,
		description: request.courseTitle,
		orderInfo: `Thanh toan khoa hoc ${request.courseTitle}`,
		customer: {
			name: request.customerName,
			email: request.customerEmail,
		},
		returnUrl: buildUrl('/payment-return'),
		callbackUrl: buildUrl('/payment-webhook'),
		ipnUrl: buildUrl('/payment-webhook'),
	}
}

async function postVnpayCheckout(request: VnpayCheckoutRequest): Promise<unknown> {
	const body = normalizeCheckoutRequestBody(request)
	let lastError: unknown = null

	for (const endpoint of VNPAY_CHECKOUT_ENDPOINTS) {
		try {
			const { data } = await api.post(endpoint, body)
			return data
		} catch (error) {
			lastError = error
			const status = asRecord((error as { response?: unknown })?.response).status
			if (status === 404 || status === 405) {
				continue
			}
			throw error
		}
	}

	throw lastError instanceof Error ? lastError : new Error('VNPAY checkout endpoint not found')
}

export async function createVnpayCheckout(request: VnpayCheckoutRequest): Promise<VnpayCheckoutResult> {
	const data = await postVnpayCheckout(request)

	const payload = extractCheckoutPayload(data)
	const orderId = typeof payload.orderId === 'string' && payload.orderId.trim().length > 0
		? payload.orderId
		: `vnpay_${Date.now()}`
	const paymentUrl = typeof payload.paymentUrl === 'string' && payload.paymentUrl.trim().length > 0 ? payload.paymentUrl : undefined
	const deeplink = typeof payload.deeplink === 'string' && payload.deeplink.trim().length > 0 ? payload.deeplink : undefined
	const qrCodeUrl = typeof payload.qrCodeUrl === 'string' && payload.qrCodeUrl.trim().length > 0 ? payload.qrCodeUrl : undefined
	const rawStatus = typeof payload.status === 'string' ? payload.status.toLowerCase() : ''
	const status = rawStatus === 'paid' || rawStatus === 'success' || rawStatus === '00'
		? 'paid'
		: rawStatus === 'failed' || rawStatus === 'error'
			? 'failed'
			: 'pending'

	if (!paymentUrl && !deeplink && !qrCodeUrl) {
		throw new Error('Missing paymentUrl/qrCodeUrl/deeplink from payment checkout response')
	}

	return {
		orderId,
		paymentUrl,
		deeplink,
		qrCodeUrl,
		gateway: 'vnpay',
		status,
		message: typeof payload.message === 'string' && payload.message.trim().length > 0 ? payload.message : undefined,
	}
}