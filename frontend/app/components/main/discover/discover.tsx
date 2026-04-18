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
  ChevronDown,
  ChevronUp
} from "lucide-react";
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
import { LibrariesLoading } from '../../librariesLoading';
import { StatusDot } from '../../statusDot';
import { StatusBadge } from '../../statusBadge';
import { BusynessPopup } from '../../busynessPopup';
import dynamic from 'next/dynamic';
import { MapComponentHandle, MapComponentProps } from '../../map/MapComponent';
import { BACKEND_URL, CHATBOT_URL } from '@/lib/apiEndPoints';
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
  const DynamicMapComponent  = dynamic<MapComponentProps>(
    () => import('../../map/MapComponent').then((mod) => mod.default),
    {
      loading: () => <></>,
      ssr: false,
    }
  );
  
  
  DynamicMapComponent.displayName = 'DynamicMapComponent';
  
export default function DiscoverPage({data}) {
  const [searchText, setSearchText] = useState('');
  const mapHandleRef = React.useRef<MapComponentHandle | null>(null);  // New state for OskiChat
const [chatHistory, setChatHistory] = useState([
  { role: 'bot', text: 'Hey! I\’m OskiChat. New to campus? I can help you get around. Feel free to tap around the map above. What are you looking for?' }
]);
const [chatInput, setChatInput] = useState('');
const [makingRequest, setMakingRequest] = useState(false);

const [isChatMinimized, setIsChatMinimized] = useState(false);
// Function to handle sending a message

const handleSendMessage = async (e?: React.FormEvent) => {
  e?.preventDefault();

  if (makingRequest) return;
  if (!chatInput.trim()) return;

  const trimmedInput = chatInput.trim();
  const newHistory = [...chatHistory, { role: "user", text: trimmedInput }].slice(-5);

  setChatHistory(newHistory);
  setChatInput("");

  if (trimmedInput.length < 10) {
    setChatHistory((prev) =>
      [...prev, { role: "bot", text: "You gotta write a little more than that :)" }].slice(-5)
    );
    return;
  }

  setMakingRequest(true);

  // add temporary loading message
  setChatHistory((prev) =>
    [...prev, { role: "bot", text: "Thinking..." }].slice(-5)
  );

  try {
    const res = await fetch(CHATBOT_URL + "/api/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_lat: 37.8715,
        user_lng: -122.2730,
        query: trimmedInput.length > 250 ? trimmedInput.substring(0, 250) : trimmedInput,
      }),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      throw new Error("Server returned a non-JSON response");
    }

    if (!res.ok) {
      throw new Error(data?.detail?.error || JSON.stringify(data?.detail) || "Request failed");
    }

    const recommendation = data.final_json;
    const botMessage = `${recommendation.pitch}`;
    const query_store_response = await fetch(BACKEND_URL + "/api/oskichat/store_search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_lat: 37.8715,
        user_lng: -122.2730,
        query: trimmedInput.length > 250 ? trimmedInput.substring(0, 250) : trimmedInput,
        output: data || {}
      }),
    });
    setChatHistory((prev) => {
      const withoutLoading = prev.filter(
        (msg) => !(msg.role === "bot" && msg.text === "Thinking...")
      );
      return [...withoutLoading, { role: "bot", text: botMessage }].slice(-5);
    });

    onLibrarySelect(recommendation.name);
  } catch (error) {
    console.error("Failed to fetch recommendation:", error);

    setChatHistory((prev) => {
      const withoutLoading = prev.filter(
        (msg) => !(msg.role === "bot" && msg.text === "Thinking...")
      );
      return [
        ...withoutLoading,
        {
          role: "bot",
          text: "I couldn't find anything meeting your criteria, try sending me the message again.",
        },
      ].slice(-5);
    });
  } finally {
    setMakingRequest(false);
  }
};
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


    const [pinnedIds, setPinnedIds] = useState([])
 
    const sortedLibraries = [...(filteredLibraries || [])].sort((a, b) => {
      const isAPinned = pinnedIds.includes(a.id);
      const isBPinned = pinnedIds.includes(b.id);
      
      if (isAPinned && !isBPinned) return -1; 
      if (!isAPinned && isBPinned) return 1; 
      if(!a.isOpen && b.isOpen) return 1;
      if(a.isOpen && !b.isOpen) return -1;
      return 0; 
    });
    const onLibrarySelect = (input:string) => {
      console.log("clicked", input, mapHandleRef.current);
      mapHandleRef.current?.goToBestMatch(input);
    }

      return (
        <div className="relative h-[93dvh] w-full overflow-hidden bg-gray-100 font-sans">
          
          <div className="absolute inset-0 z-0">
          <DynamicMapComponent
            searchText={searchText}
            setSearchText={setSearchText}
            onReady={(handle) => {
              console.log("is ready")
              mapHandleRef.current = handle;
              return mapHandleRef.current;
            }}
          />
                </div>
    
          <div className="absolute hide-scrollbar top-0 left-0 w-full z-10 flex flex-col gap-4 p-4 pt-8 pointer-events-none bg-gradient-to-b from-white/90 via-white/40 to-transparent">
            
          </div>
    
          <div className="absolute bottom-0  left-0 w-full z-10 pointer-events-none">
            
            {/* <div className="absolute bottom-[150px] left-4 right-4 max-w-lg mx-auto pointer-events-auto flex flex-col bg-white/95 backdrop-blur-md border border-gray-200 rounded-[2rem] shadow-lg overflow-hidden transition-all duration-300"> */}
              
            {/* OSKICHAT WIDGET - With Minimize/Maximize Toggle */}
            <div 
              className={`absolute bottom-[150px] left-4 right-4  max-auto  max-w-lg pointer-events-auto flex flex-col shrink-0 order-1 bg-white/95 backdrop-blur-md border border-gray-200 rounded-[2rem] shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
                isChatMinimized ? 'h-[40px] cursor-pointer hover:bg-gray-50' : 'h-[260px]'
              }`}
            >
              
              {/* Header - Now clickable to toggle */}
              <div 
                className="flex shrink-0  items-center justify-between px-5 py-2 bg-gray-50/80 cursor-pointer h-[40px]"
                onClick={() => setIsChatMinimized(!isChatMinimized)}
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  OskiChat
                </span>
                <button className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                  {isChatMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Only render the body when NOT minimized */}
              {!isChatMinimized && (
                <>
                  {/* Message History */}
                  <div className="flex-grow flex flex-col gap-2 p-3 overflow-y-auto hide-scrollbar bg-white/50 border-t border-gray-100">
                    <div className="flex-grow" /> 
                    {chatHistory.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`max-w-[85%] rounded-2xl px-3.5 py-1.5 text-sm shadow-sm shrink-0 ${
                          msg.role === 'user' 
                            ? 'bg-blue-500 text-white self-end rounded-br-sm' 
                            : 'bg-gray-200 text-gray-800 self-start rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                  </div>

                  {/* Input Area */}
                  <form onSubmit={handleSendMessage} className="shrink-0 p-2 relative flex items-center bg-white border-t border-gray-100 h-14">
                    <Input
                      type="text"
                      placeholder="Ask Oski about Berkeley spots..."
                      className="w-full pl-4 pr-10 py-5 bg-white border border-gray-200 rounded-full focus:ring-0 text-md"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                    />
                    <Button 
                      type="submit" 
                      disabled={!chatInput.trim()}
                      className="absolute right-3.5 h-7 w-7 rounded-full bg-blue-500 p-0 text-white border-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>
                      </svg>
                    </Button>
                  </form>
                </>
              )}
            </div>

            <div className="absolute bottom-0 left-0 w-full">
              {!libraryData && (
                <div className="flex justify-center pointer-events-auto">
                  {/* <LibrariesLoading /> */}
                </div>
              )}

                      <div className="flex gap-4 overflow-x-auto px-4 pb-4 mb-4 snap-x snap-mandatory hide-scrollbar pointer-events-auto w-full">
                        {libraryData && libraryData.length >= 29 && sortedLibraries && sortedLibraries.map((lib: any) => {
                          if (lib && (lib.name == "Privileges Desk" || lib.name == "Systemwide Library Facility-North")){
                            return (<div></div>)
                          } 
                          return (
                            <Card 
                              key={lib.id} 
                              onClick={() => onLibrarySelect?.(lib.name)} 
                              className="relative w-[85vw] max-w-[340px] shrink-0 snap-center overflow-hidden p-0 gap-0 rounded-[2rem] border-none bg-transparent cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                            >
                              <CardHeader className="p-0 [.border-b]:pb-6">
                                <div className="relative h-20 w-full overflow-hidden rounded-[1.5rem]">
                                  <img
                                    src={lib.image}
                                    alt={`${lib.name} exterior`}
                                    className="h-full w-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none" />
                                  <div className='absolute bottom-4 left-4 z-20 w-[calc(100%-2rem)]'>
                                    <CardTitle className="text-lg font-sans text-gray-100 tracking-tight leading-tight w-full" style={{ whiteSpace: 'pre-wrap' }}>
                                      {lib.name && lib.name.length > 30 ? lib.name.substring(0,28) + "..." : lib.name}
                                    </CardTitle>       
                                    
                                    <div className="flex flex-row gap-x-2 pt-2">
                                    {lib.isOpen ? (
                                      <StatusBadge crowdLevel={lib.crowdLevel} variant="" />
                                    ) : (
                                      <div className="flex items-center font-bold py-0 rounded-full">
                                        <StatusBadge variant="closed" className="" crowdLevel={0} />
                                      </div>
                                    )}
                                    {(lib.hours && lib.hours.length > 3 && (!lib.hours.includes('Closed') && lib.hours.length > 0)) && 
                                      <div className="flex items-center text-slate-600 bg-transparent py-1 rounded-full border-none border-slate-100">
                                        <Clock className="mr-2 h-3 w-3 text-gray-200" />
                                        <span style={{ whiteSpace: 'pre-wrap' }} className='text-white font-extralight text-xs'>{lib.hours}</span>
                                      </div>
                                    }
                                      </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="gap-y-4 m-0"></CardContent>
                              <CardFooter className='gap-x-2 mb-0 [.border-t]:pt-0'></CardFooter>
                            </Card>
                          );
                        })}
                      </div>
            </div>
          </div>
        </div>
      );
  }
  