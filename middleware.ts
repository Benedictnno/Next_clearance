import { NextResponse, type NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const SESSION_COOKIE = 'session'

function getSession(req: NextRequest): { userId: number; role: 'student' | 'admin' | 'officer' } | null {
	const token = req.cookies.get(SESSION_COOKIE)?.value
	if (!token) return null
	try {
		const secret = process.env.SESSION_SECRET
		if (!secret) return null
		return jwt.verify(token, secret) as any
	} catch {
		return null
	}
}

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl
	const session = getSession(req)

	const isStudentArea = pathname.startsWith('/student')
	const isOfficerArea = pathname.startsWith('/officer')
	const isAdminArea = pathname.startsWith('/admin')

	if (isStudentArea) {
		if (!session || session.role !== 'student') {
			const url = req.nextUrl.clone()
			url.pathname = '/login'
			return NextResponse.redirect(url)
		}
	}

	if (isOfficerArea) {
		if (!session || session.role !== 'officer') {
			const url = req.nextUrl.clone()
			url.pathname = '/officer/login'
			return NextResponse.redirect(url)
		}
	}

	if (isAdminArea) {
		if (!session || session.role !== 'admin') {
			const url = req.nextUrl.clone()
			url.pathname = '/admin/login'
			return NextResponse.redirect(url)
		}
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/student/:path*', '/officer/:path*', '/admin/:path*']
}
