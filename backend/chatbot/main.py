from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import math
import re
from typing import TypedDict, Optional, List, Dict, Any, Literal

import requests
from bs4 import BeautifulSoup
from neo4j import GraphDatabase

from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3003",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VECTOR_K = 15


# ----------------------------
# Models
# ----------------------------

class Recommendation(BaseModel):
    name: str
    lat: float
    lng: float
    pitch: str


class MapRequest(BaseModel):
    user_lat: float
    user_lng: float
    query: str


class RouteDecision(BaseModel):
    source: Literal["vector", "graph", "anchor_vector"]
    building_name: Optional[str] = None

class GraphState(TypedDict, total=False):
    user_query: str
    user_lat: float
    user_lng: float
    route: str
    building_name: Optional[str]
    candidates: List[Dict[str, Any]]
    open_libraries: Dict[str, Dict[str, str]]
    selected: Optional[Dict[str, Any]]
    final_json: Optional[Dict[str, Any]]
    debug_steps: List[str]


# ----------------------------
# LLM / Stores
# ----------------------------

llm = ChatGroq(
    temperature=0,
    model_name="llama-3.1-8b-instant",
)

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vector_store = PineconeVectorStore(
    index_name="berkeley-campus-locations",
    embedding=embeddings,
)

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

driver = None
if NEO4J_URI and NEO4J_USERNAME and NEO4J_PASSWORD:
    driver = GraphDatabase.driver(
        NEO4J_URI,
        auth=(NEO4J_USERNAME, NEO4J_PASSWORD),
    )


# ----------------------------
# Prompts
# ----------------------------

ROUTER_PROMPT = """You are a router for a UC Berkeley campus recommender.

Choose one source:

- Use "graph" ONLY for pure spatial questions about what is near/inside/connected to a named building.
- Use "anchor_vector" when the user names a building but also wants a category or activity, such as food, coffee, study, wifi, or a place to talk.
- Use "vector" otherwise.

Return JSON only:

{"source":"vector","building_name":null}
or
{"source":"graph","building_name":"Dwinelle Hall"}
or
{"source":"anchor_vector","building_name":"Dwinelle Hall"}
Do not include markdown or explanation.

"""

# ----------------------------
# Helpers
# ----------------------------
def query_intent(query: str) -> str:
    q = query.lower()

    if any(x in q for x in ["eat", "food", "restaurant", "cafe", "coffee", "drink", "lunch", "dinner", "breakfast"]):
        return "food"
    if any(x in q for x in ["study", "wifi", "quiet", "focus", "talk", "group study"]):
        return "study"
    return "general"


def has_spatial_anchor(query: str) -> bool:
    q = query.lower()
    return any(x in q for x in ["near ", "close to", "around ", "inside ", "in ", "by "])

def parse_json_object(text: str) -> Dict[str, Any]:
    text = text.strip()
    import json
    try:
        return json.loads(text)
    except Exception:
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if not match:
            raise ValueError(f"Could not parse JSON object from: {text}")
        return json.loads(match.group(0))


def normalize_name(name: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", name.lower())).strip()


def explicit_library_query(query: str) -> bool:
    q = query.lower()
    return "library" in q or "libraries" in q


def looks_like_library(name: str, text: str = "") -> bool:
    s = f"{name} {text}".lower()
    return "library" in s or "libraries" in s or "stacks" in s or "reading room" in s


def clean_description(name: str, description: str) -> str:
    description = re.sub(r"\s+", " ", description).strip()
    description = re.sub(rf"^{re.escape(name)}\.\s*", "", description, flags=re.IGNORECASE)
    return description.strip()


def haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def sort_candidates_by_distance(candidates: List[Dict[str, Any]], user_lat: float, user_lng: float):
    return sorted(
        candidates,
        key=lambda c: haversine_meters(user_lat, user_lng, c["lat"], c["lng"]),
    )


def failure_payload(query: str) -> Dict[str, Any]:
    prefs = extract_preferences(query)

    if prefs["wants_library"]:
        pitch = "I couldn’t verify an open library that fits what you asked for right now."
    elif prefs["time_sensitive"]:
        pitch = "I couldn’t verify a place that is open right now and fits what you asked for."
    else:
        pitch = "I couldn’t find a place that clearly matches what you asked for."

    return {
        "name": "",
        "lat": -1,
        "lng": -1,
        "pitch": pitch,
    }


def candidate_matches_open_library(candidate_name: str, open_libs: Dict[str, Dict[str, str]]) -> Optional[Dict[str, str]]:
    target = normalize_name(candidate_name)

    if target in open_libs:
        return open_libs[target]

    for key, value in open_libs.items():
        if target in key or key in target:
            return value

    return None


def build_pitch(candidate: Dict[str, Any]) -> str:
    description = clean_description(candidate["name"], candidate["description"])
    if not description:
        description = "It looks like a good fit for your request"

    description = description.rstrip(".")
    return f"{description}."

def get_place_coordinates(building_name: str) -> Optional[Dict[str, float]]:
    if driver is None:
        return None

    cypher_query = """
    MATCH (p:Place)
    WHERE toLower(p.name) CONTAINS toLower($b_name)
    RETURN p.name AS name, p.lat AS lat, p.lng AS lng
    LIMIT 1
    """

    with driver.session() as session:
        record = session.run(cypher_query, b_name=building_name).single()
        if not record or record["lat"] is None or record["lng"] is None:
            return None

        return {
            "name": record["name"],
            "lat": float(record["lat"]),
            "lng": float(record["lng"]),
        }
# ----------------------------
# Retrieval
# ----------------------------

def decide_route(query: str) -> RouteDecision:
    try:
        response = llm.invoke(
            [
                SystemMessage(content=ROUTER_PROMPT),
                HumanMessage(content=query),
            ]
        )
        text = response.content if isinstance(response.content, str) else str(response.content)
        data = parse_json_object(text)
        decision = RouteDecision.model_validate(data)

        if decision.source == "graph" and not decision.building_name:
            return RouteDecision(source="vector", building_name=None)

        return decision
    except Exception:
        return RouteDecision(source="vector", building_name=None)


def search_vibes(query: str, k: int = VECTOR_K) -> List[Dict[str, Any]]:
    retriever = vector_store.as_retriever(search_kwargs={"k": k})
    docs = retriever.invoke(query)

    seen = set()
    candidates: List[Dict[str, Any]] = []

    for d in docs:
        name = d.metadata.get("name")
        lat = d.metadata.get("lat")
        lng = d.metadata.get("lng")

        if not name or lat is None or lng is None:
            continue

        norm = normalize_name(name)
        if norm in seen:
            continue
        seen.add(norm)

        description = clean_description(name, str(d.page_content or ""))

        candidates.append(
            {
                "name": name,
                "lat": float(lat),
                "lng": float(lng),
                "description": description,
                "source": "vector",
                "is_library": looks_like_library(name, description),
            }
        )

    return candidates


def expanded_vector_candidates(query: str) -> List[Dict[str, Any]]:
    queries = [query]
    q = query.lower()

    if any(x in q for x in ["study", "wifi", "quiet", "talk"]):
        queries.extend([
            "late night study spot",
            "quiet study space",
            "group study with good wifi",
            "student lounge study",
            "campus cafe study",
        ])

    if any(x in q for x in ["eat", "food", "restaurant", "cafe", "coffee", "drink"]):
        queries.extend([
            "campus cafe food coffee",
            "place to eat on campus",
            "student cafe",
            "coffee near classes",
            "quick food campus",
        ])

    seen = set()
    merged: List[Dict[str, Any]] = []

    for qtext in queries:
        for candidate in search_vibes(qtext, k=8):
            norm = normalize_name(candidate["name"])
            if norm in seen:
                continue
            seen.add(norm)
            merged.append(candidate)

    return merged


def search_spatial_connections(building_name: str, limit: int = 8) -> List[Dict[str, Any]]:
    if driver is None:
        return []

    cypher_query = """
    MATCH (target:Place)
    WHERE toLower(target.name) CONTAINS toLower($b_name)
    MATCH (p:Place)-[r:NEAR|INSIDE|CONNECTED_TO]-(target)
    RETURN p.name AS name,
           type(r) AS relationship,
           target.name AS target_name,
           p.lat AS lat,
           p.lng AS lng
    LIMIT $limit
    """

    candidates: List[Dict[str, Any]] = []

    with driver.session() as session:
        result = session.run(cypher_query, b_name=building_name, limit=limit)

        seen = set()
        for record in result:
            name = record["name"]
            lat = record["lat"]
            lng = record["lng"]
            relationship = record["relationship"]
            target_name = record["target_name"]

            if not name or lat is None or lng is None:
                continue

            norm = normalize_name(name)
            if norm in seen:
                continue
            seen.add(norm)

            description = f"{relationship.replace('_', ' ').lower()} {target_name}"

            candidates.append(
                {
                    "name": name,
                    "lat": float(lat),
                    "lng": float(lng),
                    "description": description,
                    "source": "graph",
                    "is_library": looks_like_library(name, description),
                }
            )

    return candidates


# ----------------------------
# Hours page only
# ----------------------------

def fetch_open_library_names() -> Dict[str, Dict[str, str]]:
    url = "https://www.lib.berkeley.edu/hours"
    response = requests.get(url, timeout=10)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    open_libs: Dict[str, Dict[str, str]] = {}

    for element in soup.select(".library-hours-listing"):
        info = element.select_one(".library-hours-listing-info")
        if not info:
            continue

        name_el = info.select_one(".library-name")
        current_name = name_el.get_text(separator=" ").strip() if name_el else ""
        if not current_name:
            continue

        status_el = info.select_one(".library-open-status")
        raw_status = status_el.text.strip() if status_el else "Unknown"

        if "Open" in raw_status or "Closing Soon" in raw_status:
            open_libs[normalize_name(current_name)] = {
                "name": current_name,
                "raw_status": raw_status,
            }

    return open_libs


# ----------------------------
# LangGraph nodes
# ----------------------------

def route_node(state: GraphState) -> Dict[str, Any]:
    decision = decide_route(state["user_query"])
    debug_steps = list(state.get("debug_steps", []))
    debug_steps.append(
        f"Route -> {decision.source}" + (f" ({decision.building_name})" if decision.building_name else "")
    )

    return {
        **state,
        "route": decision.source,
        "building_name": decision.building_name,
        "debug_steps": debug_steps,
    }


def retrieve_node(state: GraphState) -> Dict[str, Any]:
    debug_steps = list(state.get("debug_steps", []))
    route = state["route"]

    if route == "graph" and state.get("building_name"):
        candidates = search_spatial_connections(state["building_name"])
        debug_steps.append(
            f"Graph retrieval for '{state['building_name']}' -> {len(candidates)} candidate(s)"
        )
        if not candidates:
            debug_steps.append("Graph returned no candidates, falling back to vector search")
            route = "vector"
            candidates = expanded_vector_candidates(state["user_query"])
    elif route == "anchor_vector" and state.get("building_name"):
        candidates = expanded_vector_candidates(state["user_query"])
        anchor = get_place_coordinates(state["building_name"])

        if anchor:
            candidates = sort_candidates_by_distance(
                candidates,
                anchor["lat"],
                anchor["lng"],
            )
            debug_steps.append(
                f"Anchor-vector retrieval for '{state['building_name']}' -> {len(candidates)} candidate(s)"
            )
        else:
            candidates = sort_candidates_by_distance(
                candidates,
                state["user_lat"],
                state["user_lng"],
            )
            debug_steps.append(
                f"Anchor-vector fallback to user location because anchor '{state['building_name']}' was not found"
            )
    else:
        candidates = expanded_vector_candidates(state["user_query"])

    candidates = sort_candidates_by_distance(
        candidates,
        state["user_lat"],
        state["user_lng"],
    )

    preview = ", ".join(c["name"] for c in candidates[:8]) if candidates else "none"
    debug_steps.append(f"Candidates -> {preview}")

    return {
        **state,
        "route": route,
        "candidates": candidates,
        "debug_steps": debug_steps,
    }


def fetch_open_libraries_node(state: GraphState) -> Dict[str, Any]:
    debug_steps = list(state.get("debug_steps", []))
    try:
        open_libs = fetch_open_library_names()
        debug_steps.append(f"Fetched open library list -> {len(open_libs)} open")
    except Exception as e:
        open_libs = {}
        debug_steps.append(f"Hours fetch failed -> {str(e)}")

    return {
        **state,
        "open_libraries": open_libs,
        "debug_steps": debug_steps,
    }


def select_node(state: GraphState) -> Dict[str, Any]:
    debug_steps = list(state.get("debug_steps", []))
    candidates = list(state.get("candidates", []))
    open_libs = dict(state.get("open_libraries", {}))
    library_required = explicit_library_query(state["user_query"])

    selected = None
    deferred_non_libraries: List[Dict[str, Any]] = []

    for candidate in candidates:
        if candidate["is_library"]:
            match = candidate_matches_open_library(candidate["name"], open_libs)
            debug_steps.append(
                f"library filter {candidate['name']} -> {'OPEN' if match else 'NOT_OPEN'}"
            )
            if match:
                selected = {
                    **candidate,
                    "hours_status": match["raw_status"],
                }
                break
        else:
            if library_required:
                debug_steps.append(
                    f"Skipped non-library candidate because the query explicitly asked for a library -> {candidate['name']}"
                )
                continue
            deferred_non_libraries.append(candidate)

    if not selected and not library_required and deferred_non_libraries:
        fallback = deferred_non_libraries[0]
        debug_steps.append(f"Falling back to non-library candidate -> {fallback['name']}")
        selected = fallback

    return {
        **state,
        "selected": selected,
        "debug_steps": debug_steps,
    }


def finalize_node(state: GraphState) -> Dict[str, Any]:
    selected = state.get("selected")

    if not selected:
        return {
            **state,
            "final_json": failure_payload(state["user_query"]),
        }

    recommendation = Recommendation(
        name=selected["name"],
        lat=float(selected["lat"]),
        lng=float(selected["lng"]),
        pitch=custom_pitch(state["user_query"], selected),
    )

    return {
        **state,
        "final_json": recommendation.model_dump(),
    }

def extract_preferences(query: str) -> Dict[str, bool]:
    q = query.lower()
    return {
        "wants_library": "library" in q or "libraries" in q,
        "time_sensitive": any(x in q for x in [
            "right now", "at this hour", "currently open", "open now",
            "late", "late night", "4am", "3am", "2am", "1am", "midnight", "tonight"
        ]),
        "quiet": any(x in q for x in [
            "quiet", "silence", "silent", "focus", "deep work", "concentrate"
        ]),
        "social": any(x in q for x in [
            "talk", "talking", "group", "friends", "collab", "collaborate"
        ]),
        "wifi": "wifi" in q or "wi-fi" in q,
        "coffee": any(x in q for x in [
            "coffee", "cafe", "food", "snack", "drink"
        ]),
        "nearby": any(x in q for x in [
            "near", "close", "nearby", "walk", "walking distance"
        ]),
        "indoor": "indoor" in q or "inside" in q,
    }
def extract_reason_tags(candidate: Dict[str, Any]) -> Dict[str, bool]:
    text = f"{candidate.get('name', '')} {candidate.get('description', '')}".lower()
    return {
        "quiet": any(x in text for x in [
            "quiet", "calm", "focused", "scholarly", "deep work", "reading room"
        ]),
        "social": any(x in text for x in [
            "talk", "group", "collabor", "social", "student hub", "lively"
        ]),
        "wifi": "wifi" in text or "wi-fi" in text or "laptop" in text,
        "coffee": any(x in text for x in [
            "coffee", "cafe", "peet", "food", "snack"
        ]),
        "indoor": any(x in text for x in [
            "indoor", "inside", "seating", "lounge", "building"
        ]),
        "late_friendly": any(x in text for x in [
            "late night", "long hours", "very long hours"
        ]),
        }

def custom_pitch(query: str, candidate: Dict[str, Any]) -> str:
    prefs = extract_preferences(query)
    reasons = extract_reason_tags(candidate)

    opening = f"Go to {candidate['name']}"

    reason_parts: List[str] = []

    if candidate.get("hours_status"):
        reason_parts.append(f"it is {candidate['hours_status'].lower()}")

    if prefs["quiet"] and reasons["quiet"]:
        reason_parts.append("it fits a quieter, focused study session")
    elif prefs["social"] and reasons["social"]:
        reason_parts.append("it is better for talking and working with other people")
    elif prefs["social"] and candidate.get("source") != "library":
        reason_parts.append("it should be easier to talk there than in a quiet library")
    elif prefs["quiet"] and candidate.get("is_library"):
        reason_parts.append("it is a stronger fit for focused studying")

    if prefs["wifi"] and reasons["wifi"]:
        reason_parts.append("it sounds laptop-friendly with good wifi")
    elif prefs["wifi"]:
        reason_parts.append("it is a reasonable place to work on a laptop")

    if prefs["coffee"] and reasons["coffee"]:
        reason_parts.append("you can also grab coffee there")

    if prefs["time_sensitive"] and candidate.get("is_library") and candidate.get("hours_status"):
        reason_parts.append("so it clears your open-right-now requirement")

    if not reason_parts:
        base_desc = clean_description(candidate["name"], candidate.get("description", ""))
        if base_desc:
            reason_parts.append(base_desc.split(".")[0].rstrip("."))
        else:
            reason_parts.append("it looks like the best available fit for what you asked for")

    if len(reason_parts) == 1:
        return f"{opening}. {reason_parts[0]}."
    if len(reason_parts) == 2:
        return f"{opening}. {reason_parts[0]}, and {reason_parts[1]}."
    return f"{opening}. {reason_parts[0]}, {reason_parts[1]}, and {reason_parts[2]}."
# ----------------------------
# Build graph
# ----------------------------

builder = StateGraph(GraphState)

builder.add_node("route", route_node)
builder.add_node("retrieve", retrieve_node)
builder.add_node("open_libraries", fetch_open_libraries_node)
builder.add_node("select", select_node)
builder.add_node("finalize", finalize_node)

builder.set_entry_point("route")
builder.add_edge("route", "retrieve")
builder.add_edge("retrieve", "open_libraries")
builder.add_edge("open_libraries", "select")
builder.add_edge("select", "finalize")
builder.add_edge("finalize", END)

graph = builder.compile()


# ----------------------------
# Endpoint
# ----------------------------

@app.post("/api/recommend")
async def get_location_recommendation(req: MapRequest):
    try:
        result = graph.invoke(
            {
                "user_query": req.query,
                "user_lat": req.user_lat,
                "user_lng": req.user_lng,
                "route": "vector",
                "building_name": None,
                "candidates": [],
                "open_libraries": {},
                "selected": None,
                "final_json": None,
                "debug_steps": [f"Human: {req.query}"],
            }
        )

        final_json = result.get("final_json")
        if not final_json:
            raise ValueError("Graph completed without final_json")

        return {
            "final_json": final_json,
            "debug_steps": result.get("debug_steps", []),
        }

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail={"error": str(e)},
        )