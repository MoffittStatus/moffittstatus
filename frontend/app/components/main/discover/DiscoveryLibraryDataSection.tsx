'use client'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Library } from "@/lib/libData";
import React from "react";
import { useState } from "react";
import { StatusBadge } from "../../statusBadge";
import { Clock } from "lucide-react";

export default function DiscoveryLibraryDataSection({ data, onLibrarySelect }: { data: Library[], any }) {
    const [libraryData, setLibraryData] = useState<Library[]>()
    React.useEffect(()=>{
        setLibraryData(data);
    },[data])
    const sortedLibraries = [...(libraryData || [])].sort((a, b) => {
        // const isAPinned = pinnedIds.includes(a.id);
        // const isBPinned = pinnedIds.includes(b.id);
        
        // if (isAPinned && !isBPinned) return -1; 
        // if (!isAPinned && isBPinned) return 1; 
        if(!a.isOpen && b.isOpen) return 1;
        if(a.isOpen && !b.isOpen) return -1;
        return 0; 
      });
    return(
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
    )
}