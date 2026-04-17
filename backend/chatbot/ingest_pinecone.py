import os
from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone

load_dotenv()

# 1. Initialize the Free Local Embedding Model (runs fast on your 4080)
# We use all-MiniLM-L6-v2 because it maps text to 384 dimensions.
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# 2. Connect to Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = "berkeley-campus-locations"

# 3. Create your Mock Enterprise Data
# We embed the text description, but store the lat/lng in the metadata so your map can use it!
locations = [
    #Libraries
  Document(
    page_content="Art History/Classics Library. A compact UC Berkeley library inside Doe Library with quiet study spaces, research assistance, and a calm academic atmosphere. Good for focused reading and evening study.",
    metadata={"name": "Art History/Classics Library", "lat": 37.8722068, "lng": -122.2592367, "url": "https://goo.gl/maps/vDxBqXGTHhZpqtdD6"}
  ),
  Document(
    page_content="Bancroft Library. A specialized research library at UC Berkeley with an archival focus and a scholarly atmosphere. Best for serious research rather than casual study.",
    metadata={"name": "Bancroft Library", "lat": 37.8723046, "lng": -122.2586503, "url": "https://goo.gl/maps/yiQ7h6GJZnDajYQN7"}
  ),
  Document(
    page_content="Berkeley Art Museum and Pacific Film Archive. A museum and film archive with study-center functions and an arts-focused environment. Better for research, cultural browsing, and academic projects than quiet long-session studying.",
    metadata={"name": "Berkeley Art Museum and Pacific Film Archive", "lat": 37.8707356, "lng": -122.269059, "url": "https://goo.gl/maps/rpfEW1xFhHFUZ8yi7"}
  ),
  Document(
    page_content="Berkeley Law Library. A focused law library with long hours and a strong academic research atmosphere. Good for quiet legal study and structured work sessions.",
    metadata={"name": "Berkeley Law Library", "lat": 37.8694764, "lng": -122.2540154, "url": "https://goo.gl/maps/2sRhhU4sSShjnGE59"}
  ),
  Document(
    page_content="Bioscience, Natural Resources & Public Health Library. A UC Berkeley subject library for bioscience and public health research with a study-friendly setting. Suitable for reading, research, and longer academic sessions.",
    metadata={"name": "Bioscience, Natural Resources & Public Health Library", "lat": 37.8714896, "lng": -122.2647157, "url": "https://goo.gl/maps/1hZwe4HmyzaRJek89"}
  ),
  Document(
    page_content="Business Library. A busy, high-traffic study library with long hours, equipment lending, snacks, and a productive work environment. Good for group work, laptop study, and long sessions.",
    metadata={"name": "Business Library", "lat": 37.871465, "lng": -122.2560199, "url": "https://goo.gl/maps/CmyE9rVC4PmbR6cZ8"}
  ),
  Document(
    page_content="Chemistry, Astronomy & Physics Library. A subject library for STEM study with a quiet, research-oriented atmosphere and long hours. Best for focused technical work and academic reference use.",
    metadata={"name": "Chemistry, Astronomy & Physics Library", "lat": 37.8725916, "lng": -122.2553429, "url": "https://goo.gl/maps/tKddPxVQ7AFmH54X7"}
  ),
  Document(
    page_content="Doe Library. The central UC Berkeley library with a classic, serious study atmosphere, broad research support, and long hours. Ideal for deep focus, reading, and all-day study.",
    metadata={"name": "Doe Library", "lat": 37.8722068, "lng": -122.2618116, "url": "https://goo.gl/maps/LkV9pj5T2tFFtjW17"}
  ),
  Document(
    page_content="Earth Sciences & Map Library. A specialized research library for earth science and cartography materials with a quiet study setting. Good for focused academic work and reserved study space use.",
    metadata={"name": "Earth Sciences & Map Library", "lat": 37.8739719, "lng": -122.2621846, "url": "https://goo.gl/maps/ieK45WFMK1zD7nxy5"}
  ),
  Document(
    page_content="East Asian Library. A subject library with research collections, long hours, and a study-oriented environment. Useful for quiet reading, research, and language or regional studies.",
    metadata={"name": "East Asian Library", "lat": 37.8735757, "lng": -122.2625545, "url": "https://goo.gl/maps/6qCSpHzXwKaRaaC76"}
  ),
  Document(
    page_content="Engineering & Mathematical Sciences Library. A STEM library with equipment lending, long hours, snacks, and a strong study environment. Great for engineering homework, coding, and group study.",
    metadata={"name": "Engineering & Mathematical Sciences Library", "lat": 37.8738432, "lng": -122.2608912, "url": "https://goo.gl/maps/aUbDhnvnshyu7zmk8"}
  ),
  Document(
    page_content="Environmental Design Archives. A research archive for environmental design materials with a quieter research-focused atmosphere. Best for archival work and academic lookup rather than casual study.",
    metadata={"name": "Environmental Design Archives", "lat": 37.8707352, "lng": -122.2548935, "url": "https://goo.gl/maps/QpLUwCUo5Fp3Qwrz9"}
  ),
  Document(
    page_content="Environmental Design Library. A design-focused UC Berkeley library with study spaces, long hours, and a creative academic atmosphere. Good for drafting, reading, and project work.",
    metadata={"name": "Environmental Design Library", "lat": 37.8707352, "lng": -122.2574684, "url": "https://goo.gl/maps/8o7M79Akg8xsTkFaA"}
  ),
  Document(
    page_content="Ethnic Studies Library. A subject library with research materials and a quiet, study-friendly environment. Best for reading, writing, and focused academic work.",
    metadata={"name": "Ethnic Studies Library", "lat": 37.8713614, "lng": -122.2601673, "url": "https://goo.gl/maps/axdC2JFsv6YEstubA"}
  ),
  Document(
    page_content="Graduate Services (study only). A graduate-only study area inside Doe Library with access restrictions and a quiet academic atmosphere. Best for concentrated work and longer sessions.",
    metadata={"name": "Graduate Services (study only)", "lat": 37.8722202, "lng":-122.2618144, "url": "https://goo.gl/maps/LkV9pj5T2tFFtjW17"}
  ),
  Document(
    page_content="Graduate Theological Union Library. A theological research library in Berkeley with a scholarly atmosphere and specialized collections. Best for research and quiet reading.",
    metadata={"name": "Graduate Theological Union Library", "lat": 37.8756942, "lng": -122.2644618, "url": "https://goo.gl/maps/5kZyK4UaTwu6s1KJ9"}
  ),
  Document(
    page_content="Institute of Governmental Studies Library. A focused policy and government research library with a quiet academic setting. Good for research, reading, and writing.",
    metadata={"name": "Institute of Governmental Studies Library", "lat": 37.8710156, "lng": -122.2606622, "url": "https://goo.gl/maps/G7SuBAPAELeZpGaG9"}
  ),
  Document(
    page_content="Institute of Transportation Studies Library. A transportation-focused research library with a quiet, scholarly atmosphere. Best for academic research and technical reading.",
    metadata={"name": "Institute of Transportation Studies Library", "lat": 37.8738837, "lng": -122.2614437, "url": "https://goo.gl/maps/SzJHPT7ir1csgz2t7"}
  ),
  Document(
    page_content="Interlibrary Loan. A service point inside Doe Library for requesting materials and interlibrary access. Not primarily a study destination, but useful for library support tasks.",
    metadata={"name": "Interlibrary Loan", "lat": 37.8722068, "lng": -122.2618116, "url": "https://goo.gl/maps/LkV9pj5T2tFFtjW17"}
  ),
  Document(
    page_content="Lawrence Berkeley National Laboratory Library. A specialized lab library in Berkeley serving scientific and technical research needs. Best for reference work and research support.",
    metadata={"name": "Lawrence Berkeley National Laboratory Library", "lat": 37.8946547, "lng": -122.3303015, "url": "https://goo.gl/maps/PLEk7v1WoVJTWC2SA"}
  ),
  Document(
    page_content="Main (Gardner) Stacks. A major underground study and research area at UC Berkeley with very long hours and a serious work atmosphere. Excellent for quiet deep work and exam prep.",
    metadata={"name": "Main (Gardner) Stacks", "lat": 37.8721832, "lng": -122.2621678, "url": "https://goo.gl/maps/MCJBfgS1YaBiSmxi8"}
  ),
  Document(
    page_content="Morrison Library. A quieter UC Berkeley library inside Doe with a classic reading-room feel and a calm scholarly atmosphere. Good for focused reading and compact study sessions.",
    metadata={"name": "Morrison Library", "lat": 37.8722068, "lng": -122.2620137, "url": "https://goo.gl/maps/YZUyAVzkmD7BR5zt8"}
  ),
  Document(
    page_content="Music Library. A subject library for music research with a quiet academic atmosphere and long hours. Best for listening-based research, reading, and focused study.",
    metadata={"name": "Music Library", "lat": 37.8704442, "lng": -122.2587614, "url": "https://goo.gl/maps/RSwQRTp1FaLcDeEG8"}
  ),
  Document(
    page_content="Social Research Library. A research-focused library with a quiet academic setting and a strong social sciences orientation. Good for reading, writing, and research tasks.",
    metadata={"name": "Social Research Library", "lat": 37.8737118, "lng": -122.2636233, "url": "https://goo.gl/maps/thNXddkyNeTjQF5a9"}
  ),
  Document(
    page_content="South/Southeast Asia Library (study only). A study-only library space with subject collections and a quiet scholarly environment. Best for focused reading and region-specific research.",
    metadata={"name": "South/Southeast Asia Library (study only)", "lat": 37.8722202, "lng": -122.2618144, "url": "https://goo.gl/maps/LkV9pj5T2tFFtjW17"}
  ),
  #Cafes
  Document( 
        page_content="Free Speech Movement Cafe (FSM). A lively, bustling cafe located inside Moffitt Library. Great for group study, strong espresso, and a vibrant campus atmosphere. Features outdoor patio seating and is very popular among undergrads.", 
        metadata={"name": "Free Speech Movement Cafe (FSM)", "lat": 37.872428, "lng": -122.260588, "url": "https://www.google.com/maps/search/?api=1&query=37.872428,-122.260588"} 
    ),
    Document( 
        page_content="Cafe Think. Located right inside the Haas School of Business courtyard. Offers organic coffee and great lunches. Excellent for taking a break between business classes with a highly collaborative atmosphere and outdoor courtyard seating.", 
        metadata={"name": "Cafe Think", "lat": 37.871500, "lng": -122.253600, "url": "https://www.google.com/maps/search/?api=1&query=37.871500,-122.253600"} 
    ),
    Document( 
        page_content="Brown's California Cafe. Located in the Genetics and Plant Biology building on the northwest side of campus. Focuses on locally sourced, sustainable food and Peet's coffee. Bright, modern indoor and outdoor seating, heavily utilized by STEM students.", 
        metadata={"name": "Brown's California Cafe", "lat": 37.873700, "lng": -122.263500, "url": "https://www.google.com/maps/search/?api=1&query=37.873700,-122.263500"} 
    ),
    Document( 
        page_content="Yali's Cafe (Stanley Hall). Conveniently located on the ground floor of Stanley Hall. An essential quick stop for engineering, biology, and chemistry students needing a caffeine fix or bagel between labs. Very limited seating, mostly grab-and-go.", 
        metadata={"name": "Yali's Cafe - Stanley Hall", "lat": 37.873400, "lng": -122.255600, "url": "https://www.google.com/maps/search/?api=1&query=37.873400,-122.255600"} 
    ),
    Document( 
        page_content="The Coffee Lab. A literal coffee shack located in the Chemistry plaza between Hildebrand and Latimer Halls. Only has outdoor plaza seating. Perfect for grabbing a quick, cheap Americano between hard science lectures.", 
        metadata={"name": "The Coffee Lab", "lat": 37.872800, "lng": -122.256200, "url": "https://www.google.com/maps/search/?api=1&query=37.872800,-122.256200"} 
    ),
    Document( 
        page_content="Qualcomm Cyber Cafe. Located on the ground floor of Sutardja Dai Hall (CITRIS). Very popular with EECS students and researchers. Offers specialty coffee, pastries, and sandwiches with indoor seating and plenty of outlets for coding.", 
        metadata={"name": "Qualcomm Cyber Cafe", "lat": 37.874800, "lng": -122.258600, "url": "https://www.google.com/maps/search/?api=1&query=37.874800,-122.258600"} 
    ),
    Document( 
        page_content="Terrace Cafe. Located on the rooftop of the Bechtel Engineering Center. Offers outdoor patio seating with excellent views of the Campanile. A relaxed spot for engineering students to grab coffee, salads, and sandwiches.", 
        metadata={"name": "Terrace Cafe", "lat": 37.874200, "lng": -122.258800, "url": "https://www.google.com/maps/search/?api=1&query=37.874200,-122.258800"} 
    ),
    Document( 
        page_content="Ramona's Cafe. Tucked away inside Wurster Hall. Frequented heavily by architecture and environmental design students working long studio hours. Serves Peet's coffee, paninis, and hot food with an industrial aesthetic.", 
        metadata={"name": "Ramona's Cafe", "lat": 37.870600, "lng": -122.254700, "url": "https://www.google.com/maps/search/?api=1&query=37.870600,-122.254700"} 
    ),
    Document( 
        page_content="Golden Bear Cafe (GBC). Located centrally on Upper Sproul Plaza. While largely a bustling food court, it serves as a massive coffee and smoothie hub for students crossing campus. Highly energetic, fast-paced, and extremely loud.", 
        metadata={"name": "Golden Bear Cafe (GBC)", "lat": 37.869400, "lng": -122.259500, "url": "https://www.google.com/maps/search/?api=1&query=37.869400,-122.259500"} 
    )
]
campus_buildings = [
    # --- THEATERS & PERFORMANCE CENTERS ---
    Document(
        page_content="Zellerbach Hall. The premier performance venue on the UC Berkeley campus. Hosts Cal Performances, including world-class dance, theater, music, and speaker events. Located right on Lower Sproul Plaza.",
        metadata={"name": "Zellerbach Hall", "lat": 37.8691, "lng": -122.2604, "url": "https://goo.gl/maps/ZellerbachHall"}
    ),
    Document(
        page_content="William Randolph Hearst Greek Theatre. A massive, 8,500-seat outdoor amphitheater built into the Berkeley hills. Hosts major concerts, graduations, and large-scale university events.",
        metadata={"name": "Hearst Greek Theatre", "lat": 37.8735, "lng": -122.2546, "url": "https://goo.gl/maps/GreekTheatre"}
    ),
    Document(
        page_content="Hertz Hall. UC Berkeley's primary concert hall for the Department of Music. Features excellent acoustics and houses the university's historic organ. Located near the Faculty Club.",
        metadata={"name": "Hertz Hall", "lat": 37.8708, "lng": -122.2573, "url": "https://goo.gl/maps/HertzHall"}
    ),
    Document(
        page_content="Zellerbach Playhouse. A smaller, more intimate theatrical space adjacent to the main Zellerbach Hall. Heavily used by the Department of Theater, Dance, and Performance Studies (TDPS) for student and professional productions.",
        metadata={"name": "Zellerbach Playhouse", "lat": 37.8693, "lng": -122.2611, "url": "https://goo.gl/maps/ZellerbachPlayhouse"}
    ),
    Document(
        page_content="Durham Studio Theater. An intimate black-box theater located inside Dwinelle Hall. Used primarily for student-directed plays and smaller TDPS performances.",
        metadata={"name": "Durham Studio Theater", "lat": 37.8705, "lng": -122.2605, "url": "https://goo.gl/maps/DurhamTheater"}
    ),

    # --- MAJOR ACADEMIC & LECTURE HALLS ---
    Document(
        page_content="Dwinelle Hall. A massive, notoriously maze-like academic building housing the humanities departments, language classes, and large lecture halls. Located centrally near the Campanile and Sproul Plaza.",
        metadata={"name": "Dwinelle Hall", "lat": 37.8705, "lng": -122.2605, "url": "https://goo.gl/maps/Dwinelle"}
    ),
    Document(
        page_content="Wheeler Hall. One of the largest lecture halls on campus, hosting massive lower-division classes and high-profile guest lectures. Located right next to the Campanile and Sather Gate.",
        metadata={"name": "Wheeler Hall", "lat": 37.8703, "lng": -122.2590, "url": "https://goo.gl/maps/Wheeler"}
    ),
    Document(
        page_content="Valley Life Sciences Building (VLSB). A gigantic building dedicated to biological sciences. Famous for having a T-Rex skeleton inside. Houses the Bioscience Library and Brown's Cafe.",
        metadata={"name": "Valley Life Sciences Building (VLSB)", "lat": 37.8716, "lng": -122.2633, "url": "https://goo.gl/maps/VLSB"}
    ),
    Document(
        page_content="Wurster Hall. A brutalist concrete building housing the College of Environmental Design. Open late for architecture, landscape architecture, and urban planning studio students.",
        metadata={"name": "Wurster Hall", "lat": 37.8706, "lng": -122.2547, "url": "https://goo.gl/maps/Wurster"}
    ),
    Document(
        page_content="Haas School of Business. A modern complex of buildings on the eastern edge of campus, featuring a central courtyard, study rooms, and professional amenities for undergraduate and MBA students.",
        metadata={"name": "Haas School of Business", "lat": 37.8715, "lng": -122.2536, "url": "https://goo.gl/maps/Haas"}
    ),
    Document(
        page_content="Chou Hall. The newest addition to the Haas Business School campus, entirely dedicated to student learning spaces, event spaces, and sustainable, zero-waste design.",
        metadata={"name": "Chou Hall", "lat": 37.8718, "lng": -122.2533, "url": "https://goo.gl/maps/ChouHall"}
    ),

    # --- ENGINEERING & COMPUTER SCIENCE ---
    Document(
        page_content="Soda Hall. The primary building for Computer Science (CS) students. Features computer labs, research spaces, and the Wozniak Lounge. Located on the northern edge of campus on Hearst Ave.",
        metadata={"name": "Soda Hall", "lat": 37.8756, "lng": -122.2588, "url": "https://goo.gl/maps/SodaHall"}
    ),
    Document(
        page_content="Cory Hall. The headquarters for the Electrical Engineering (EE) department. Packed with hardware labs, robotics research, and maker spaces. Located right next to Soda Hall.",
        metadata={"name": "Cory Hall", "lat": 37.8750, "lng": -122.2575, "url": "https://goo.gl/maps/CoryHall"}
    ),
    Document(
        page_content="Sutardja Dai Hall. Home to CITRIS and computer science research. A modern building on the north side of campus frequented by EECS students, housing the Qualcomm Cyber Cafe.",
        metadata={"name": "Sutardja Dai Hall", "lat": 37.8748, "lng": -122.2586, "url": "https://goo.gl/maps/Sutardja"}
    ),
    Document(
        page_content="Etcheverry Hall. Houses the Mechanical Engineering, Industrial Engineering, and Nuclear Engineering departments. Located on the north side of campus across Hearst Ave.",
        metadata={"name": "Etcheverry Hall", "lat": 37.8756, "lng": -122.2598, "url": "https://goo.gl/maps/EtcheverryHall"}
    ),
    Document(
        page_content="Hearst Memorial Mining Building. A stunning, historically preserved building housing the Materials Science and Engineering department. Famous for its beautiful sky-lit atrium.",
        metadata={"name": "Hearst Memorial Mining Building", "lat": 37.8739, "lng": -122.2568, "url": "https://goo.gl/maps/HearstMining"}
    ),
    Document(
        page_content="McLaughlin Hall. Houses the Civil and Environmental Engineering department, along with the Institute of Transportation Studies.",
        metadata={"name": "McLaughlin Hall", "lat": 37.8737, "lng": -122.2593, "url": "https://goo.gl/maps/McLaughlin"}
    ),
    Document(
        page_content="Hesse Hall. Connected to McLaughlin Hall, mostly containing mechanical engineering laboratories and heavy equipment testing facilities.",
        metadata={"name": "Hesse Hall", "lat": 37.8741, "lng": -122.2590, "url": "https://goo.gl/maps/HesseHall"}
    ),

    # --- PHYSICAL SCIENCES & MATH ---
    Document(
        page_content="Evans Hall. A towering concrete building dominating the east side of campus. Home to the Mathematics, Economics, and Statistics departments.",
        metadata={"name": "Evans Hall", "lat": 37.8736, "lng": -122.2578, "url": "https://goo.gl/maps/EvansHall"}
    ),
    Document(
        page_content="Stanley Hall. A state-of-the-art hub for bioengineering and quantitative biosciences. Located near the eastern edge of campus, heavily trafficked by STEM researchers.",
        metadata={"name": "Stanley Hall", "lat": 37.8734, "lng": -122.2556, "url": "https://goo.gl/maps/Stanley"}
    ),
    Document(
        page_content="Campbell Hall. Home to the Astronomy and Physics departments. Features rooftop observatories for stargazing and research.",
        metadata={"name": "Campbell Hall", "lat": 37.8730, "lng": -122.2578, "url": "https://goo.gl/maps/CampbellHall"}
    ),
    Document(
        page_content="Physics North. (Formerly LeConte Hall). Part of the physics complex, housing laboratories, lecture halls, and historical artifacts from Berkeley's early atomic research.",
        metadata={"name": "Physics North", "lat": 37.8727, "lng": -122.2566, "url": "https://goo.gl/maps/PhysicsNorth"}
    ),
    Document(
        page_content="Physics South. (Formerly Old LeConte Hall). The older portion of the physics complex. Famous for being the site of the first cyclotron.",
        metadata={"name": "Physics South", "lat": 37.8724, "lng": -122.2571, "url": "https://goo.gl/maps/PhysicsSouth"}
    ),
    Document(
        page_content="Birge Hall. Connected to the physics buildings, primarily containing advanced research laboratories for the physics department.",
        metadata={"name": "Birge Hall", "lat": 37.8725, "lng": -122.2561, "url": "https://goo.gl/maps/BirgeHall"}
    ),
    Document(
        page_content="Latimer Hall. A prominent building in the College of Chemistry complex, housing chemistry labs, offices, and lecture spaces.",
        metadata={"name": "Latimer Hall", "lat": 37.8730, "lng": -122.2560, "url": "https://goo.gl/maps/LatimerHall"}
    ),
    Document(
        page_content="Hildebrand Hall. Part of the College of Chemistry, containing the Chemistry Library and extensive laboratory space.",
        metadata={"name": "Hildebrand Hall", "lat": 37.8726, "lng": -122.2555, "url": "https://goo.gl/maps/HildebrandHall"}
    ),
    Document(
        page_content="Pimentel Hall. A distinct, circular lecture hall used exclusively for massive chemistry and physical science introductory courses. Features a rotating stage for live experiments.",
        metadata={"name": "Pimentel Hall", "lat": 37.8731, "lng": -122.2552, "url": "https://goo.gl/maps/PimentelHall"}
    ),
    Document(
        page_content="Tan Hall. The tallest building in the chemistry complex, containing advanced chemical engineering and chemical biology research labs.",
        metadata={"name": "Tan Hall", "lat": 37.8734, "lng": -122.2551, "url": "https://goo.gl/maps/TanHall"}
    ),
    Document(
        page_content="Lewis Hall. A chemistry research building, primarily utilized by graduate students and faculty in the College of Chemistry.",
        metadata={"name": "Lewis Hall", "lat": 37.8727, "lng": -122.2547, "url": "https://goo.gl/maps/LewisHall"}
    ),

    # --- SOCIAL SCIENCES, ARTS & HUMANITIES ---
    Document(
        page_content="Social Sciences Building. (Formerly Barrows Hall). A massive, older building on the south edge of campus housing Political Science, Sociology, and Ethnic Studies.",
        metadata={"name": "Social Sciences Building", "lat": 37.8701, "lng": -122.2579, "url": "https://goo.gl/maps/SocialSciencesBuilding"}
    ),
    Document(
        page_content="Anthropology and Art Practice Building. (Formerly Kroeber Hall). Houses the Anthropology department, Art Practice studios, and the Hearst Museum of Anthropology.",
        metadata={"name": "Anthropology and Art Practice Building", "lat": 37.8698, "lng": -122.2554, "url": "https://goo.gl/maps/AnthroArt"}
    ),
    Document(
        page_content="Morrison Hall. Home to the Department of Music. Contains practice rooms, faculty offices, and the Music Library.",
        metadata={"name": "Morrison Hall", "lat": 37.8703, "lng": -122.2576, "url": "https://goo.gl/maps/MorrisonHall"}
    ),
    Document(
        page_content="Moses Hall. A picturesque, ivy-covered building housing the Institute of International Studies and philosophy-related offices.",
        metadata={"name": "Moses Hall", "lat": 37.8708, "lng": -122.2589, "url": "https://goo.gl/maps/MosesHall"}
    ),
    Document(
        page_content="Stephens Hall. An academic hall serving as the headquarters for the Academic Senate and various interdisciplinary humanities centers.",
        metadata={"name": "Stephens Hall", "lat": 37.8713, "lng": -122.2586, "url": "https://goo.gl/maps/StephensHall"}
    ),
    Document(
        page_content="South Hall. The oldest remaining original building on the UC Berkeley campus. Built in 1873, it currently houses the School of Information (I-School).",
        metadata={"name": "South Hall", "lat": 37.8714, "lng": -122.2596, "url": "https://goo.gl/maps/SouthHall"}
    ),
    Document(
        page_content="California Hall. An historic administrative and academic building located near the center of campus. Often serves as the office of the Chancellor.",
        metadata={"name": "California Hall", "lat": 37.8719, "lng": -122.2599, "url": "https://goo.gl/maps/CaliforniaHall"}
    ),

    # --- AGRICULTURE & NATURAL RESOURCES (ROUSSEAU QUAD) ---
    Document(
        page_content="Giannini Hall. Part of the Rausser College of Natural Resources, focusing on agricultural and resource economics. Located in the beautiful northwest quadrant of campus.",
        metadata={"name": "Giannini Hall", "lat": 37.8727, "lng": -122.2644, "url": "https://goo.gl/maps/GianniniHall"}
    ),
    Document(
        page_content="Hilgard Hall. A beautiful historic building housing environmental science, policy, and management departments. Famous for the inscription 'To Rescue for Human Society the Native Values of Rural Life'.",
        metadata={"name": "Hilgard Hall", "lat": 37.8732, "lng": -122.2647, "url": "https://goo.gl/maps/HilgardHall"}
    ),
    Document(
        page_content="Wellman Hall. A classic agricultural science building, prominently featuring the Essig Museum of Entomology.",
        metadata={"name": "Wellman Hall", "lat": 37.8729, "lng": -122.2636, "url": "https://goo.gl/maps/WellmanHall"}
    ),
    Document(
        page_content="Mulford Hall. Headquarters for the forestry and environmental science departments. Features extensive wood paneling and natural science laboratories.",
        metadata={"name": "Mulford Hall", "lat": 37.8730, "lng": -122.2655, "url": "https://goo.gl/maps/MulfordHall"}
    ),
    Document(
        page_content="Morgan Hall. Home to the Department of Nutritional Sciences and Toxicology. Located on the northwest corner of campus.",
        metadata={"name": "Morgan Hall", "lat": 37.8739, "lng": -122.2650, "url": "https://goo.gl/maps/MorganHall"}
    ),
    Document(
        page_content="Koshland Hall. A modern biological sciences and plant biology building located on the far northwest edge of the campus near Oxford Street.",
        metadata={"name": "Koshland Hall", "lat": 37.8741, "lng": -122.2662, "url": "https://goo.gl/maps/KoshlandHall"}
    ),
    Document(
        page_content="Barker Hall. A high-rise research building dedicated to biochemistry and molecular biology, physically attached to Koshland Hall.",
        metadata={"name": "Barker Hall", "lat": 37.8743, "lng": -122.2658, "url": "https://goo.gl/maps/BarkerHall"}
    ),

    # --- STUDENT LIFE, ADMIN & ATHLETICS ---
    Document(
        page_content="Martin Luther King Jr. Student Union (MLK). The bustling epicenter of student life on Upper Sproul. Houses the student store, creative spaces, meeting rooms, and various food vendors.",
        metadata={"name": "MLK Student Union", "lat": 37.8690, "lng": -122.2597, "url": "https://goo.gl/maps/MLKUnion"}
    ),
    Document(
        page_content="Sproul Hall. The main administrative building handling admissions, financial aid, and student records. Famous as the epicenter of the 1964 Free Speech Movement.",
        metadata={"name": "Sproul Hall", "lat": 37.8697, "lng": -122.2588, "url": "https://goo.gl/maps/SproulHall"}
    ),
    Document(
        page_content="Eshleman Hall. A modern high-rise building housing student government (ASUC), student publications, and various club and organization offices.",
        metadata={"name": "Eshleman Hall", "lat": 37.8687, "lng": -122.2600, "url": "https://goo.gl/maps/EshlemanHall"}
    ),
    Document(
        page_content="Recreational Sports Facility (RSF). UC Berkeley's massive main student gym and fitness center, featuring weight rooms, basketball courts, and swimming pools.",
        metadata={"name": "Recreational Sports Facility (RSF)", "lat": 37.8683, "lng": -122.2630, "url": "https://goo.gl/maps/RSF"}
    ),
    Document(
        page_content="Haas Pavilion. The massive indoor sports arena home to the Cal Golden Bears men's and women's basketball and gymnastics teams.",
        metadata={"name": "Haas Pavilion", "lat": 37.8695, "lng": -122.2632, "url": "https://goo.gl/maps/HaasPavilion"}
    ),
    Document(
        page_content="California Memorial Stadium. The massive 63,000-seat outdoor football stadium nestled into the Berkeley hills. Home to Cal Football.",
        metadata={"name": "California Memorial Stadium", "lat": 37.8711, "lng": -122.2508, "url": "https://goo.gl/maps/MemorialStadium"}
    ),
    Document(
        page_content="Alumni House. The headquarters for the Cal Alumni Association, hosting networking events, meetings, and alumni gatherings. Located near the central campus.",
        metadata={"name": "Alumni House", "lat": 37.8698, "lng": -122.2618, "url": "https://goo.gl/maps/AlumniHouse"}
    ),
    Document(
        page_content="Anthony Hall. A unique, historic wooden building that serves as the headquarters for the Graduate Assembly. Located near Strawberry Creek.",
        metadata={"name": "Anthony Hall", "lat": 37.8703, "lng": -122.2581, "url": "https://goo.gl/maps/AnthonyHall"}
    ),
    Document(
        page_content="Minor Hall. The home of the School of Optometry. Contains academic spaces, laboratories, and a public-facing optometry clinic.",
        metadata={"name": "Minor Hall", "lat": 37.8716, "lng": -122.2553, "url": "https://goo.gl/maps/MinorHall"}
    )
]

# Don't forget to append this to your main locations list before passing it to Pinecone!
locations.extend(campus_buildings)
# 4. Upsert the data into Pinecone
print("Uploading vectors to Pinecone...")
PineconeVectorStore.from_documents(
    locations, 
    embeddings, 
    index_name=index_name
)
print("Ingestion complete! Your AI now knows about these locations.")