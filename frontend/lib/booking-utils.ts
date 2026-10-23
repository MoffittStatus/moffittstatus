import { LibraryOption, LibrarySlug } from '@/types/booking';

export const SINGLE_SLUGS: LibrarySlug[] = [
  "main_stacks",
  "moffitt",
  "kresge",
  "earth_sciences",
  "east_asian",
  "environmental_design",
  "igs",
  "business",
  "social_research",
];
export const VALID_SLUGS: LibrarySlug[] = ["all", ...SINGLE_SLUGS];

export const LIBRARIES: LibraryOption[] = [
  { slug: "all", name: "All Libraries" },
  { slug: "main_stacks", name: "Main (Gardner) Stacks" },
  { slug: "moffitt", name: "Moffitt Library" },
  { slug: "kresge", name: "Engineering & Mathematical Sciences Library" },
  { slug: "business", name: "Business Library" },
  { slug: "earth_sciences", name: "Earth Sciences & Map Library" },
  { slug: "east_asian", name: "East Asian Library" },
  { slug: "environmental_design", name: "Environmental Design Library" },
  { slug: "igs", name: "Institute of Governmental Studies Library" },
  { slug: "social_research", name: "Social Research Library" },
];

export const SLUG_TO_NAME: Record<string, string> = LIBRARIES.reduce((acc, lib) => {
  if (lib.slug !== "all") acc[lib.slug] = lib.name;
  return acc;
}, {} as Record<string, string>);

export const HOURS: number[] = Array.from({ length: 25 }, (_, i) => i);

export const formatHourLabel = (h: number): string => {
  if (h === 0 || h === 24) return "12 AM";
  if (h === 12) return "12 PM";
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
};

export const format12HourTime = (time24: string): string => {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr || '00'} ${ampm}`;
};

export const formatSlotRange12Hr = (timeSlotStr: string): string => {
  if (!timeSlotStr) return 'Available Slot';
  const parts = timeSlotStr.split(' - ');
  return parts.length === 2 
    ? `${format12HourTime(parts[0])} - ${format12HourTime(parts[1])}`
    : format12HourTime(timeSlotStr);
};

export const formatDateKey = (dateObj: Date): string => 
  dateObj.toLocaleDateString('sv-SE', { timeZone: 'America/Los_Angeles' });