"use client"

import { useState } from 'react'

export default function AdminLogin() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [err, setErr] = useState<string | null>(null)

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		setErr(null)
		const res = await fetch('/api/auth/admin/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password }),
		})
		if (res.ok) {
			window.location.href = '/admin/dashboard'
		} else {
			const j = await res.json().catch(() => ({}))
			setErr(j.error || 'Login failed')
		}
	}

	return (
		<div style={{ maxWidth: 520, margin: '2rem auto' }}>
			<h2>Admin Login</h2>
			{err ? <div style={{ color: 'crimson' }}>{err}</div> : null}
			<form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
				<label>
					Email
					<input value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
				</label>
				<label>
					Password
					<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
				</label>
				<button className="btn">Login</button>
			</form>
		</div>
	)
}


