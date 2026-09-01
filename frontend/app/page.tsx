'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, Zap, Sliders, Calendar } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFDFD' }}>

      {/* Hero */}
      <section className="pt-36 pb-20 px-6 text-center">

        {/* Pill badge */}
        <div className="inline-flex items-center gap-3 rounded-full px-2 py-1.5 mb-8"
             style={{ backgroundColor: 'rgba(79,110,247,0.08)', border: '1px solid rgba(79,110,247,0.15)' }}>
          <span className="text-xs font-bold text-white px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: '#4F6EF7' }}>NEW</span>
          <span className="text-sm font-medium pr-1" style={{ color: '#4F6EF7' }}>Moffitt Floor 5 is now open</span>
          <ArrowRight className="h-3.5 w-3.5 mr-1" style={{ color: '#4F6EF7' }} />
        </div>

        {/* Heading */}
        <h1 className="font-bold text-gray-900 leading-[1.1] tracking-tight mb-5 whitespace-nowrap mx-auto" style={{ fontSize: '72px' }}>
          Find your space to{' '}
          <span style={{ color: '#4F6EF7' }}>focus.</span>
        </h1>

        {/* Subtext */}
        <p className="text-gray-400 text-base max-w-md mx-auto mb-10 leading-relaxed">
          See every library in realtime and witness the moment a room becomes available.
          The smartest way to find study spaces across UC Berkeley.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => router.push('/libraries')}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold transition-all hover:opacity-85 active:scale-95"
            style={{ backgroundColor: '#111111' }}
          >
            Start Browsing
            <ArrowRight className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 text-gray-600 text-sm font-medium bg-white hover:border-gray-300 hover:text-gray-900 transition-all active:scale-95">
            View Campus Map
          </button>
        </div>

        {/* App Mockup */}
        <div className="mt-16 max-w-4xl mx-auto relative">
          <div className="rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200/60 overflow-hidden bg-white">

            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF5F57' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FEBC2E' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28C840' }} />
              </div>
              <div className="flex-1 mx-6">
                <div className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-400 text-left max-w-xs mx-auto">
                  moffittstatus.com/libraries
                </div>
              </div>
            </div>

            {/* Preview content with fade */}
            <div className="h-56 bg-gray-50/40 relative overflow-hidden flex items-center justify-center gap-4 px-8">

              {/* Side cards (blurred/faded) */}
              <div className="absolute left-8 top-1/2 -translate-y-1/2 w-44 bg-white rounded-xl border border-gray-100 p-4 shadow-sm opacity-40 blur-[1px]">
                <div className="w-7 h-7 rounded-lg bg-gray-100 mb-3" />
                <div className="text-xs font-semibold text-gray-800">Main Stacks</div>
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  <span className="text-[10px] text-gray-400">Moderate</span>
                </div>
              </div>

              {/* Center card (focused) */}
              <div className="relative z-10 w-52 bg-white rounded-xl border p-5 shadow-lg" style={{ borderColor: 'rgba(79,110,247,0.25)' }}>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white mb-3 inline-block" style={{ backgroundColor: '#4F6EF7' }}>
                  AVAILABLE NOW
                </span>
                <div className="text-sm font-bold text-gray-900 mt-1">MO</div>
                <div className="text-xs text-gray-400 mt-1">Moffitt Library</div>
                <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full w-1/3" style={{ backgroundColor: '#4F6EF7' }} />
                </div>
                <div className="text-[10px] text-gray-400 mt-1">34% capacity</div>
              </div>

              {/* Side card right (blurred/faded) */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 w-44 bg-white rounded-xl border border-gray-100 p-4 shadow-sm opacity-40 blur-[1px]">
                <div className="w-7 h-7 rounded-lg bg-gray-100 mb-3" />
                <div className="text-xs font-semibold text-gray-800">Kresge</div>
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-[10px] text-gray-400">Busy</span>
                </div>
              </div>

              {/* Fade overlays on sides */}
              <div className="absolute left-0 top-0 bottom-0 w-32 pointer-events-none"
                   style={{ background: 'linear-gradient(to right, rgba(249,250,251,0.95), transparent)' }} />
              <div className="absolute right-0 top-0 bottom-0 w-32 pointer-events-none"
                   style={{ background: 'linear-gradient(to left, rgba(249,250,251,0.95), transparent)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="py-14 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '8', label: 'LIBRARIES' },
            { value: '142', label: 'STUDY ROOMS' },
            { value: '99%', label: 'LIVE ACCURACY' },
            { value: '12k+', label: 'ACTIVE STUDENTS' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-12">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-5">
            Everything you need to study better.
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Stop wandering around campus looking for a spot. Know exactly where to go
            before you even leave your dorm.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-20">
          {[
            {
              icon: <Zap className="h-5 w-5" style={{ color: '#4F6EF7' }} />,
              title: 'Real-time Updates',
              desc: 'Our sensors and booking integrations show you exactly which rooms are empty right this second, updated instantly.',
            },
            {
              icon: <Sliders className="h-5 w-5" style={{ color: '#4F6EF7' }} />,
              title: 'Smart Amenities',
              desc: 'Filter spaces by exactly what you need: whiteboards, dual monitors, natural light, or quick coffee proximity.',
            },
            {
              icon: <Calendar className="h-5 w-5" style={{ color: '#4F6EF7' }} />,
              title: 'Instant Booking',
              desc: 'Claim your spot with one tap. Secure group study rooms up to two weeks in advance without the hassle.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(79,110,247,0.08)' }}
              >
                {icon}
              </div>
              <h3 className="text-gray-900 font-bold text-base mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 pb-24">
        <div
          className="max-w-3xl mx-auto rounded-3xl px-12 py-16 text-center"
          style={{ background: 'linear-gradient(135deg, #0F172B 0%, #1a1f3a 50%, #0F172B 100%)' }}
        >
          <h2 className="text-3xl font-bold text-white mb-3">Ready to secure your spot?</h2>
          <p className="text-white/40 text-sm mb-8 leading-relaxed">
            Join thousands of students who have already upgraded their study<br />
            sessions and reclaimed their time.
          </p>
          <button
            onClick={() => router.push('/libraries')}
            className="px-7 py-3 rounded-full bg-white text-gray-900 text-sm font-semibold hover:opacity-90 transition-all active:scale-95"
          >
            Start Browsing Now →
          </button>
        </div>
      </section>

    </div>
  )
}
