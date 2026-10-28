const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function fetchRoomAvailability(dateStr, library) {
  const startDate = new Date(dateStr);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 1);

  const startParam = startDate.toISOString().split('T')[0];
  const endParam = endDate.toISOString().split('T')[0];

  let lid, gid = '0', pageSize = '100';
  switch (library) {
    case "main_stacks":
      lid = '8867'; gid = '16357';
      break;
    case "kresge":
      lid = '8863'; gid = '0';
      break;
    case "moffitt":
      lid = '8868'; gid = '0'; pageSize = '18';
      break;
    case "earth_sciences":
      lid = '8862'; gid = '0';
      break;
    case "east_asian":
      lid = '8864'; gid = '0';
      break;
    case "environmental_design":
      lid = '8865'; gid = '0';
      break;
    case "igs":
      lid = '8866'; gid = '0';
      break;
    case "business":
      lid = '22244'; gid = '0';
      break;
    case "social_research":
      lid = '24641'; gid = '0';
      break;
  }

  if (!lid) {
    console.error("bad slug");
    return {};
  }

  const formData = new URLSearchParams({
    lid,
    gid,
    eid: '-1',
    seat: '0',
    seatId: '0',
    zone: '0',
    start: startParam,
    end: endParam,
    pageIndex: '0',
    pageSize
  });

  try {
    const response = await fetch('https://berkeley.libcal.com/spaces/availability/grid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://berkeley.libcal.com',
        'Referer': `https://berkeley.libcal.com/spaces?lid=${lid}&gid=${gid}`,
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      },
      body: formData.toString(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`LibCal refused: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch LibCal:", error);
    return { slots: [] };
  }
}

const ROOM_NAMES = {
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
  "62883": "B1M20D Engineering Library Training Room (Capacity 35)",
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
  "62893": "Tamarack, Room 521 (Capacity 4)",
  // Earth Sciences & Map
  "62877": "Seminar Room, 55A McCone (Capacity 20)",
  // East Asian
  "62895": "Numata Room, Room 241 (Capacity 10)",
  "62896": "Room 377 (Capacity 4)",
  // Environmental Design
  "62869": "Room 210C Bauer Wurster Hall (Capacity 10)",
  // Institute of Governmental Studies
  "62876": "Matsui Center Study Room",
  // Business
  "196070": "S350A (Capacity 5)",
  "196071": "S350B (Capacity 5)",
  "196072": "S350C (Capacity 5)",
  "196074": "S350D (Capacity 5)",
  // Social Research
  "231046": "227 Haviland Hall (Capacity 10)"
};

async function filterRoomsByTime(jsonData, targetDateObj) {
  if (!jsonData || !jsonData.slots) {
    console.error("data bad");
    return [];
  };

  const availableSlots = jsonData.slots.filter((slot) => {
    const isTimeMatch = true;
    const hasCheckoutClass = slot.className && slot.className.includes("s-lc-eq-checkout");
    const isUnavailable = slot.className && slot.className.includes("s-lc-eq-r-unavailable");
    const isValidID = `${slot.itemId}` in ROOM_NAMES;

    return isTimeMatch && !hasCheckoutClass && !isUnavailable && isValidID && (slot.itemId != 62883);
  });

  return availableSlots.map((slot) => ({
    id: slot.itemId,
    name: ROOM_NAMES?.[`${slot.itemId}`] || `Unknown Room (${slot.itemId})`,
    time: `${slot.start} - ${slot.end}`,
    checksum: `${slot.checksum}` || '',
  }));
}

async function getAvailableRooms(selected_day, library) {
  const dateStr = selected_day != null ? selected_day : new Date().toLocaleDateString('sv-SE', {
    timeZone: 'America/Los_Angeles'
  });
  const jsonData = await fetchRoomAvailability(dateStr, library);

  const hour = parseInt(
    new Date().toLocaleTimeString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      hour12: false
    })
  );
  const targetDate = new Date(`${dateStr}T${hour}:00:00`);
  console.log("Checking availability for:", targetDate.toString());

  const freeRooms = await filterRoomsByTime(jsonData, targetDate);
  console.log("There are ", freeRooms.length, " free rooms");
  return freeRooms;
}

async function getAllLibraryHours() {
  try {
    const baseUrl = 'https://www.lib.berkeley.edu';
    const response = await fetch(`${baseUrl}/hours`);
    const html = await response.text();

    const libraries = [];
    const $ = cheerio.load(html);

    $('.library-hours-listing').each((_, element) => {
      const $el = $(element);
      const nid = $el.attr('data-nid');

      const imageRelativeSrc = $el.find('.library-hours-listing-image img').attr('src');
      const imageSrc = imageRelativeSrc ? `${baseUrl}${imageRelativeSrc}` : undefined;

      const $info = $el.find('.library-hours-listing-info');

      const $nameEl = $info.find('.library-name').clone();
      $nameEl.find('br').replaceWith('\n');
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

      const $studyLink = $el.find('.reserve-study-space-link a');
      const studySpaceLink = $studyLink.length > 0 ? $studyLink.attr('href') : undefined;
      const hasStudySpace = !!studySpaceLink;

      if (hours.length < 3) hours = "";
      if (hours.includes('hoursStarts')) hours = hours.replace('hoursStarts', 'hours\nStarts');
      if (hours.includes(' Cal ID')) hours = hours.replace(' Cal ID', '\nCal ID');

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

    console.log("Got hours data");
    return libraries;

  } catch (error) {
    console.error('Error fetching library hours:', error);
    return null;
  }
}

module.exports = {
  fetchRoomAvailability,
  filterRoomsByTime,
  getAvailableRooms,
  getAllLibraryHours
};