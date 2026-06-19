from fastapi.testclient import TestClient
from fastapi import FastAPI
import sys
import os

# Set up path to import routes
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "python")))

from routes.image_routes import router

app = FastAPI()
app.include_router(router)

client = TestClient(app)

def test_zip_naming():
    # Test payload
    payload = {
        "urls": [
            "https://placehold.co/100x100.png"
        ],
        "url": "https://www.webtoons.com/en/fantasy/tower-of-god/season-3-ep-130/viewer?title_no=95"
    }
    
    print("Sending request to /download-zip...")
    res = client.post("/download-zip", json=payload)
    print("Response status:", res.status_code)
    data = res.json()
    print("Response body:", data)
    
    assert data["success"] is True
    assert "filename" in data
    # Safe name format: Webtoons_Tower_Of_God_Chapter_130_Season_3_Ep_130.zip
    print("Generated filename:", data["filename"])
    
    # Now retrieve it
    download_url = data["downloadUrl"]
    zip_id = download_url.split("/")[-1]
    
    print(f"Retrieving ZIP file from /download-zip/get/{zip_id}...")
    res_get = client.get(f"/download-zip/get/{zip_id}")
    print("Response status:", res_get.status_code)
    cd = res_get.headers.get("Content-Disposition")
    print("Content-Disposition header:", cd)
    assert f"filename={data['filename']}" in cd

if __name__ == "__main__":
    try:
        test_zip_naming()
        print("\nSUCCESS: Naming test passed!")
    except Exception as e:
        print("\nFAILURE:", e)
        sys.exit(1)
