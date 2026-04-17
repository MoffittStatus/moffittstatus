'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';

// Import CSS for Leaflet and Routing Machine
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import React from 'react';

// --- Fix for Leaflet Default Icon Bug in Next.js ---
const BerkeleyDotIcon = L.divIcon({
  className: 'berkeley-dot',
  html: `<div style="
    background-color: #FDB515; 
    border: 2px solid #003262; 
    width: 12px; 
    height: 12px; 
    border-radius: 50%;
    box-shadow: 0 0 5px rgba(149, 68, 68, 0.3);
  "></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6], // Centered
});

// To apply globally:
L.Marker.prototype.options.icon = BerkeleyDotIcon;
interface BerkeleyLocation {
  name: string;
  lat: number;
  lng: number;
  description: string;
}

const LIBRARIES_AND_CAFES: BerkeleyLocation[] = [
  // --- LIBRARIES ---
  {
    name: "Art History/Classics Library",
    lat: 37.87244,
    lng: -122.25956,
    description: "A compact UC Berkeley library inside Doe Library with quiet study spaces, research assistance, and a calm academic atmosphere. Good for focused reading and evening study."
  },
  {
    name: "Bancroft Library",
    lat: 37.8723,
    lng: -122.2587,
    description: "A specialized research library at UC Berkeley with an archival focus and a scholarly atmosphere. Best for serious research rather than casual study."
  },
  {
    name: "Berkeley Art Museum and Pacific Film Archive",
    lat: 37.8707356,
    lng: -122.2664841,
    description: "A museum and film archive with study-center functions and an arts-focused environment. Better for research, cultural browsing, and academic projects than quiet long-session studying."
  },
  {
    name: "Berkeley Law Library",
    lat: 37.86992,
    lng: -122.25341,
    description: "A focused law library with long hours and a strong academic research atmosphere. Good for quiet legal study and structured work sessions."
  },
  {
    name: "Bioscience, Natural Resources & Public Health Library",
    lat: 37.87148,
    lng: -122.26211,
    description: "A UC Berkeley subject library for bioscience and public health research with a study-friendly setting. Suitable for reading, research, and longer academic sessions."
  },
  {
    name: "Business Library",
    lat: 37.87169,
    lng: -122.25384,
    description: "A busy, high-traffic study library with long hours, equipment lending, snacks, and a productive work environment. Good for group work, laptop study, and long sessions."
  },
  {
    name: "Chemistry, Astronomy & Physics Library",
    lat: 37.872565,
    lng: -122.255832,
    description: "A subject library for STEM study with a quiet, research-oriented atmosphere and long hours. Best for focused technical work and academic reference use."
  },
  {
    name: "Doe Library",
    lat: 37.87244,
    lng: -122.25956,
    description: "The central UC Berkeley library with a classic, serious study atmosphere, broad research support, and long hours. Ideal for deep focus, reading, and all-day study."
  },
  {
    name: "Earth Sciences & Map Library",
    lat: 37.873996,
    lng: -122.25966,
    description: "A specialized research library for earth science and cartography materials with a quiet study setting. Good for focused academic work and reserved study space use."
  },
  {
    name: "East Asian Library",
    lat: 37.87357,
    lng: -122.26034,
    description: "A subject library with research collections, long hours, and a study-oriented environment. Useful for quiet reading, research, and language or regional studies."
  },
  {
    name: "Engineering & Mathematical Sciences Library",
    lat: 37.87425,
    lng: -122.25807,
    description: "A STEM library with equipment lending, long hours, snacks, and a strong study environment. Great for engineering homework, coding, and group study."
  },
  {
    name: "Environmental Design Archives",
    lat: 37.8705,
    lng: -122.25488,
    description: "A research archive for environmental design materials with a quieter research-focused atmosphere. Best for archival work and academic lookup rather than casual study."
  },
  {
    name: "Environmental Design Library",
    lat: 37.8705,
    lng: -122.25488,
    description: "A design-focused UC Berkeley library with study spaces, long hours, and a creative academic atmosphere. Good for drafting, reading, and project work."
  },
  {
    name: "Ethnic Studies Library",
    lat: 37.87124,
    lng: -122.25761,
    description: "A subject library with research materials and a quiet, study-friendly environment. Best for reading, writing, and focused academic work."
  },
  {
    name: "Graduate Services (study only)",
    lat: 37.87244,
    lng: -122.25956,
    description: "A graduate-only study area inside Doe Library with access restrictions and a quiet academic atmosphere. Best for concentrated work and longer sessions."
  },
  {
    name: "Graduate Theological Union Library",
    lat: 37.8755432,
    lng: -122.2618741,
    description: "A theological research library in Berkeley with a scholarly atmosphere and specialized collections. Best for research and quiet reading."
  },
  {
    name: "Institute of Governmental Studies Library",
    lat: 37.87099,
    lng: -122.25799,
    description: "A focused policy and government research library with a quiet academic setting. Good for research, reading, and writing."
  },
  {
    name: "Institute of Transportation Studies Library",
    lat: 37.873829,
    lng: -122.259051,
    description: "A transportation-focused research library with a quiet, scholarly atmosphere. Best for academic research and technical reading."
  },
  {
    name: "Interlibrary Loan",
    lat: 37.87244,
    lng: -122.25956,
    description: "A service point inside Doe Library for requesting materials and interlibrary access. Not primarily a study destination, but useful for library support tasks."
  },
  {
    name: "Lawrence Berkeley National Laboratory Library",
    lat: 37.87614,
    lng: -122.25082,
    description: "A specialized lab library in Berkeley serving scientific and technical research needs. Best for reference work and research support."
  },
  {
    name: "Main (Gardner) Stacks",
    lat: 37.87244,
    lng: -122.25956,
    description: "A major underground study and research area at UC Berkeley with very long hours and a serious work atmosphere. Excellent for quiet deep work and exam prep."
  },
  {
    name: "Morrison Library",
    lat: 37.87244,
    lng: -122.25956,
    description: "A quieter UC Berkeley library inside Doe with a classic reading-room feel and a calm scholarly atmosphere. Good for focused reading and compact study sessions."
  },
  {
    name: "Music Library",
    lat: 37.87044,
    lng: -122.2561,
    description: "A subject library for music research with a quiet academic atmosphere and long hours. Best for listening-based research, reading, and focused study."
  },
  {
    name: "Social Research Library",
    lat: 37.87374,
    lng: -122.26105,
    description: "A research-focused library with a quiet academic setting and a strong social sciences orientation. Good for reading, writing, and research tasks."
  },
  {
    name: "South/Southeast Asia Library (study only)",
    lat: 37.87244,
    lng: -122.25956,
    description: "A study-only library space with subject collections and a quiet scholarly environment. Best for focused reading and region-specific research."
  },

  // --- CAFES ---
  {
    name: "Free Speech Movement Cafe (FSM)",
    lat: 37.87257,
    lng: -122.26081,
    description: "A lively, bustling cafe located inside Moffitt Library. Great for group study, strong espresso, and a vibrant campus atmosphere. Features outdoor patio seating and is very popular among undergrads."
  },
  {
    name: "Cafe Think",
    lat: 37.87169,
    lng: -122.25384,
    description: "Located right inside the Haas School of Business courtyard. Offers organic coffee and great lunches. Excellent for taking a break between business classes with a highly collaborative atmosphere and outdoor courtyard seating."
  },
  {
    name: "Brown's California Cafe",
    lat: 37.873513,
    lng: -122.264751,
    description: "Located in the Genetics and Plant Biology building on the northwest side of campus. Focuses on locally sourced, sustainable food and Peet's coffee. Bright, modern indoor and outdoor seating, heavily utilized by STEM students."
  },
  {
    name: "Yali's Cafe - Stanley Hall",
    lat: 37.87404,
    lng: -122.25609,
    description: "Conveniently located on the ground floor of Stanley Hall. An essential quick stop for engineering, biology, and chemistry students needing a caffeine fix or bagel between labs. Very limited seating, mostly grab-and-go."
  },
  {
    name: "The Coffee Lab",
    lat: 37.872775,
    lng: -122.255894,
    description: "A literal coffee shack located in the Chemistry plaza between Hildebrand and Latimer Halls. Only has outdoor plaza seating. Perfect for grabbing a quick, cheap Americano between hard science lectures."
  },
  {
    name: "Qualcomm Cyber Cafe",
    lat: 37.8748,
    lng: -122.258389,
    description: "Located on the ground floor of Sutardja Dai Hall (CITRIS). Very popular with EECS students and researchers. Offers specialty coffee, pastries, and sandwiches with indoor seating and plenty of outlets for coding."
  },
  {
    name: "Terrace Cafe",
    lat: 37.87425,
    lng: -122.25807,
    description: "Located on the rooftop of the Bechtel Engineering Center. Offers outdoor patio seating with excellent views of the Campanile. A relaxed spot for engineering students to grab coffee, salads, and sandwiches."
  },
  {
    name: "Ramona's Cafe",
    lat: 37.8705,
    lng: -122.25488,
    description: "Tucked away inside Wurster Hall. Frequented heavily by architecture and environmental design students working long studio hours. Serves Peet's coffee, paninis, and hot food with an industrial aesthetic."
  },
  {
    name: "Golden Bear Cafe (GBC)",
    lat: 37.86976,
    lng: -122.25975,
    description: "Located centrally on Upper Sproul Plaza. While largely a bustling food court, it serves as a massive coffee and smoothie hub for students crossing campus. Highly energetic, fast-paced, and extremely loud."
  }
];
const CAMPUS_BUILDINGS: BerkeleyLocation[] = [
  // --- THEATERS & PERFORMANCE CENTERS ---
  {
    name: "Zellerbach Hall",
    lat: 37.869048,
    lng: -122.261226,
    description: "The premier performance venue on the UC Berkeley campus. Hosts Cal Performances, including world-class dance, theater, music, and speaker events. Located right on Lower Sproul Plaza."
  },
  {
    name: "Hearst Greek Theatre",
    lat: 37.87355,
    lng: -122.25432,
    description: "A massive, 8,500-seat outdoor amphitheater built into the Berkeley hills. Hosts major concerts, graduations, and large-scale university events."
  },
  {
    name: "Hertz Hall",
    lat: 37.8711,
    lng: -122.25567,
    description: "UC Berkeley's primary concert hall for the Department of Music. Features excellent acoustics and houses the university's historic organ. Located near the Faculty Club."
  },
  {
    name: "Zellerbach Playhouse",
    lat: 37.869048,
    lng: -122.261226,
    description: "A smaller, more intimate theatrical space adjacent to the main Zellerbach Hall. Heavily used by the Department of Theater, Dance, and Performance Studies (TDPS) for student and professional productions."
  },
  {
    name: "Durham Studio Theater",
    lat: 37.870515,
    lng: -122.260722,
    description: "An intimate black-box theater located inside Dwinelle Hall. Used primarily for student-directed plays and smaller TDPS performances."
  },

  // --- MAJOR ACADEMIC & LECTURE HALLS ---
  {
    name: "Dwinelle Hall",
    lat: 37.87058,
    lng: -122.26041,
    description: "A massive, notoriously maze-like academic building housing the humanities departments, language classes, and large lecture halls. Located centrally near the Campanile and Sproul Plaza."
  },
  {
    name: "Wheeler Hall",
    lat: 37.87129,
    lng: -122.25914,
    description: "One of the largest lecture halls on campus, hosting massive lower-division classes and high-profile guest lectures. Located right next to the Campanile and Sather Gate."
  },
  {
    name: "Valley Life Sciences Building (VLSB)",
    lat: 37.87148,
    lng: -122.26211,
    description: "A gigantic building dedicated to biological sciences. Famous for having a T-Rex skeleton inside. Houses the Bioscience Library and Brown's Cafe."
  },
  {
    name: "Wurster Hall",
    lat: 37.8705,
    lng: -122.25488,
    description: "A brutalist concrete building housing the College of Environmental Design. Open late for architecture, landscape architecture, and urban planning studio students."
  },
  {
    name: "Haas School of Business",
    lat: 37.87169,
    lng: -122.25384,
    description: "A modern complex of buildings on the eastern edge of campus, featuring a central courtyard, study rooms, and professional amenities for undergraduate and MBA students."
  },
  {
    name: "Chou Hall",
    lat: 37.8723,
    lng: -122.2543,
    description: "The newest addition to the Haas Business School campus, entirely dedicated to student learning spaces, event spaces, and sustainable, zero-waste design."
  },

  // --- ENGINEERING & COMPUTER SCIENCE ---
  {
    name: "Soda Hall",
    lat: 37.87567,
    lng: -122.25871,
    description: "The primary building for Computer Science (CS) students. Features computer labs, research spaces, and the Wozniak Lounge. Located on the northern edge of campus on Hearst Ave."
  },
  {
    name: "Cory Hall",
    lat: 37.8750,
    lng: -122.2575,
    description: "The headquarters for the Electrical Engineering (EE) department. Packed with hardware labs, robotics research, and maker spaces. Located right next to Soda Hall."
  },
  {
    name: "Sutardja Dai Hall",
    lat: 37.8748,
    lng: -122.258389,
    description: "Home to CITRIS and computer science research. A modern building on the north side of campus frequented by EECS students, housing the Qualcomm Cyber Cafe."
  },
  {
    name: "Etcheverry Hall",
    lat: 37.87587,
    lng: -122.2593,
    description: "Houses the Mechanical Engineering, Industrial Engineering, and Nuclear Engineering departments. Located on the north side of campus across Hearst Ave."
  },
  {
    name: "Hearst Memorial Mining Building",
    lat: 37.87446,
    lng: -122.25727,
    description: "A stunning, historically preserved building housing the Materials Science and Engineering department. Famous for its beautiful sky-lit atrium."
  },
  {
    name: "McLaughlin Hall",
    lat: 37.873829,
    lng: -122.259051,
    description: "Houses the Civil and Environmental Engineering department, along with the Institute of Transportation Studies."
  },
  {
    name: "Hesse Hall",
    lat: 37.874167,
    lng: -122.259247,
    description: "Connected to McLaughlin Hall, mostly containing mechanical engineering laboratories and heavy equipment testing facilities."
  },

  // --- PHYSICAL SCIENCES & MATH ---
  {
    name: "Evans Hall",
    lat: 37.87363,
    lng: -122.25783,
    description: "A towering concrete building dominating the east side of campus. Home to the Mathematics, Economics, and Statistics departments."
  },
  {
    name: "Stanley Hall",
    lat: 37.87404,
    lng: -122.25609,
    description: "A state-of-the-art hub for bioengineering and quantitative biosciences. Located near the eastern edge of campus, heavily trafficked by STEM researchers."
  },
  {
    name: "Campbell Hall",
    lat: 37.87298,
    lng: -122.25705,
    description: "Home to the Astronomy and Physics departments. Features rooftop observatories for stargazing and research."
  },
  {
    name: "Physics North",
    lat: 37.87249,
    lng: -122.25688,
    description: "(Formerly LeConte Hall). Part of the physics complex, housing laboratories, lecture halls, and historical artifacts from Berkeley's early atomic research."
  },
  {
    name: "Physics South",
    lat: 37.87249,
    lng: -122.25688,
    description: "(Formerly Old LeConte Hall). The older portion of the physics complex. Famous for being the site of the first cyclotron."
  },
  {
    name: "Birge Hall",
    lat: 37.87219,
    lng: -122.25724,
    description: "Connected to the physics buildings, primarily containing advanced research laboratories for the physics department."
  },
  {
    name: "Latimer Hall",
    lat: 37.873215,
    lng: -122.255835,
    description: "A prominent building in the College of Chemistry complex, housing chemistry labs, offices, and lecture spaces."
  },
  {
    name: "Hildebrand Hall",
    lat: 37.8726,
    lng: -122.2555,
    description: "Part of the College of Chemistry, containing the Chemistry Library and extensive laboratory space."
  },
  {
    name: "Pimentel Hall",
    lat: 37.87341,
    lng: -122.25602,
    description: "A distinct, circular lecture hall used exclusively for massive chemistry and physical science introductory courses. Features a rotating stage for live experiments."
  },
  {
    name: "Tan Hall",
    lat: 37.8731,
    lng: -122.25642,
    description: "The tallest building in the chemistry complex, containing advanced chemical engineering and chemical biology research labs."
  },
  {
    name: "Lewis Hall",
    lat: 37.873009,
    lng: -122.254878,
    description: "A chemistry research building, primarily utilized by graduate students and faculty in the College of Chemistry."
  },

  // --- SOCIAL SCIENCES, ARTS & HUMANITIES ---
  {
    name: "Social Sciences Building",
    lat: 37.87006,
    lng: -122.25791,
    description: "(Formerly Barrows Hall). A massive, older building on the south edge of campus housing Political Science, Sociology, and Ethnic Studies."
  },
  {
    name: "Anthropology and Art Practice Building",
    lat: 37.86988,
    lng: -122.2552,
    description: "(Formerly Kroeber Hall). Houses the Anthropology department, Art Practice studios, and the Hearst Museum of Anthropology."
  },
  {
    name: "Morrison Hall",
    lat: 37.87087,
    lng: -122.25644,
    description: "Home to the Department of Music. Contains practice rooms, faculty offices, and the Music Library."
  },
  {
    name: "Moses Hall",
    lat: 37.87099,
    lng: -122.25799,
    description: "A picturesque, ivy-covered building housing the Institute of International Studies and philosophy-related offices."
  },
  {
    name: "Stephens Hall",
    lat: 37.87124,
    lng: -122.25761,
    description: "An academic hall serving as the headquarters for the Academic Senate and various interdisciplinary humanities centers."
  },
  {
    name: "South Hall",
    lat: 37.87133,
    lng: -122.25851,
    description: "The oldest remaining original building on the UC Berkeley campus. Built in 1873, it currently houses the School of Information (I-School)."
  },
  {
    name: "California Hall",
    lat: 37.87189,
    lng: -122.26038,
    description: "An historic administrative and academic building located near the center of campus. Often serves as the office of the Chancellor."
  },

  // --- AGRICULTURE & NATURAL RESOURCES (ROUSSEAU QUAD) ---
  {
    name: "Giannini Hall",
    lat: 37.87357,
    lng: -122.26234,
    description: "Part of the Rausser College of Natural Resources, focusing on agricultural and resource economics. Located in the beautiful northwest quadrant of campus."
  },
  {
    name: "Hilgard Hall",
    lat: 37.873164,
    lng: -122.263405,
    description: "A beautiful historic building housing environmental science, policy, and management departments. Famous for the inscription 'To Rescue for Human Society the Native Values of Rural Life'."
  },
  {
    name: "Wellman Hall",
    lat: 37.872982,
    lng: -122.262729,
    description: "A classic agricultural science building, prominently featuring the Essig Museum of Entomology."
  },
  {
    name: "Mulford Hall",
    lat: 37.87264,
    lng: -122.26449,
    description: "Headquarters for the forestry and environmental science departments. Features extensive wood paneling and natural science laboratories."
  },
  {
    name: "Morgan Hall",
    lat: 37.873164,
    lng: -122.264198,
    description: "Home to the Department of Nutritional Sciences and Toxicology. Located on the northwest corner of campus."
  },
  {
    name: "Koshland Hall",
    lat: 37.87394,
    lng: -122.26487,
    description: "A modern biological sciences and plant biology building located on the far northwest edge of the campus near Oxford Street."
  },
  {
    name: "Barker Hall",
    lat: 37.87395,
    lng: -122.26549,
    description: "A high-rise research building dedicated to biochemistry and molecular biology, physically attached to Koshland Hall."
  },

  // --- STUDENT LIFE, ADMIN & ATHLETICS ---
  {
    name: "MLK Student Union",
    lat: 37.869137,
    lng: -122.259614,
    description: "The bustling epicenter of student life on Upper Sproul. Houses the student store, creative spaces, meeting rooms, and various food vendors."
  },
  {
    name: "Sproul Hall",
    lat: 37.8696,
    lng: -122.25878,
    description: "The main administrative building handling admissions, financial aid, and student records. Famous as the epicenter of the 1964 Free Speech Movement."
  },
  {
    name: "Eshleman Hall",
    lat: 37.868761,
    lng: -122.260471,
    description: "A modern high-rise building housing student government (ASUC), student publications, and various club and organization offices."
  },
  {
    name: "Recreational Sports Facility (RSF)",
    lat: 37.868652,
    lng: -122.262897,
    description: "UC Berkeley's massive main student gym and fitness center, featuring weight rooms, basketball courts, and swimming pools."
  },
  {
    name: "Haas Pavilion",
    lat: 37.8694,
    lng: -122.26222,
    description: "The massive indoor sports arena home to the Cal Golden Bears men's and women's basketball and gymnastics teams."
  },
  {
    name: "California Memorial Stadium",
    lat: 37.87132,
    lng: -122.2506,
    description: "The massive 63,000-seat outdoor football stadium nestled into the Berkeley hills. Home to Cal Football."
  },
  {
    name: "Alumni House",
    lat: 37.86968,
    lng: -122.26119,
    description: "The headquarters for the Cal Alumni Association, hosting networking events, meetings, and alumni gatherings. Located near the central campus."
  },
  {
    name: "Anthony Hall",
    lat: 37.87069,
    lng: -122.25819,
    description: "A unique, historic wooden building that serves as the headquarters for the Graduate Assembly. Located near Strawberry Creek."
  },
  {
    name: "Minor Hall",
    lat: 37.871525,
    lng: -122.254711,
    description: "The home of the School of Optometry. Contains academic spaces, laboratories, and a public-facing optometry clinic."
  }
];
const BERKELEY_SPOTS: BerkeleyLocation[] = [...LIBRARIES_AND_CAFES, ...CAMPUS_BUILDINGS];
// --- Types ---
interface RoutingProps {
  start: L.LatLngExpression;
  end: L.LatLngExpression;
}


// This sub-component handles the actual routing logic
const RoutingControl = ({ start, end }: RoutingProps) => {
    const map = useMap();
    // Use a ref to keep track of the control across renders
    const routingControlRef = React.useRef<L.Routing.Control | null>(null);
  
    useEffect(() => {
      if (!map) return;
  
      // 1. Create the control instance
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(start as any), 
          L.latLng(end as any)
        ],
        lineOptions: {
          styles: [{ color: "#6FA1EC", weight: 4 }],
          extendToWaypoints: true,
          missingRouteTolerance: 10
        },
        addWaypoints: false,
      });
  
      // 2. Add to map and store in ref
      routingControl.addTo(map);
      routingControlRef.current = routingControl;
  
      // 3. Robust Cleanup
      return () => {
        if (routingControlRef.current) {
          const control = routingControlRef.current;
          
          try {
            // Manually remove the waypoints/plan first
            const plan = control.getPlan();
            if (plan && map) {
              map.removeLayer(plan);
            }
            // Finally remove the control itself
            map.removeControl(control);
          } catch (e) {
            console.warn("Leaflet cleanup handled safely.");
          } finally {
            routingControlRef.current = null;
          }
        }
      };
    }, [map, start, end]);
  
    return null;
  };
  
  const CAMPANILE_COORDS: [number, number] = [37.8695, -122.2585];

  function ChangeView({ center }: { center: L.LatLngExpression }) {
    const map = useMap();
    useEffect(()=>{
      map.zoomControl.remove();  
    },[])
    useEffect(() => {
      if (map && center)
      {
      map.setView([center[0]-0.002,center[1]], map.getZoom());
      }
      }, [center, map]);
    return null;
  }

  export type MapComponentProps = {
    searchText: string;
    setSearchText: React.Dispatch<React.SetStateAction<string>>;
    onReady?: (handle: MapComponentHandle) => void;

  };
  export type MapComponentHandle = {
    goToSpot: (spot: BerkeleyLocation) => void;
    goToBestMatch: (query: string) => void;
  };
  
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  
  const scoreSpotName = (query: string, name: string) => {
    const q = normalize(query);
    const n = normalize(name);
  
    if (!q) return -Infinity;
    if (n === q) return 1000;
    if (n.startsWith(q)) return 800;
    if (n.includes(q)) return 600;
  
    const qWords = q.split(" ");
    const nWords = n.split(" ");
  
    let score = 0;
  
    for (const qw of qWords) {
      if (nWords.includes(qw)) score += 120;
      else if (n.includes(qw)) score += 70;
    }
  
    // lightweight character-order bonus
    let qi = 0;
    for (let i = 0; i < n.length && qi < q.length; i++) {
      if (n[i] === q[qi]) qi++;
    }
    score += (qi / q.length) * 100;
  
    // prefer shorter names when scores are similar
    score -= Math.abs(n.length - q.length) * 0.5;
  
    return score;
  };
  
  const findBestSpotMatch = (query: string): BerkeleyLocation | null => {
    const trimmed = query.trim();
    if (!trimmed) return null;
  
    let bestSpot: BerkeleyLocation | null = null;
    let bestScore = -Infinity;
  
    for (const spot of BERKELEY_SPOTS) {
      const score = scoreSpotName(trimmed, spot.name);
      if (score > bestScore) {
        bestScore = score;
        bestSpot = spot;
      }
    }
  
    return bestScore > 80 ? bestSpot : null;
  };
  export const MapComponent = forwardRef<MapComponentHandle, MapComponentProps>(
    ({ searchText, setSearchText, onReady  }, ref) => {
      const markerRefs = useRef<Record<string, L.Marker | null>>({});

      const goToBestMatch = (query: string) => {
        const bestSpot = findBestSpotMatch(query);
        if (!bestSpot) return;
      
        goToSpot(bestSpot);
      };
      
      useImperativeHandle(ref, () => ({
        goToSpot,
        goToBestMatch,
      }));
      const [selectedSpot, setSelectedSpot] = useState<BerkeleyLocation | null>(null);
      const [userLocation, setUserLocation] = useState<L.LatLngExpression | null>(null);
      const [destination, setDestination] = useState<L.LatLng | null>(null);
      const [hasFoundUser, setHasFoundUser] = useState(false);
  
      const filteredSpots = useMemo(() => {
        if (!searchText.trim()) return [];
        return BERKELEY_SPOTS.filter((spot) =>
          spot.name.toLowerCase().includes(searchText.toLowerCase())
        ).slice(0, 5);
      }, [searchText]);
  
      const goToSpot = (spot: BerkeleyLocation) => {
        setSelectedSpot(spot);
        setSearchText(spot.name);
        setDestination(L.latLng(spot.lat, spot.lng));
  
        setTimeout(() => {
          markerRefs.current[spot.name]?.openPopup();
        }, 100);
      };
  
      useImperativeHandle(ref, () => ({
        goToSpot,
      }));
      useEffect(() => {
        if (!onReady) return;
      
        onReady({
          goToSpot,
          goToBestMatch,
        });
      }, [onReady, goToSpot, goToBestMatch]);
      useEffect(() => {
        if (typeof window !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation([position.coords.latitude, position.coords.longitude]);
              setHasFoundUser(true);
            },
            () => {
              console.warn('Using Campanile fallback.');
              setHasFoundUser(true);
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        }
      }, []);
  
      const MapClickHandler = () => {
        useMapEvents({
          click(e) {
            setDestination(e.latlng);
          },
        });
        return null;
      };
  
      return (
        <>
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              width: 'min(420px, 90%)',
              background: 'white',
              padding: '10px',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            }}
          >
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredSpots.length > 0) {
                  goToSpot(filteredSpots[0]);
                }
              }}
              placeholder="Search Berkeley spots..."
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                outline: 'none',
              }}
            />
  
            {filteredSpots.length > 0 && (
              <div style={{ marginTop: 8, maxHeight: 220, overflowY: 'auto' }}>
                {filteredSpots.map((spot) => (
                  <div
                    key={spot.name}
                    onClick={() => goToSpot(spot)}
                    style={{
                      padding: '8px 10px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                    }}
                  >
                    {spot.name}
                  </div>
                ))}
              </div>
            )}
          </div>
  
          <MapContainer
            center={userLocation || CAMPANILE_COORDS}
            zoom={15}
            attributionControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution=""
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
  
            {hasFoundUser && !selectedSpot && (
              <ChangeView center={userLocation || CAMPANILE_COORDS} />
            )}
  
            {selectedSpot && (
              <ChangeView center={[selectedSpot.lat, selectedSpot.lng]} zoom={18} />
            )}
  
            <MapClickHandler />
  
            {userLocation && <Marker position={userLocation} />}
  
            {BERKELEY_SPOTS.map((spot) => (
              <Marker
                key={spot.name}
                position={[spot.lat, spot.lng]}
                ref={(marker) => {
                  markerRefs.current[spot.name] = marker;
                }}
              >
                <Popup>
                  <div style={{ maxWidth: '200px' }}>
                    <strong>{spot.name}</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
                      {spot.description}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </>
      );
    }
  );
  
  MapComponent.displayName = 'MapComponent';
  export default MapComponent;