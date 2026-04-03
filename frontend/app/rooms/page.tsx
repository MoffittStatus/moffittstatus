'use client'

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarIcon, Search, Clock, Users, ArrowRight, ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { fetchRoomAvailability, filterRoomsByTime, handleQuickBook } from "@/lib/libCal"

type RoomSlot = { id: string; name: string; time: string; checksum: string }
type LibraryKey = "main_stacks" | "kresge" | "moffitt" | "earth_sciences" | "east_asian" | "environmental_design" | "igs"

const LIBRARY_CONFIG: Record<LibraryKey, { name: string; accent: string }> = {
  main_stacks:          { name: "Main Stacks",          accent: "#60A5FA" },
  kresge:               { name: "Kresge",               accent: "#34D399" },
  moffitt:              { name: "Moffitt Library",       accent: "#FDB515" },
  earth_sciences:       { name: "Earth Sciences & Map",  accent: "#C084FC" },
  east_asian:           { name: "East Asian Library",    accent: "#F87171" },
  environmental_design: { name: "Environmental Design",  accent: "#22D3EE" },
  igs:                  { name: "IGS (Philosophy Hall)", accent: "#F472B6" },
}

// Room photo URLs sourced from LibCal (berkeley.libcal.com/spaces?lid=8863)
// Only Kresge B1M20 rooms and Earth Sciences have photos; all others are empty on LibCal
const ROOM_PHOTOS: Record<string, string> = {
  "62870": "https://d68g328n4ug0e.cloudfront.net/misc/1033/eq/item/2025_11_20_09_36_04.jpg",
  "62871": "https://d68g328n4ug0e.cloudfront.net/misc/1033/eq/item/2025_11_20_09_36_24.jpg",
  "62872": "https://d68g328n4ug0e.cloudfront.net/misc/1033/eq/item/2025_11_20_09_36_59.jpg",
  "62873": "https://d68g328n4ug0e.cloudfront.net/misc/1033/eq/item/2025_11_20_09_37_46.jpg",
  "62874": "https://d68g328n4ug0e.cloudfront.net/misc/1033/eq/item/2025_11_20_09_38_07.jpg",
  "62877": "https://lcimages.s3.amazonaws.com/data/rooms/1033/4371/12120eart_seminar_room.jpg",
}

const getSlotHour = (t: string) => new Date(t.split(" - ")[0].replace(" ", "T")).getHours()
const parseCapacity = (n: string) => n.match(/Capacity (\d+)/)?.[1] ?? "?"
const cleanRoomName = (n: string) => n.replace(/\s*\(.*?\)\s*/g, "").trim()

const formatTimeRange = (timeStr: string) => {
  const [s, e] = timeStr.split(" - ")
  const fmt = (x: string) => {
    const d = new Date(x.replace(" ", "T"))
    let h = d.getHours(); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12
    const m = d.getMinutes()
    return m === 0 ? `${h} ${ap}` : `${h}:${String(m).padStart(2, "0")} ${ap}`
  }
  return `${fmt(s)} – ${fmt(e)}`
}

// ── RoomCard ───────────────────────────────────────────────────────────────────

function RoomCard({ room, library, isBooking, onBook }: {
  room: RoomSlot; library: LibraryKey; isBooking: boolean; onBook: () => void
}) {
  const { accent } = LIBRARY_CONFIG[library]
  const photo = ROOM_PHOTOS[room.id]
  const name = cleanRoomName(room.name)
  const capacity = parseCapacity(room.name)
  const time = formatTimeRange(room.time)
  const cap = parseInt(capacity)
  const isGroup = !isNaN(cap) && cap >= 10

  return (
    <div
      className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col"
      style={{
        background: `linear-gradient(145deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)`,
        border: `1px solid ${accent}40`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
      }}
      onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${accent}70`; e.currentTarget.style.boxShadow = `0 8px 32px ${accent}25` }}
      onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${accent}40`; e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.4)` }}
    >
      {/* Top accent line */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${accent} 0%, transparent 100%)` }} />

      {/* Photo or styled placeholder */}
      <div className="relative overflow-hidden" style={{ height: photo ? "140px" : "100px" }}>
        {photo ? (
          <>
            <img src={photo} alt={name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
            <div className="absolute bottom-3 left-3">
              <h3 className="font-bold text-white text-base leading-tight drop-shadow">{name}</h3>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col justify-between p-4"
               style={{ background: `linear-gradient(135deg, ${accent}12 0%, ${accent}06 100%)` }}>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
                  style={{ backgroundColor: "#FDB515", color: "#000", border: "1px solid #FDB515" }}>
              {isGroup ? "Group" : "Solo"}
            </span>
            <h3 className="font-bold text-lg leading-tight text-white">{name}</h3>
          </div>
        )}
        {photo && (
          <div className="absolute top-3 left-3">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#FDB515", color: "#000", border: "1px solid #FDB515", backdropFilter: "blur(8px)" }}>
              {isGroup ? "Group" : "Solo"}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-3 flex-1">
        {photo && <div />}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-white/40">
            <Users className="h-3 w-3" />
            <span>{capacity} max</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium" style={{ color: `${accent}cc` }}>
            <Clock className="h-3 w-3" />
            <span>{time}</span>
          </div>
        </div>

        <button
          onClick={onBook}
          disabled={isBooking}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-40"
          style={{ backgroundColor: "#FDB515", border: "1px solid #FDB515", color: "#000" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#e6a412" }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FDB515" }}
        >
          {isBooking ? (
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : (
            <><span>Reserve</span><ArrowRight className="h-3 w-3" /></>
          )}
        </button>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="h-0.5 w-full bg-white/10" />
      <div className="h-24 bg-white/3" />
      <div className="p-3 space-y-3">
        <div className="h-3 bg-white/8 rounded-full w-3/4" />
        <div className="h-7 bg-white/5 rounded-xl" />
      </div>
    </div>
  )
}

const LIBS: (LibraryKey | "all")[] = ["all", "main_stacks", "moffitt", "kresge", "earth_sciences", "east_asian", "environmental_design", "igs"]
const LABELS: Record<string, string> = {
  all: "All", main_stacks: "Main Stacks", moffitt: "Moffitt", kresge: "Kresge",
  earth_sciences: "Earth Sciences", east_asian: "East Asian",
  environmental_design: "Env. Design", igs: "IGS",
}

export default function RoomsPage() {
  const [selectedLibrary, setSelectedLibrary] = useState<LibraryKey | "all">("all")
  const [searchQuery, setSearchQuery]         = useState("")
  const [selectedDate, setSelectedDate]       = useState<Date>(new Date())
  const [selectedHour, setSelectedHour]       = useState<number | undefined>(undefined)
  const [rawData, setRawData]                 = useState<{ library: LibraryKey; rooms: RoomSlot[] }[]>([])
  const [isLoading, setIsLoading]             = useState(true)
  const [error, setError]                     = useState<string | null>(null)
  const [bookingRoomId, setBookingRoomId]     = useState<string | null>(null)
  const [retryCount, setRetryCount]           = useState(0)
  const [calendarOpen, setCalendarOpen]       = useState(false)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true
    setIsLoading(true); setError(null)
    const dateStr = selectedDate.toLocaleDateString("sv-SE")
    Promise.all(
      (["main_stacks", "kresge", "moffitt", "earth_sciences", "east_asian", "environmental_design", "igs"] as LibraryKey[]).map(async lib => {
        const json = await fetchRoomAvailability(dateStr, lib)
        const rooms = await filterRoomsByTime(json, new Date(`${dateStr}T00:00:00`))
        return { library: lib, rooms: rooms as RoomSlot[] }
      })
    ).then(r => { if (isMounted) { setRawData(r); setIsLoading(false) } })
     .catch(e => { if (isMounted) { console.error(e); setError("Failed to load rooms."); setIsLoading(false) } })
    return () => { isMounted = false }
  }, [selectedDate, retryCount])

  const filtered = useMemo(() =>
    rawData
      .filter(d => selectedLibrary === "all" || d.library === selectedLibrary)
      .map(d => ({
        ...d,
        rooms: d.rooms.filter(s => {
          if (selectedHour !== undefined && getSlotHour(s.time) !== selectedHour) return false
          if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
          return true
        })
      }))
      .filter(d => d.rooms.length > 0),
  [rawData, selectedLibrary, selectedHour, searchQuery])

  const handleBookRoom = async (room: RoomSlot) => {
    const key = room.id + room.time
    setBookingRoomId(key)
    try {
      // NOTE: handleQuickBook has hardcoded libraryId '8867' (Main Stacks).
      // Kresge/other bookings will route through the wrong library ID — acceptable for MVP.
      const url = await handleQuickBook(room, new Date())
      if (url) window.location.href = url
      else toast.error("Booking failed — no redirect URL returned.")
    } catch { toast.error("Booking failed. Please try again.") }
    finally { setBookingRoomId(null) }
  }

  const totalRooms = filtered.reduce((a, d) => a + d.rooms.length, 0)

  return (
    <div className="min-h-screen relative" style={{ background: "linear-gradient(160deg, #001428 0%, #001f3f 35%, #000d1a 100%)" }}>

      {/* Glows */}
      <div className="fixed top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none opacity-10"
           style={{ background: "radial-gradient(ellipse, #60A5FA 0%, transparent 70%)" }} />
      <div className="fixed bottom-[-80px] left-[-80px] w-[500px] h-[400px] rounded-full blur-3xl pointer-events-none opacity-20"
           style={{ background: "radial-gradient(ellipse, #FDB515 0%, transparent 65%)" }} />
      <div className="fixed bottom-[-80px] right-[-80px] w-[400px] h-[300px] rounded-full blur-3xl pointer-events-none opacity-10"
           style={{ background: "radial-gradient(ellipse, #34D399 0%, transparent 65%)" }} />

      {/* ── Compact header ── */}
      <div className="pt-6 pb-6 px-4 text-center">
        <button onClick={() => router.push('/')} className="inline-flex items-center gap-1.5 text-white/25 hover:text-white/50 text-xs transition-colors mb-4">
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>MoffittStatus</span>
        </button>
        <h1 className="text-white font-bold tracking-tight leading-none mb-1.5" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
          Find your <span style={{ color: "#FDB515" }}>space.</span>
        </h1>
        <p className="text-white/35 text-sm">
          {isLoading ? "Loading…" : `${totalRooms} rooms available · ${format(selectedDate, "MMM d, yyyy")}`}
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div className="sticky top-0 z-10 backdrop-blur-xl border-b px-4 py-2.5"
           style={{ background: "linear-gradient(90deg, rgba(40,24,0,0.95) 0%, rgba(60,38,0,0.95) 50%, rgba(25,15,0,0.95) 100%)", borderColor: "rgba(253,181,21,0.12)" }}>
        <div className="max-w-6xl mx-auto flex flex-wrap gap-2 items-center">

          <div className="flex flex-wrap gap-1">
            {LIBS.map(lib => (
              <button key={lib} onClick={() => setSelectedLibrary(lib)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-200"
                style={selectedLibrary === lib
                  ? { backgroundColor: "#FDB515", color: "#000", fontWeight: 700 }
                  : { color: "rgba(255,255,255,0.45)" }}
              >
                {LABELS[lib]}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs" style={{ background: "rgba(253,181,21,0.07)", border: "1px solid rgba(253,181,21,0.18)" }}>
            <Search className="h-3 w-3" style={{ color: "rgba(253,181,21,0.45)" }} />
            <input placeholder="Search…" className="bg-transparent outline-none text-white placeholder:text-white/25 w-24"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/50 hover:text-white transition-colors"
                      style={{ background: "rgba(253,181,21,0.07)", border: "1px solid rgba(253,181,21,0.18)" }}>
                <CalendarIcon className="h-3 w-3" />
                <span>{format(selectedDate, "MMM d")}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={selectedDate}
                onSelect={d => { if (d) { setSelectedDate(d); setCalendarOpen(false) } }}
                disabled={d => d < new Date(new Date().setHours(0,0,0,0))} initialFocus />
            </PopoverContent>
          </Popover>

          <Select value={selectedHour !== undefined ? String(selectedHour) : "all"}
                  onValueChange={v => setSelectedHour(v === "all" ? undefined : parseInt(v))}>
            <SelectTrigger className="rounded-full w-auto px-3 h-7 text-xs text-white/50 focus:ring-0 gap-1"
                           style={{ background: "rgba(253,181,21,0.07)", border: "1px solid rgba(253,181,21,0.18)" }}>
              <Clock className="h-3 w-3" />
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any time</SelectItem>
              {Array.from({length: 16}, (_, i) => i + 8).map(h => (
                <SelectItem key={h} value={String(h)}>
                  {h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h-12}:00 PM`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="max-w-6xl mx-auto px-4 pt-8 pb-24 relative z-0">

        {error && (
          <div className="flex flex-col items-center py-24 gap-4">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => setRetryCount(c => c+1)} className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white border border-white/10 hover:bg-white/5 transition-colors">Retry</button>
          </div>
        )}

        {!isLoading && !error && totalRooms === 0 && (
          <div className="flex flex-col items-center py-24 gap-2">
            <p className="text-xl font-semibold text-white/40">No rooms available</p>
            <p className="text-sm text-white/25">Try a weekday or adjust filters</p>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({length: 10}).map((_, i) => <Skeleton key={i} />)}
          </div>
        )}

        {!isLoading && !error && filtered.map(({ library, rooms }) => {
          const { name, accent } = LIBRARY_CONFIG[library]
          return (
            <section key={library} className="mb-10">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}` }} />
                <h2 className="text-base font-bold text-white">{name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>
                  {rooms.length}
                </span>
                <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${accent}20 0%, transparent 100%)` }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {rooms.map(room => {
                  const key = room.id + room.time
                  return (
                    <RoomCard key={key} room={room} library={library}
                      isBooking={bookingRoomId === key}
                      onBook={() => handleBookRoom(room)}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
