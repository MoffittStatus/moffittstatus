import { Armchair, BookOpenCheck, Coffee, Laptop, Moon } from 'lucide-react';

export const featureConfig = [
  { 
    key: "late", 
    label: "Late Hours", 
    icon: Moon, 
    activeColor: "text-indigo-500 bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
    iconColor: "fill-indigo-500" // Optional: fills the icon 
  },
  { 
    key: "snacks", 
    label: "Snacks Allowed", 
    icon: Coffee, 
    activeColor: "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100",
    iconColor: "" 
  },
  { 
    key: "equipment", 
    label: "Tech Lending", 
    icon: Laptop, 
    activeColor: "text-blue-500 bg-blue-50 border-blue-200 hover:bg-blue-100",
    iconColor: "" 
  },
  { 
    key: "research", 
    label: "Research Help", 
    icon: BookOpenCheck, 
    activeColor: "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
    iconColor: "" 
  },
  { 
    key: "study", 
    label: "Study Spaces", 
    icon: Armchair, 
    activeColor: "text-rose-500 bg-rose-50 border-rose-200 hover:bg-rose-100",
    iconColor: "" 
  },
];

export function getSlugFromName(name: string): string {
  const overrides: Record<string, string> = {
    "Main (Gardner) Stacks": "main_stacks",
    "Main Stacks": "main_stacks",
    "Moffitt Library": "moffitt",
    "Doe Library": "doe",
    "Kresge Engineering Library": "kresge",
    "Engineering & Mathematical Sciences Library": "kresge"
  };

  if (overrides[name]) return overrides[name];

  return name
    .toLowerCase()
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^\w_]/g, ''); // Remove special chars
}

export type Library = {
  id: number;
  name: string;
  hours: string;
  isOpen: boolean;
  rooms: Array<unknown>;
  roomsOpen: number;
  roomsTotal: number;
  crowdLevel: number;
  features?: {
    late?: boolean;
    snacks?: boolean;
    equipment?: boolean;
    research?: boolean;
    study?: boolean;
  };
  nameID: string;
  calID: string;
  url?: string;
  image?: string;
  studyLink?: string;
  weeklySchedule?: any;
  address?: string;
};