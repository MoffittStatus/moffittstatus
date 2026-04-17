import requests
import os

load_dotenv()

api_key = os.environ.get("GROQ_API_KEY")
url = "https://api.groq.com/openai/v1/models"
print(api_key)
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)

print(response.json())