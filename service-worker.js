// Minimal offline cache for PWA shell.
const CACHE = 'chore-cache-v1';
const ASSETS = [
'./',
'./index.html',
'./styles.css',
'./app.js',
'./manifest.webmanifest'
];


self.addEventListener('install', (e)=>{
e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
self.skipWaiting();
});
self.addEventListener('activate', (e)=>{
e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
self.clients.claim();
});
self.addEventListener('fetch', (e)=>{
const req = e.request;
e.respondWith(
caches.match(req).then(res => res || fetch(req).then(network => {
// Cache-bust only same-origin GETs
if (req.method === 'GET' && new URL(req.url).origin === location.origin) {
const copy = network.clone();
caches.open(CACHE).then(c=>c.put(req, copy));
}
return network;
}).catch(()=> caches.match('./index.html')))
);
});
