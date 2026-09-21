
import { getCurrentHourlyData } from "./gMapCapacities"
import { getAllLibraryHours, getAvailableRooms } from "./libCal"
import { getSlugFromName } from "./libData"

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
  
export const loadLibraries = async () => {
    try {
      const [librariesResult] = await Promise.allSettled([ // , ratingsResult
        getAllLibraryHours()
        // getAllLibraryRatings(),
      ]);
      
      const allLibraries =
        librariesResult.status === "fulfilled" ? librariesResult.value : [];
      
        // console.log("Pass 1: Basic info loaded");
      const libraryPromises = allLibraries!.map(async (lib, index) => {
  
        const slug = getSlugFromName(lib.name);
        let capData = getCurrentHourlyData(lib.name);
        const crowdLevel = capData ? (capData["percentage"] || 30) : 30; //ratingsMap[lib.name] || 60;
        
        
        let [displayHours, calID] = hoursFix(lib.hours) || ["", ""];
        // displayHours = displayHours.replace(".","")
        console.log("Hours:", displayHours)
        const roomData = lib.hasStudySpace
        ? await getAvailableRooms(null, slug).catch(() => []) 
        : [];
        if (roomData.length > 0){
          console.log(roomData);
        }
  
  
        return {
          id: index,
          name: lib.name,
          hours: displayHours,
          calID: calID,
          isOpen: (lib.status || '').toLowerCase().includes('open') || (lib.status || '').toLowerCase().includes('closing soon'),
          
          // Room Logic
          rooms: roomData,
          roomsOpen: roomData.length > 0 ? roomData.length : -1,
          roomsTotal: slug == "main_stacks" || slug == "moffitt" || slug == "kresge" ? 1 : 0,
          
          crowdLevel: crowdLevel,
          // weeklySchedule:scheduleMap[lib.name] || [],
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
      return [];
    }
  };