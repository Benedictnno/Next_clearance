import Link from 'next/link'

export default function DashboardShell({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="min-h-screen grid grid-rows-[auto,1fr]">
			<header className="topbar shadow px-4 py-3">
				<div className="mx-auto max-w-7xl flex items-center justify-between">
					<h1 className="text-lg font-semibold">EKSU Clearance</h1>
					<nav className="flex items-center gap-4 text-sm">
						<Link className="hover:underline" href="/student/dashboard">Student</Link>
						<Link className="hover:underline" href="/officer/dashboard">Officer</Link>
						<Link className="hover:underline" href="/admin/dashboard">Admin</Link>
					</nav>
				</div>
			</header>
			<main className="px-4 py-6">
				<div className="mx-auto max-w-7xl">
					<h2 className="text-2xl font-semibold mb-4" style={{color:'#150E56'}}>{title}</h2>
					{children}
				</div>
			</main>
		</div>
	)
}




