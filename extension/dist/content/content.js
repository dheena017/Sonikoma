var F=Object.defineProperty;var O=(g,t,e)=>t in g?F(g,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):g[t]=e;var l=(g,t,e)=>O(g,typeof t!="symbol"?t+"":t,e);class v{static initPageSniffer(){if(!(this.snifferInjected||typeof document>"u")){this.snifferInjected=!0,window.addEventListener("sonikoma:network_images",t=>{if(t&&t.detail&&Array.isArray(t.detail.images))for(const e of t.detail.images)typeof e=="string"&&e.startsWith("http")&&this.capturedNetworkImages.add(e)});try{const t=document.createElement("script");t.setAttribute("type","text/javascript"),t.textContent=`
        (function() {
          if (window.__sonikoma_sniffer_active) return;
          window.__sonikoma_sniffer_active = true;
          window.__SONIKOMA_CAPTURED_IMAGES__ = window.__SONIKOMA_CAPTURED_IMAGES__ || [];

          function pushUrls(urls) {
            if (!Array.isArray(urls) || urls.length === 0) return;
            const valid = [];
            for (const u of urls) {
              if (typeof u === 'string' && u.length > 8 && (u.startsWith('http') || u.startsWith('//') || u.startsWith('/'))) {
                let full = u;
                if (full.startsWith('//')) full = 'https:' + full;
                else if (full.startsWith('/')) full = window.location.origin + full;
                if (!window.__SONIKOMA_CAPTURED_IMAGES__.includes(full)) {
                  window.__SONIKOMA_CAPTURED_IMAGES__.push(full);
                  valid.push(full);
                }
              }
            }
            if (valid.length > 0) {
              window.dispatchEvent(new CustomEvent('sonikoma:network_images', { detail: { images: valid } }));
            }
          }

          // 1. Inspect window global variables
          function inspectGlobals() {
            try {
              if (window.__NEXT_DATA__ && window.__NEXT_DATA__.props) {
                const s = JSON.stringify(window.__NEXT_DATA__.props);
                const matches = s.match(/https?:\\/\\/[^"'s]+\\.(?:jpg|jpeg|png|webp|avif)(?:\\?[^"'s]*)?/gi);
                if (matches) pushUrls(matches);
              }
              if (window.chapter_data && Array.isArray(window.chapter_data.images)) {
                pushUrls(window.chapter_data.images.map(i => typeof i === 'string' ? i : i.url || i.src));
              }
              if (window.pages && Array.isArray(window.pages)) {
                pushUrls(window.pages.map(i => typeof i === 'string' ? i : i.url || i.src));
              }
              if (window.chapImages && Array.isArray(window.chapImages)) {
                pushUrls(window.chapImages);
              }
              if (window.pData && window.pData.img) {
                pushUrls(Array.isArray(window.pData.img) ? window.pData.img : [window.pData.img]);
              }
              if (window.ts_reader && window.ts_reader.params && window.ts_reader.params.sources) {
                for (const src of window.ts_reader.params.sources) {
                  if (src && Array.isArray(src.images)) pushUrls(src.images);
                }
              }
            } catch (_) {}
          }
          inspectGlobals();
          setTimeout(inspectGlobals, 1500);

          // 2. Intercept window.fetch
          const origFetch = window.fetch;
          if (origFetch) {
            window.fetch = async function(...args) {
              const res = await origFetch.apply(this, args);
              try {
                const clone = res.clone();
                const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
                if (url.includes('chapter') || url.includes('api') || url.includes('at-home') || url.includes('pages')) {
                  clone.json().then(data => {
                    const str = JSON.stringify(data);
                    const matches = str.match(/https?:\\/\\/[^"'s]+\\.(?:jpg|jpeg|png|webp|avif)(?:\\?[^"'s]*)?/gi);
                    if (matches) pushUrls(matches);
                  }).catch(() => {});
                }
              } catch (_) {}
              return res;
            };
          }

          // 3. Intercept XMLHttpRequest
          const origOpen = XMLHttpRequest.prototype.open;
          const origSend = XMLHttpRequest.prototype.send;
          XMLHttpRequest.prototype.open = function(method, url) {
            this.__sonikoma_req_url = url;
            return origOpen.apply(this, arguments);
          };
          XMLHttpRequest.prototype.send = function() {
            this.addEventListener('load', function() {
              try {
                if (this.responseText && this.responseText.length > 50) {
                  const matches = this.responseText.match(/https?:\\/\\/[^"'s]+\\.(?:jpg|jpeg|png|webp|avif)(?:\\?[^"'s]*)?/gi);
                  if (matches && matches.length >= 2) pushUrls(matches);
                }
              } catch (_) {}
            });
            return origSend.apply(this, arguments);
          };
        })();
      `,(document.head||document.documentElement).appendChild(t),t.remove()}catch{}}}static async fetchDirectSiteApi(){var s,o,n,i;const t=window.location.href,e=window.location.hostname;if(e.includes("mangadex.org")){const a=t.match(/\/chapter\/([a-f0-9\-]+)/i);if(a&&a[1]){const c=a[1];try{const r=await fetch(`https://api.mangadex.org/at-home/server/${c}`);if(r.ok){const m=await r.json(),u=m.baseUrl,d=(s=m.chapter)==null?void 0:s.hash,p=((o=m.chapter)==null?void 0:o.data)||((n=m.chapter)==null?void 0:n.dataSaver)||[];if(u&&d&&p.length>0)return p.map(h=>`${u}/data/${d}/${h}`)}}catch{}}}if(e.includes("comick.")){const a=t.match(/\/comic\/[^/]+\/([^/?#]+)/i);if(a&&a[1]){const c=a[1];try{const r=await fetch(`https://api.comick.fun/chapter/${c}`);if(r.ok){const u=((i=(await r.json()).chapter)==null?void 0:i.images)||[];if(u.length>0)return u.map(d=>d.url||`https://meo.comick.pictures/${d.bkey}`)}}catch{}}}try{const a=Array.from(document.querySelectorAll("script:not([src])"));for(const c of a){const r=c.textContent||"";if(r.includes("chapter_data")||r.includes("ts_reader")||r.includes("pData")||r.includes("images")||r.includes("img_data")){const m=r.match(/https?:\\?\/\\?\/[^"'\s\\]+\.(?:jpg|jpeg|png|webp|avif)(?:\\?[^"'\s\\]*)?/gi);if(m&&m.length>=3){const u=m.map(d=>d.replace(/\\\//g,"/"));return Array.from(new Set(u))}}}}catch{}return[]}static getRealImageSrc(t){var n;if(!t)return"";const e=["data-url","data-src","data-original","data-lazy-src","data-echo","data-real-src","data-cdn","data-full-url","data-srcset","data-img-src","data-lazy","data-splide-lazy","data-deferred","data-hi-res-src","data-origin-src","data-zoom-src","data-cfsrc","data-src-zoom","data-orig-src","data-img","data-image","data-highres","data-fallback","data-path","data-raw","srcset","src"];for(const i of e){const a=t.getAttribute(i);if(a&&typeof a=="string"){const c=a.trim();if(c.length>5&&!c.startsWith("data:image/gif")&&!c.startsWith("data:image/svg")&&!c.includes("blank.gif")&&!c.includes("spacer.gif")&&!c.includes("placeholder")){const r=c.split(",")[0].trim().split(" ")[0].trim();if(r.startsWith("//"))return`https:${r}`;if(r.startsWith("http://")||r.startsWith("https://"))return r;if(r.startsWith("/"))return`${window.location.origin}${r}`;if(r.startsWith("./")||r.startsWith("../"))try{return new URL(r,window.location.href).href}catch{return r}return r}}}const s=t;if(s.currentSrc&&typeof s.currentSrc=="string"&&s.currentSrc.startsWith("http")){const i=s.currentSrc.toLowerCase();if(!i.includes("blank.gif")&&!i.includes("spacer.gif")&&!i.includes("placeholder"))return s.currentSrc}if(s.src&&typeof s.src=="string"&&s.src.startsWith("http")){const i=s.src.toLowerCase();if(!i.includes("blank.gif")&&!i.includes("spacer.gif")&&!i.includes("placeholder"))return s.src}const o=((n=t.style)==null?void 0:n.backgroundImage)||window.getComputedStyle(t).backgroundImage;if(o&&o.includes("url(")){const i=o.match(/url\(['"]?([^'"]+)['"]?\)/);if(i&&i[1]){let a=i[1].trim();if(a.startsWith("//")&&(a=`https:${a}`),a.startsWith("/")&&(a=`${window.location.origin}${a}`),!a.startsWith("data:image/gif")&&!a.startsWith("data:image/svg")&&!a.includes("blank.gif")&&!a.includes("spacer.gif"))return a}}if(t.tagName==="CANVAS")try{const i=t;if(i.width>200&&i.height>200)return i.toDataURL("image/png")}catch{}return""}static scanChapterImages(){this.initPageSniffer();const t=[],e=new Set,s=["#_imageList img","#_imageList img._images","img._images","#_viewerBox img",".viewer_lst img",".viewer_img img",".viewer_lst .viewer_img img",".wt_viewer img","#comic_view_area img",".view_area img",".reader--container img",".page--container img",".reader-area img",".comic-page img",".chapter-content img",".reading-content img",".reading-content picture img",".entry-content img",".page-break img","#readerarea img",".readerarea img",".post-content img","#chapter-video-frame img",".container-chapter-reader img",".panel-chapter-info img",".image-horizontal img",".image-vertical img",".v-reader img","#reader img","#viewer img","#chapter-images img","div[class*='viewer'] img","div[class*='reader'] img","div[id*='viewer'] img","div[id*='reader'] img","img[data-url]","img[data-src]","img[data-original]","img[data-lazy-src]","article img","main img","canvas","img"];let o=[];for(const n of s)try{const i=Array.from(document.querySelectorAll(n));if(i.length>=2&&i.some(c=>!!this.getRealImageSrc(c))){o=i;break}}catch{}o.length===0&&(o=Array.from(document.querySelectorAll("img, picture source, [style*='background-image'], canvas")));for(const n of o){const i=this.getRealImageSrc(n);if(!i||e.has(i))continue;const a=n.getBoundingClientRect(),c=n,r=c.naturalWidth||a.width||0,m=c.naturalHeight||a.height||0,u=!!(n.getAttribute("data-url")||n.getAttribute("data-src")||n.getAttribute("data-original")||n.getAttribute("data-lazy-src")||n.getAttribute("data-real-src")||n.getAttribute("data-echo")||n.getAttribute("data-cdn")||n.getAttribute("data-full-url")||n.getAttribute("data-lazy")||n.getAttribute("data-img-src"));if(!u&&r>0&&r<70&&m>0&&m<70)continue;const d=i.toLowerCase();(d.includes("favicon")||d.includes("avatar")||d.includes("logo")||d.includes("pixel")||d.includes("advert")||d.includes("share_")||d.includes("icon_")||d.includes("btn_")||d.includes("button_")||d.includes("blank.gif")||d.includes("spacer.gif")||d.includes("tracking")||d.includes("analytics"))&&(!u||r>0&&r<100&&m>0&&m<100)||(e.add(i),t.push({index:t.length+1,src:i,width:r>100?r:800,height:m>100?m:1200,top:Math.round(a.top+window.scrollY)}))}if(this.capturedNetworkImages.size>0){let n=t.length>0?t[t.length-1].top+1e3:0;for(const i of this.capturedNetworkImages)e.has(i)||(e.add(i),t.push({index:t.length+1,src:i,width:800,height:1200,top:n}),n+=1e3)}return t.sort((n,i)=>n.top-i.top),t.forEach((n,i)=>{n.index=i+1}),t}static async scanChapterImagesAsync(){this.initPageSniffer();const t=await this.fetchDirectSiteApi();return t&&t.length>=2?t.map((e,s)=>({index:s+1,src:e,width:800,height:1200,top:s*1100})):this.scanChapterImages()}static extractPageMetadata(){var i;let t="",e="";const o=((i=document.querySelector('meta[property="og:title"]'))==null?void 0:i.getAttribute("content"))||document.title||"";if(o){const a=o.split(/[-|–—»•:]/);a.length>=2?(t=a[0].trim(),e=a.slice(1).join(" - ").trim()):t=o.trim()}const n=document.querySelector("h1, h2, .subj, .chapter-title, .episode-title, .subj_episode, .chapter-name, .c-breadcrumb li:last-child");return n&&n.textContent&&(e=n.textContent.trim().split(`
`)[0].substring(0,50)),{seriesTitle:t||document.title||window.location.hostname,chapterTitle:e||"Active Chapter",url:window.location.href,domain:window.location.hostname}}}l(v,"capturedNetworkImages",new Set),l(v,"snifferInjected",!1);typeof window<"u"&&(window.DomMangaScanner=v,v.initPageSniffer());const P=[{id:"off",name:"Mute",icon:"🔇",desc:"No background audio"},{id:"lofi",name:"Lo-Fi Chords",icon:"🎵",desc:"Calm warm cinematic chords"},{id:"rain",name:"Rain Waves",icon:"🌧️",desc:"Organic rain & ocean swell"},{id:"space",name:"Cyber Drone",icon:"🌌",desc:"432Hz ethereal ambient drone"},{id:"pulse",name:"Action Pulse",icon:"⚡",desc:"Tense rhythmic sub-bass pulse"},{id:"zen",name:"Zen Harmony",icon:"🎋",desc:"Peaceful acoustic resonant harmonics"}],C=[{id:"normal",name:"Natural",icon:"🖼️",filterCss:"none"},{id:"oled",name:"OLED Dark",icon:"🕶️",filterCss:"contrast(1.18) brightness(0.92) saturate(1.08)"},{id:"sepia",name:"Warm Sepia",icon:"📜",filterCss:"sepia(0.38) contrast(1.08) brightness(0.96) hue-rotate(-12deg)"},{id:"cyber",name:"Cyber Neon",icon:"🎆",filterCss:"saturate(1.45) contrast(1.15) hue-rotate(8deg)"},{id:"noir",name:"Noir Ink",icon:"🖤",filterCss:"grayscale(1) contrast(1.3) brightness(0.95)"},{id:"warm",name:"Night Amber",icon:"🕯️",filterCss:"sepia(0.55) brightness(0.92) hue-rotate(-25deg)"}];class q{constructor(){l(this,"ctx",null);l(this,"currentMood","off");l(this,"masterGain",null);l(this,"activeNodes",[]);l(this,"volume",.65)}cycleMood(){const e=(P.findIndex(s=>s.id===this.currentMood)+1)%P.length;return this.setMood(P[e].id),P[e]}setMood(t){this.currentMood=t,t==="off"?this.stop():this.startMood(t)}setVolume(t){if(this.volume=Math.max(0,Math.min(1,t)),this.masterGain&&this.ctx)try{this.masterGain.gain.setValueAtTime(.08*this.volume,this.ctx.currentTime)}catch{}}initCtx(){if(!this.ctx){const t=window.AudioContext||window.webkitAudioContext;this.ctx=new t}this.ctx.state==="suspended"&&this.ctx.resume()}startMood(t){try{this.initCtx(),this.stop(),this.masterGain=this.ctx.createGain(),this.masterGain.gain.setValueAtTime(.001,this.ctx.currentTime);const e=.08*this.volume;if(this.masterGain.gain.exponentialRampToValueAtTime(e,this.ctx.currentTime+2),this.masterGain.connect(this.ctx.destination),t==="lofi")[65.41,130.81,196,311.13,392].forEach((o,n)=>{const i=this.ctx.createOscillator();i.type=n===0?"sine":n%2===0?"triangle":"sine",i.frequency.setValueAtTime(o,this.ctx.currentTime);const a=this.ctx.createOscillator(),c=this.ctx.createGain();a.frequency.setValueAtTime(.08+n*.03,this.ctx.currentTime),c.gain.setValueAtTime(1.5,this.ctx.currentTime),a.connect(c),c.connect(i.frequency),a.start(),i.connect(this.masterGain),i.start(),this.activeNodes.push(i,a,c)});else if(t==="rain"){const s=this.ctx.sampleRate*2,o=this.ctx.createBuffer(1,s,this.ctx.sampleRate),n=o.getChannelData(0);let i=0,a=0,c=0,r=0,m=0,u=0,d=0;for(let w=0;w<s;w++){const y=Math.random()*2-1;i=.99886*i+y*.0555179,a=.99332*a+y*.0750759,c=.969*c+y*.153852,r=.8665*r+y*.3104856,m=.55*m+y*.5329522,u=-.7616*u-y*.016898,n[w]=(i+a+c+r+m+u+d+y*.5362)*.08,d=y*.115926}const p=this.ctx.createBufferSource();p.buffer=o,p.loop=!0;const h=this.ctx.createBiquadFilter();h.type="lowpass",h.frequency.setValueAtTime(800,this.ctx.currentTime);const f=this.ctx.createOscillator();f.frequency.setValueAtTime(.15,this.ctx.currentTime);const b=this.ctx.createGain();b.gain.setValueAtTime(300,this.ctx.currentTime),f.connect(b),b.connect(h.frequency),f.start(),p.connect(h),h.connect(this.masterGain),p.start(),this.activeNodes.push(p,h,f,b)}else if(t==="space")[108,216,432,648].forEach((o,n)=>{const i=this.ctx.createOscillator();i.type="sine",i.frequency.setValueAtTime(o,this.ctx.currentTime);const a=this.ctx.createStereoPanner?this.ctx.createStereoPanner():null;a?(a.pan.setValueAtTime(n%2===0?-.4:.4,this.ctx.currentTime),i.connect(a),a.connect(this.masterGain),this.activeNodes.push(a)):i.connect(this.masterGain),i.start(),this.activeNodes.push(i)});else if(t==="pulse"){const s=this.ctx.createOscillator();s.type="sawtooth",s.frequency.setValueAtTime(55,this.ctx.currentTime);const o=this.ctx.createBiquadFilter();o.type="lowpass",o.frequency.setValueAtTime(220,this.ctx.currentTime),o.Q.setValueAtTime(4,this.ctx.currentTime);const n=this.ctx.createOscillator();n.type="square",n.frequency.setValueAtTime(2,this.ctx.currentTime);const i=this.ctx.createGain();i.gain.setValueAtTime(140,this.ctx.currentTime),n.connect(i),i.connect(o.frequency),n.start(),s.connect(o),o.connect(this.masterGain),s.start(),this.activeNodes.push(s,o,n,i)}else t==="zen"&&[144,288,432,576,864].forEach((o,n)=>{const i=this.ctx.createOscillator();i.type="sine",i.frequency.setValueAtTime(o,this.ctx.currentTime);const a=this.ctx.createGain();a.gain.setValueAtTime(1/(n+1.5),this.ctx.currentTime);const c=this.ctx.createOscillator();c.frequency.setValueAtTime(.05+n*.02,this.ctx.currentTime);const r=this.ctx.createGain();r.gain.setValueAtTime(.3,this.ctx.currentTime),c.connect(r),r.connect(a.gain),c.start(),i.connect(a),a.connect(this.masterGain),i.start(),this.activeNodes.push(i,a,c,r)})}catch{}}stop(){if(this.masterGain&&this.ctx)try{this.masterGain.gain.linearRampToValueAtTime(.001,this.ctx.currentTime+.3)}catch{}setTimeout(()=>{this.activeNodes.forEach(t=>{try{typeof t.stop=="function"&&t.stop()}catch{}}),this.activeNodes=[]},350)}}class V{constructor(){l(this,"isVoiceActive",!1);l(this,"currentUtterance",null);l(this,"onSubtitleCallback",null)}setSubtitleCallback(t){this.onSubtitleCallback=t}toggle(){return this.isVoiceActive=!this.isVoiceActive,this.isVoiceActive||this.stop(),this.isVoiceActive}get isActive(){return this.isVoiceActive}speak(t){if(!(!this.isVoiceActive||!("speechSynthesis"in window)))try{window.speechSynthesis.cancel();const e=new SpeechSynthesisUtterance(t);e.rate=1.05,e.pitch=1;const o=window.speechSynthesis.getVoices().find(n=>n.lang.startsWith("en")&&(n.name.includes("Natural")||n.name.includes("Google")||n.name.includes("Samantha")));o&&(e.voice=o),this.onSubtitleCallback&&this.onSubtitleCallback(t),e.onend=()=>{this.onSubtitleCallback&&this.onSubtitleCallback("")},e.onerror=()=>{this.onSubtitleCallback&&this.onSubtitleCallback("")},this.currentUtterance=e,window.speechSynthesis.speak(e)}catch{}}stop(){if("speechSynthesis"in window)try{window.speechSynthesis.cancel()}catch{}this.onSubtitleCallback&&this.onSubtitleCallback("")}}class L{constructor(t){l(this,"scanner");l(this,"isPlaying",!1);l(this,"scrollSpeed",1);l(this,"baseSpeedPxPerSec",65);l(this,"animationFrameId",null);l(this,"lastTimestamp",null);l(this,"subpixelAccumulator",0);l(this,"hudElement",null);l(this,"dimmerElement",null);l(this,"spotlightElement",null);l(this,"toastElement",null);l(this,"subtitleElement",null);l(this,"scrubberTooltipElement",null);l(this,"nextChapterBanner",null);l(this,"isDimmed",!1);l(this,"isSpotlight",!1);l(this,"isAdaptivePacing",!0);l(this,"isAutoDimHud",!0);l(this,"isDockTop",!0);l(this,"isSettingsOpen",!1);l(this,"isTemporarilyPausedForUser",!1);l(this,"manualScrollTimeout",null);l(this,"hudDimTimer",null);l(this,"currentShader","normal");l(this,"detectedPanels",[]);l(this,"currentPanelIndex",0);l(this,"panelPauseTimer",0);l(this,"lastPausedPanelIdx",-1);l(this,"lastNarratedPanelIdx",-1);l(this,"nextChapterCountdown",0);l(this,"nextChapterTimerId",null);l(this,"soundscape",new q);l(this,"voiceNarrator",new V);this.scanner=t||window.DomMangaScanner,this.init()}init(){this.createCinemaHUD(),this.createDimmerOverlay(),this.createSpotlightOverlay(),this.createSubtitleOverlay(),this.bindGlobalShortcuts(),this.bindUserScrollInterceptors(),this.bindMouseActivityInterceptors(),this.voiceNarrator.setSubtitleCallback(t=>{this.updateSubtitle(t)})}bindGlobalShortcuts(){window.addEventListener("keydown",t=>{const e=t.target;(e==null?void 0:e.tagName)==="INPUT"||(e==null?void 0:e.tagName)==="TEXTAREA"||e!=null&&e.isContentEditable||!(this.hudElement&&!this.hudElement.classList.contains("sonikoma-hidden"))||(t.code==="Space"?(t.preventDefault(),this.isPlaying?this.pause():this.play()):t.code==="ArrowUp"?(t.preventDefault(),this.adjustSpeed(.25)):t.code==="ArrowDown"?(t.preventDefault(),this.adjustSpeed(-.25)):t.code==="ArrowRight"?(t.preventDefault(),this.jumpToNextPanel()):t.code==="ArrowLeft"?(t.preventDefault(),this.jumpToPrevPanel()):t.key==="m"||t.key==="M"?(t.preventDefault(),this.cycleSoundscape()):t.key==="c"||t.key==="C"?(t.preventDefault(),this.cycleShader()):t.key==="v"||t.key==="V"?(t.preventDefault(),this.toggleVoiceNarrator()):t.key==="d"||t.key==="D"?(t.preventDefault(),this.toggleTheaterDimmer()):t.key==="l"||t.key==="L"?(t.preventDefault(),this.toggleSpotlight()):t.key==="f"||t.key==="F"?(t.preventDefault(),this.toggleFullscreen()):t.key==="s"||t.key==="S"?(t.preventDefault(),this.snipActiveScene()):t.key==="b"||t.key==="B"?(t.preventDefault(),this.bookmarkActiveScene()):t.code==="Escape"&&(this.nextChapterBanner?this.cancelNextChapterCountdown():this.isSettingsOpen?this.toggleSettingsFlyout(!1):this.stop()))})}bindUserScrollInterceptors(){const t=()=>{!this.isPlaying||this.isTemporarilyPausedForUser||(this.isTemporarilyPausedForUser=!0,this.updateStatusBadge("Paused","⏸"),this.manualScrollTimeout&&clearTimeout(this.manualScrollTimeout),this.manualScrollTimeout=setTimeout(()=>{this.isTemporarilyPausedForUser=!1,this.isPlaying&&(this.updateStatusBadge("Playing","▶"),this.lastTimestamp=performance.now())},1300))};window.addEventListener("wheel",t,{passive:!0}),window.addEventListener("touchmove",t,{passive:!0})}bindMouseActivityInterceptors(){const t=()=>{this.hudElement&&(this.hudElement.style.opacity="1"),this.hudDimTimer&&clearTimeout(this.hudDimTimer),this.isPlaying&&this.isAutoDimHud&&(this.hudDimTimer=setTimeout(()=>{this.isPlaying&&this.hudElement&&!this.isSettingsOpen&&(this.hudElement.style.opacity="0.22")},2800))};window.addEventListener("mousemove",t,{passive:!0})}createDimmerOverlay(){let t=document.getElementById("sonikoma-theater-dimmer");t||(t=document.createElement("div"),t.id="sonikoma-theater-dimmer",t.className="sonikoma-theater-dimmer sonikoma-hidden",(document.body||document.documentElement).appendChild(t)),this.dimmerElement=t}createSpotlightOverlay(){let t=document.getElementById("sonikoma-cinema-spotlight");t||(t=document.createElement("div"),t.id="sonikoma-cinema-spotlight",t.className="sonikoma-cinema-spotlight sonikoma-hidden",(document.body||document.documentElement).appendChild(t)),this.spotlightElement=t}createSubtitleOverlay(){let t=document.getElementById("sonikoma-cinema-subtitles");t||(t=document.createElement("div"),t.id="sonikoma-cinema-subtitles",t.className="sonikoma-cinema-subtitles sonikoma-hidden",(document.body||document.documentElement).appendChild(t)),this.subtitleElement=t}updateSubtitle(t){if(this.subtitleElement){if(!t){this.subtitleElement.classList.add("sonikoma-hidden"),this.subtitleElement.style.setProperty("display","none","important");return}this.subtitleElement.innerHTML=`
      <span class="sonikoma-sub-icon">🎙️</span>
      <span class="sonikoma-sub-text">${t}</span>
    `,this.subtitleElement.classList.remove("sonikoma-hidden"),this.subtitleElement.style.setProperty("display","flex","important")}}showToast(t){if(!this.toastElement){const e=document.createElement("div");e.id="sonikoma-cinema-toast",e.className="sonikoma-cinema-toast sonikoma-hidden",(document.body||document.documentElement).appendChild(e),this.toastElement=e}this.toastElement.textContent=t,this.toastElement.classList.remove("sonikoma-hidden"),this.toastElement.style.setProperty("display","flex","important"),setTimeout(()=>{this.toastElement&&(this.toastElement.classList.add("sonikoma-hidden"),this.toastElement.style.setProperty("display","none","important"))},2200)}createCinemaHUD(){var e,s,o,n,i,a,c,r,m,u,d,p,h,f,b,w,y,I,_;let t=document.getElementById("sonikoma-cinema-hud");if(!t){t=document.createElement("div"),t.id="sonikoma-cinema-hud",t.className="sonikoma-cinema-hud sonikoma-dock-top sonikoma-hidden",t.innerHTML=`
        <div class="sonikoma-cinema-bar">
          <!-- Drag Handle -->
          <div id="sonikoma-hud-drag-handle" class="sonikoma-drag-handle" title="Drag to move Cinema Bar anywhere">
            ⠿
          </div>

          <!-- Brand Badge -->
          <div class="sonikoma-cinema-brand" title="Sonikoma Immersive Cinema Engine v3.0">
            <span class="sonikoma-cinema-glow-dot"></span>
            <span class="sonikoma-cinema-badge">CINEMA</span>
            <span id="sonikoma-cinema-series" class="sonikoma-cinema-series">Sonikoma Reader</span>
          </div>

          <div class="sonikoma-cinema-divider"></div>

          <!-- Play/Pause Toggle -->
          <button type="button" id="sonikoma-btn-cinema-toggle" class="sonikoma-hud-btn-primary" title="Play / Pause Auto-Scroll (Spacebar)">
            <span id="sonikoma-cinema-icon">⏸</span>
            <span id="sonikoma-cinema-status">Pause</span>
          </button>

          <div class="sonikoma-cinema-divider"></div>

          <!-- Panel Jumper (Prev/Next) -->
          <div class="sonikoma-panel-jumper">
            <button type="button" id="sonikoma-btn-prev-panel" class="sonikoma-hud-btn-mini" title="Previous Panel (←)">⏮</button>
            <span id="sonikoma-panel-readout" class="sonikoma-panel-readout">Scene 1/1</span>
            <button type="button" id="sonikoma-btn-next-panel" class="sonikoma-hud-btn-mini" title="Next Panel (→)">⏭</button>
          </div>

          <div class="sonikoma-cinema-divider"></div>

          <!-- Speed Stepper -->
          <div class="sonikoma-speed-stepper">
            <button type="button" id="sonikoma-btn-speed-minus" class="sonikoma-hud-btn-mini" title="Slow Down (↓)">-</button>
            <span id="sonikoma-speed-readout" class="sonikoma-speed-badge">1.0x</span>
            <button type="button" id="sonikoma-btn-speed-plus" class="sonikoma-hud-btn-mini" title="Speed Up (↑)">+</button>
          </div>

          <div class="sonikoma-cinema-divider"></div>

          <!-- Quick Action Buttons -->
          <!-- Ambient Soundscape Mood Button -->
          <button type="button" id="sonikoma-btn-cinema-bgm" class="sonikoma-hud-icon-btn" title="Ambient Soundscape (M) • Lo-Fi, Rain, Drone, Pulse, Zen">
            <span id="sonikoma-bgm-icon">🎵</span>
          </button>

          <!-- Cinematic Visual Shader -->
          <button type="button" id="sonikoma-btn-cinema-shader" class="sonikoma-hud-icon-btn" title="Cinematic Visual Shaders (C) • OLED, Sepia, Neon, Noir, Amber">
            <span id="sonikoma-shader-icon">🎨</span>
          </button>

          <!-- AI Voice Narrator -->
          <button type="button" id="sonikoma-btn-cinema-voice" class="sonikoma-hud-icon-btn" title="AI Voice Narrator (V) • Hands-Free Speech Reading">
            🎙️
          </button>

          <!-- Spotlight Focus -->
          <button type="button" id="sonikoma-btn-cinema-spotlight" class="sonikoma-hud-icon-btn" title="Toggle Reading Spotlight Focus (L)">
            🔦
          </button>

          <!-- Theater Dimmer -->
          <button type="button" id="sonikoma-btn-cinema-dimmer" class="sonikoma-hud-icon-btn" title="Toggle Theater Dimmer (D)">
            🌑
          </button>

          <!-- Snip Active Scene -->
          <button type="button" id="sonikoma-btn-cinema-snip" class="sonikoma-hud-icon-btn" title="Instant Capture Active Scene (S)">
            ✂️
          </button>

          <!-- Bookmark Active Scene -->
          <button type="button" id="sonikoma-btn-cinema-bookmark" class="sonikoma-hud-icon-btn" title="Bookmark Chapter Position (B)">
            📌
          </button>

          <!-- Fullscreen Toggle -->
          <button type="button" id="sonikoma-btn-cinema-fs" class="sonikoma-hud-icon-btn" title="Toggle Fullscreen Immersion (F)">
            ⛶
          </button>

          <!-- Settings Flyout Toggle -->
          <button type="button" id="sonikoma-btn-cinema-settings" class="sonikoma-hud-icon-btn" title="Cinema Settings & AI Director (⚙️)">
            ⚙️
          </button>

          <!-- Dock Position Flip (Top/Bottom) -->
          <button type="button" id="sonikoma-btn-cinema-dock" class="sonikoma-hud-icon-btn" title="Flip Dock Position (Top / Bottom)">
            ⇅
          </button>

          <!-- Exit Cinema -->
          <button type="button" id="sonikoma-btn-cinema-close" class="sonikoma-hud-btn-danger" title="Exit Cinema Mode (Esc)">
            ✕ Exit
          </button>

          <!-- Bottom Clickable Timeline Scrubber & Live Progress Track -->
          <div id="sonikoma-hud-timeline" class="sonikoma-hud-progress-track" title="Click anywhere to jump to chapter percentage">
            <div id="sonikoma-hud-progress-fill" class="sonikoma-hud-progress-fill" style="width: 0%;"></div>
            <div id="sonikoma-scrubber-tooltip" class="sonikoma-scrubber-tooltip sonikoma-hidden">0%</div>
          </div>
        </div>

        <!-- Settings & AI Director Flyout Drawer -->
        <div id="sonikoma-cinema-flyout" class="sonikoma-cinema-flyout sonikoma-hidden">
          <div id="sonikoma-flyout-drag-header" class="sonikoma-flyout-header" title="Drag to move Settings anywhere">
            <div class="sonikoma-flyout-title-box">
              <span class="sonikoma-drag-icon">⠿</span>
              <span>Cinema Studio Master Controls</span>
            </div>
            <button type="button" id="sonikoma-btn-close-flyout" class="sonikoma-flyout-close">✕</button>
          </div>

          <div class="sonikoma-flyout-row">
            <span class="sonikoma-flyout-label">AI Director Adaptive Pacing</span>
            <button type="button" id="sonikoma-btn-toggle-pacing" class="sonikoma-toggle-switch sonikoma-active">ON</button>
          </div>

          <div class="sonikoma-flyout-row">
            <span class="sonikoma-flyout-label">HUD Auto-Dimming (Immersion)</span>
            <button type="button" id="sonikoma-btn-toggle-autodim" class="sonikoma-toggle-switch sonikoma-active">ON</button>
          </div>

          <div class="sonikoma-flyout-row">
            <span class="sonikoma-flyout-label">Soundscape Mode</span>
            <span id="sonikoma-flyout-soundscape-name" class="sonikoma-flyout-val">Lo-Fi Chords</span>
          </div>

          <div class="sonikoma-flyout-row">
            <span class="sonikoma-flyout-label">Audio Volume</span>
            <input type="range" id="sonikoma-volume-slider" min="0" max="100" value="65" class="sonikoma-slider-input" />
          </div>

          <div class="sonikoma-flyout-row">
            <span class="sonikoma-flyout-label">Visual Shader Filter</span>
            <span id="sonikoma-flyout-shader-name" class="sonikoma-flyout-val">Natural</span>
          </div>

          <div class="sonikoma-flyout-row">
            <span class="sonikoma-flyout-label">AI Voice Narrator</span>
            <span id="sonikoma-flyout-voice-status" class="sonikoma-flyout-val">OFF</span>
          </div>

          <div class="sonikoma-flyout-row">
            <span class="sonikoma-flyout-label">Remaining Reading Time</span>
            <span id="sonikoma-flyout-eta" class="sonikoma-flyout-val">~2 min left</span>
          </div>

          <div class="sonikoma-flyout-shortcuts">
            <span class="sonikoma-shortcut-tag"><kbd>Space</kbd> Play/Pause</span>
            <span class="sonikoma-shortcut-tag"><kbd>↑/↓</kbd> Speed</span>
            <span class="sonikoma-shortcut-tag"><kbd>←/→</kbd> Panel</span>
            <span class="sonikoma-shortcut-tag"><kbd>M</kbd> Music</span>
            <span class="sonikoma-shortcut-tag"><kbd>C</kbd> Shader</span>
            <span class="sonikoma-shortcut-tag"><kbd>V</kbd> Voice</span>
            <span class="sonikoma-shortcut-tag"><kbd>L</kbd> Light</span>
            <span class="sonikoma-shortcut-tag"><kbd>D</kbd> Dimmer</span>
            <span class="sonikoma-shortcut-tag"><kbd>S</kbd> Snip</span>
            <span class="sonikoma-shortcut-tag"><kbd>B</kbd> Bookmark</span>
            <span class="sonikoma-shortcut-tag"><kbd>F</kbd> Fullscreen</span>
          </div>
        </div>
      `,(document.body||document.documentElement).appendChild(t),(e=t.querySelector("#sonikoma-btn-cinema-toggle"))==null||e.addEventListener("click",()=>{this.isPlaying?this.pause():this.play()}),(s=t.querySelector("#sonikoma-btn-cinema-close"))==null||s.addEventListener("click",()=>this.stop()),(o=t.querySelector("#sonikoma-btn-speed-minus"))==null||o.addEventListener("click",()=>this.adjustSpeed(-.25)),(n=t.querySelector("#sonikoma-btn-speed-plus"))==null||n.addEventListener("click",()=>this.adjustSpeed(.25)),(i=t.querySelector("#sonikoma-btn-prev-panel"))==null||i.addEventListener("click",()=>this.jumpToPrevPanel()),(a=t.querySelector("#sonikoma-btn-next-panel"))==null||a.addEventListener("click",()=>this.jumpToNextPanel()),(c=t.querySelector("#sonikoma-btn-cinema-bgm"))==null||c.addEventListener("click",()=>this.cycleSoundscape()),(r=t.querySelector("#sonikoma-btn-cinema-shader"))==null||r.addEventListener("click",()=>this.cycleShader()),(m=t.querySelector("#sonikoma-btn-cinema-voice"))==null||m.addEventListener("click",()=>this.toggleVoiceNarrator()),(u=t.querySelector("#sonikoma-btn-cinema-dimmer"))==null||u.addEventListener("click",()=>this.toggleTheaterDimmer()),(d=t.querySelector("#sonikoma-btn-cinema-spotlight"))==null||d.addEventListener("click",()=>this.toggleSpotlight()),(p=t.querySelector("#sonikoma-btn-cinema-fs"))==null||p.addEventListener("click",()=>this.toggleFullscreen()),(h=t.querySelector("#sonikoma-btn-cinema-snip"))==null||h.addEventListener("click",()=>this.snipActiveScene()),(f=t.querySelector("#sonikoma-btn-cinema-bookmark"))==null||f.addEventListener("click",()=>this.bookmarkActiveScene()),(b=t.querySelector("#sonikoma-btn-cinema-settings"))==null||b.addEventListener("click",()=>this.toggleSettingsFlyout()),(w=t.querySelector("#sonikoma-btn-close-flyout"))==null||w.addEventListener("click",()=>this.toggleSettingsFlyout(!1)),(y=t.querySelector("#sonikoma-btn-cinema-dock"))==null||y.addEventListener("click",()=>this.toggleDockPosition()),(I=t.querySelector("#sonikoma-volume-slider"))==null||I.addEventListener("input",k=>{const S=parseInt(k.target.value,10)/100;this.soundscape.setVolume(S)});const x=t.querySelector("#sonikoma-hud-timeline"),E=t.querySelector("#sonikoma-scrubber-tooltip");this.scrubberTooltipElement=E,x&&E&&(x.addEventListener("mousemove",k=>{const S=x.getBoundingClientRect(),T=Math.max(0,Math.min(1,(k.clientX-S.left)/S.width)),A=Math.round(T*100);E.textContent=`Jump to ${A}%`,E.style.left=`${k.clientX-S.left}px`,E.classList.remove("sonikoma-hidden")}),x.addEventListener("mouseleave",()=>{E.classList.add("sonikoma-hidden")}),x.addEventListener("click",k=>{const S=x.getBoundingClientRect(),T=Math.max(0,Math.min(1,(k.clientX-S.left)/S.width)),A=Math.max(1,(document.documentElement.scrollHeight||document.body.scrollHeight)-window.innerHeight);window.scrollTo({top:T*A,behavior:"smooth"}),this.showToast(`Jumped to ${Math.round(T*100)}%`)})),(_=t.querySelector("#sonikoma-btn-toggle-pacing"))==null||_.addEventListener("click",k=>{this.isAdaptivePacing=!this.isAdaptivePacing,k.target.textContent=this.isAdaptivePacing?"ON":"OFF",this.isAdaptivePacing?k.target.classList.add("sonikoma-active"):k.target.classList.remove("sonikoma-active"),this.showToast(this.isAdaptivePacing?"AI Director Pacing ON":"AI Director Pacing OFF")});const M=t.querySelector("#sonikoma-hud-drag-handle"),B=t.querySelector(".sonikoma-cinema-bar");this.enableDraggable(t,M||B);const N=t.querySelector("#sonikoma-cinema-flyout"),D=t.querySelector("#sonikoma-flyout-drag-header");N&&D&&this.enableDraggable(N,D)}this.hudElement=t}enableDraggable(t,e){e.style.cursor="grab",e.addEventListener("mousedown",s=>{const o=s.target;if(o&&(o.tagName==="BUTTON"||o.tagName==="INPUT"||o.closest("button")||o.classList.contains("sonikoma-flyout-close")))return;s.preventDefault();let n=!0;const i=s.clientX,a=s.clientY,c=t.getBoundingClientRect(),r=c.left,m=c.top;t.style.setProperty("position","fixed","important"),t.style.setProperty("margin","0","important"),t.style.setProperty("transform","none","important"),t.style.setProperty("left",`${r}px`,"important"),t.style.setProperty("top",`${m}px`,"important"),t.style.setProperty("right","auto","important"),t.style.setProperty("bottom","auto","important"),t.classList.remove("sonikoma-dock-top","sonikoma-dock-bottom"),e.style.cursor="grabbing",t.classList.add("sonikoma-dragging"),document.body.style.userSelect="none";const u=p=>{if(!n)return;const h=p.clientX-i,f=p.clientY-a,b=Math.max(10,Math.min(window.innerWidth-t.offsetWidth-10,r+h)),w=Math.max(10,Math.min(window.innerHeight-t.offsetHeight-10,m+f));t.style.setProperty("left",`${b}px`,"important"),t.style.setProperty("top",`${w}px`,"important")},d=()=>{n=!1,e.style.cursor="grab",t.classList.remove("sonikoma-dragging"),document.body.style.userSelect="",window.removeEventListener("mousemove",u),window.removeEventListener("mouseup",d)};window.addEventListener("mousemove",u),window.addEventListener("mouseup",d)})}adjustSpeed(t){const e=[.25,.5,.75,1,1.25,1.5,2,2.5,3];let s=e.findIndex(n=>Math.abs(n-this.scrollSpeed)<.01);s===-1&&(s=3),t>0?s=Math.min(e.length-1,s+1):s=Math.max(0,s-1),this.scrollSpeed=e[s];const o=document.getElementById("sonikoma-speed-readout");o&&(o.textContent=`${this.scrollSpeed}x`),this.showToast(`Speed: ${this.scrollSpeed}x`)}cycleSoundscape(){const t=this.soundscape.cycleMood(),e=document.getElementById("sonikoma-btn-cinema-bgm"),s=document.getElementById("sonikoma-bgm-icon"),o=document.getElementById("sonikoma-flyout-soundscape-name");s&&(s.textContent=t.icon),o&&(o.textContent=t.name),e&&(t.id!=="off"?e.classList.add("sonikoma-active"):e.classList.remove("sonikoma-active")),this.showToast(`Soundscape: ${t.icon} ${t.name}`)}cycleShader(){const e=(C.findIndex(a=>a.id===this.currentShader)+1)%C.length,s=C[e];this.currentShader=s.id;const o=document.documentElement;s.id==="normal"?o.style.filter="":o.style.filter=s.filterCss;const n=document.getElementById("sonikoma-btn-cinema-shader"),i=document.getElementById("sonikoma-flyout-shader-name");i&&(i.textContent=s.name),n&&(s.id!=="normal"?n.classList.add("sonikoma-active"):n.classList.remove("sonikoma-active")),this.showToast(`Shader: ${s.icon} ${s.name}`)}toggleVoiceNarrator(){const t=this.voiceNarrator.toggle(),e=document.getElementById("sonikoma-btn-cinema-voice"),s=document.getElementById("sonikoma-flyout-voice-status");e&&(t?e.classList.add("sonikoma-active"):e.classList.remove("sonikoma-active")),s&&(s.textContent=t?"ON":"OFF"),this.showToast(t?"🎙️ Voice Narrator Active":"🎙️ Voice Narrator Off"),t&&this.narrateCurrentScene()}narrateCurrentScene(){if(!this.voiceNarrator.isActive)return;const t=this.currentPanelIndex+1,e=this.detectedPanels.length||1;this.voiceNarrator.speak(`Entering Scene ${t} of ${e}`)}toggleTheaterDimmer(){this.isDimmed=!this.isDimmed;const t=document.getElementById("sonikoma-btn-cinema-dimmer");this.dimmerElement&&(this.isDimmed?(this.dimmerElement.classList.remove("sonikoma-hidden"),this.dimmerElement.style.setProperty("display","block","important")):(this.dimmerElement.classList.add("sonikoma-hidden"),this.dimmerElement.style.setProperty("display","none","important"))),t&&(this.isDimmed?t.classList.add("sonikoma-active"):t.classList.remove("sonikoma-active")),this.showToast(this.isDimmed?"Theater Dimmer ON":"Theater Dimmer OFF")}toggleSpotlight(){this.isSpotlight=!this.isSpotlight;const t=document.getElementById("sonikoma-btn-cinema-spotlight");this.spotlightElement&&(this.isSpotlight?(this.spotlightElement.classList.remove("sonikoma-hidden"),this.spotlightElement.style.setProperty("display","block","important")):(this.spotlightElement.classList.add("sonikoma-hidden"),this.spotlightElement.style.setProperty("display","none","important"))),t&&(this.isSpotlight?t.classList.add("sonikoma-active"):t.classList.remove("sonikoma-active")),this.showToast(this.isSpotlight?"Spotlight Focus ON":"Spotlight Focus OFF")}toggleFullscreen(){try{document.fullscreenElement?(document.exitFullscreen&&document.exitFullscreen().catch(()=>{}),this.showToast("Fullscreen OFF")):(document.documentElement.requestFullscreen().catch(()=>{}),this.showToast("Fullscreen Immersion ON"))}catch{}}snipActiveScene(){const t=this.currentPanelIndex,e=this.detectedPanels[t];this.showToast(`📸 Captured Scene #${t+1}!`),typeof chrome<"u"&&chrome.runtime&&chrome.runtime.sendMessage&&chrome.runtime.sendMessage({type:"TRIGGER_ACTIVE_SCENE_SNIP",payload:{panelIndex:t+1,src:(e==null?void 0:e.src)||"",url:window.location.href}})}bookmarkActiveScene(){const t=this.currentPanelIndex+1,e=window.scrollY||document.documentElement.scrollTop||0,s=Math.max(1,(document.documentElement.scrollHeight||document.body.scrollHeight)-window.innerHeight),o=Math.round(e/s*100),n={url:window.location.href,title:document.title,scene:t,progress:o,timestamp:Date.now()};typeof chrome<"u"&&chrome.storage&&chrome.storage.local?chrome.storage.local.get("sonikoma_bookmarks",i=>{const a=Array.isArray(i==null?void 0:i.sonikoma_bookmarks)?i.sonikoma_bookmarks:[];a.unshift(n),chrome.storage.local.set({sonikoma_bookmarks:a.slice(0,50)},()=>{this.showToast(`📌 Bookmark saved at Scene ${t} (${o}%)`)})}):this.showToast(`📌 Bookmark saved at Scene ${t} (${o}%)`)}toggleSettingsFlyout(t){const e=document.getElementById("sonikoma-cinema-flyout");e&&(this.isSettingsOpen=typeof t=="boolean"?t:!this.isSettingsOpen,this.isSettingsOpen?(e.classList.remove("sonikoma-hidden"),e.style.setProperty("display","flex","important")):(e.classList.add("sonikoma-hidden"),e.style.setProperty("display","none","important")))}toggleDockPosition(){this.isDockTop=!this.isDockTop,this.hudElement&&(this.hudElement.style.removeProperty("left"),this.hudElement.style.removeProperty("top"),this.hudElement.style.removeProperty("right"),this.hudElement.style.removeProperty("bottom"),this.hudElement.style.removeProperty("transform"),this.hudElement.style.removeProperty("margin"),this.isDockTop?(this.hudElement.classList.remove("sonikoma-dock-bottom"),this.hudElement.classList.add("sonikoma-dock-top")):(this.hudElement.classList.remove("sonikoma-dock-top"),this.hudElement.classList.add("sonikoma-dock-bottom"))),this.showToast(this.isDockTop?"Docked to Top":"Docked to Bottom")}jumpToNextPanel(){(!this.detectedPanels||this.detectedPanels.length===0)&&this.refreshPanels();const t=window.scrollY+120,e=this.detectedPanels.findIndex(s=>s.top>t);e!==-1&&(this.currentPanelIndex=e,window.scrollTo({top:this.detectedPanels[e].top-80,behavior:"smooth"}),this.updatePanelReadout(),this.voiceNarrator.isActive&&this.voiceNarrator.speak(`Scene ${e+1}`))}jumpToPrevPanel(){(!this.detectedPanels||this.detectedPanels.length===0)&&this.refreshPanels();const t=window.scrollY-100;let e=-1;for(let s=this.detectedPanels.length-1;s>=0;s--)if(this.detectedPanels[s].top<t){e=s;break}e!==-1?(this.currentPanelIndex=e,window.scrollTo({top:Math.max(0,this.detectedPanels[e].top-80),behavior:"smooth"}),this.updatePanelReadout(),this.voiceNarrator.isActive&&this.voiceNarrator.speak(`Scene ${e+1}`)):window.scrollTo({top:0,behavior:"smooth"})}refreshPanels(){var t,e;(t=this.scanner)!=null&&t.scanChapterImages&&(this.detectedPanels=this.scanner.scanChapterImages()),(e=this.scanner)!=null&&e.scanChapterImagesAsync&&this.scanner.scanChapterImagesAsync().then(s=>{s&&s.length>0&&(this.detectedPanels=s,this.updatePanelReadout())}).catch(()=>{})}updatePanelReadout(){const t=document.getElementById("sonikoma-panel-readout");if(t){const e=this.detectedPanels.length||1,s=Math.min(e,this.currentPanelIndex+1);t.textContent=`Scene ${s}/${e}`}}updateStatusBadge(t,e){const s=document.getElementById("sonikoma-cinema-status"),o=document.getElementById("sonikoma-cinema-icon");s&&(s.textContent=t),o&&(o.textContent=e)}triggerNextChapterPrompt(){var o;if(this.nextChapterBanner)return;const t=document.createElement("div");t.id="sonikoma-next-chapter-banner",t.className="sonikoma-next-chapter-banner",this.nextChapterCountdown=6;const s=(()=>{const n=Array.from(document.querySelectorAll("a"));for(const a of n){const c=(a.textContent||"").toLowerCase(),r=a.getAttribute("href")||"";if((c.includes("next chapter")||c.includes("next episode")||c.includes("next >")||a.className.includes("next"))&&r&&!r.startsWith("#")&&!r.startsWith("javascript"))return a.href}const i=window.location.href.match(/(chapter|ep|episode)[-_/](\d+)/i);if(i){const a=parseInt(i[2],10)+1;return window.location.href.replace(i[0],`${i[1]}-${a}`)}return""})();t.innerHTML=`
      <div class="sonikoma-next-content">
        <span class="sonikoma-next-title">🎉 Chapter Finished!</span>
        <span id="sonikoma-next-timer" class="sonikoma-next-subtitle">
          ${s?'Auto-advancing to Next Chapter in <strong id="sk-countdown">6</strong>s...':"You have reached the end of this chapter."}
        </span>
      </div>
      <div class="sonikoma-next-actions">
        ${s?`<a href="${s}" id="sonikoma-btn-read-next" class="sonikoma-btn-next-act">Next Chapter ➔</a>`:""}
        <button type="button" id="sonikoma-btn-cancel-next" class="sonikoma-btn-cancel-act">Stay Here</button>
      </div>
    `,(document.body||document.documentElement).appendChild(t),this.nextChapterBanner=t,(o=t.querySelector("#sonikoma-btn-cancel-next"))==null||o.addEventListener("click",()=>{this.cancelNextChapterCountdown()}),s&&(this.nextChapterTimerId=setInterval(()=>{this.nextChapterCountdown--;const n=document.getElementById("sk-countdown");n&&(n.textContent=`${this.nextChapterCountdown}`),this.nextChapterCountdown<=0&&(clearInterval(this.nextChapterTimerId),window.location.href=s)},1e3))}cancelNextChapterCountdown(){this.nextChapterTimerId&&(clearInterval(this.nextChapterTimerId),this.nextChapterTimerId=null),this.nextChapterBanner&&(this.nextChapterBanner.remove(),this.nextChapterBanner=null)}start(){var t;if(this.createCinemaHUD(),this.createDimmerOverlay(),this.createSpotlightOverlay(),this.createSubtitleOverlay(),this.hudElement&&(this.hudElement.classList.remove("sonikoma-hidden"),this.hudElement.style.setProperty("display","block","important"),this.hudElement.style.setProperty("visibility","visible","important"),this.hudElement.style.setProperty("opacity","1","important"),this.hudElement.style.setProperty("z-index","2147483647","important")),this.refreshPanels(),this.updatePanelReadout(),(t=this.scanner)!=null&&t.extractPageMetadata){const e=this.scanner.extractPageMetadata(),s=document.getElementById("sonikoma-cinema-series");s&&(s.textContent=e.seriesTitle||"Sonikoma Reader")}this.soundscape.currentMood==="off"&&this.cycleSoundscape(),this.isPlaying=!0,this.updateStatusBadge("Pause","⏸"),this.lastTimestamp=performance.now(),this.subpixelAccumulator=0,this.loop(this.lastTimestamp)}play(){this.isPlaying=!0,this.isTemporarilyPausedForUser=!1,this.updateStatusBadge("Pause","⏸"),this.lastTimestamp=performance.now(),this.loop(this.lastTimestamp)}pause(){this.isPlaying=!1,this.updateStatusBadge("Play","▶"),this.animationFrameId&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null)}stop(){this.pause(),this.soundscape.stop(),this.voiceNarrator.stop(),this.toggleSettingsFlyout(!1),this.cancelNextChapterCountdown(),document.documentElement.style.filter="",this.hudElement&&(this.hudElement.classList.add("sonikoma-hidden"),this.hudElement.style.setProperty("display","none","important")),this.dimmerElement&&(this.dimmerElement.classList.add("sonikoma-hidden"),this.dimmerElement.style.setProperty("display","none","important"),this.isDimmed=!1),this.spotlightElement&&(this.spotlightElement.classList.add("sonikoma-hidden"),this.spotlightElement.style.setProperty("display","none","important"),this.isSpotlight=!1),this.subtitleElement&&(this.subtitleElement.classList.add("sonikoma-hidden"),this.subtitleElement.style.setProperty("display","none","important"))}loop(t){if(!this.isPlaying)return;this.lastTimestamp||(this.lastTimestamp=t);const e=Math.min(.1,(t-this.lastTimestamp)/1e3);if(this.lastTimestamp=t,!this.isTemporarilyPausedForUser){let s=this.scrollSpeed;const o=window.scrollY||document.documentElement.scrollTop||0,n=Math.max(1,(document.documentElement.scrollHeight||document.body.scrollHeight)-window.innerHeight);if(this.isAdaptivePacing&&this.detectedPanels.length>0){const h=this.detectedPanels.findIndex(f=>Math.abs(f.top-(o+100))<70);h!==-1&&h!==this.lastPausedPanelIdx?this.panelPauseTimer<1.2?(this.panelPauseTimer+=e,s=this.scrollSpeed*.35):(this.lastPausedPanelIdx=h,this.panelPauseTimer=0,this.voiceNarrator.isActive&&this.lastNarratedPanelIdx!==h&&(this.lastNarratedPanelIdx=h,this.voiceNarrator.speak(`Scene ${h+1}`))):this.panelPauseTimer=0}const i=this.baseSpeedPxPerSec*s*e;this.subpixelAccumulator+=i;const a=Math.floor(this.subpixelAccumulator);a>=1&&(this.subpixelAccumulator-=a,window.scrollBy(0,a));const c=Math.min(100,Math.max(0,Math.round(o/n*100))),r=document.getElementById("sonikoma-hud-progress-fill");r&&(r.style.width=`${c}%`);const m=Math.max(0,n-o),u=Math.round(m/Math.max(1,this.baseSpeedPxPerSec*this.scrollSpeed)),d=Math.ceil(u/60),p=document.getElementById("sonikoma-flyout-eta");if(p&&(p.textContent=d>1?`~${d} min left (${c}%)`:`< 1 min left (${c}%)`),this.detectedPanels.length>0){const h=this.detectedPanels.findIndex(f=>f.top>o+150);h!==-1&&h!==this.currentPanelIndex&&(this.currentPanelIndex=Math.max(0,h-1),this.updatePanelReadout())}if(o>=n-20){this.pause(),this.updateStatusBadge("Finished","✓"),this.showToast("🎉 Chapter Completed!"),this.triggerNextChapterPrompt();return}}this.animationFrameId=requestAnimationFrame(s=>this.loop(s))}}typeof window<"u"&&(window.CinemaPlayer=L);(()=>{if(window.__sonikoma_content_orchestrator_loaded)return;window.__sonikoma_content_orchestrator_loaded=!0;let g=null;function t(){return g||(g=new L(v)),g}setTimeout(()=>{try{const e=v.scanChapterImages(),s=v.extractPageMetadata();e&&e.length>=2&&chrome.runtime.sendMessage({type:"TRACK_CHAPTER_READ",payload:{seriesName:s.seriesTitle,chapterTitle:s.chapterTitle,chapterUrl:window.location.href,siteDomain:window.location.hostname}})}catch{}},1200),chrome.runtime.onMessage.addListener((e,s,o)=>{const{type:n}=e||{};if(n==="PING")return o({status:"PONG"}),!0;if(n==="TRIGGER_CINEMA_MODE"||n==="START_CINEMA"||n==="TOGGLE_CINEMA"){try{t().start(),o({success:!0,isPlaying:!0})}catch(i){o({success:!1,error:(i==null?void 0:i.message)||String(i)})}return!0}if(n==="STOP_CINEMA")return g&&g.stop(),o({success:!0}),!0;if(n==="GET_READER_STATS"||n==="GET_CHAPTER_DATA"||n==="GET_IMAGES"||n==="SCAN_CHAPTER")return(async()=>{try{const i=await v.scanChapterImagesAsync(),a=v.extractPageMetadata();o({success:!0,panelCount:i.length,seriesTitle:a.seriesTitle,chapterTitle:a.chapterTitle,url:window.location.href,domain:window.location.hostname,images:i.map((c,r)=>({index:r+1,src:c.src,width:c.width,height:c.height,top:c.top})),panels:i,meta:a})}catch(i){o({success:!1,error:(i==null?void 0:i.message)||String(i),images:[],panels:[],panelCount:0})}})(),!0})})();
