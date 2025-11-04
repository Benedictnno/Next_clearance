'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface NYSCFormData {
  name: string;
  faculty: string;
  department: string;
  courseOfStudy: string;
  matricNumber: string;
  jambRegNo: string;
  sex: 'male' | 'female' | '';
  dateOfBirth: {
    day: string;
    month: string;
    year: string;
  };
  maritalStatus: 'single' | 'married' | '';
  stateOfOrigin: string;
  lgaOfOrigin: string;
  dateOfGraduation: string;
  phoneNumber: string;
  email: string;
}

export default function NYSCInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<NYSCFormData>({
    name: '',
    faculty: '',
    department: '',
    courseOfStudy: 'B.Sc.',
    matricNumber: '',
    jambRegNo: '',
    sex: '',
    dateOfBirth: { day: '', month: '', year: '' },
    maritalStatus: '',
    stateOfOrigin: '',
    lgaOfOrigin: '',
    dateOfGraduation: '',
    phoneNumber: '',
    email: ''
  });

  useEffect(() => {
    fetchStudentData();
  }, []);

  async function fetchStudentData() {
    try {
      const res = await fetch('/api/student/profile', {
        credentials: 'include', // Include cookies for authentication
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        }
      });
      const data = await res.json();
      
      if (data.success) {
        const student = data.data;
        setFormData(prev => ({
          ...prev,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          faculty: student.faculty?.name || '',
          department: student.department?.name || '',
          matricNumber: student.matricNumber || '',
          email: student.email || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/student/nysc-info', {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (data.success) {
        alert('NYSC information saved successfully!');
        router.push('/student/nysc-form');
      } else {
        alert('Failed to save information: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save information');
    } finally {
      setSaving(false);
    }
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">NYSC Mobilization Information</h1>
          <p className="text-gray-600 mt-2">Fill in your information for NYSC mobilization form</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                1. Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* Faculty & Department */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  2. Faculty <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Course of Study */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                3. Course of Study <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.courseOfStudy}
                onChange={(e) => setFormData({ ...formData, courseOfStudy: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Matric Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                4. Matric Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.matricNumber}
                onChange={(e) => setFormData({ ...formData, matricNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* JAMB Reg No */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                5. JAMB Reg. No.
              </label>
              <input
                type="text"
                value={formData.jambRegNo}
                onChange={(e) => setFormData({ ...formData, jambRegNo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Sex */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                6. Sex (Tick X) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sex"
                    value="male"
                    checked={formData.sex === 'male'}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value as 'male' })}
                    className="w-5 h-5 text-indigo-600"
                    required
                  />
                  <span>Male</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sex"
                    value="female"
                    checked={formData.sex === 'female'}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value as 'female' })}
                    className="w-5 h-5 text-indigo-600"
                    required
                  />
                  <span>Female</span>
                </label>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                7. Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Day (e.g., 01)"
                  value={formData.dateOfBirth.day}
                  onChange={(e) => setFormData({
                    ...formData,
                    dateOfBirth: { ...formData.dateOfBirth, day: e.target.value }
                  })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  maxLength={2}
                  required
                />
                <select
                  value={formData.dateOfBirth.month}
                  onChange={(e) => setFormData({
                    ...formData,
                    dateOfBirth: { ...formData.dateOfBirth, month: e.target.value }
                  })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Month</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Year (e.g., 2000)"
                  value={formData.dateOfBirth.year}
                  onChange={(e) => setFormData({
                    ...formData,
                    dateOfBirth: { ...formData.dateOfBirth, year: e.target.value }
                  })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  maxLength={4}
                  required
                />
              </div>
            </div>

            {/* Marital Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                8. Marital Status (Tick x) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="maritalStatus"
                    value="single"
                    checked={formData.maritalStatus === 'single'}
                    onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as 'single' })}
                    className="w-5 h-5 text-indigo-600"
                    required
                  />
                  <span>Single</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="maritalStatus"
                    value="married"
                    checked={formData.maritalStatus === 'married'}
                    onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as 'married' })}
                    className="w-5 h-5 text-indigo-600"
                    required
                  />
                  <span>Married</span>
                </label>
              </div>
            </div>

            {/* State of Origin */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                9. State of Origin <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.stateOfOrigin}
                onChange={(e) => setFormData({ ...formData, stateOfOrigin: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* LGA of Origin */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                10. Local Government of Origin <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lgaOfOrigin}
                onChange={(e) => setFormData({ ...formData, lgaOfOrigin: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Date and Year of Graduation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                11. Date and Year of Graduation
              </label>
              <input
                type="text"
                placeholder="e.g., December 2025"
                value={formData.dateOfGraduation}
                onChange={(e) => setFormData({ ...formData, dateOfGraduation: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Phone Number & Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  12. Phone Number(s) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? 'Saving...' : 'Save & View Form'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/student/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
