import urllib.request, ssl, re
url='https://namicomi.com/en/chapter/tXQBwXXR'
headers={
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language':'en-US,en;q=0.9'
}
req=urllib.request.Request(url, headers=headers)
ctx=ssl.create_default_context()
with urllib.request.urlopen(req, context=ctx, timeout=30) as res:
    html=res.read().decode('utf-8', errors='replace')
idx=html.find('window.__NUXT__=')
print('idx', idx)
if idx != -1:
    end=html.find('</script>', idx)
    block=html[idx:end]
    print(block[:1500].replace('\n',' '))
    print('--- block end ---')
    for pattern in [r'"src"\s*:\s*"(https?://[^"\\]+)"', r'src:\s*"(https?://[^"\\]+)"', r'https?://[^"\'\s]+\.(?:jpg|jpeg|png|webp)']:
        found=re.findall(pattern, block)
        print('PATTERN',pattern,'count',len(found))
        print(found[:20])
        print('---')
