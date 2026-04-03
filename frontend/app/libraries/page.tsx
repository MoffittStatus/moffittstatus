'use client'; // If this is a client component

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
import {SubmitReport} from '@/app/components/submitRating'
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
import { LibrariesLoading } from '@/app/components/librariesLoading';
import { StatusDot } from '@/app/components/statusDot';
import { StatusBadge } from '@/app/components/statusBadge';
import { BusynessPopup } from '@/app/components/busynessPopup';

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

// Configuration for your features
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
function hoursFix (input:string) { 
  // if(input.includes('24')){
  //   const temp = input.split('\n')
  //   return [temp.slice(0,8), temp.slice(8)]
  // }
  if (input.includes('Starts')){
    const parts = input.split('Starts')
    return [parts[0].trim(), 'Starts ' + parts[1].trim()]
  }
  if (input.includes('Cal ID')){
    const parts = input.split('Cal ID')
    return [parts[0].trim(), 'Cal ID ' + parts[1].trim()]
  }
  const parts = input.split('.');

  const firstPart = parts.slice(0, 4).join('.') + '.';

  const secondPart = parts.slice(4).join('.').trim();
return [firstPart.trim(), secondPart]
}
function fixData (text:string){
  if(!text)
    return {}
  text = text.toLowerCase()
  return {
    equipment: text.includes("equipment"),

    late: text.includes("evening") || text.includes("late"),

    research: text.includes("research"),

    study: text.includes("study"),
    
    snacks: text.includes("snack")
  }
}

export default function LibraryStatusPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [libraryData, setLibraryData] = useState<Library[]>()
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
  // React.useEffect(()=>{
  //   const  loadLibraries= async () => {
  //   const tempRoomData = [[],await getAvailableRooms("6 pm","kresge"),await getAvailableRooms("6 pm","main_stacks")]
    
  //   const tempTimeData = await getAllLibraryHours() || []
  //   console.log(tempTimeData)
  //   setLibraryData([
  //     {
  //       id: 0,
  //       name: "Doe Library",
  //       hours: hoursFix(tempTimeData[7].hours)[0]||"",
  //       calID: hoursFix(tempTimeData[7].hours)[1]||"",
  //       isOpen: (tempTimeData[7].status||'').toLowerCase().includes('open'),
  //       rooms: tempRoomData[0]||[],
  //       roomsOpen: -1, 
  //       roomsTotal: 1,
  //       crowdLevel: (await getLibraryRating("doe")).data.average||60,
  //       features: tempTimeData[7] && tempTimeData[7].services ? fixData(tempTimeData[7].services) : {},
  //       nameID:'doe',
  //       url: tempTimeData[7].googleMapsLink
  //     },
  //     {
  //       id: 1,
  //       name: "Kresge Library",
  //       hours: hoursFix(tempTimeData[10].hours)[0]||"",
  //       calID: hoursFix(tempTimeData[10].hours)[1]||"",
  //       isOpen: (tempTimeData[10].status||'').toLowerCase().includes('open'),
  //       rooms: tempRoomData[1]||[],
  //       roomsOpen: (tempRoomData[1]).length || -1,
  //       roomsTotal: 5,
  //       crowdLevel: (await getLibraryRating("kresge")).data.average||60,
  //       features: tempTimeData[10] && tempTimeData[10].services ? fixData(tempTimeData[10].services) : {},
  //       nameID:"kresge"
  //     },
  //     {
  //       id: 2,
  //       name: "Main Stacks",
  //       hours: hoursFix(tempTimeData[20].hours)[0]||"",
  //       calID: hoursFix(tempTimeData[20].hours)[1]||"",
  //       isOpen: (tempTimeData[20].status||'').toLowerCase().includes('open'),
  //       rooms:tempRoomData[2]||[],
  //       roomsOpen: (tempRoomData[2]).length || -1,
  //       roomsTotal: 17,
  //       crowdLevel: (await getLibraryRating("main_stacks")).data.average||60,
  //       features: tempTimeData[20] && tempTimeData[20].services ? fixData(tempTimeData[20].services) : {},
  //       nameID:'main_stacks'
  //     },
  //   ]);}
  //   loadLibraries();
  // },[])
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
  React.useEffect(() => {
    let isMounted = true;
    const loadLibraries = async () => {
      try {
        // const allLibraries = (await getAllLibraryHours()) || [];
        const [allLibraries, allRatingsRes] = await Promise.all([
          getAllLibraryHours(),
          getAllLibraryRatings()
        ]); 
        console.log("Finished")
        if (!isMounted) return;
          const ratingsRaw = allRatingsRes?.data?.data || [];
          const ratingsMap: Record<string, number> = {};
          const scheduleMap: Record<string, any> = {};

          ratingsRaw.forEach((r: any) => {
            const key = r.library; 
            ratingsMap[key] = parseFloat(r.average);
            scheduleMap[key] = r.weeklySchedule;
            console.log(r.weeklySchedule)
          });
    
          console.log("Ratings Map Created:", ratingsMap);

          const initialData = (allLibraries || []).map((lib, index) => {
            const slug = getSlugFromName(lib.name);
            const [displayHours, calID] = hoursFix(lib.hours) || ["", ""];
    
            return {
              id: index,
              name: lib.name,
              hours: displayHours,
              calID: calID,
              isOpen: (lib.status || '').toLowerCase().includes('open'),
              crowdLevel: ratingsMap[slug] || 60,
              features: lib.services ? fixData(lib.services) : {},
              nameID: slug,
              url: lib.googleMapsLink,
              image: lib.imageSrc,
              studyLink: lib.studySpaceLink,
              hasStudySpace: lib.hasStudySpace,
              weeklySchedule:scheduleMap[lib.name] || [],
              rooms: [], 
              roomsOpen: -1,
              roomsTotal: 0
            };
          });
          console.log(initialData[0].weeklySchedule)
          console.log(initialData[1].weeklySchedule)
          console.log(initialData[2].weeklySchedule)
          console.log(initialData[3].weeklySchedule)
          console.log(initialData[4].weeklySchedule)
          console.log(initialData[5].weeklySchedule)
          console.log(initialData[6].weeklySchedule)
          console.log(initialData[7].weeklySchedule)
          console.log(initialData[8].weeklySchedule)
          console.log("Pass 1: Basic info loaded");
          setLibraryData(initialData);
        const libraryPromises = allLibraries!.map(async (lib, index) => {
          // Only fetch rooms if the scraper found a study space link
          // const roomsPromise = lib.hasStudySpace 
          //   ? getAvailableRooms("6 pm", slug).catch(() => []) 
          //   : Promise.resolve([]);
          const slug = getSlugFromName(lib.name);

          const crowdLevel = ratingsMap[lib.name] || 60;
          
          const roomData = lib.hasStudySpace 
          ? await getAvailableRooms("6 pm", slug).catch(() => []) 
          : [];
          const [displayHours, calID] = hoursFix(lib.hours) || ["", ""];
  
          return {
            id: index,
            name: lib.name,
            hours: displayHours,
            calID: calID,
            isOpen: (lib.status || '').toLowerCase().includes('open') || (lib.status || '').toLowerCase().includes('closing soon'),
            
            // Room Logic
            rooms: roomData,
            roomsOpen: roomData.length > 0 ? roomData.length : -1,
            roomsTotal: roomData.length || 0,
            
            crowdLevel: crowdLevel,
            weeklySchedule:scheduleMap[lib.name] || [],
            features: lib.services ? fixData(lib.services) : {},
            nameID: slug,
            url: lib.googleMapsLink,
            image: lib.imageSrc,
            studyLink: lib.studySpaceLink
          };
        });
  
        const processedData = await Promise.all(libraryPromises);
        
        console.log("Processed Library Data:", processedData);
        setLibraryData(processedData);
  
      } catch (error) {
        console.error("Failed to load library data", error);
      }
    };
  
    loadLibraries();
  }, []);
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
      {/* Recommendations Section */}
      {/* <section className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight mb-4">
          Recommendations
        </h2>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Individuals</CardTitle>
              <p className="text-muted-foreground">
                Go to Floor 1 in Moffitt Library
              </p>
            </CardHeader>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Groups</CardTitle>
              <p className="text-muted-foreground">Go to Floor D in Main Stacks</p>
            </CardHeader>
          </Card>
        </div>
      </section>

      <hr className="my-8" /> */}
        
      <section className="space-y-6">   
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-8 md:gap-8 lg:gap-24 xl:gap-16 border-none bg-transparent shadow-none">
            {libraryData && libraryData.length >=29 && sortedLibraries && sortedLibraries.map((lib) => {
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
          {/* <div className='flex flex-row gap-x-2 justify-right items-right'>
          {(lib.weeklySchedule && lib.weeklySchedule.length>0 && !lib.weeklySchedule.every(item => item === 0)) &&       
        <BusynessPopup 
          schedule={lib.weeklySchedule || []} 
          libraryName={lib.name} 
        />
        }
        
          </div> */}
        </div>
    </div>
    
      {/* <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div> */}
      
      {/* <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              togglePin(lib.id);
            }}
            className={`
              absolute top-3 right-3 z-20 h-6 w-6 rounded-full 
              transition-all duration-300 backdrop-blur-md shadow-sm
              ${isPinned 
                ? "bg-blue-500 text-white hover:bg-blue-600" 
                : "bg-white/70 text-slate-500 hover:bg-white hover:text-blue-500"
              }
            `}
          >
            <Pin className={`h-4 w-4 transition-transform ${isPinned ? "fill-current" : "rotate-45"}`} />
          </Button> */}
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

function DatePicker({
  date,
  setDate,
}: {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full md:w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MM/dd/yyyy") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
