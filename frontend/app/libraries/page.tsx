'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllLibraryHours, getAvailableRooms } from '@/lib/libCal'
import { getAllLibraryRatings } from '@/lib/firebaseMethods'

// ─── Types ───────────────────────────────────────────────────────────────────

type LibraryFeatures = {
  late?: boolean
  snacks?: boolean
  equipment?: boolean
  research?: boolean
  study?: boolean
}

type Library = {
  id: number
  name: string
  hours: string
  isOpen: boolean
  roomsOpen: number
  crowdLevel: number
  features: LibraryFeatures
  nameID: string
  url?: string
  image?: string
  hasStudySpace?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hoursFix(input: string): [string, string] {
  if (!input) return ['', '']
  if (input.includes('Starts')) {
    const p = input.split('Starts')
    return [p[0].trim(), 'Starts ' + p[1].trim()]
  }
  if (input.includes('Cal ID')) {
    const p = input.split('Cal ID')
    return [p[0].trim(), 'Cal ID ' + p[1].trim()]
  }
  const p = input.split('.')
  return [p.slice(0, 4).join('.') + '.', p.slice(4).join('.').trim()]
}

function fixData(text: string): LibraryFeatures {
  if (!text) return {}
  const t = text.toLowerCase()
  return {
    equipment: t.includes('equipment'),
    late: t.includes('evening') || t.includes('late'),
    research: t.includes('research'),
    study: t.includes('study'),
    snacks: t.includes('snack'),
  }
}

function getSlugFromName(name: string): string {
  const overrides: Record<string, string> = {
    'Main (Gardner) Stacks':                        'main_stacks',
    'Moffitt Library':                              'moffitt',
    'Doe Library':                                  'doe',
    'Kresge Engineering Library':                   'kresge',
    'Engineering & Mathematical Sciences Library':  'kresge',
    'Engineering & Mathematical Sciences':          'kresge',
    'Earth Sciences & Map Library':                 'earth_sciences',
    'Earth Sciences & Map':                         'earth_sciences',
    'East Asian Library':                           'east_asian',
    'Environmental Design Library':                 'environmental_design',
    'Environmental Design':                         'environmental_design',
    'Institute of Governmental Studies Library':    'igs',
    'Institute of Governmental Studies':            'igs',
  }
  return overrides[name] ?? name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '')
}

type CrowdInfo = { label: string; bgColor: string; textColor: string; dotColor: string }

function getCrowdInfo(crowdLevel: number, isOpen: boolean): CrowdInfo {
  if (!isOpen) return { label: 'Closed', bgColor: '#FEE2E2', textColor: '#991B1B', dotColor: '#991B1B' }
  if (crowdLevel <= 33) return { label: 'Not Crowded', bgColor: '#DCFCE7', textColor: '#166534', dotColor: '#166534' }
  if (crowdLevel <= 66) return { label: 'Crowded', bgColor: '#FFEDD5', textColor: '#9A3412', dotColor: '#EA580C' }
  return { label: 'Very Crowded', bgColor: '#FEE2E2', textColor: '#991B1B', dotColor: '#991B1B' }
}

// Slugs that have room availability in LibCal — matches the rooms page config
const ROOM_CAPABLE_SLUGS = new Set([
  'main_stacks', 'kresge', 'moffitt', 'earth_sciences', 'east_asian', 'environmental_design', 'igs',
])

// ─── Static image fallbacks (used when scraper returns no imageSrc) ──────────

const LIBRARY_IMAGES: Record<string, string> = {
  'Bioscience, Natural Resources & Public Health': '/lib-images/bioscience.png',
  'Business':                                       '/lib-images/business.png',
  'Chemistry, Astronomy & Physics':                 '/lib-images/chemistry.png',
  'Doe Library':                                    '/lib-images/doe.png',
  'Earth Sciences & Map':                           '/lib-images/earth_sciences.png',
  'East Asian Library':                             '/lib-images/east_asian.png',
  'Engineering & Mathematical Sciences':            '/lib-images/engineering.png',
  'Environmental Design':                           '/lib-images/environmental_design.png',
  'Main (Gardner) Stacks':                          '/lib-images/main_stacks.png',
  'Music Library':                                  '/lib-images/music.png',
  'Social Research Library':                        '/lib-images/social_research.png',
}

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z" stroke="#90A1B9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.75 15.75L12.525 12.525" stroke="#90A1B9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6.667" stroke="#99A1AF" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 4V8L10.667 9.333" stroke="#99A1AF" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.333 6.667C13.333 9.995 9.641 13.462 8.401 14.533C8.285 14.62 8.145 14.667 8 14.667C7.855 14.667 7.715 14.62 7.599 14.533C6.359 13.462 2.667 9.995 2.667 6.667C2.667 5.252 3.229 3.896 4.229 2.895C5.229 1.895 6.585 1.333 8 1.333C9.415 1.333 10.771 1.895 11.771 2.895C12.771 3.896 13.333 5.252 13.333 6.667Z" stroke="white" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 8.667C9.105 8.667 10 7.771 10 6.667C10 5.562 9.105 4.667 8 4.667C6.895 4.667 6 5.562 6 6.667C6 7.771 6.895 8.667 8 8.667Z" stroke="white" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 12L10 8L6 4" stroke="#6355F3" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const FilterFunnelIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.833 11.667C5.833 11.775 5.863 11.881 5.92 11.974C5.977 12.066 6.059 12.14 6.156 12.189L7.323 12.772C7.412 12.817 7.51 12.838 7.61 12.833C7.709 12.829 7.806 12.799 7.89 12.746C7.975 12.694 8.045 12.621 8.093 12.534C8.141 12.447 8.167 12.349 8.167 12.25V8.167C8.167 7.878 8.274 7.599 8.468 7.384L12.682 2.724C12.757 2.64 12.807 2.537 12.825 2.425C12.842 2.314 12.828 2.2 12.782 2.097C12.736 1.994 12.662 1.906 12.567 1.845C12.473 1.783 12.363 1.75 12.25 1.75H1.75C1.637 1.75 1.527 1.783 1.432 1.844C1.338 1.906 1.263 1.993 1.217 2.096C1.171 2.2 1.156 2.314 1.174 2.425C1.192 2.537 1.242 2.64 1.317 2.724L5.532 7.384C5.726 7.599 5.833 7.878 5.833 8.167V11.667Z" stroke="#62748E" strokeWidth="1.167" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Feature icons — all rendered in #99A1AF on the card row
const ArmchairIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 6.75V4.5C15 4.102 14.842 3.721 14.561 3.439C14.279 3.158 13.898 3 13.5 3H4.5C4.102 3 3.721 3.158 3.439 3.439C3.158 3.721 3 4.102 3 4.5V6.75" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1.5 12C1.5 12.398 1.658 12.779 1.939 13.061C2.221 13.342 2.602 13.5 3 13.5H15C15.398 13.5 15.779 13.342 16.061 13.061C16.342 12.779 16.5 12.398 16.5 12V8.25C16.5 7.852 16.342 7.471 16.061 7.189C15.779 6.908 15.398 6.75 15 6.75C14.602 6.75 14.221 6.908 13.939 7.189C13.658 7.471 13.5 7.852 13.5 8.25V9.375C13.5 9.474 13.461 9.57 13.39 9.64C13.32 9.71 13.225 9.75 13.125 9.75H4.875C4.776 9.75 4.68 9.71 4.61 9.64C4.54 9.57 4.5 9.474 4.5 9.375V8.25C4.5 7.852 4.342 7.471 4.061 7.189C3.779 6.908 3.398 6.75 3 6.75C2.602 6.75 2.221 6.908 1.939 7.189C1.658 7.471 1.5 7.852 1.5 8.25V12Z" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 13.5V15M15 13.5V15M9 3V9.75" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const LaptopIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 12V5.25C15 4.852 14.842 4.471 14.561 4.189C14.279 3.908 13.898 3.75 13.5 3.75H4.5C4.102 3.75 3.721 3.908 3.439 4.189C3.158 4.471 3 4.852 3 5.25V12M15 12H3M15 12L15.96 13.913C16.018 14.027 16.045 14.155 16.04 14.283C16.034 14.412 15.995 14.536 15.927 14.646C15.86 14.755 15.765 14.845 15.653 14.907C15.54 14.969 15.413 15.001 15.285 15H2.715C2.586 15.001 2.46 14.969 2.347 14.907C2.235 14.845 2.14 14.755 2.072 14.646C2.005 14.536 1.966 14.412 1.96 14.283C1.955 14.155 1.982 14.027 2.04 13.913L3 12" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 5.25V15.75" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.25 13.5C2.051 13.5 1.86 13.421 1.72 13.28C1.579 13.14 1.5 12.949 1.5 12.75V3C1.5 2.801 1.579 2.61 1.72 2.47C1.86 2.329 2.051 2.25 2.25 2.25H6C6.796 2.25 7.559 2.566 8.121 3.129C8.684 3.691 9 4.454 9 5.25C9 4.454 9.316 3.691 9.879 3.129C10.441 2.566 11.204 2.25 12 2.25H15.75C15.949 2.25 16.14 2.329 16.28 2.47C16.421 2.61 16.5 2.801 16.5 3V12.75C16.5 12.949 16.421 13.14 16.28 13.28C16.14 13.421 15.949 13.5 15.75 13.5H11.25C10.653 13.5 10.081 13.737 9.659 14.159C9.237 14.581 9 15.153 9 15.75C9 15.153 8.763 14.581 8.341 14.159C7.919 13.737 7.347 13.5 6.75 13.5H2.25Z" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 2.25C8.105 3.145 7.602 4.359 7.602 5.625C7.602 6.891 8.105 8.105 9 9C9.895 9.895 11.109 10.398 12.375 10.398C13.641 10.398 14.855 9.895 15.75 9C15.75 10.335 15.354 11.64 14.612 12.75C13.871 13.86 12.817 14.725 11.583 15.236C10.35 15.747 8.993 15.881 7.683 15.62C6.374 15.36 5.171 14.717 4.227 13.773C3.283 12.829 2.64 11.626 2.38 10.317C2.119 9.007 2.253 7.65 2.764 6.417C3.275 5.183 4.14 4.129 5.25 3.388C6.36 2.646 7.665 2.25 9 2.25Z" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CoffeeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 1.5V3M10.5 1.5V3M4.5 1.5V3" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 6C12.199 6 12.39 6.079 12.53 6.22C12.671 6.36 12.75 6.551 12.75 6.75V12.75C12.75 13.546 12.434 14.309 11.871 14.871C11.309 15.434 10.546 15.75 9.75 15.75H5.25C4.454 15.75 3.691 15.434 3.129 14.871C2.566 14.309 2.25 13.546 2.25 12.75V6.75C2.25 6.551 2.329 6.36 2.47 6.22C2.61 6.079 2.801 6 3 6H13.5C14.296 6 15.059 6.316 15.621 6.879C16.184 7.441 16.5 8.204 16.5 9C16.5 9.796 16.184 10.559 15.621 11.121C15.059 11.684 14.296 12 13.5 12H12.75" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── Filter Pill Config ───────────────────────────────────────────────────────

const FILTER_PILLS: { key: string; label: string; test: (lib: Library) => boolean }[] = [
  { key: 'open',      label: '+ Open Now',                  test: (l) => l.isOpen },
  { key: 'rooms',     label: '+ Has Available Rooms',        test: (l) => l.roomsOpen > 0 },
  { key: 'late',      label: '+ Late Hours',                 test: (l) => !!l.features.late },
  { key: 'snacks',    label: '+ Snacks Allowed',             test: (l) => !!l.features.snacks },
  { key: 'equipment', label: '+ Tech Lending',               test: (l) => !!l.features.equipment },
  { key: 'study',     label: '+ Study Spaces',               test: (l) => !!l.features.study },
  { key: 'large',     label: '+ 300+ Seats',                  test: (l) => l.crowdLevel >= 0 },
]

// ─── Library Card ─────────────────────────────────────────────────────────────

function LibraryCard({ lib }: { lib: Library }) {
  const router = useRouter()
  const crowd = getCrowdInfo(lib.crowdLevel, lib.isOpen)
  const hasRooms = lib.roomsOpen > 0

  return (
    <div
      className="bg-white overflow-hidden flex flex-col"
      style={{ borderRadius: 24, border: '1px solid #F3F4F6', boxShadow: '0px 2px 16px rgba(0, 0, 0, 0.03)' }}
    >
      {/* Image */}
      <div className="relative bg-[#F3F4F6] overflow-hidden" style={{ height: 192, flexShrink: 0 }}>
        {(lib.image || LIBRARY_IMAGES[lib.name]) && (
          <img
            src={lib.image || LIBRARY_IMAGES[lib.name]}
            alt={lib.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(0deg, rgba(16,24,40,0.50) 0%, rgba(16,24,40,0.10) 50%, rgba(0,0,0,0) 100%)',
            opacity: 0.9,
          }}
        />

        {/* Crowd badge */}
        <div
          className="absolute top-5 left-5 flex items-center gap-1.5 rounded-full"
          style={{
            background: crowd.bgColor,
            padding: '6px 12px',
            boxShadow: '0px 1px 2px rgba(0,0,0,0.1), 0px 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div className="rounded-full" style={{ width: 8, height: 8, background: crowd.dotColor }} />
          <span style={{ color: crowd.textColor, fontSize: 12, fontWeight: 700, lineHeight: '18px' }}>
            {crowd.label}
          </span>
        </div>

        {/* Map pin button */}
        <button
          onClick={(e) => { e.stopPropagation(); lib.url && window.open(lib.url, '_blank') }}
          className="absolute top-5 right-5 flex items-center justify-center"
          style={{
            width: 36, height: 36,
            background: 'rgba(0,0,0,0.30)',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.20)',
            boxShadow: '0px 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          <MapPinIcon />
        </button>

        {/* Rooms available badge */}
        {hasRooms && (
          <div
            className="absolute bottom-4 left-5"
            style={{
              background: 'rgba(0,0,0,0.50)',
              borderRadius: 10,
              padding: '7px 15px',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0px 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            <span style={{ color: 'white', fontSize: 13, fontWeight: 600, lineHeight: '19.5px' }}>
              {lib.roomsOpen} rooms available
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1" style={{ padding: '24px 24px 24px 24px' }}>
        <h3
          className="leading-tight"
          style={{ color: '#111827', fontSize: 19, fontWeight: 700, lineHeight: '26.13px' }}
        >
          {lib.name}
        </h3>

        {/* Hours */}
        <div className="flex items-center gap-2 mt-3">
          <ClockIcon />
          <span style={{ color: '#6A7282', fontSize: 14, fontWeight: 500, lineHeight: '21px' }}>
            {lib.hours || '—'}
          </span>
        </div>

        {/* Feature icons row */}
        <div
          className="flex items-center gap-4 mt-4 pt-4"
          style={{ borderTop: '1px solid #F3F4F6' }}
        >
          {[
            { icon: <ArmchairIcon />, label: 'Comfortable Seating', tooltipClass: 'left-0' },
            { icon: <LaptopIcon />,   label: 'Tech Lending',         tooltipClass: 'left-1/2 -translate-x-1/2' },
            { icon: <BookIcon />,     label: 'Study Spaces',         tooltipClass: 'left-1/2 -translate-x-1/2' },
            { icon: <MoonIcon />,     label: 'Late Hours',           tooltipClass: 'left-1/2 -translate-x-1/2' },
            { icon: <CoffeeIcon />,   label: 'Snacks Allowed',       tooltipClass: 'right-0' },
          ].map(({ icon, label, tooltipClass }) => (
            <div key={label} className="relative group">
              {icon}
              <span
                className={`pointer-events-none absolute bottom-full mb-2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 ${tooltipClass}`}
                style={{ background: '#1C2333' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <div className="mt-5">
          {!lib.isOpen ? (
            <div
              className="w-full flex items-center justify-center"
              style={{ background: '#F9FAFB', borderRadius: 14, padding: '12px 0' }}
            >
              <span style={{ color: '#99A1AF', fontSize: 14, fontWeight: 600, lineHeight: '21px' }}>
                Closed Today
              </span>
            </div>
          ) : !hasRooms ? (
            <div
              className="w-full flex items-center justify-center"
              style={{ background: '#F9FAFB', borderRadius: 14, padding: '12px 0' }}
            >
              <span style={{ color: '#99A1AF', fontSize: 14, fontWeight: 600, lineHeight: '21px' }}>
                No Rooms Available
              </span>
            </div>
          ) : (
            <button
              onClick={() => router.push(`/rooms?lib=${lib.nameID}`)}
              className="w-full flex items-center justify-center gap-2 transition-colors hover:bg-[#EEF0FA]"
              style={{ background: '#F3F5FC', borderRadius: 14, padding: '12px 0' }}
            >
              <span style={{ color: '#6355F3', fontSize: 14, fontWeight: 600, lineHeight: '21px' }}>
                View Rooms
              </span>
              <ChevronRightIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="bg-white overflow-hidden animate-pulse"
      style={{ borderRadius: 24, border: '1px solid #F3F4F6' }}
    >
      <div style={{ height: 192, background: '#F3F4F6' }} />
      <div style={{ padding: '24px' }}>
        <div style={{ height: 20, background: '#F3F4F6', borderRadius: 8, width: '70%', marginBottom: 12 }} />
        <div style={{ height: 16, background: '#F3F4F6', borderRadius: 8, width: '45%', marginBottom: 20 }} />
        <div style={{ height: 44, background: '#F3F4F6', borderRadius: 14 }} />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LibrariesPage() {
  const [libraryData, setLibraryData] = useState<Library[] | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  function toggleFilter(key: string) {
    setSelectedFilters(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    )
  }

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const [allLibraries, allRatingsRes] = await Promise.all([
          getAllLibraryHours().catch(() => null),
          getAllLibraryRatings().catch(() => null),
        ])
        if (!isMounted) return

        if (!allLibraries || allLibraries.length === 0) {
          setLibraryData([])
          return
        }

        const ratingsRaw: any[] = allRatingsRes?.data?.data || []
        const ratingsMap: Record<string, number> = {}
        ratingsRaw.forEach((r: any) => { ratingsMap[r.library] = parseFloat(r.average) })

        // Phase 1 — basic info (no room counts yet)
        const initial: Library[] = (allLibraries || []).map((lib: any, i: number) => {
          const slug = getSlugFromName(lib.name)
          const [hours] = hoursFix(lib.hours || '')
          return {
            id: i,
            name: lib.name,
            hours,
            isOpen: (lib.status || '').toLowerCase().includes('open'),
            roomsOpen: -1,
            crowdLevel: ratingsMap[slug] ?? 60,
            features: lib.services ? fixData(lib.services) : {},
            nameID: slug,
            url: lib.googleMapsLink,
            image: lib.imageSrc,
            hasStudySpace: lib.hasStudySpace,
          }
        })
        if (isMounted) setLibraryData(initial)

        // Phase 2 — enrich with room counts
        const withRooms = await Promise.all(
          (allLibraries || []).map(async (lib: any, i: number) => {
            const slug = getSlugFromName(lib.name)
            const [hours] = hoursFix(lib.hours || '')
            const roomData = ROOM_CAPABLE_SLUGS.has(slug)
              ? await getAvailableRooms('6 pm', slug).catch(() => [])
              : []
            const isOpen =
              (lib.status || '').toLowerCase().includes('open') ||
              (lib.status || '').toLowerCase().includes('closing soon')
            return {
              id: i,
              name: lib.name,
              hours,
              isOpen,
              roomsOpen: Array.isArray(roomData) ? roomData.length : 0,
              crowdLevel: ratingsMap[slug] ?? 60,
              features: lib.services ? fixData(lib.services) : {},
              nameID: slug,
              url: lib.googleMapsLink,
              image: lib.imageSrc,
              hasStudySpace: lib.hasStudySpace,
            }
          })
        )
        if (isMounted) setLibraryData(withRooms)
      } catch (err) {
        console.error('Failed to load libraries', err)
      }
    }

    load()
    return () => { isMounted = false }
  }, [])

  const filtered = (libraryData ?? []).filter(lib => {
    if (searchQuery && !lib.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (selectedFilters.length === 0) return true
    return selectedFilters.every(key => {
      const pill = FILTER_PILLS.find(p => p.key === key)
      return pill ? pill.test(lib) : true
    })
  })

  return (
    <div className="min-h-screen" style={{ background: '#FDFDFD' }}>
      <div
        className="mx-auto"
        style={{ maxWidth: 1171, paddingTop: 82 + 48, paddingLeft: 24, paddingRight: 24, paddingBottom: 96 }}
      >
        {/* ── Header ── */}
        <div style={{ marginBottom: 48 }}>
          <h1
            style={{
              color: '#0F172B',
              fontSize: 36,
              fontWeight: 800,
              lineHeight: '40px',
            }}
          >
            Explore Libraries
          </h1>
          <p
            style={{
              color: '#62748E',
              fontSize: 16,
              fontWeight: 400,
              lineHeight: '24px',
              marginTop: 12,
              maxWidth: 672,
            }}
          >
            Find the perfect study spot across campus. Search by name or use filters to discover
            spaces that match your current needs.
          </p>

          {/* Search bar */}
          <div style={{ marginTop: 32, maxWidth: 800 }}>
            <div
              className="flex items-center rounded-2xl overflow-hidden"
              style={{
                background: 'white',
                border: '1px solid #E5E7EB',
                boxShadow: '0px 1px 2px rgba(0,0,0,0.1), 0px 1px 3px rgba(0,0,0,0.1)',
                height: 54,
              }}
            >
              {/* Left: library type label */}
              <div
                className="flex items-center gap-2 shrink-0"
                style={{
                  padding: '0 16px',
                  height: '100%',
                  borderRight: '1px solid #F3F4F6',
                  minWidth: 136,
                }}
              >
                <SearchIcon />
                <span style={{ color: '#90A1B9', fontSize: 14, fontWeight: 500 }}>All libraries</span>
              </div>

              {/* Right: text input + ⌘K hint */}
              <div className="flex items-center justify-between flex-1" style={{ padding: '0 16px' }}>
                <input
                  type="text"
                  placeholder="Search by library name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none"
                  style={{
                    color: '#111827',
                    fontSize: 15,
                    fontWeight: 400,
                  }}
                />
                <div
                  className="flex items-center justify-center"
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    padding: '4px 8px',
                    flexShrink: 0,
                    boxShadow: '0px 1px 2px rgba(0,0,0,0.1)',
                  }}
                >
                  <span style={{ color: '#90A1B9', fontSize: 10, fontWeight: 700, letterSpacing: '1.12px' }}>
                    ⌘K
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter pills */}
          <div style={{ marginTop: 20 }}>
            <div className="flex items-center flex-wrap" style={{ gap: '8px 8px' }}>
              {/* Suggestions label */}
              <div className="flex items-center gap-1.5" style={{ marginRight: 4 }}>
                <FilterFunnelIcon />
                <span
                  style={{
                    color: '#62748E',
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.25px',
                    lineHeight: '19.5px',
                  }}
                >
                  Suggestions
                </span>
              </div>

              {FILTER_PILLS.map(pill => {
                const active = selectedFilters.includes(pill.key)
                return (
                  <button
                    key={pill.key}
                    onClick={() => toggleFilter(pill.key)}
                    className="rounded-full transition-all"
                    style={{
                      padding: '9px 17px',
                      background: active ? '#0F172B' : 'white',
                      border: active ? '1px solid #0F172B' : '1px solid #E5E7EB',
                      boxShadow: '0px 1px 2px rgba(0,0,0,0.1), 0px 1px 3px rgba(0,0,0,0.1)',
                      color: active ? 'white' : '#4A5565',
                      fontSize: 13,
                      fontWeight: 500,
                      lineHeight: '19.5px',
                      cursor: 'pointer',
                    }}
                  >
                    {pill.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── All Libraries heading ── */}
        <h2
          style={{
            color: '#0F172B',
            fontSize: 20,
            fontWeight: 700,
            lineHeight: '28px',
            marginBottom: 32,
          }}
        >
          All Libraries
        </h2>

        {/* ── Grid ── */}
        {libraryData === null ? (
          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}
          >
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : libraryData.length === 0 ? (
          <div className="flex items-center justify-center" style={{ paddingTop: 96, paddingBottom: 96 }}>
            <p style={{ color: '#6A7282', fontSize: 16 }}>Could not load library data. Make sure the backend is running.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center" style={{ paddingTop: 96, paddingBottom: 96 }}>
            <p style={{ color: '#6A7282', fontSize: 16 }}>No libraries match your filters.</p>
          </div>
        ) : (
          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 32 }}
          >
            {filtered.map(lib => <LibraryCard key={lib.id} lib={lib} />)}
          </div>
        )}
      </div>
    </div>
  )
}
