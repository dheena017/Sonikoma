import urllib.request
import json
import ssl

url = "http://localhost:3000/api/scrape-images"
data = {"url": "https://www.webtoons.com/en/drama/daytime-in-the-bunker/episode-11/viewer?title_no=9842&episode_no=11"}

req = urllib.request.Request(
    url,
    data=json.dumps(data).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        res_data = json.loads(response.read().decode('utf-8'))
    print("Success:", res_data.get("success"))
    print("Total images returned:", res_data.get("total_images"))
    print("Images list (first 10):")
    for i, img in enumerate(res_data.get("images", [])[:10]):
        print(f"{i+1}: {img}")
except Exception as e:
    print("Error calling backend:", e)
