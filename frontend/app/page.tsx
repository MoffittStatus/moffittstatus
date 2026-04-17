import * as React from "react";
import { getAllLibraryRatings } from '@/lib/firebaseMethods';
import { getAllLibraryHours, getAvailableRooms } from '@/lib/libCal';
import LibraryStatusPage from './components/main/main';

function hoursFix (input:string) { 
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
export default async function Page() {
  const loadLibraries = async () => {
    try {
      const [allLibraries, allRatingsRes] = await Promise.all([
        getAllLibraryHours(),
        getAllLibraryRatings()
      ]); 
      console.log("Finished")
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
      const libraryPromises = allLibraries!.map(async (lib, index) => {

        const slug = getSlugFromName(lib.name);

        const crowdLevel = ratingsMap[lib.name] || 60;
        
        const roomData = lib.hasStudySpace && false
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
      return processedData;

    } catch (error) {
      console.error("Failed to load library data", error);
	return processedData || [];
}
  };

  const result = await loadLibraries();
  return (<LibraryStatusPage data={result}></LibraryStatusPage>)
}
