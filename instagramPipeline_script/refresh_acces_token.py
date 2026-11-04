import os
import re
from datetime import datetime
import requests
from dotenv import load_dotenv, set_key

# 1. Load existing environment variables from .env
ENV_FILE_PATH = ".env"
load_dotenv(ENV_FILE_PATH)

APP_ID = os.getenv("IG_APP_ID")
APP_SECRET = os.getenv("IG_APP_SECRET")
CURRENT_TOKEN = os.getenv("IG_ACCESS_TOKEN")
GRAPH_API_VERSION = "v21.0"


def inspect_token(token: str) -> dict:
    """Debug and check the expiration date/time of the current access token."""
    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/debug_token"
    params = {"input_token": token, "access_token": f"{APP_ID}|{APP_SECRET}"}

    response = requests.get(url, params=params)
    data = response.json()

    if "data" in data:
        return data["data"]
    else:
        raise Exception(f"Failed to inspect token: {data}")


def refresh_long_lived_token(current_token: str) -> str:
    """Exchange a valid long-lived user token for a fresh 60-day token."""
    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/oauth/access_token"
    params = {
        "grant_type": "fb_exchange_token",
        "client_id": APP_ID,
        "client_secret": APP_SECRET,
        "fb_exchange_token": current_token,
    }

    response = requests.get(url, params=params)
    data = response.json()

    if "access_token" in data:
        return data["access_token"]
    else:
        raise Exception(f"Failed to refresh access token: {data}")


def update_env_file(key: str, value: str):
    """Write/update a key-value pair directly in the .env file."""
    # Use python-dotenv's set_key to update the .env file cleanly
    set_key(ENV_FILE_PATH, key, value)
    print(f"Successfully updated {key} in '{ENV_FILE_PATH}'.")


def main():
    if not all([APP_ID, APP_SECRET, CURRENT_TOKEN]):
        raise ValueError(
            "Missing IG_APP_ID, IG_APP_SECRET, or IG_ACCESS_TOKEN in .env file."
        )

    print("Checking current token status with Meta...")
    token_info = inspect_token(CURRENT_TOKEN)

    expires_at_timestamp = token_info.get("expires_at", 0)

    # 0 or missing means the token never expires (e.g. System User token)
    if expires_at_timestamp == 0:
        print("Token is set to never expire or is a System User token.")
        return

    expires_at = datetime.fromtimestamp(expires_at_timestamp)
    days_remaining = (expires_at - datetime.now()).days

    print(
        f"Token expires on: {expires_at.strftime('%Y-%m-%d %H:%M:%S')} ({days_remaining} days remaining)"
    )

    # Refresh if token has 15 or fewer days remaining
    if days_remaining <= 15:
        print("Token is approaching expiration. Refreshing now...")
        new_token = refresh_long_lived_token(CURRENT_TOKEN)

        # Update .env file
        update_env_file("IG_ACCESS_TOKEN", new_token)
        print("Token refresh complete! Your pipeline is good for another 60 days.")
    else:
        print(
            "Token is still fresh (more than 15 days left). No refresh needed yet."
        )


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error during token refresh check: {e}")