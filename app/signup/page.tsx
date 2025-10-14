"use client"

import { useState } from 'react'

export default function SignupPage() {
	const [form, setForm] = useState({
		matric_no: '',
		first_name: '',
		last_name: '',
		email: '',
		department: '',
		password: '',
	})
	const [err, setErr] = useState<string | null>(null)

	function set<K extends keyof typeof form>(k: K, v: string) {
		setForm((s) => ({ ...s, [k]: v }))
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		setErr(null)
		const res = await fetch('/api/auth/student/signup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(form),
		})
		if (res.ok) {
			window.location.href = '/student/dashboard'
		} else {
			const j = await res.json().catch(() => ({}))
			setErr(j.error || 'Signup failed')
		}
	}

	return (
		<div style={{ maxWidth: 520, margin: '2rem auto' }}>
			<h2>Create Student Account</h2>
			{err ? <div style={{ color: 'crimson' }}>{err}</div> : null}
			<form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
				<label>
					Matric No
					<input value={form.matric_no} onChange={(e) => set('matric_no', e.target.value)} className="input" />
				</label>
				<label>
					First Name
					<input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} className="input" />
				</label>
				<label>
					Last Name
					<input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} className="input" />
				</label>
				<label>
					Email
					<input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="input" />
				</label>
				<label>
					Department
					<input value={form.department} onChange={(e) => set('department', e.target.value)} className="input" />
				</label>
				<label>
					Password
					<input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} className="input" />
				</label>
				<button className="btn">Sign Up</button>
			</form>
		</div>
	)
}


