import urllib.request
import re
import ssl

url = "https://www.webtoons.com/en/drama/daytime-in-the-bunker/episode-11/viewer?title_no=9842&episode_no=11"
req = urllib.request.Request(
    url,
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.webtoons.com/"
    }
)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        html = response.read().decode('utf-8')
        
    start_idx = -1
    container_match = re.search(r'<(div|ul|section)\s+[^>]*?class=["\'][^"\']*?viewer_lst[^"\']*?["\'][^>]*?>', html, re.IGNORECASE)
    if not container_match:
        container_match = re.search(r'<(div|ul|section)\s+[^>]*?(?:id=["\']_imageList["\']|class=["\'][^"\']*?_imageList[^"\']*?")[^>]*?>', html, re.IGNORECASE)
        
    if container_match:
        start_idx = container_match.start()
        search_block = html[start_idx:start_idx + 300000]
    else:
        search_block = html
        
    img_regex = re.compile(r'<img\s+([^>]+)>', re.IGNORECASE)
    image_set = []
    
    for match in img_regex.finditer(search_block):
        attr_str = match.group(1)
        
        class_match = re.search(r'class=["\']([^"\']+)["\']', attr_str, re.IGNORECASE)
        class_name = class_match.group(1) if class_match else ""
        
        data_url_match = re.search(r'data-url=["\']([^"\']+)["\']', attr_str, re.IGNORECASE)
        src_match = re.search(r'src=["\']([^"\']+)["\']', attr_str, re.IGNORECASE)
        id_match = re.search(r'id=["\']([^"\']+)["\']', attr_str, re.IGNORECASE)
        
        data_url = data_url_match.group(1) if data_url_match else ""
        src_url = src_match.group(1) if src_match else ""
        id_name = id_match.group(1) if id_match else ""
        
        is_comic_class = '_images' in class_name or 'viewer_img' in class_name
        is_comic_id = id_name.startswith('img_') or id_name.startswith('volume_')
        
        candidate_url = (data_url or src_url).strip()
        if not candidate_url:
            continue
            
        is_phinf = 'phinf.net' in candidate_url or 'pstatic.net' in candidate_url
        is_unwanted = any(k in candidate_url.lower() for k in [
            'logo', 'icon', 'avatar', 'banner', 'loading', 'pixel', 'bg_',
            'thumb', 'profile', 'comment', 'creator', 'author', 'button'
        ])
        
        is_comic_panel = False
        if is_phinf and not is_unwanted:
            if is_comic_class or is_comic_id:
                is_comic_panel = True
            elif start_idx != -1:
                is_comic_panel = True
                
        if is_comic_panel:
            if candidate_url not in image_set:
                image_set.append(candidate_url)
                
    filtered_images = []
    for img in image_set:
        lower = img.lower()
        is_unwanted = any(k in lower for k in [
            'logo', 'bg_', 'icon', 'button', 'loading', 'pixel', 'progress',
            'arrow', 'favicon', 'banner', 'thumb', 'profile', 'comment',
            'avatar', 'user', 'reply', 'creator', 'author', 'social', 'shari', 'footer'
        ])
        is_thumbnail = 'type=f' in lower and 'type=q90' not in lower
        
        if not is_unwanted and not is_thumbnail:
            filtered_images.append(img)
            
    print(f"Filtered list contains {len(filtered_images)} images.")
    print("First 3:")
    for i, img in enumerate(filtered_images[:3]):
        print(f"{i+1}: {img}")
    print("Last 3:")
    for i, img in enumerate(filtered_images[-3:]):
        print(f"{len(filtered_images)-2+i}: {img}")
        
except Exception as e:
    print("Error:", e)
