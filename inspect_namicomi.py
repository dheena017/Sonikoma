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
print('len', len(html))
for term in ['window.__NUXT__','window.__INITIAL_STATE__','window.__DATA__','__INITIAL_STATE__','__NUXT__','chapter','pages','images','bookResultData','chapterList','readonly','page','src']:
    idx=html.find(term)
    print(term, idx)
    if idx!=-1:
        print(html[max(0,idx-100):idx+200].replace('\n',' '))
        print('---')
