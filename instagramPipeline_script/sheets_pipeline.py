import os
import time
from datetime import datetime
from dotenv import load_dotenv
import gspread
from google.oauth2.service_account import Credentials
import requests

load_dotenv()

# Environment variables
INSTAGRAM_ACCOUNT_ID = os.getenv("IG_ACCOUNT_ID")
ACCESS_TOKEN = os.getenv("IG_ACCESS_TOKEN")
GRAPH_API_VERSION = "v21.0"
BASE_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"
SPREADSHEET_NAME = "Instagram Content Queue"

# Google Sheets Setup
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]


def get_sheet():
    creds = Credentials.from_service_account_file(
        "service_account.json", scopes=SCOPES
    )
    client = gspread.authorize(creds)
    return client.open(SPREADSHEET_NAME).sheet1


# --- Instagram API Functions ---
def create_container(image_url: str, caption: str) -> str:
    url = f"{BASE_URL}/{INSTAGRAM_ACCOUNT_ID}/media"
    payload = {
        "image_url": image_url,
        "caption": caption,
        "access_token": ACCESS_TOKEN,
    }
    res = requests.post(url, data=payload).json()
    if "id" in res:
        return res["id"]
    raise Exception(f"Container Creation Failed: {res}")


def check_status(container_id: str, retries: int = 5) -> bool:
    url = f"{BASE_URL}/{container_id}"
    params = {"fields": "status_code", "access_token": ACCESS_TOKEN}
    for _ in range(retries):
        res = requests.get(url, params=params).json()
        status = res.get("status_code")
        if status == "FINISHED":
            return True
        elif status in ["ERROR", "EXPIRED"]:
            raise Exception(f"Container error: {status}")
        time.sleep(3)
    raise TimeoutError("Processing timed out.")


def publish_post(container_id: str) -> str:
    url = f"{BASE_URL}/{INSTAGRAM_ACCOUNT_ID}/media_publish"
    payload = {"creation_id": container_id, "access_token": ACCESS_TOKEN}
    res = requests.post(url, data=payload).json()
    if "id" in res:
        return res["id"]
    raise Exception(f"Publish Failed: {res}")


# --- Main Pipeline Task ---
def process_scheduled_posts():
    sheet = get_sheet()
    records = sheet.get_all_records()

    for idx, row in enumerate(records, start=2):  # Row 1 is header
        status = row.get("Status", "").strip()
        scheduled_date_str = row.get("Scheduled Date", "").strip()
        image_url = row.get("Image URL", "").strip()
        caption = row.get("Caption", "").strip()

        # Check if post is marked Ready and scheduled for now or earlier
        if status.lower() == "ready" and scheduled_date_str:
            try:
                scheduled_date = datetime.strptime(
                    scheduled_date_str, "%Y-%m-%d %H:%M"
                )
            except ValueError:
                print(
                    f"Row {idx}: Invalid date format. Use 'YYYY-MM-DD HH:MM'."
                )
                continue

            if datetime.now() >= scheduled_date:
                print(f"Processing row {idx}...")
                try:
                    # Update status to Processing
                    sheet.update_cell(idx, 4, "Processing")

                    # Execute Instagram Pipeline
                    container_id = create_container(image_url, caption)
                    check_status(container_id)
                    media_id = publish_post(container_id)

                    # Update Sheet with Success Status and Post ID
                    sheet.update_cell(idx, 4, "Published")
                    sheet.update_cell(idx, 5, media_id)
                    print(
                        f"Row {idx} successfully published! Media ID: {media_id}"
                    )

                except Exception as e:
                    print(f"Error publishing row {idx}: {e}")
                    sheet.update_cell(idx, 4, f"Failed: {e}")


if __name__ == "__main__":
    process_scheduled_posts()