import livepopulartimes
import urllib.parse
import sys
import datetime
import requests
import json
import pytz

def unshorten_url(url):
    """
    Follows a short link (goo.gl) to find the real long URL.
    """
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        if "goo.gl" in url or "googleusercontent" in url:
            response = requests.get(url, allow_redirects=True, headers=headers, timeout=15)
            return response.url
        return url
    except Exception as e:
        return url

def get_capacity(url: str):
    if not url:
        print(json.dumps({"success": False, "error": "Missing URL"}))
        return

    try:
        original_url = url

        if "goo.gl" in url or "googleusercontent" in url:
            url = unshorten_url(url)

        if '/place/' in url:
            raw_name = url.split('/place/')[1].split('/')[0]
        else:
            print(json.dumps({
                "success": False,
                "error": "Invalid URL format: Missing /place/",
                "debug_original_url": original_url,
                "debug_expanded_url": url
            }))
            return

        clean_name = urllib.parse.unquote(raw_name).replace('+', ' ').strip()
        search_term = "{} Berkeley CA".format(clean_name)

        data = livepopulartimes.get_populartimes_by_address(search_term)
        if not isinstance(data, dict):
            print(json.dumps({
                "success": False,
                "error": "livepopulartimes returned non-dict",
                "library_name": clean_name,
                "debug_original_url": original_url,
                "debug_expanded_url": url,
                "debug_search_term": search_term,
                "debug_data": str(data)
            }))
            return

        percentage = data.get('current_popularity')
        schedule = data.get('populartimes', [])
        MAX_CAPACITY = 200

        if percentage is not None:
            count = int((percentage / 100) * MAX_CAPACITY)
            result = {
                "success": True,
                "library_name": clean_name,
                "status": "Live",
                "percentage": percentage,
                "estimated_students": count,
                "is_open": True,
                "schedule": schedule,
                "debug_original_url": original_url,
                "debug_expanded_url": url,
                "debug_search_term": search_term
            }

        elif schedule:
            berkeley_tz = pytz.timezone('America/Los_Angeles')
            now = datetime.datetime.now(berkeley_tz)
            day_idx = now.weekday()
            hour_idx = now.hour

            try:
                historical_pct = schedule[day_idx]['data'][hour_idx]
                count = int((historical_pct / 100) * MAX_CAPACITY)

                status_msg = "Historical Estimate"
                if historical_pct == 0:
                    status_msg = "Likely Closed"

                result = {
                    "success": True,
                    "library_name": clean_name,
                    "status": status_msg,
                    "percentage": historical_pct,
                    "estimated_students": count,
                    "is_open": historical_pct > 0,
                    "schedule": schedule,
                    "debug_original_url": original_url,
                    "debug_expanded_url": url,
                    "debug_search_term": search_term
                }
            except Exception as e:
                result = {
                    "success": False,
                    "library_name": clean_name,
                    "error": "Error parsing history: {}".format(str(e)),
                    "percentage": 0,
                    "estimated_students": 0,
                    "is_open": False,
                    "schedule": schedule,
                    "debug_original_url": original_url,
                    "debug_expanded_url": url,
                    "debug_search_term": search_term,
                    "debug_data": data
                }
        else:
            result = {
                "success": False,
                "library_name": clean_name,
                "error": "No popularity data found",
                "status": "No Data Found",
                "percentage": 0,
                "estimated_students": 0,
                "is_open": False,
                "schedule": [],
                "debug_original_url": original_url,
                "debug_expanded_url": url,
                "debug_search_term": search_term,
                "debug_data": data
            }

    except Exception as e:
        result = {"success": False, "error": str(e)}

    print(json.dumps(result, default=str))

if __name__ == '__main__':
    if len(sys.argv) > 1:
        get_capacity(sys.argv[1])
    else:
        print(json.dumps({"success": False, "error": "No URL provided"}))
