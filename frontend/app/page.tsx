'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, Activity, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
         style={{ background: "linear-gradient(135deg, #001933 0%, #002952 40%, #0a0f1e 100%)" }}>

      {/* Berkeley gold glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-3xl pointer-events-none opacity-20"
           style={{ background: "radial-gradient(ellipse, #FDB515 0%, transparent 70%)" }} />

      {/* Logo */}
      <div className="text-center mb-2">
        <h1 className="text-white font-bold tracking-tight leading-none"
            style={{ fontSize: "clamp(3rem, 10vw, 7rem)" }}>
          Moffitt<span style={{ color: "#FDB515" }}>Status</span>
        </h1>
        <p className="text-white/40 text-sm tracking-[0.25em] uppercase mt-2 font-medium">
          UC Berkeley Libraries
        </p>
      </div>

      {/* Divider */}
      <div className="w-16 h-px my-10 opacity-30" style={{ backgroundColor: "#FDB515" }} />

      {/* Cards */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">

        <button
          onClick={() => router.push('/rooms')}
          className="group flex-1 text-left rounded-3xl p-7 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] border"
          style={{ background: "rgba(253,181,21,0.06)", borderColor: "rgba(253,181,21,0.2)" }}
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-5"
               style={{ backgroundColor: "rgba(253,181,21,0.15)" }}>
            <BookOpen className="h-5 w-5" style={{ color: "#FDB515" }} />
          </div>
          <h2 className="text-white text-xl font-bold mb-1">Book a Room</h2>
          <p className="text-white/40 text-sm leading-relaxed mb-6">
            Reserve study rooms at Main Stacks, Moffitt, Kresge, and more.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "#FDB515" }}>
            <span>Browse rooms</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </button>

        <button
          onClick={() => router.push('/libraries')}
          className="group flex-1 text-left rounded-3xl p-7 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] border border-white/10 bg-white/5 hover:bg-white/8"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
            <Activity className="h-5 w-5 text-white/60" />
          </div>
          <h2 className="text-white text-xl font-bold mb-1">Crowd Meters</h2>
          <p className="text-white/40 text-sm leading-relaxed mb-6">
            Check live busyness levels and hours for every Berkeley library.
          </p>
          <div className="flex items-center gap-2 text-white/40 text-sm font-medium group-hover:text-white/70 transition-colors">
            <span>View libraries</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </button>

      </div>
    </div>
  )
}
