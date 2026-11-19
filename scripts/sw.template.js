// 서비스 워커 템플릿 (빌드할 때 vite.config.ts 의 pwa() 가 아래 두 자리 표시자를 채운다)
// 전략: 설치할 때 모든 파일을 캐시 → 코드·그림은 캐시 우선, 화면(index.html)은 네트워크 우선. 새 버전이 배포되면 캐시 이름이 바뀌어 교체된다.
const CACHE = 'undercover-__VERSION__';
const URLS = __URLS__;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('undercover-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // 화면(index.html)은 항상 네트워크를 먼저 확인해서 새 버전이 바로 보이게 한다. 오프라인일 때만 저장해 둔 것을 쓴다.
  // (파일 이름에 해시가 붙은 코드·그림은 아래처럼 캐시 우선)
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req.url, { cache: 'no-cache' }).catch(() => caches.match('./')));
    return;
  }
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).catch(() => (req.mode === 'navigate' ? caches.match('./') : Response.error())),
    ),
  );
});
