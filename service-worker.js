/* Catholic Companion v69 — offline shell and versioned app updates. */
const CACHE_PREFIX='catholic-companion-release-';
const CACHE_NAME=CACHE_PREFIX+'v69';
const APP_SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key))))
   .then(()=>self.clients.claim())
 );
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return; // Live readings and Bible content use their own network/DB.
 if(request.mode==='navigate'){
  event.respondWith((async()=>{
   try{
    const response=await fetch(request,{cache:'no-store'});
    if(response.ok&&response.type==='basic'){
     const copy=response.clone();
     event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy)).catch(()=>{}));
    }
    return response;
   }catch(_){
    const cached=await caches.match('./index.html');
    return cached||Response.error();
   }
  })());
  return;
 }
 event.respondWith(caches.match(request).then(async cached=>{
  if(cached)return cached;
  const response=await fetch(request);
  if(response.ok&&response.type==='basic'){
   const copy=response.clone();
   event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)).catch(()=>{}));
  }
  return response;
 }));
});
