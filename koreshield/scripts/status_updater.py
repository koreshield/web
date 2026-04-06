import time
import json
import requests
import os

API_URL = "http://koreshield-api:8000/health/providers"
OUTPUT_PATH = "/data/status.json"
CHECK_INTERVAL = 60

def update_status():
    print(f"Starting status updater. Polling {API_URL} every {CHECK_INTERVAL}s")
    while True:
        try:
            response = requests.get(API_URL, timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                # Format for the status page
                status_output = {
                    "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "overall_status": "healthy" if data.get("healthy_providers", 0) > 0 else "degraded",
                    "providers": data.get("providers", {}),
                    "total_providers": data.get("total_providers", 0),
                    "healthy_providers": data.get("healthy_providers", 0)
                }
                
                # Write atomically
                tmp_path = f"{OUTPUT_PATH}.tmp"
                with open(tmp_path, 'w') as f:
                    json.dump(status_output, f, indent=2)
                os.rename(tmp_path, OUTPUT_PATH)
                print(f"Status updated: {status_output['overall_status']}")
            else:
                print(f"API returned error: {response.status_code}")
        except Exception as e:
            print(f"Failed to update status: {e}")
        
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    # Ensure data directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    update_status()
