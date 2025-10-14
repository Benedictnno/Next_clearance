"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [userType, setUserType] = useState('student')
	const [err, setErr] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		setErr(null)
		setLoading(true)
		
		try {
			const endpoint = userType === 'student' 
				? '/api/auth/student/signin'
				: userType === 'officer'
					? '/api/auth/officer/signin'
					: '/api/auth/admin/signin'
					
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			})
			
			if (res.ok) {
				window.location.href = `/${userType}/dashboard`
			} else {
				const j = await res.json().catch(() => ({}))
				setErr(j.error || 'Login failed')
			}
		} catch (error) {
			setErr('An error occurred. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
			<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
				<div className="flex justify-center mb-6">
					<Image 
						src="/assets/eksulogo.png" 
						alt="University Logo" 
						width={100} 
						height={100} 
						className="h-20 w-auto"
					/>
				</div>
				<h1 className="text-2xl font-bold text-center mb-6">Student Clearance System</h1>
				
				{err && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						{err}
					</div>
				)}
				
				<div className="mb-4">
					<div className="flex border rounded-md overflow-hidden">
						<button 
							className={`flex-1 py-2 ${userType === 'student' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
							onClick={() => setUserType('student')}
							type="button"
						>
							Student
						</button>
						<button 
							className={`flex-1 py-2 ${userType === 'officer' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
							onClick={() => setUserType('officer')}
							type="button"
						>
							Officer
						</button>
						<button 
							className={`flex-1 py-2 ${userType === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
							onClick={() => setUserType('admin')}
							type="button"
						>
							Admin
						</button>
					</div>
				</div>
				
				<form onSubmit={onSubmit} className="space-y-4">
					<div>
						<label className="block text-gray-700 font-medium mb-2">
							{userType === 'student' ? 'Matric Number' : 'Email'}
						</label>
						<input 
							value={email} 
							onChange={(e) => setEmail(e.target.value)} 
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>
					<div>
						<label className="block text-gray-700 font-medium mb-2">
							Password
						</label>
						<input 
							type="password" 
							value={password} 
							onChange={(e) => setPassword(e.target.value)} 
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>
					<button 
						className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
						disabled={loading}
					>
						{loading ? 'Logging in...' : 'Login'}
					</button>
				</form>
				
				{userType === 'student' && (
					<div className="mt-4 text-center">
						<p className="text-gray-600">
							Don&apos;t have an account?{' '}
							<Link href="/signup" className="text-blue-600 hover:underline">
								Sign up
							</Link>
						</p>
					</div>
				)}
			</div>
		</div>
	)
}
