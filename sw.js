// 先返回缓存（离线可用），同时后台联网更新缓存；下次打开即为新版本。
// 发布时改 C 的版本号可以强制清掉旧缓存。
const C = "llm-sizer-v2";
const F = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", e => e.waitUntil(caches.open(C).then(c => c.addAll(F)).then(() => self.skipWaiting())));

self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())
));

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(C).then(c => c.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req, { cache: "no-cache" }).then(res => {
      if (res && res.ok) c.put(req.mode === "navigate" ? "./" : req, res.clone());
      return res;
    }).catch(() => hit);
    if (hit) { e.waitUntil(net); return hit; }
    return net.then(r => r || c.match("./"));
  })));
});
