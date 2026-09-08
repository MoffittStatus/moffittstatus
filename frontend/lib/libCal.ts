 'use server'
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';
import { BACKEND_URL } from './apiEndPoints';

export const handleQuickBook = async (room, selectedTime) => {
  console.log("hi\n")
  console.log(BACKEND_URL)
  console.log(room)
  try {
    const response = await fetch(BACKEND_URL+'/api/libcal/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: room.id,
        startTime: room.time,//selectedTime.toISOString(),
        checksum: room.checksum,
        duration: 60,
        libraryId: '8867',
        groupId: '16357',
        userId: 'dummy_user_123',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const { success, redirectUrl, tempBooking } = await response.json();
    console.log(redirectUrl)
    // window.location.href = redirectUrl;
    return redirectUrl
  } catch (error) {
    console.error('Booking failed:', error);
    // alert(`Booking failed: ${error.message}`);
  }
};

export async function fetchRoomAvailability(dateStr:string,library:string) {
  // dateStr should be "YYYY-MM-DD", e.g., "2025-11-17"
  
  // 1. Calculate the end date (usually just the next day or same day depending on needs)
  // The request you saw grabbed a 3-day range, let's mimic that or just do 1 day
  const startDate = new Date(dateStr);
  const endDate = new Date(startDate);
  endDate.setDate((startDate.getDate() + 1) ); // Get 24 hours worth
  
  const startParam = startDate.toISOString().split('T')[0]; // "2025-11-17"
  const endParam = endDate.toISOString().split('T')[0];     // "2025-11-18"

  // 2. Prepare the Form Data
  let formData
  switch(library){
    case "main_stacks":
      formData = new URLSearchParams({
        lid: '8867',     // Library ID (Main Stacks?)   
        gid: '16357',    // Group ID
        eid: '-1',       // Entity ID (usually -1 for "all")
        seat: '0',
        seatId: '0',
        zone: '0',
        start: startParam, 
        end: endParam,
        pageIndex: '0',
        pageSize: '100' // Bump this up to ensure you get all rooms
      });
      break
    case "kresge":
      formData = new URLSearchParams({
        lid: '8863',     // Library ID (Main Stacks?)   
        gid: '0',    // Group ID
        eid: '-1',       // Entity ID (usually -1 for "all")
        seat: '0',
        seatId: '0',
        zone: '0',
        start: startParam, 
        end: endParam,
        pageIndex: '0',
        pageSize: '100' // Bump this up to ensure you get all rooms
      });
      break
    case "moffitt":
      formData = new URLSearchParams({
        lid: '8868',
        gid: '0',
        eid: '-1',
        seat: '0',
        seatId: '0',
        zone: '0',
        start: startParam,
        end: endParam,
        pageIndex: '0',
        pageSize: '18'
      });
      break
  }
  if (!formData)
    return {}
  try {
    // 3. Send POST request from the Next.js Server (Bypasses CORS)
    const response = await fetch('https://berkeley.libcal.com/spaces/availability/grid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://berkeley.libcal.com', 
        'Referer': 'https://berkeley.libcal.com/spaces?lid=8867&gid=16357',
        'X-Requested-With': 'XMLHttpRequest', 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      },
      body: formData ? formData.toString() : "",
      cache: 'no-store' // Don't cache this, we want real-time data
    });

    if (!response.ok) {
      throw new Error(`LibCal refused: ${response.status}`);
    }

    const data = await response.json();
    //console.log(data);
    return data; // This sends the clean JSON back to your client component
    
  } catch (error) {
    console.error("Failed to fetch LibCal:", error);
    return { slots: [] }; // Return empty if failed
  }
}
const ROOM_NAMES={
    // Stacks
    "62852": "Room B4 (Capacity 5)",
    "62853": "Room B5 (Capacity 5)",
    "62854": "Room B6 (Capacity 5)",
    "62855": "Room B7 (Capacity 5)",
    "62856": "Room C1 (Capacity 10)",
    "62857": "Room C2 (Capacity 10)",
    "62858": "Room C4 (Capacity 5)",
    "62859": "Room C6 (Capacity 5)",
    "62860": "Room C7 (Capacity 5)",
    "62861": "Room D 1 (Capacity 10)",
    "62862": "Room D 2 (Capacity 10)",
    "62863": "Room D 4 (Capacity 5)",
    "62864": "Room D 5 (Capacity 5)",
    "62865": "Room D 6 (Capacity 5)",
    "62866": "Room D 7 (Capacity 5)",
    "62867": "Room D14 (Capacity 5)",
    "62868": "Room D16 (Capacity 5)",
    // Kresge
    "62870": "B1M20A (Capacity 10)",
    "62871": "B1M20B (Capacity 10)",
    "62872": "B1M20C (Capacity 10)",
    "62873": "B1M20E (Capacity 15)",
    "62874": "B1M20F (Capacity 10)",
    // Moffitt
    "62878": "Egret, Room 409 (Capacity 4)",
    "62879": "Goldeneye, Room 411 (Capacity 4)",
    "62880": "Quail, Room 431 (Capacity 4)",
    "62881": "Tern, Room 433 (Capacity 4)",
    "62882": "Warbler, Room 435 (Capacity 4)",
    "62884": "Room 415 (Capacity 8)",
    "62885": "Room 417 (Capacity 8)",
    "62886": "Hemlock, Room 503 (Capacity 4)",
    "62887": "Ironwood, Room 505 (Capacity 4)",
    "62888": "Juniper, Room 509 (Capacity 4)",
    "62889": "Laurel, Room 511 (Capacity 4)",
    "62890": "Mesquite, Room 513 (Capacity 4)",
    "62891": "Palm, Room 517 (Capacity 4)",
    "62892": "Redwood, Room 519 (Capacity 4)",
    "62893": "Tamarack, Room 521 (Capacity 4)"
  
  }
  export async function filterRoomsByTime(jsonData, targetDateObj) {
    const targetTime = targetDateObj.getTime();
  
    // 1. PERFORMANCE: Calculate 11 AM once, outside the loop
    const elevenAmDate = new Date(targetDateObj);
    elevenAmDate.setHours(11, 0, 0, 0); 
    const elevenAmTime = elevenAmDate.getTime();

    // Safety check
    if (!jsonData || !jsonData.slots) return [];
  
    const availableSlots = jsonData.slots.filter((slot) => {
      // 2. Parse LibCal Date
      const formattedStart = slot.start.replace(" ", "T");
      const formattedEnd = slot.end.replace(" ", "T");

      const start = new Date(formattedStart).getTime();
      const end = new Date(formattedEnd).getTime();

      // 3. LOGIC FIX: Check if the slot is happening NOW
      // Logic: 
      // A. The slot must have started (start <= targetTime)
      // B. The slot must NOT have ended yet (end > targetTime)
      // C. (Optional) You wanted a check for 11am? 
      //    If you only want slots that exist BEFORE 11am, keep the third check:
      const isTimeMatch = true//(targetTime >= start) && (targetTime < end) && (start < end);
  
      // 4. LOGIC FIX: Check for Availability (Green/Checkout)
      // LibCal classes: 's-lc-eq-checkout' (Available), 's-lc-eq-period' (Padding), 's-lc-eq-booked' (Booked)
      const hasCheckoutClass = slot.className && slot.className.includes("s-lc-eq-checkout");
      // if(slot.checksum)
      //   console.log(slot.checksum)
      // We want BOTH a time match AND the checkout class
      const isValidID = slot.itemId < 100000;
      return isTimeMatch && !hasCheckoutClass && isValidID;
    });
  
    // Map to readable format
    return availableSlots.map((slot) => ({
      id: slot.itemId,
      // specific logic to check map names or fallback
      name: ROOM_NAMES?.[`${slot.itemId}`] || `Unknown Room (${slot.itemId})`, 
      time: `${slot.start} - ${slot.end}`,
      checksum: `${slot.checksum}` || '',
    }));
}
    
export async function getAvailableRooms(selected_day:string|null, library:string) {
    // A. Fetch the data for the specific date you have (Nov 17, 2025)
    const dateStr = selected_day!=null ? selected_day : new Date().toLocaleDateString('sv-SE', { 
      timeZone: 'America/Los_Angeles' 
    }); 
    const jsonData = await fetchRoomAvailability(dateStr,library);
    // B. Create a Date object strictly for 2:00 PM on that day
    // Note: "14:00:00" is 2 PM in 24-hour time
    const hour = parseInt(
      new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: 'numeric',
        hour12: false
      })
    ); // 14 = 2 pm
    const targetDate = new Date(`${dateStr}T${hour}:00:00`); 
    console.log("Checking availability for:", targetDate.toString());
    // C. Run the filter
    const freeRooms = await filterRoomsByTime(jsonData, targetDate);
    console.log("There are ", freeRooms.length, " free rooms")
    // console.log("Free rooms:", freeRooms)
    return freeRooms;
}
interface LibraryHours {
  name: string;
  hours: string;
  address?: string;
  phone?: string;
  notes?: string[];
}

interface LibraryHoursResult {
  day: string;
  date: string;
  libraries: LibraryHours[];
}

// Define an interface that matches the data available in the DOM
interface LibraryInfo {
  name: string;
  status: string; // e.g., "Open Now", "Closed"
  hours: string;
  address: string;
  googleMapsLink?: string;
  nid?: string; // The data-nid attribute seen in the <li>
  services?: string;
  imageSrc?: string;
  studySpaceLink?: string;
  hasStudySpace: boolean;
}
export async function getAllLibraryHours(): Promise<LibraryInfo[] | null> {
  try {
    const baseUrl = 'https://www.lib.berkeley.edu';
    const response = await fetch(`${baseUrl}/hours`);
    const html = await response.text();
    
    //const htmlText = await response.text();
    const libraries: LibraryInfo[] = [];
    const $ = cheerio.load(html);
    $('.library-hours-listing').each((_, element) => {
      const $el = $(element);
      
      // Node ID
      const nid = $el.attr('data-nid');

      // --- NEW: Image Extraction ---
      // 1. Find the image container relative to the main 'li' element
      const imageRelativeSrc = $el.find('.library-hours-listing-image img').attr('src');
      // 2. Prepend base URL if the src exists
      const imageSrc = imageRelativeSrc ? `${baseUrl}${imageRelativeSrc}` : undefined;

      // Scope searches to the info div for text details
      const $info = $el.find('.library-hours-listing-info');

      // Basic Info
      const $nameEl = $info.find('.library-name').clone();
      $nameEl.find('br').replaceWith('\n'); // Keep your newline fix
      const name = $nameEl.text().trim();
      
      const status = $info.find('.library-open-status').text().trim();
      let hours = $info.find('.library-hours').text().trim();
      
      const address = $info.find('.library-hours-listing-address').text()
        .replace(/\s\s+/g, ' ')
        .trim();

      const googleMapsLink = $info.find('a.google-maps-link').attr('href');
      const services = $info.find('.available-services .available .tooltip')
      .map((_, el) => $(el).text().trim())
      .get()
      .join(' ');
      // --- NEW: Study Space Extraction ---
      // 1. Find the container shown in your second screenshot
      const $studyLink = $el.find('.reserve-study-space-link a');
      // 2. Get the href if it exists
      const studySpaceLink = $studyLink.length > 0 ? $studyLink.attr('href') : undefined;
      // 3. Simple boolean to check existence
      const hasStudySpace = !!studySpaceLink; 

      // Formatting logic you requested previously
      if(hours.length < 3) hours = "";
      if(hours.includes('hoursStarts')) hours = hours.replace('hoursStarts', 'hours\nStarts');
      if(hours.includes(' Cal ID')) hours = hours.replace(' Cal ID', '\nCal ID');

      // console.log(status, ' | ', name)
      if (name) {
        libraries.push({
          name,
          status,
          hours,
          address,
          googleMapsLink,
          nid,
          services: services || undefined,
          imageSrc,       
          studySpaceLink,
          hasStudySpace
        });
      }
    });
    console.log("Got hours data")
    return libraries;

  } catch (error) {
    console.error('Error fetching library hours:', error);
    return null;
  }
}

// // Usage examples:
// // Get today's hours
// const todayHours = await getAllLibraryHours();
// console.log(todayHours);

// // Get hours for a specific day
// const nextMonday = new Date();
// nextMonday.setDate(nextMonday.getDate() + ((1 - nextMonday.getDay() + 7) % 7));
// const mondayHours = await getAllLibraryHours(nextMonday);
// console.log(mondayHours);

// // Get a specific library's hours for today
// const today = await getAllLibraryHours();
// const doeLibrary = today?.libraries.find(lib => lib.name === 'Doe Library');
// console.log(`Doe Library today: ${doeLibrary?.hours}`);

// // Get all closed libraries today
// const closedLibraries = today?.libraries.filter(lib => lib.hours === 'Closed');
// console.log(`Closed today: ${closedLibraries?.map(l => l.name).join(', ')}`);
