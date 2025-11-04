import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0]">
      {/* Hero Section */}
      <div className="relative overflow-hidden text-center py-16 px-8 bg-gradient-to-br from-[#7B113A] to-[#150E56] text-white -mx-4 mb-16">
        <div className="absolute inset-0 opacity-30 bg-[url('/assets/pattern.svg')]"></div>
        <div className="relative z-10">
          <div className="flex md:flex-row flex-col items-center justify-center mb-8">
            <Image src="/assets/eksu_core.png" alt="Logo" width={300} height={300} className="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white shadow-sm"> Digital Clearance System</h1>
          </div>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/90 leading-relaxed">
            A streamlined platform for managing student clearance processes efficiently and transparently.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link href="/student/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#7B113A] font-semibold rounded-md hover:bg-opacity-90 transition-all transform hover:-translate-y-1 hover:shadow-lg">
              Student Dashboard
            </Link>
            <Link href="/officer/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-md hover:bg-white hover:text-[#7B113A] transition-all transform hover:-translate-y-1 hover:shadow-lg">
              Officer Dashboard
            </Link>
            {/* <Link href="/admin/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-md hover:bg-white hover:text-[#150E56] transition-all transform hover:-translate-y-1 hover:shadow-lg">
              Admin Dashboard
            </Link> */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Benefits Section */}
        <section className="my-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-center text-gray-800 mb-8">Benefits</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Streamlined Process",
                description: "Complete your clearance requirements efficiently with our digital workflow system."
              },
              {
                title: "Real-time Updates",
                description: "Track your clearance progress in real-time with instant notifications and status updates."
              },
              {
                title: "Secure Documentation",
                description: "All your documents are securely stored and easily accessible when needed."
              },
              {
                title: "Digital ID Cards",
                description: "Generate your student ID card digitally with secure verification features."
              },
              {
                title: "NYSC Integration",
                description: "Seamlessly generate your NYSC forms upon successful clearance completion."
              },
              {
                title: "24/7 Accessibility",
                description: "Access the system anytime, anywhere to check status or submit documents."
              }
            ].map((benefit, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-lg border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#b91c1c] to-[#ea580c]"></div>
                <h3 className="text-xl font-semibold text-[#b91c1c] mb-4">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="my-16">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { number: "5,000+", label: "Students Cleared" },
              { number: "98%", label: "Satisfaction Rate" },
              { number: "24/7", label: "System Availability" }
            ].map((stat, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow text-center">
                <div className="text-4xl font-bold text-[#b91c1c] mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Guidelines Section */}
        <section className="my-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-center text-gray-800 mb-8">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Register an Account",
                description: "Create your account using your student credentials and set up your profile."
              },
              {
                title: "Submit Required Documents",
                description: "Upload all necessary documents for each clearance step as required."
              },
              {
                title: "Track Your Progress",
                description: "Monitor your clearance status and receive updates on each step."
              },
              {
                title: "Complete Clearance",
                description: "Once approved, download your clearance certificate and ID card."
              }
            ].map((guide, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-lg border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#b91c1c] to-[#ea580c]"></div>
                <h3 className="text-xl font-semibold text-[#b91c1c] mb-4">{guide.title}</h3>
                <p className="text-gray-600 leading-relaxed">{guide.description}</p>
              </div>
            ))}
          </div>
        </section>

   
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold"> <Image src="/assets/eksu_core.png" alt="Logo" width={50} height={50} className="w-8 h-8 md:w-10 md:h-10" /> Digital Clearance</h3>
              <p className="text-gray-400">Streamlining student clearance processes</p>
            </div>
            <div className="flex gap-4 md:gap-8">
              <Link href="/about" className="text-gray-300 hover:text-white">About</Link>
              <Link href="/contact" className="text-gray-300 hover:text-white">Contact</Link>
              <Link href="/help" className="text-gray-300 hover:text-white">Help</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Ekiti State University. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
