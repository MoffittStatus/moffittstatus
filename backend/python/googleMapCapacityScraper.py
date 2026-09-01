import livepopulartimes
import urllib.parse
import sys
import datetime
import requests
import json
import pytz

def unshorten_url(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        if "goo.gl" in url or "googleusercontent" in url:
            response = requests.get(url, allow_redirects=True, headers=headers, timeout=15)
            return response.url
        return url
    except Exception:
        return url

def unique_keep_order(items):
    out = []
    seen = set()
    for item in items:
        key = item.strip().lower()
        if key and key not in seen:
            seen.add(key)
            out.append(item.strip())
    return out

def extract_search_terms(expanded_url):
    terms = []

    parsed = urllib.parse.urlparse(expanded_url)
    qs = urllib.parse.parse_qs(parsed.query)

    # 1) Use q= from the expanded URL first, since you noticed reloading the full URL works better
    q = qs.get("q", [None])[0]
    if q:
        q = urllib.parse.unquote(q).strip()
        if q:
            terms.extend([
                q,
                q.replace("University California", "UC"),
                q.replace("University of California", "UC"),
            ])

    # 2) Then use /place/... name
    if "/place/" in expanded_url:
        try:
            raw_name = expanded_url.split("/place/")[1].split("/")[0]
            clean_name = urllib.parse.unquote(raw_name).replace("+", " ").strip()
            if clean_name:
                terms.extend([
                    clean_name,
                    f"{clean_name} Berkeley",
                    f"{clean_name} Berkeley CA",
                    f"{clean_name} UC Berkeley",
                ])
        except Exception:
            pass

    return unique_keep_order(terms)

def try_lookup(search_term):
    data = livepopulartimes.get_populartimes_by_address(search_term)
    if not isinstance(data, dict):
        return None

    percentage = data.get("current_popularity")
    schedule = data.get("populartimes") or data.get("popular_times") or []

    return {
        "search_term": search_term,
        "data": data,
        "percentage": percentage,
        "schedule": schedule,
    }

def build_result(clean_name, original_url, expanded_url, search_term, data, percentage, schedule):
    max_capacity = 200

    if percentage is not None:
        count = int((percentage / 100) * max_capacity)
        return {
            "success": True,
            "library_name": clean_name,
            "status": "Live",
            "percentage": percentage,
            "estimated_students": count,
            "is_open": True,
            "schedule": schedule,
            "debug_original_url": original_url,
            "debug_expanded_url": expanded_url,
            "debug_search_term": search_term,
            "debug_data": data
        }

    if schedule:
        berkeley_tz = pytz.timezone("America/Los_Angeles")
        now = datetime.datetime.now(berkeley_tz)
        day_idx = now.weekday()
        hour_idx = now.hour

        try:
            historical_pct = schedule[day_idx]["data"][hour_idx]
            count = int((historical_pct / 100) * max_capacity)
            status_msg = "Historical Estimate" if historical_pct > 0 else "Likely Closed"

            return {
                "success": True,
                "library_name": clean_name,
                "status": status_msg,
                "percentage": historical_pct,
                "estimated_students": count,
                "is_open": historical_pct > 0,
                "schedule": schedule,
                "debug_original_url": original_url,
                "debug_expanded_url": expanded_url,
                "debug_search_term": search_term,
                "debug_data": data
            }
        except Exception as e:
            return {
                "success": False,
                "library_name": clean_name,
                "error": "Error parsing history: {}".format(str(e)),
                "percentage": 0,
                "estimated_students": 0,
                "is_open": False,
                "schedule": schedule,
                "debug_original_url": original_url,
                "debug_expanded_url": expanded_url,
                "debug_search_term": search_term,
                "debug_data": data
            }

    return {
        "success": False,
        "library_name": clean_name,
        "error": "No popularity data found",
        "status": "No Data Found",
        "percentage": 0,
        "estimated_students": 0,
        "is_open": False,
        "schedule": [],
        "debug_original_url": original_url,
        "debug_expanded_url": expanded_url,
        "debug_search_term": search_term,
        "debug_data": data
    }

def get_capacity(url: str):
    if not url:
        print(json.dumps({"success": False, "error": "Missing URL"}))
        return

    try:
        original_url = url
        expanded_url = unshorten_url(url)

        if "/place/" not in expanded_url:
            print(json.dumps({
                "success": False,
                "error": "Invalid URL format: Missing /place/",
                "debug_original_url": original_url,
                "debug_expanded_url": expanded_url
            }))
            return

        raw_name = expanded_url.split("/place/")[1].split("/")[0]
        clean_name = urllib.parse.unquote(raw_name).replace("+", " ").strip()

        search_terms = extract_search_terms(expanded_url)

        last_result = None
        for term in search_terms:
            lookup = try_lookup(term)
            if not lookup:
                continue

            result = build_result(
                clean_name=clean_name,
                original_url=original_url,
                expanded_url=expanded_url,
                search_term=lookup["search_term"],
                data=lookup["data"],
                percentage=lookup["percentage"],
                schedule=lookup["schedule"]
            )

            if result["success"]:
                print(json.dumps(result, default=str))
                return

            last_result = result

        if last_result:
            last_result["debug_search_terms_tried"] = search_terms
            print(json.dumps(last_result, default=str))
            return

        print(json.dumps({
            "success": False,
            "library_name": clean_name,
            "error": "Lookup returned no usable data",
            "debug_original_url": original_url,
            "debug_expanded_url": expanded_url,
            "debug_search_terms_tried": search_terms
        }, default=str))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == '__main__':
    if len(sys.argv) > 1:
        get_capacity(sys.argv[1])
    else:
        print(json.dumps({"success": False, "error": "No URL provided"}))
