import DashboardShell from '@/components/DashboardShell'
import { getSession } from '@/lib/auth'
import { collections } from '@/lib/mongoCollections'
import { clearanceEngine } from '@/lib/clearanceEngine'
import Link from 'next/link'

export default async function StudentProfile() {
	const session = await getSession()
	if (!session) {
		return <div>Unauthorized</div>
	}

	const { students } = await collections()
	const student = await students.findOne({ userId: session.userId })
	
	if (!student) {
		return <div>Student not found</div>
	}

	// Get clearance progress
	const progress = await clearanceEngine.getStudentProgress(String(student._id))
	
	return (
		<DashboardShell title="Student Profile">
			<div className="max-w-4xl mx-auto space-y-6">
				{/* Profile Header */}
				<div className="card p-6">
					<div className="flex items-center space-x-4">
						<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
							<span className="text-2xl font-bold text-blue-600">
								{student.firstName.charAt(0)}{student.lastName.charAt(0)}
							</span>
						</div>
						<div>
							<h2 className="text-2xl font-bold" style={{color:'#150E56'}}>
								{student.firstName} {student.lastName}
							</h2>
							<p className="text-gray-600">{student.matricNumber}</p>
							<p className="text-sm text-gray-500">{student.department} • {student.faculty}</p>
						</div>
					</div>
				</div>

				{/* Clearance Progress */}
				<div className="card p-6">
					<h3 className="text-lg font-semibold mb-4" style={{color:'#150E56'}}>Clearance Progress</h3>
					
					{/* Progress Bar */}
					<div className="mb-6">
						<div className="flex justify-between items-center mb-2">
							<span className="text-sm font-medium">Overall Progress</span>
							<span className="text-sm text-gray-600">{progress.progressPercentage}%</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-3">
							<div 
								className="bg-blue-600 h-3 rounded-full transition-all duration-300"
								style={{ width: `${progress.progressPercentage}%` }}
							></div>
						</div>
					</div>

					{/* Progress Steps */}
					<div className="space-y-3">
						{progress.steps.map((step, index) => (
							<div key={step.step.id} className="flex items-center space-x-4 p-3 rounded-lg border">
								<div className="flex-shrink-0">
									<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
										step.progress.status === 'approved' 
											? 'bg-green-100 text-green-700' 
											: step.progress.status === 'rejected'
											? 'bg-red-100 text-red-700'
											: 'bg-yellow-100 text-yellow-700'
									}`}>
										{step.progress.status === 'approved' ? '✓' : 
										 step.progress.status === 'rejected' ? '✗' : 
										 index + 1}
									</div>
								</div>
								<div className="flex-1">
									<div className="flex justify-between items-center">
										<div>
											<h4 className="font-medium">{step.step.name}</h4>
											<p className="text-sm text-gray-600">
												Step {step.step.stepNumber}
												{step.step.requiresPayment && ' • Payment Required'}
											</p>
										</div>
										<div className="text-right">
											<span className={`px-2 py-1 rounded text-xs ${
												step.progress.status === 'approved' 
													? 'bg-green-100 text-green-700' 
													: step.progress.status === 'rejected'
													? 'bg-red-100 text-red-700'
													: 'bg-yellow-100 text-yellow-700'
											}`}>
												{step.progress.status.toUpperCase()}
											</span>
										</div>
									</div>
									{step.progress.comment && (
										<div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
											<strong>Officer Comment:</strong> {step.progress.comment}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Student Information */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="card p-6">
						<h3 className="text-lg font-semibold mb-4" style={{color:'#150E56'}}>Academic Information</h3>
						<div className="space-y-3">
							<div>
								<label className="text-sm text-gray-600">Matriculation Number</label>
								<p className="font-medium">{student.matricNumber}</p>
							</div>
							<div>
								<label className="text-sm text-gray-600">Department</label>
								<p className="font-medium">{student.department}</p>
							</div>
							<div>
								<label className="text-sm text-gray-600">Faculty</label>
								<p className="font-medium">{student.faculty}</p>
							</div>
							<div>
								<label className="text-sm text-gray-600">Level</label>
								<p className="font-medium">{student.level}</p>
							</div>
						</div>
					</div>

					<div className="card p-6">
						<h3 className="text-lg font-semibold mb-4" style={{color:'#150E56'}}>Personal Information</h3>
						<div className="space-y-3">
							<div>
								<label className="text-sm text-gray-600">Full Name</label>
								<p className="font-medium">{student.firstName} {student.lastName}</p>
							</div>
							<div>
								<label className="text-sm text-gray-600">Email</label>
								<p className="font-medium">{session.email}</p>
							</div>
							<div>
								<label className="text-sm text-gray-600">Student ID</label>
								<p className="font-medium">{session.userId}</p>
							</div>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="card p-6">
					<h3 className="text-lg font-semibold mb-4" style={{color:'#150E56'}}>Quick Actions</h3>
					<div className="flex flex-wrap gap-4">
						<Link 
							href="/student/dashboard" 
							className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
						>
							View Dashboard
						</Link>
						<Link 
							href="/student/slip" 
							className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
						>
							View Clearance Slip
						</Link>
						{progress.isCompleted && (
							<>
								<Link 
									href="/api/student/clearance-certificate" 
									className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
								>
									Download Certificate
								</Link>
								<Link 
									href="/api/student/nysc-form/download" 
									className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
								>
									Download NYSC Form
								</Link>
							</>
						)}
					</div>
				</div>
			</div>
		</DashboardShell>
	)
}
