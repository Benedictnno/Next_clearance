'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface NYSCInfo {
  name: string;
  faculty: string;
  department: string;
  courseOfStudy: string;
  matricNumber: string;
  jambRegNo: string;
  sex: string;
  dateOfBirth: { day: number; month: number; year: number };
  maritalStatus: string;
  stateOfOrigin: string;
  lgaOfOrigin: string;
  dateOfGraduation: string;
  phoneNumber: string;
  email: string;
}

export default function NYSCInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NYSCInfo>({
    name: '',
    faculty: '',
    department: '',
    courseOfStudy: '',
    matricNumber: '',
    jambRegNo: '',
    sex: '',
    dateOfBirth: { day: 1, month: 1, year: 2000 },
    maritalStatus: '',
    stateOfOrigin: '',
    lgaOfOrigin: '',
    dateOfGraduation: '',
    phoneNumber: '',
    email: '',
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExistingData();
  }, []);

  const fetchExistingData = async () => {
    try {
      // 1. Try to fetch existing NYSC data
      const res = await fetch('/api/student/nysc-info');
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setFormData({
            ...data.data,
            dateOfBirth: {
              day: parseInt(data.data.dateOfBirthDay) || 1,
              month: parseInt(data.data.dateOfBirthMonth) || 1,
              year: parseInt(data.data.dateOfBirthYear) || 2000,
            },
          });
          return; // Stop here if we have data
        }
      }

      // 2. If no data, pre-fill from profile
      const profileRes = await fetch('/api/student/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const student = profileData.data;
        if (student) {
          setFormData(prev => ({
            ...prev,
            name: `${student.firstName} ${student.lastName}`,
            faculty: student.faculty?.name || '',
            department: student.department?.name || '',
            courseOfStudy: student.department?.name || '', // Fallback
            matricNumber: student.matricNumber || '',
            email: student.email || '',
            phoneNumber: student.phoneNumber || '',
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/student/nysc-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('NYSC information saved successfully!');
        setTimeout(() => router.push('/student/dashboard'), 2000);
      } else {
        setError(data.error || 'Failed to save information');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-soft-200">
      {/* Gradient Ribbon Header */}
      <div className="gradient-ribbon h-2"></div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-soft-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-h2 text-primary-500 font-semibold">NYSC Information</h1>
              <p className="text-label text-dark-600 mt-1">Complete your NYSC deployment information</p>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-accent-50 border-2 border-accent-300 rounded-lg p-4 flex items-center justify-between">
            <p className="text-accent-700 font-medium">{error}</p>
            <button onClick={() => setError(null)} className="text-accent-600 hover:text-accent-800 font-bold">
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-2 border-green-300 rounded-lg p-4 flex items-center justify-between">
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-h3 text-primary-500 font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-label font-medium text-dark-700 mb-2">
                    Full Name <span className="text-accent-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-label font-medium text-dark-700 mb-2">
                    Sex <span className="text-accent-600">*</span>
                  </label>
                  <select
                    required
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label font-medium text-dark-700 mb-2">
                    Marital Status <span className="text-accent-600">*</span>
                  </label>
                  <select
                    required
                    value={formData.maritalStatus}
                    onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                  </select>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="mt-4">
                <label className="block text-label font-medium text-dark-700 mb-2">
                  Date of Birth <span className="text-accent-600">*</span>
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <select
                    required
                    value={formData.dateOfBirth.day}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: { ...formData.dateOfBirth, day: parseInt(e.target.value) } })}
                    className="input-field"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <select
                    required
                    value={formData.dateOfBirth.month}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: { ...formData.dateOfBirth, month: parseInt(e.target.value) } })}
                    className="input-field"
                  >
                    <option value="">Month</option>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                      <option key={i + 1} value={i + 1}>{month}</option>
                    ))}
                  </select>
                  <select
                    required
                    value={formData.dateOfBirth.year}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: { ...formData.dateOfBirth, year: parseInt(e.target.value) } })}
                    className="input-field"
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 50 }, (_, i) => 2005 - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="section-divider"></div>

            {/* Academic Information */}
            <div>
              <h3 className="text-h3 text-primary-500 font-semibold mb-4">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label font-medium text-dark-700 mb-2">
                    Faculty <span className="text-accent-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.faculty}
                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Science"
                  />
                </div>
                <div>
                  <label className="block text-label font-medium text-dark-700 mb-2">
                    Department <span className="text-accent-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Computer Science"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-label font-medium text-dark-700 mb-2">
                    Course of Study <span className="text-accent-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.courseOfStudy}
                    onChange={(e) => setFormData({ ...formData, courseOfStudy: e.target.value })}
                    className="input-field"
                    placeholder="e.g., B.Sc Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-label font-medium text-dark-700 mb-2">
                    Matriculation Number <span className="text-accent-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.matricNumber}
                    onChange={(e) => setFormData({ ...formData, matricNumber: e.target.value })}
                    className="input-field"
                    placeholder="e.g., CSC/2020/001"
                  />
                </div>
                <div>
                  <label className="block text-label font-medium text-dark-700 mb-2">
                    JAMB Registration Number <span className="text-accent-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.jambRegNo}
                    onChange={(e) => setFormData({ ...formData, jambRegNo: e.target.value })}
                    className="input-field"
                    placeholder="e.g., 12345678AB"
                  />
                </div>
                <div>
                  <label className="block text-label font-medium text-dark-700 mb-2">
                    Date of Graduation <span className="text-accent-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfGraduation}
                    onChange={(e) => setFormData({ ...formData, dateOfGraduation: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="section-divider"></div>

            {/* Origin Information */}
            <div>
              <h3 className="text-h3 text-primary-500 font-semibold mb-4">Origin Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label font-medium text-dark-700 mb-2">
                    State of Origin <span className="text-accent-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.stateOfOrigin}
                    onChange={(e) => setFormData({ ...formData, stateOfOrigin: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Lagos"
                  />
                </div>
                <div>
                  <label className="block text-label font-medium text-dark-700 mb-2">
                    Local Government Area <span className="text-accent-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lgaOfOrigin}
                    onChange={(e) => setFormData({ ...formData, lgaOfOrigin: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Ikeja"
                  />
                </div>
              </div>
            </div>

            <div className="section-divider"></div>

            {/* Contact Information */}
            <div>
              <h3 className="text-h3 text-primary-500 font-semibold mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label font-medium text-dark-700 mb-2">
                    Phone Number <span className="text-accent-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="input-field"
                    placeholder="e.g., 08012345678"
                  />
                </div>
                <div>
                  <label className="block text-label font-medium text-dark-700 mb-2">
                    Email Address <span className="text-accent-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    placeholder="e.g., student@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/student/dashboard')}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? 'Saving...' : 'Save Information'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="card bg-secondary-50 border-2 border-secondary-200 mt-6">
          <h4 className="font-semibold text-secondary-900 mb-3 text-body">📌 Important Notes</h4>
          <ul className="text-label text-secondary-800 space-y-2">
            <li>• Ensure all information is accurate and matches your official documents</li>
            <li>• This information will be used for your NYSC deployment</li>
            <li>• You can update this information anytime before final submission</li>
            <li>• All fields marked with * are required</li>
          </ul>
        </div>
      </div>

      {/* Footer Gradient */}
      <div className="gradient-ribbon h-2 mt-12"></div>
    </div>
  );
}
