'use client'

import { useState } from 'react';

import * as React from "react";
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
import { useRouter } from 'next/navigation';
import ScheduleChart from '../scheduleChart';
const featureConfig = [
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
type Library = {
    id: number;
    name: string;
    hours: string;
    isOpen: boolean;
    rooms: Array<unknown>;
    roomsOpen: number;
    roomsTotal: number;
    crowdLevel: number; // 0 to 100
    features?: {
      late?: boolean;
      snacks?: boolean;
      equipment?: boolean;
      research?: boolean;
      study?: boolean;
    };
    nameID:string;
    calID:string;
    url?:string;
    image?:string;
    studyLink?:string;
    weeklySchedule?:any;
  };
export default function LibraryStatusPage({data}) {
  const router = useRouter()

    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [libraryData, setLibraryData] = useState<Library[]>()
    React.useEffect(()=>{
        setLibraryData(data);
    },[data])
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const filteredLibraries = libraryData?.filter((lib) => {
      const matchesTags = selectedFilters.length === 0 || 
        selectedFilters.every((key) => lib.features[key]);
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        lib.name.toLowerCase().includes(query) || (lib.name.replace(/\s*\(.*?\)\s*/g, ' ').trim()).toLowerCase().includes(query) ||
        (lib.address && lib.address.toLowerCase().includes(query)); // Optional: search address too
    
      // Return true only if BOTH match
      return matchesTags && matchesSearch;
    });
    const toggleFilter = (key: string) => {
      setSelectedFilters(prev => 
        prev.includes(key) 
          ? prev.filter(f => f !== key)
          : [...prev, key]              
      );
    };
  
    function CrowdLevelText(lib) {
      if (lib.crowdLevel <= 25) {
   return     <span className="text-green-600">Not Crowded</span>
  } else if (lib.crowdLevel <= 50) {
    return <span className="text-yellow-600">Not too Crowded</span>
  } else if (lib.crowdLevel <= 75) {
    return <span className="text-orange-600">Crowded</span>
  } else {
    return <span className="text-red-600">At Capacity</span>
  }
    }
    function getSlugFromName(name: string): string {
      const overrides: Record<string, string> = {
        "Main (Gardner) Stacks": "main_stacks",
        "Moffitt Library": "moffitt",
        "Doe Library": "doe",
        "Kresge Engineering Library": "kresge"
      };
    
      if (overrides[name]) return overrides[name];
    
      return name
        .toLowerCase()
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[^\w_]/g, ''); // Remove special chars
    }

    const [pinnedIds, setPinnedIds] = useState([])
    const togglePin = (id) => {
      setPinnedIds((prev) => {
        const newPins = prev.includes(id) 
          ? prev.filter((p) => p !== id)
          : [...prev, id];               
        
        localStorage.setItem('pinnedLibs', JSON.stringify(newPins));
        return newPins;
      });
    };
    const sortedLibraries = [...(filteredLibraries || [])].sort((a, b) => {
      const isAPinned = pinnedIds.includes(a.id);
      const isBPinned = pinnedIds.includes(b.id);
      
      if (isAPinned && !isBPinned) return -1; 
      if (!isAPinned && isBPinned) return 1; 
      return 0; 
    });

    return (
      <div className='bg-gray-50'>

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
          <input
            type="text"
            placeholder="Search by library name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />

          {/* Keyboard Shortcut Badge */}
          {/* <div className="pr-4 flex items-center shrink-0">
            <kbd className="px-2 py-1 text-xs font-medium text-slate-400 bg-slate-100 rounded-md border border-slate-200">
              ⌘ K
            </kbd>
          </div> */}
        </div>
      </div>

      {/* Suggestions Header & Filter Pills */}
      <div className="flex flex-wrap items-center gap-2.5">
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
      </div>
    </section>
      <main className="container w-full p-4 md:p-8 mx-auto" >  
        <section className="space-y-6">   
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-8 md:gap-8 lg:gap-24 xl:gap-16 border-none bg-transparent shadow-none">
              {libraryData && sortedLibraries && sortedLibraries.map((lib) => {
                const roomPercent = (lib.roomsOpen / lib.roomsTotal) * 100;
                const isPinned = pinnedIds.includes(lib.id)
                return (
                  <Card 
                    key={lib.id} 
                    className="p-0 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xs transition-all hover:shadow-md"
                  >
                    {/* Top Image Section (Flush with top/left/right borders) */}
                    <div className="relative h-52 w-full overflow-hidden">
                      <img
                        src={lib.image}
                        alt={`${lib.name} exterior`}
                        className="h-full w-full object-cover"
                      />
                
                      {/* Top Left: Status Badge */}
                      <div className="absolute top-3 left-3 z-10">
                        {lib.isOpen ? (
                          <StatusBadge crowdLevel={lib.crowdLevel} variant="" />
                        ) : (
                          <StatusBadge variant="closed" crowdLevel={0} />
                        )}
                      </div>
                
                      {/* Top Right: Map Location Button */}
                      <Button
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(lib.url, '_blank');
                        }}
                        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border-none transition-transform active:scale-95"
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                
                      {/* Bottom Left Badge: Available Rooms Overlay */}
                      {lib.availableRooms && (
                        <div className="absolute bottom-3 left-3 z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-xs font-medium border border-white/10">
                          {lib.availableRooms} rooms available
                        </div>
                      )}
                    </div>
                
                    {/* Card Body Section */}
                    <CardContent className="p-5 flex flex-col gap-3 pt-0">
                      {/* Title */}
                      <CardTitle className="text-xl font-bold text-slate-900 leading-snug tracking-tight">
                        {lib.name}
                      </CardTitle>
                
                      {/* Hours */}
                      {lib.hours && !lib.hours.includes('Closed') && (
                        <div className="flex items-center text-slate-500 text-sm gap-2">
                          <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{lib.hours}</span>
                        </div>
                      )}

                      { lib.isOpen && lib.hours.length > 3 && <ScheduleChart name={lib.name} operatingHours={lib.hours}></ScheduleChart> }

                      {/* Horizontal Divider */}
                      <div className="w-full border-t border-slate-100 my-1" />
                
                      {/* Feature Icons Row */}
                      <div className="flex items-center gap-3.5 text-slate-400">
                        {featureConfig.map((feature) => {
                          const isActive = lib.features[feature.key];
                          const IconComponent = feature.icon;
                          return (
                            <Tooltip key={feature.key}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`transition-colors ${
                                    isActive ? "text-slate-600" : "text-slate-300 opacity-50"
                                  }`}
                                >
                                  <IconComponent className="h-4 w-4" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{isActive ? feature.label : `No ${feature.label}`}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                
                      {/* Action Button */}
                      {lib.availableRooms && (
                        <Button 
                          variant="ghost" 
                          className="w-full mt-2 py-2.5 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-600 font-semibold text-sm flex items-center justify-center gap-1 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Navigation logic for room booking/details
                          }}
                        >
                          View Rooms <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {!libraryData && <LibrariesLoading></LibrariesLoading>}
          </div>
        </section>
      </main>
      </div>
    );
  }
  
