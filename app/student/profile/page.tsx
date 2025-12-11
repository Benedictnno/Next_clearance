'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Student {
	firstName: string;
	lastName: string;
	matricNumber: string;
	email: string;
	department?: { name: string };
	faculty?: { name: string };
	level?: string;
	phoneNumber?: string;
	admissionYear?: number;
}

interface OfficeStatus {
	officeId: string;
	officeName: string;
	stepNumber: number;
	status: 'not_started' | 'pending' | 'approved' | 'rejected';
	comment?: string;
}

export default function StudentProfilePage() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [student, setStudent] = useState<Student | null>(null);
	const [clearanceStatus, setClearanceStatus] = useState<OfficeStatus[]>([]);
	const [overallProgress, setOverallProgress] = useState(0);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			// Fetch profile
			const profileRes = await fetch('/api/student/profile');
			if (profileRes.ok) {
				const profileData = await profileRes.json();
				setStudent(profileData.data);
			}

			// Fetch clearance status
			const statusRes = await fetch('/api/student/clearance-workflow/status');
			if (statusRes.ok) {
				const statusData = await statusRes.json();
				setClearanceStatus(statusData.data?.offices || []);
				setOverallProgress(statusData.data?.overallProgress || 0);
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-soft-200">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-secondary-500 mx-auto"></div>
					<p className="mt-4 text-dark-700 font-medium">Loading profile...</p>
				</div>
			</div>
		);
	}

	if (!student) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-soft-200">
				<div className="text-center card max-w-md">
					<p className="text-accent-600 mb-4 font-medium">Failed to load profile</p>
					<button onClick={() => window.location.reload()} className="btn-primary">
						Retry
					</button>
				</div>
			</div>
		);
	}

	const approvedCount = clearanceStatus.filter(o => o.status === 'approved').length;
	const totalOffices = clearanceStatus.length;

	return (
		<div className="min-h-screen bg-soft-200">
			{/* Gradient Ribbon Header */}
			<div className="gradient-ribbon h-2"></div>

			{/* Header */}
			<div className="bg-white shadow-sm border-b border-soft-400">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-h2 text-primary-500 font-semibold">Student Profile</h1>
							<p className="text-label text-dark-600 mt-1">View your academic and clearance information</p>
						</div>
						<button
							onClick={() => router.push('/student/dashboard')}
							className="btn-accent"
						>
							← Back to Dashboard
						</button>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Profile Header Card */}
				<div className="card-primary glow-on-hover mb-8">
					<div className="flex items-center space-x-6">
						<div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
							<span className="text-5xl font-bold text-white">
								{student.firstName[0]}{student.lastName[0]}
							</span>
						</div>
						<div className="flex-1">
							<h2 className="text-h2 text-white font-bold">
								{student.firstName} {student.lastName}
							</h2>
							<p className="data-field inline-block mt-2 bg-white/20 text-white border-0">
								{student.matricNumber}
							</p>
							{student.department && (
								<p className="text-mist-200 text-body mt-2">
									{student.department.name} • {student.faculty?.name || 'N/A'}
								</p>
							)}
						</div>
						<div className="text-right">
							<p className="text-mist-200 text-label-sm uppercase tracking-wide">Overall Progress</p>
							<p className="text-h1 text-white font-bold mt-1">{overallProgress}%</p>
							<p className="text-mist-200 text-label mt-1">{approvedCount}/{totalOffices} Approved</p>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Academic Information */}
					<div className="card">
						<h3 className="text-h3 text-primary-500 font-semibold mb-6">📚 Academic Information</h3>
						<div className="space-y-4">
							<div>
								<label className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Matriculation Number</label>
								<p className="data-field mt-1">{student.matricNumber}</p>
							</div>
							<div>
								<label className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Department</label>
								<p className="text-body text-dark-900 font-medium mt-1">{student.department?.name || 'N/A'}</p>
							</div>
							<div>
								<label className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Faculty</label>
								<p className="text-body text-dark-900 font-medium mt-1">{student.faculty?.name || 'N/A'}</p>
							</div>
							<div>
								<label className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Level</label>
								<p className="text-body text-dark-900 font-medium mt-1">{student.level || 'N/A'}</p>
							</div>
							{student.admissionYear && (
								<div>
									<label className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Admission Year</label>
									<p className="text-body text-dark-900 font-medium mt-1">{student.admissionYear}</p>
								</div>
							)}
						</div>
					</div>

					{/* Personal Information */}
					<div className="card">
						<h3 className="text-h3 text-primary-500 font-semibold mb-6">👤 Personal Information</h3>
						<div className="space-y-4">
							<div>
								<label className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Full Name</label>
								<p className="text-body text-dark-900 font-medium mt-1">
									{student.firstName} {student.lastName}
								</p>
							</div>
							<div>
								<label className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Email Address</label>
								<p className="text-body text-dark-900 font-medium mt-1">{student.email}</p>
							</div>
							{student.phoneNumber && (
								<div>
									<label className="text-label-sm text-dark-600 font-medium uppercase tracking-wide">Phone Number</label>
									<p className="text-body text-dark-900 font-medium mt-1">{student.phoneNumber}</p>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Clearance Progress */}
				<div className="card mt-8">
					<h3 className="text-h3 text-primary-500 font-semibold mb-6">📊 Clearance Progress</h3>

					{/* Progress Bar */}
					<div className="mb-6">
						<div className="flex justify-between items-center mb-2">
							<span className="text-label font-medium text-dark-700">Overall Completion</span>
							<span className="text-label font-bold text-secondary-600">{overallProgress}%</span>
						</div>
						<div className="progress-bar">
							<div className="progress-fill" style={{ width: `${overallProgress}%` }}></div>
						</div>
					</div>

					{/* Office Status List */}
					<div className="space-y-3">
						{clearanceStatus.map((office) => (
							<div key={office.officeId} className="flex items-center justify-between p-4 bg-soft-200 rounded-lg">
								<div className="flex items-center space-x-3">
									<span className="text-2xl">
										{office.status === 'approved' ? '✓' : office.status === 'pending' ? '⏳' : office.status === 'rejected' ? '✗' : '○'}
									</span>
									<div>
										<p className="font-semibold text-dark-900 text-body">
											{office.stepNumber}. {office.officeName}
										</p>
										{office.comment && (
											<p className="text-label text-dark-600 mt-1">{office.comment}</p>
										)}
									</div>
								</div>
								<span
									className={`px-3 py-1 rounded-full font-medium text-label ${office.status === 'approved'
											? 'badge-approved'
											: office.status === 'pending'
												? 'badge-pending'
												: office.status === 'rejected'
													? 'badge-rejected'
													: 'badge-not-started'
										}`}
								>
									{office.status.replace('_', ' ').toUpperCase()}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Quick Actions */}
				<div className="card mt-8">
					<h3 className="text-h3 text-primary-500 font-semibold mb-6">⚡ Quick Actions</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<button
							onClick={() => router.push('/student/dashboard')}
							className="btn-primary"
						>
							📊 View Dashboard
						</button>
						<button
							onClick={() => router.push('/student/slip')}
							className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-120"
						>
							📄 Clearance Slip
						</button>
						<button
							onClick={() => router.push('/student/nysc-info')}
							className="btn-secondary"
						>
							📝 NYSC Information
						</button>
					</div>
				</div>
			</div>

			{/* Footer Gradient */}
			<div className="gradient-ribbon h-2 mt-12"></div>
		</div>
	);
}
