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
      <div className='bg-gray-200'>

      <section className='w-full shadow-lg bg-white'>
      <div>
      

      </div>
              <div className="flex flex-col gap-4 mb-4">
              <div className="relative flex-grow flex justify-center items-center py-4">

    <div className="relative w-full max-w-sm">
      <Input
        type="search"
        placeholder="Search libraries..."
        className="w-full pl-12 text-md md:text-md font-strong border-none  bg-gray-200 rounded-full 
                   focus:border-transparent focus:ring-0 focus:ring-transparent
                   placeholder:text-gray-400 font-light transition-all duration-300
                   shadow-sm hover:shadow-md"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-4 text-gray-400" />
    </div>
  </div>
              </div>
              <div className="flex flex-wrap gap-2 flex-row items-center justify-center">
              <div className="flex flex-wrap gap-2 mb-6 ml-4 mr-4">
              {featureConfig.map((feature) => {
                const Icon = feature.icon;
                const isSelected = selectedFilters.includes(feature.key);
  
                return (
                  <Badge
                    key={feature.key}
                    onClick={() => toggleFilter(feature.key)}
                    variant={isSelected ? "default" : "outline"}
                    className={`
                      cursor-pointer select-none transition-all duration-200 gap-1 pr-3
                      ${isSelected 
                        ? `bg-gray-900 text-white border-transparent shadow-sm`
                        : " hover:bg-gray-600/50 border-none bg-gray-200"
                      }
                    `}
                  >
                    <Icon className={`h-3 w-3 ${isSelected ? "text-current" : "text-muted-foreground"}`} />
                    {feature.label}
                    {isSelected}
                  </Badge>
                );
              })}
            </div>
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
                  <Card key={lib.id} className="overflow-hidden p-0 gap-0 rounded-[2rem] border-none bg-transparent shadow-none ">
                    <CardHeader className="p-0 [.border-b]:pb-6">
                    <div className="relative h-64 w-full overflow-hidden rounded-[1.5rem]">
        <img
          src={lib.image}
          alt={`${lib.name} exterior`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/60 to-transparent pointer-events-none" />
        <div className="absolute top-3 left-3 z-20">
        {lib.isOpen ? (
                          <StatusBadge crowdLevel={lib.crowdLevel} variant=""></StatusBadge>
                        ) : (
                          <div className="flex items-center font-bold py-0 rounded-full">
                            <StatusBadge 
                              variant="closed" 
                              className="" 
                              crowdLevel={0}
                            />
                          </div>
                        )}
      </div>
      <div className='absolute bottom-4 left-4 z-20'>
        
      <CardTitle className="text-lg font-sans text-gray-100 tracking-tight leading-tight w-full" style={{ whiteSpace: 'pre-wrap' }}>
            {lib.name}
          </CardTitle>       
          {(lib.hours && lib.hours.length > 3 && (!lib.hours.includes('Closed') && lib.hours.length > 0)) && 
              <div className="flex items-center text-slate-600 bg-transparent py-1 rounded-full border-none border-slate-100">
                <Clock className="mr-2 h-3 w-3 text-gray-200" />
                <span style={{ whiteSpace: 'pre-wrap' }} className='text-white font-extralight text-xs'>{lib.hours}</span>
              </div>
            }
  
          <Separator.Root
            decorative
            orientation="horizontal"
            className="mt-2 mb-1 h-px w-[350px] bg-gray-400/30"
          />        
          <div className="flex flex-wrap gap-1 items-center">
            {featureConfig.map((feature) => {
              const isActive = lib.features[feature.key];
              const IconComponent = feature.icon;
              return (
                <div key={feature.key}>
                <Tooltip>
                  <TooltipTrigger>
                <div
                  title={isActive ? feature.label : `No ${feature.label}`}
                  className={`
                    relative flex items-center justify-center w-6 h-6 rounded-full border-none transition-all duration-200 ease-in-out
                    ${isActive 
                      ? `scale-100 opacity-100 text-gray-200` 
                      : "bg-transparent border-transparent text-gray-100/20 scale-90 grayscale"
                    }
                  `}
                >
                  
                  <IconComponent 
                    className={`h-4 w-4`} 
                  />
                </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isActive ? feature.label : `No ${feature.label}`}</p>
                </TooltipContent>
              </Tooltip>
              </div>
              );
            })}
  
          </div>
      </div>
      
  
            <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(lib.url, '_blank');
            }}
            className="absolute top-3 right-6 h-6 p-1 bg-gray-800/60 backdrop-blur-md text-white border-0 rounded-full transition-all duration-300 ease-spring hover:scale-105 active:scale-95 hover:bg-gray-600 hover:border-blue-200 hover:shadow-md group"
          >
            <MapPin className="mr-0 h-2 w-2 opacity-80 transition-transform group-hover:rotate-12" />
          </Button>
      </div>
                    </CardHeader>
  
                    <CardContent className="gap-y-4 m-0">
                      
                    </CardContent>
                    
                    
                    <CardFooter className='gap-x-2 mb-0 [.border-t]:pt-0'>
                    
                      
                    </CardFooter>
                    { lib.calID && 
                        <span className='flex items-right justify-start ml-6 mt-0 p-0 text-slate-400 font-sm mr-4' style={{ whiteSpace: 'pre-wrap' }}>{lib.calID}</span>
                        }
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
  
