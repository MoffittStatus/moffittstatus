import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

# Connect to Neo4j
URI = os.getenv("NEO4J_URI")
AUTH = (os.getenv("NEO4J_USERNAME"), os.getenv("NEO4J_PASSWORD"))

def seed_graph():
    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        with driver.session() as session:
            # Create a Knowledge Graph of Berkeley spots
            session.run("""
                // --- LIBRARIES ---
                CREATE (l_arthistory:Place {name: "Art History/Classics Library", type: "Library", lat: 37.8722068, lng: -122.2592367, url: "https://goo.gl/maps/vDxBqXGTHhZpqtdD6"})
                CREATE (l_bancroft:Place {name: "Bancroft Library", type: "Library", lat: 37.8723046, lng: -122.2586503, url: "https://goo.gl/maps/yiQ7h6GJZnDajYQN7"})
                CREATE (l_bampfa:Place {name: "Berkeley Art Museum and Pacific Film Archive", type: "Library", lat: 37.8707356, lng: -122.269059, url: "https://goo.gl/maps/rpfEW1xFhHFUZ8yi7"})
                CREATE (l_law:Place {name: "Berkeley Law Library", type: "Library", lat: 37.8694764, lng: -122.2540154, url: "https://goo.gl/maps/2sRhhU4sSShjnGE59"})
                CREATE (l_bioscience:Place {name: "Bioscience, Natural Resources & Public Health Library", type: "Library", lat: 37.8714896, lng: -122.2647157, url: "https://goo.gl/maps/1hZwe4HmyzaRJek89"})
                CREATE (l_business:Place {name: "Business Library", type: "Library", lat: 37.871465, lng: -122.2560199, url: "https://goo.gl/maps/CmyE9rVC4PmbR6cZ8"})
                CREATE (l_chemistry:Place {name: "Chemistry, Astronomy & Physics Library", type: "Library", lat: 37.8725916, lng: -122.2553429, url: "https://goo.gl/maps/tKddPxVQ7AFmH54X7"})
                CREATE (l_doe:Place {name: "Doe Library", type: "Library", lat: 37.8722068, lng: -122.2618116, url: "https://goo.gl/maps/LkV9pj5T2tFFtjW17"})
                CREATE (l_earth:Place {name: "Earth Sciences & Map Library", type: "Library", lat: 37.8739719, lng: -122.2621846, url: "https://goo.gl/maps/ieK45WFMK1zD7nxy5"})
                CREATE (l_eastasian:Place {name: "East Asian Library", type: "Library", lat: 37.8735757, lng: -122.2625545, url: "https://goo.gl/maps/6qCSpHzXwKaRaaC76"})
                CREATE (l_engineering:Place {name: "Engineering & Mathematical Sciences Library", type: "Library", lat: 37.8738432, lng: -122.2608912, url: "https://goo.gl/maps/aUbDhnvnshyu7zmk8"})
                CREATE (l_env_archives:Place {name: "Environmental Design Archives", type: "Library", lat: 37.8707352, lng: -122.2548935, url: "https://goo.gl/maps/QpLUwCUo5Fp3Qwrz9"})
                CREATE (l_env_design:Place {name: "Environmental Design Library", type: "Library", lat: 37.8707352, lng: -122.2574684, url: "https://goo.gl/maps/8o7M79Akg8xsTkFaA"})
                CREATE (l_ethnic:Place {name: "Ethnic Studies Library", type: "Library", lat: 37.8713614, lng: -122.2601673, url: "https://goo.gl/maps/axdC2JFsv6YEstubA"})
                CREATE (l_grad_study:Place {name: "Graduate Services (study only)", type: "Library", lat: 37.8722202, lng: -122.2618144, url: "https://goo.gl/maps/LkV9pj5T2tFFtjW17"})
                CREATE (l_gtu:Place {name: "Graduate Theological Union Library", type: "Library", lat: 37.8756942, lng: -122.2644618, url: "https://goo.gl/maps/5kZyK4UaTwu6s1KJ9"})
                CREATE (l_igs:Place {name: "Institute of Governmental Studies Library", type: "Library", lat: 37.8710156, lng: -122.2606622, url: "https://goo.gl/maps/G7SuBAPAELeZpGaG9"})
                CREATE (l_its:Place {name: "Institute of Transportation Studies Library", type: "Library", lat: 37.8738837, lng: -122.2614437, url: "https://goo.gl/maps/SzJHPT7ir1csgz2t7"})
                CREATE (l_ill:Place {name: "Interlibrary Loan", type: "Library", lat: 37.8722068, lng: -122.2618116, url: "https://goo.gl/maps/LkV9pj5T2tFFtjW17"})
                CREATE (l_lbnl:Place {name: "Lawrence Berkeley National Laboratory Library", type: "Library", lat: 37.8946547, lng: -122.3303015, url: "https://goo.gl/maps/PLEk7v1WoVJTWC2SA"})
                CREATE (l_stacks:Place {name: "Main (Gardner) Stacks", type: "Library", lat: 37.8721832, lng: -122.2621678, url: "https://goo.gl/maps/MCJBfgS1YaBiSmxi8"})
                CREATE (l_morrison:Place {name: "Morrison Library", type: "Library", lat: 37.8722068, lng: -122.2620137, url: "https://goo.gl/maps/YZUyAVzkmD7BR5zt8"})
                CREATE (l_music:Place {name: "Music Library", type: "Library", lat: 37.8704442, lng: -122.2587614, url: "https://goo.gl/maps/RSwQRTp1FaLcDeEG8"})
                CREATE (l_social:Place {name: "Social Research Library", type: "Library", lat: 37.8737118, lng: -122.2636233, url: "https://goo.gl/maps/thNXddkyNeTjQF5a9"})
                CREATE (l_south_asia:Place {name: "South/Southeast Asia Library (study only)", type: "Library", lat: 37.8722202, lng: -122.2618144, url: "https://goo.gl/maps/LkV9pj5T2tFFtjW17"})

                // --- CAFES ---
                CREATE (c_fsm:Place {name: "Free Speech Movement Cafe (FSM)", type: "Cafe", lat: 37.872428, lng: -122.260588, url: "https://www.google.com/maps/search/?api=1&query=37.872428,-122.260588"})
                CREATE (c_think:Place {name: "Cafe Think", type: "Cafe", lat: 37.871500, lng: -122.253600, url: "https://www.google.com/maps/search/?api=1&query=37.871500,-122.253600"})
                CREATE (c_browns:Place {name: "Brown's California Cafe", type: "Cafe", lat: 37.873700, lng: -122.263500, url: "https://www.google.com/maps/search/?api=1&query=37.873700,-122.263500"})
                CREATE (c_yalis:Place {name: "Yali's Cafe - Stanley Hall", type: "Cafe", lat: 37.873400, lng: -122.255600, url: "https://www.google.com/maps/search/?api=1&query=37.873400,-122.255600"})
                CREATE (c_coffee_lab:Place {name: "The Coffee Lab", type: "Cafe", lat: 37.872800, lng: -122.256200, url: "https://www.google.com/maps/search/?api=1&query=37.872800,-122.256200"})
                CREATE (c_qualcomm:Place {name: "Qualcomm Cyber Cafe", type: "Cafe", lat: 37.874800, lng: -122.258600, url: "https://www.google.com/maps/search/?api=1&query=37.874800,-122.258600"})
                CREATE (c_terrace:Place {name: "Terrace Cafe", type: "Cafe", lat: 37.874200, lng: -122.258800, url: "https://www.google.com/maps/search/?api=1&query=37.874200,-122.258800"})
                CREATE (c_ramonas:Place {name: "Ramona's Cafe", type: "Cafe", lat: 37.870600, lng: -122.254700, url: "https://www.google.com/maps/search/?api=1&query=37.870600,-122.254700"})
                CREATE (c_gbc:Place {name: "Golden Bear Cafe (GBC)", type: "Cafe", lat: 37.869400, lng: -122.259500, url: "https://www.google.com/maps/search/?api=1&query=37.869400,-122.259500"})

                // --- GRAPH RELATIONSHIPS ---
                // Mapping libraries that live inside Doe Library based on your descriptions
                CREATE (l_arthistory)-[:INSIDE]->(l_doe)
                CREATE (l_grad_study)-[:INSIDE]->(l_doe)
                CREATE (l_morrison)-[:INSIDE]->(l_doe)
                CREATE (l_ill)-[:INSIDE]->(l_doe)
                CREATE (l_stacks)-[:CONNECTED_TO]->(l_doe)

                // Mapping cafes near specific study areas
                CREATE (c_think)-[:NEAR]->(l_business)
                CREATE (c_ramonas)-[:NEAR]->(l_env_design)
                CREATE (c_terrace)-[:NEAR]->(l_engineering)
                CREATE (c_coffee_lab)-[:NEAR]->(l_chemistry)
                CREATE (c_browns)-[:NEAR]->(l_bioscience)
                
                // Yali's acts as a hub for multiple STEM buildings
                CREATE (c_yalis)-[:NEAR]->(l_chemistry)
                CREATE (c_yalis)-[:NEAR]->(l_engineering)
                CREATE (c_yalis)-[:NEAR]->(l_bioscience)
                
                // Qualcomm inside the CITRIS building (EECS hub)
                CREATE (c_qualcomm)-[:NEAR]->(l_engineering)
                
                // Golden Bear Cafe on Sproul Plaza (Near Doe and Bancroft)
                CREATE (c_gbc)-[:NEAR]->(l_bancroft)
                CREATE (c_gbc)-[:NEAR]->(l_doe)

                // MERGE ACADEMIC & LECTURE HALLS
                MERGE (h_dwinelle:Place {name: "Dwinelle Hall", type: "Hall"}) ON CREATE SET h_dwinelle.lat = 37.8705, h_dwinelle.lng = -122.2605, h_dwinelle.url = "https://www.google.com/maps/search/?api=1&query=37.8705,-122.2605"
                MERGE (h_wheeler:Place {name: "Wheeler Hall", type: "Hall"}) ON CREATE SET h_wheeler.lat = 37.8703, h_wheeler.lng = -122.2590, h_wheeler.url = "https://www.google.com/maps/search/?api=1&query=37.8703,-122.2590"
                MERGE (h_vlsb:Place {name: "Valley Life Sciences Building (VLSB)", type: "Hall"}) ON CREATE SET h_vlsb.lat = 37.8716, h_vlsb.lng = -122.2633, h_vlsb.url = "https://www.google.com/maps/search/?api=1&query=37.8716,-122.2633"
                MERGE (h_wurster:Place {name: "Wurster Hall", type: "Hall"}) ON CREATE SET h_wurster.lat = 37.8706, h_wurster.lng = -122.2547, h_wurster.url = "https://www.google.com/maps/search/?api=1&query=37.8706,-122.2547"
                MERGE (h_haas:Place {name: "Haas School of Business", type: "Hall"}) ON CREATE SET h_haas.lat = 37.8715, h_haas.lng = -122.2536, h_haas.url = "https://www.google.com/maps/search/?api=1&query=37.8715,-122.2536"
                MERGE (h_chou:Place {name: "Chou Hall", type: "Hall"}) ON CREATE SET h_chou.lat = 37.8718, h_chou.lng = -122.2533, h_chou.url = "https://www.google.com/maps/search/?api=1&query=37.8718,-122.2533"

                // MERGE ENGINEERING & COMPUTER SCIENCE
                MERGE (h_soda:Place {name: "Soda Hall", type: "Hall"}) ON CREATE SET h_soda.lat = 37.8756, h_soda.lng = -122.2588, h_soda.url = "https://www.google.com/maps/search/?api=1&query=37.8756,-122.2588"
                MERGE (h_cory:Place {name: "Cory Hall", type: "Hall"}) ON CREATE SET h_cory.lat = 37.8750, h_cory.lng = -122.2575, h_cory.url = "https://www.google.com/maps/search/?api=1&query=37.8750,-122.2575"
                MERGE (h_sutardja:Place {name: "Sutardja Dai Hall", type: "Hall"}) ON CREATE SET h_sutardja.lat = 37.8748, h_sutardja.lng = -122.2586, h_sutardja.url = "https://www.google.com/maps/search/?api=1&query=37.8748,-122.2586"
                MERGE (h_etcheverry:Place {name: "Etcheverry Hall", type: "Hall"}) ON CREATE SET h_etcheverry.lat = 37.8756, h_etcheverry.lng = -122.2598, h_etcheverry.url = "https://www.google.com/maps/search/?api=1&query=37.8756,-122.2598"
                MERGE (h_mining:Place {name: "Hearst Memorial Mining Building", type: "Hall"}) ON CREATE SET h_mining.lat = 37.8739, h_mining.lng = -122.2568, h_mining.url = "https://www.google.com/maps/search/?api=1&query=37.8739,-122.2568"
                MERGE (h_mclaughlin:Place {name: "McLaughlin Hall", type: "Hall"}) ON CREATE SET h_mclaughlin.lat = 37.8737, h_mclaughlin.lng = -122.2593, h_mclaughlin.url = "https://www.google.com/maps/search/?api=1&query=37.8737,-122.2593"
                MERGE (h_hesse:Place {name: "Hesse Hall", type: "Hall"}) ON CREATE SET h_hesse.lat = 37.8741, h_hesse.lng = -122.2590, h_hesse.url = "https://www.google.com/maps/search/?api=1&query=37.8741,-122.2590"

                // MERGE PHYSICAL SCIENCES & MATH
                MERGE (h_evans:Place {name: "Evans Hall", type: "Hall"}) ON CREATE SET h_evans.lat = 37.8736, h_evans.lng = -122.2578, h_evans.url = "https://www.google.com/maps/search/?api=1&query=37.8736,-122.2578"
                MERGE (h_stanley:Place {name: "Stanley Hall", type: "Hall"}) ON CREATE SET h_stanley.lat = 37.8734, h_stanley.lng = -122.2556, h_stanley.url = "https://www.google.com/maps/search/?api=1&query=37.8734,-122.2556"
                MERGE (h_campbell:Place {name: "Campbell Hall", type: "Hall"}) ON CREATE SET h_campbell.lat = 37.8730, h_campbell.lng = -122.2578, h_campbell.url = "https://www.google.com/maps/search/?api=1&query=37.8730,-122.2578"
                MERGE (h_phys_north:Place {name: "Physics North", type: "Hall"}) ON CREATE SET h_phys_north.lat = 37.8727, h_phys_north.lng = -122.2566, h_phys_north.url = "https://www.google.com/maps/search/?api=1&query=37.8727,-122.2566"
                MERGE (h_phys_south:Place {name: "Physics South", type: "Hall"}) ON CREATE SET h_phys_south.lat = 37.8724, h_phys_south.lng = -122.2571, h_phys_south.url = "https://www.google.com/maps/search/?api=1&query=37.8724,-122.2571"
                MERGE (h_birge:Place {name: "Birge Hall", type: "Hall"}) ON CREATE SET h_birge.lat = 37.8725, h_birge.lng = -122.2561, h_birge.url = "https://www.google.com/maps/search/?api=1&query=37.8725,-122.2561"
                MERGE (h_latimer:Place {name: "Latimer Hall", type: "Hall"}) ON CREATE SET h_latimer.lat = 37.8730, h_latimer.lng = -122.2560, h_latimer.url = "https://www.google.com/maps/search/?api=1&query=37.8730,-122.2560"
                MERGE (h_hildebrand:Place {name: "Hildebrand Hall", type: "Hall"}) ON CREATE SET h_hildebrand.lat = 37.8726, h_hildebrand.lng = -122.2555, h_hildebrand.url = "https://www.google.com/maps/search/?api=1&query=37.8726,-122.2555"
                MERGE (h_pimentel:Place {name: "Pimentel Hall", type: "Hall"}) ON CREATE SET h_pimentel.lat = 37.8731, h_pimentel.lng = -122.2552, h_pimentel.url = "https://www.google.com/maps/search/?api=1&query=37.8731,-122.2552"
                MERGE (h_tan:Place {name: "Tan Hall", type: "Hall"}) ON CREATE SET h_tan.lat = 37.8734, h_tan.lng = -122.2551, h_tan.url = "https://www.google.com/maps/search/?api=1&query=37.8734,-122.2551"
                MERGE (h_lewis:Place {name: "Lewis Hall", type: "Hall"}) ON CREATE SET h_lewis.lat = 37.8727, h_lewis.lng = -122.2547, h_lewis.url = "https://www.google.com/maps/search/?api=1&query=37.8727,-122.2547"

                // MERGE SOCIAL SCIENCES, ARTS & HUMANITIES
                MERGE (h_social_sci:Place {name: "Social Sciences Building", type: "Hall"}) ON CREATE SET h_social_sci.lat = 37.8701, h_social_sci.lng = -122.2579, h_social_sci.url = "https://www.google.com/maps/search/?api=1&query=37.8701,-122.2579"
                MERGE (h_anthro_art:Place {name: "Anthropology and Art Practice Building", type: "Hall"}) ON CREATE SET h_anthro_art.lat = 37.8698, h_anthro_art.lng = -122.2554, h_anthro_art.url = "https://www.google.com/maps/search/?api=1&query=37.8698,-122.2554"
                MERGE (h_morrison:Place {name: "Morrison Hall", type: "Hall"}) ON CREATE SET h_morrison.lat = 37.8703, h_morrison.lng = -122.2576, h_morrison.url = "https://www.google.com/maps/search/?api=1&query=37.8703,-122.2576"
                MERGE (h_moses:Place {name: "Moses Hall", type: "Hall"}) ON CREATE SET h_moses.lat = 37.8708, h_moses.lng = -122.2589, h_moses.url = "https://www.google.com/maps/search/?api=1&query=37.8708,-122.2589"
                MERGE (h_stephens:Place {name: "Stephens Hall", type: "Hall"}) ON CREATE SET h_stephens.lat = 37.8713, h_stephens.lng = -122.2586, h_stephens.url = "https://www.google.com/maps/search/?api=1&query=37.8713,-122.2586"
                MERGE (h_south:Place {name: "South Hall", type: "Hall"}) ON CREATE SET h_south.lat = 37.8714, h_south.lng = -122.2596, h_south.url = "https://www.google.com/maps/search/?api=1&query=37.8714,-122.2596"
                MERGE (h_california:Place {name: "California Hall", type: "Hall"}) ON CREATE SET h_california.lat = 37.8719, h_california.lng = -122.2599, h_california.url = "https://www.google.com/maps/search/?api=1&query=37.8719,-122.2599"

                // MERGE AG & NATURAL RESOURCES
                MERGE (h_giannini:Place {name: "Giannini Hall", type: "Hall"}) ON CREATE SET h_giannini.lat = 37.8727, h_giannini.lng = -122.2644, h_giannini.url = "https://www.google.com/maps/search/?api=1&query=37.8727,-122.2644"
                MERGE (h_hilgard:Place {name: "Hilgard Hall", type: "Hall"}) ON CREATE SET h_hilgard.lat = 37.8732, h_hilgard.lng = -122.2647, h_hilgard.url = "https://www.google.com/maps/search/?api=1&query=37.8732,-122.2647"
                MERGE (h_wellman:Place {name: "Wellman Hall", type: "Hall"}) ON CREATE SET h_wellman.lat = 37.8729, h_wellman.lng = -122.2636, h_wellman.url = "https://www.google.com/maps/search/?api=1&query=37.8729,-122.2636"
                MERGE (h_mulford:Place {name: "Mulford Hall", type: "Hall"}) ON CREATE SET h_mulford.lat = 37.8730, h_mulford.lng = -122.2655, h_mulford.url = "https://www.google.com/maps/search/?api=1&query=37.8730,-122.2655"
                MERGE (h_morgan:Place {name: "Morgan Hall", type: "Hall"}) ON CREATE SET h_morgan.lat = 37.8739, h_morgan.lng = -122.2650, h_morgan.url = "https://www.google.com/maps/search/?api=1&query=37.8739,-122.2650"
                MERGE (h_koshland:Place {name: "Koshland Hall", type: "Hall"}) ON CREATE SET h_koshland.lat = 37.8741, h_koshland.lng = -122.2662, h_koshland.url = "https://www.google.com/maps/search/?api=1&query=37.8741,-122.2662"
                MERGE (h_barker:Place {name: "Barker Hall", type: "Hall"}) ON CREATE SET h_barker.lat = 37.8743, h_barker.lng = -122.2658, h_barker.url = "https://www.google.com/maps/search/?api=1&query=37.8743,-122.2658"

                // MERGE THEATERS & PERFORMANCE CENTERS
                MERGE (t_zellerbach:Place {name: "Zellerbach Hall", type: "Theater"}) ON CREATE SET t_zellerbach.lat = 37.8691, t_zellerbach.lng = -122.2604, t_zellerbach.url = "https://www.google.com/maps/search/?api=1&query=37.8691,-122.2604"
                MERGE (t_greek:Place {name: "Hearst Greek Theatre", type: "Theater"}) ON CREATE SET t_greek.lat = 37.8735, t_greek.lng = -122.2546, t_greek.url = "https://www.google.com/maps/search/?api=1&query=37.8735,-122.2546"
                MERGE (t_hertz:Place {name: "Hertz Hall", type: "Theater"}) ON CREATE SET t_hertz.lat = 37.8708, t_hertz.lng = -122.2573, t_hertz.url = "https://www.google.com/maps/search/?api=1&query=37.8708,-122.2573"
                MERGE (t_playhouse:Place {name: "Zellerbach Playhouse", type: "Theater"}) ON CREATE SET t_playhouse.lat = 37.8693, t_playhouse.lng = -122.2611, t_playhouse.url = "https://www.google.com/maps/search/?api=1&query=37.8693,-122.2611"
                MERGE (t_durham:Place {name: "Durham Studio Theater", type: "Theater"}) ON CREATE SET t_durham.lat = 37.8705, t_durham.lng = -122.2605, t_durham.url = "https://www.google.com/maps/search/?api=1&query=37.8705,-122.2605"

                // MERGE STUDENT LIFE, ADMIN & ATHLETICS
                MERGE (a_mlk:Place {name: "MLK Student Union", type: "Student Center"}) ON CREATE SET a_mlk.lat = 37.8690, a_mlk.lng = -122.2597, a_mlk.url = "https://www.google.com/maps/search/?api=1&query=37.8690,-122.2597"
                MERGE (a_sproul:Place {name: "Sproul Hall", type: "Admin"}) ON CREATE SET a_sproul.lat = 37.8697, a_sproul.lng = -122.2588, a_sproul.url = "https://www.google.com/maps/search/?api=1&query=37.8697,-122.2588"
                MERGE (a_eshleman:Place {name: "Eshleman Hall", type: "Student Center"}) ON CREATE SET a_eshleman.lat = 37.8687, a_eshleman.lng = -122.2600, a_eshleman.url = "https://www.google.com/maps/search/?api=1&query=37.8687,-122.2600"
                MERGE (a_rsf:Place {name: "Recreational Sports Facility (RSF)", type: "Athletics"}) ON CREATE SET a_rsf.lat = 37.8683, a_rsf.lng = -122.2630, a_rsf.url = "https://www.google.com/maps/search/?api=1&query=37.8683,-122.2630"
                MERGE (a_haas_pav:Place {name: "Haas Pavilion", type: "Athletics"}) ON CREATE SET a_haas_pav.lat = 37.8695, a_haas_pav.lng = -122.2632, a_haas_pav.url = "https://www.google.com/maps/search/?api=1&query=37.8695,-122.2632"
                MERGE (a_stadium:Place {name: "California Memorial Stadium", type: "Athletics"}) ON CREATE SET a_stadium.lat = 37.8711, a_stadium.lng = -122.2508, a_stadium.url = "https://www.google.com/maps/search/?api=1&query=37.8711,-122.2508"
                MERGE (a_alumni:Place {name: "Alumni House", type: "Admin"}) ON CREATE SET a_alumni.lat = 37.8698, a_alumni.lng = -122.2618, a_alumni.url = "https://www.google.com/maps/search/?api=1&query=37.8698,-122.2618"
                MERGE (a_anthony:Place {name: "Anthony Hall", type: "Admin"}) ON CREATE SET a_anthony.lat = 37.8703, a_anthony.lng = -122.2581, a_anthony.url = "https://www.google.com/maps/search/?api=1&query=37.8703,-122.2581"
                MERGE (a_minor:Place {name: "Minor Hall", type: "Academic"}) ON CREATE SET a_minor.lat = 37.8716, a_minor.lng = -122.2553, a_minor.url = "https://www.google.com/maps/search/?api=1&query=37.8716,-122.2553"

                // MATCH EXISTING LIBRARIES & CAFES
                WITH * MATCH (l_music:Place {name: "Music Library"})
                MATCH (l_chemistry:Place {name: "Chemistry, Astronomy & Physics Library"})
                MATCH (c_terrace:Place {name: "Terrace Cafe"})

                // CREATE INTRA-GRAPH RELATIONSHIPS
                MERGE (h_barker)-[:CONNECTED_TO]->(h_koshland)
                MERGE (h_chou)-[:CONNECTED_TO]->(h_haas)
                MERGE (h_phys_north)-[:CONNECTED_TO]->(h_phys_south)
                MERGE (h_birge)-[:CONNECTED_TO]->(h_phys_north)
                MERGE (h_mclaughlin)-[:CONNECTED_TO]->(h_hesse)
                MERGE (h_latimer)-[:CONNECTED_TO]->(h_hildebrand)
                MERGE (a_mlk)-[:CONNECTED_TO]->(a_eshleman)

                MERGE (t_durham)-[:INSIDE]->(h_dwinelle)
                MERGE (t_playhouse)-[:CONNECTED_TO]->(t_zellerbach)

                MERGE (l_music)-[:INSIDE]->(h_morrison)
                MERGE (l_chemistry)-[:INSIDE]->(h_hildebrand)

                MERGE (h_soda)-[:NEAR]->(h_cory)
                MERGE (h_soda)-[:NEAR]->(h_etcheverry)
                MERGE (c_terrace)-[:INSIDE]->(h_mclaughlin) 

                MERGE (h_giannini)-[:NEAR]->(h_hilgard)
                MERGE (h_hilgard)-[:NEAR]->(h_wellman)
            """)
            print("Graph seeded!")

if __name__ == "__main__":
    seed_graph()