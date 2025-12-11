'use client';

import { useRouter } from 'next/navigation';

export default function NYSCFormPage() {
    const router = useRouter();

    const handleDownload = async () => {
        try {
            const res = await fetch('/api/student/nysc-form/download');
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'NYSC_Clearance_Form.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Failed to download form. Please ensure your clearance is complete.');
            }
        } catch (error) {
            alert('An error occurred while downloading the form.');
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
                            <h1 className="text-h2 text-primary-500 font-semibold">NYSC Clearance Form</h1>
                            <p className="text-label text-dark-600 mt-1">Download your official NYSC clearance form</p>
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
                {/* Main Card */}
                <div className="card-primary glow-on-hover text-center">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-6xl">📄</span>
                    </div>
                    <h2 className="text-h2 text-white font-bold mb-4">NYSC Clearance Form</h2>
                    <p className="text-mist-200 text-body mb-8 max-w-2xl mx-auto">
                        This form contains your complete clearance information and is required for NYSC registration.
                        Ensure all your clearances are approved before downloading.
                    </p>
                    <button
                        onClick={handleDownload}
                        className="px-8 py-4 bg-white text-primary-500 rounded-lg font-semibold text-body hover:bg-mist-100 transition-all duration-120 shadow-lg"
                    >
                        📥 Download NYSC Form
                    </button>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="card">
                        <h3 className="text-h3 text-primary-500 font-semibold mb-4">📋 What's Included</h3>
                        <ul className="text-label text-dark-700 space-y-3">
                            <li className="flex items-start">
                                <span className="text-secondary-600 mr-2">✓</span>
                                <span>Complete clearance status from all offices</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-secondary-600 mr-2">✓</span>
                                <span>Student personal and academic information</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-secondary-600 mr-2">✓</span>
                                <span>Official university seal and signatures</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-secondary-600 mr-2">✓</span>
                                <span>NYSC deployment information</span>
                            </li>
                        </ul>
                    </div>

                    <div className="card bg-secondary-50 border-2 border-secondary-200">
                        <h3 className="text-h3 text-secondary-900 font-semibold mb-4">⚠️ Requirements</h3>
                        <ul className="text-label text-secondary-800 space-y-3">
                            <li className="flex items-start">
                                <span className="text-accent-600 mr-2">•</span>
                                <span>All clearance offices must approve your submission</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-accent-600 mr-2">•</span>
                                <span>NYSC information must be completed</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-accent-600 mr-2">•</span>
                                <span>No pending rejections or incomplete submissions</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-accent-600 mr-2">•</span>
                                <span>Valid student profile with all required fields</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Steps Card */}
                <div className="card mt-6">
                    <h3 className="text-h3 text-primary-500 font-semibold mb-4">📝 Next Steps</h3>
                    <div className="space-y-4">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-secondary-500 text-white rounded-full flex items-center justify-center font-bold">
                                1
                            </div>
                            <div>
                                <h4 className="font-semibold text-dark-900">Download the Form</h4>
                                <p className="text-label text-dark-600">Click the download button above to get your PDF form</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-secondary-500 text-white rounded-full flex items-center justify-center font-bold">
                                2
                            </div>
                            <div>
                                <h4 className="font-semibold text-dark-900">Print the Form</h4>
                                <p className="text-label text-dark-600">Print on A4 paper in color for best results</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-secondary-500 text-white rounded-full flex items-center justify-center font-bold">
                                3
                            </div>
                            <div>
                                <h4 className="font-semibold text-dark-900">Submit to NYSC</h4>
                                <p className="text-label text-dark-600">Present the form during your NYSC registration</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Gradient */}
            <div className="gradient-ribbon h-2 mt-12"></div>
        </div>
    );
}
