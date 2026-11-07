// 先返回缓存（离线可用），同时后台联网更新缓存；下次打开即为新版本。
// waitUntil 在事件处理函数里同步调用（iOS Safari 对异步调用不宽容）。
// 发布时改 C 的版本号可以强制清掉旧缓存。
const C = "llm-sizer-v4";
const F = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(F)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === "navigate";
  const key = isPage ? "./" : req;
  const cached = caches.match(key, { ignoreSearch: true });
  const network = fetch(req).then(res => {
    if (res && res.ok && !res.redirected) {
      const copy = res.clone();
      return caches.open(C).then(c => c.put(key, copy)).then(() => res);
    }
    return res;
  });
  e.respondWith(cached.then(hit => hit || network.catch(() => caches.match("./"))));
  e.waitUntil(network.then(() => {}, () => {}));
});
