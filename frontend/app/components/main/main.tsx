import Image from "next/image";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  Clock,
  MapPin,
  MapPinCheckInside,
  Building,
  Moon,
  Coffee,
  Mic,
  HelpCircle,
  Laptop,
  Volume2,
  BookOpenCheck, 
  Armchair,
  Pin,
  Activity, 
  ChevronRight
} from "lucide-react";
import {SubmitReport} from '../../components/submitRating'
import { cn, getDynamicStyles } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import * as Separator from "@radix-ui/react-separator";
import { Slider } from "@/components/ui/slider";
import { getAllLibraryRatings } from '@/lib/firebaseMethods';
import { getAllLibraryHours, getAvailableRooms } from '@/lib/libCal';
import Details from '@/app/components/libraryDetails';
import { LibrariesLoading } from '../../components/librariesLoading';
import { StatusDot } from '../../components/statusDot';
import { StatusBadge } from '../../components/statusBadge';
import { BusynessPopup } from '../../components/busynessPopup';
import { redirect, RedirectType } from 'next/navigation';
import ScheduleChart from '../scheduleChart';
import { featureConfig, getSlugFromName } from '@/lib/libData';
import LibraryDataLoader from "./LibraryDataLoader";
import SearchBar from "./SearchBar";
import FilterButtons from "./FilterButtons";
import { FilterProvider } from "@/context/FilterContext";


export default function LibraryStatusPage() {
    return (
      <div className='bg-gray-50'>
      <FilterProvider>
    <section className="w-full px-4 md:px-32 py-8 max-w-6xl">
      {/* Header Section */}
      <div className="md:mb-6">
        <h1 className="text-xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Explore Libraries
        </h1>
        <p className="text-slate-500 text-xs md:text-base max-w-2xl leading-relaxed">
          Find the perfect study spot across campus. Search by name or use filters to discover spaces that match your current needs.
        </p>
      </div>
      {/* Compound Search Input Bar */}
      <div className="mb-6 max-w-3xl">
        <div className="relative flex items-center w-full border border-gray-200 rounded-2xl bg-white shadow-xs focus-within:ring-2 focus-within:ring-slate-300 focus-within:border-transparent transition-all">
          
          {/* Left Segment: Category Dropdown / Indicator */}
          <div className="flex items-center gap-2 px-4 py-3.5 border-r border-gray-200 text-slate-500 text-sm font-medium shrink-0">
            <Search className="h-4 w-4 text-slate-400" />
            <span>All libraries</span>
          </div>

          {/* Search Input Field */}
          <SearchBar/>

          {/* Keyboard Shortcut Badge */}
          {/* <div className="pr-4 flex items-center shrink-0">
            <kbd className="px-2 py-1 text-xs font-medium text-slate-400 bg-slate-100 rounded-md border border-slate-200">
              ⌘ K
            </kbd>
          </div> */}
        </div>
      </div>

      {/* Suggestions Header & Filter Pills */}
      {/* <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold tracking-wider mr-1 uppercase">
          <Filter className="h-3.5 w-3.5" />
          <span>Suggestions</span>
        </div>

        {featureConfig.map((feature) => {
          const isSelected = selectedFilters.includes(feature.key);

          return (
            <button
              key={feature.key}
              onClick={() => toggleFilter(feature.key)}
              className={`
                inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all border select-none
                ${isSelected 
                  ? "bg-purple-100 text-purple-700 border-purple-200 shadow-xs" 
                  : "bg-white text-slate-700 border-gray-200 hover:bg-slate-50 hover:border-gray-300"
                }
              `}
            >
              <span>{isSelected ? "✓" : "+"}</span>
              <span>{feature.label}</span>
            </button>
          );
        })}
      </div> */}

      <FilterButtons />
    </section>
      <main className="container w-full p-4 md:p-8 mx-auto" >  
        <section className="space-y-6">   
          <LibraryDataLoader></LibraryDataLoader>
        </section>
      </main>
      </FilterProvider>
      </div>
    );
  }
  
