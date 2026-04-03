 'use server'
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { BACKEND_URL } from './apiEndPoints';

type RoomSlot = { id: string; time: string; checksum: string }

export const handleQuickBook = async (room: RoomSlot) => {
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
      const error = await response.json() as { error: string };
      throw new Error(error.error);
    }

    const { redirectUrl } = await response.json() as { redirectUrl: string };
    console.log(redirectUrl)
    // window.location.href = redirectUrl;
    return redirectUrl
  } catch (error) {
    console.error('Booking failed:', (error as Error).message);
  }
};

export async function fetchRoomAvailability(dateStr: string, library: string) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/libcal/availability?library=${library}&date=${dateStr}`
    );

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("fetchRoomAvailability failed:", error);
    return { slots: [] };
  }
}
const ROOM_NAMES={
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
    "62870": "B1M20A (Capacity 10)",
    "62871": "B1M20B (Capacity 10)",
    "62872": "B1M20C (Capacity 10)",
    "62873": "B1M20E (Capacity 15)",
    "62874": "B1M20F (Capacity 10)",
    // Moffitt Library
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
    "62893": "Tamarack, Room 521 (Capacity 4)",
    // Earth Sciences & Map Library
    "62877": "Seminar Room 55A McCone (Capacity 20)",
    // East Asian Library
    "62895": "241 Numata Room (Capacity 10)",
    "62896": "377 (Capacity 4)",
    // Environmental Design Library
    "62869": "210C Bauer Wurster Hall (Capacity 10)",
    // Institute of Governmental Studies
    "62876": "Matsui Center Study Room (Capacity 8)",
  }
type LibCalSlot = {
  itemId: string | number;
  start: string;
  end: string;
  className?: string;
  checksum?: string;
}

export async function filterRoomsByTime(jsonData: { slots?: LibCalSlot[] }, _targetDateObj: Date) {
  if (!jsonData || !jsonData.slots) return [];

  const availableSlots = jsonData.slots.filter((slot: LibCalSlot) => {
    // Show all slots that are not already booked
    // LibCal classes: 's-lc-eq-checkout' (Available), 's-lc-eq-booked' (Booked)
    const hasCheckoutClass = slot.className && slot.className.includes("s-lc-eq-checkout");
    return !hasCheckoutClass;
  });

  return availableSlots.map((slot: LibCalSlot) => ({
    id: slot.itemId,
    name: ROOM_NAMES[String(slot.itemId) as keyof typeof ROOM_NAMES] || `Unknown Room (${slot.itemId})`,
    time: `${slot.start} - ${slot.end}`,
    checksum: `${slot.checksum}` || '',
  }));
}
    
export async function getAvailableRooms(_selected_hour: string, library: string) {
    // A. Fetch the data for the specific date you have (Nov 17, 2025)
    const dateStr = new Date().toLocaleDateString('sv-SE', { 
      timeZone: 'America/Los_Angeles' 
    });; 
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
    const freeRooms = await filterRoomsByTime(jsonData as { slots?: LibCalSlot[] }, targetDate);
    console.log("There are ", freeRooms.length, " free rooms")
    // console.log("Free rooms:", freeRooms)
    return freeRooms;
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
