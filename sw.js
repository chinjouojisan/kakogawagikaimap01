// 加古川市議会マップ Service Worker
// 更新したら VERSION を上げると、古いキャッシュが自動で消えます
const VERSION = 'v5';
const CACHE = 'kakogawa-gate-' + VERSION;
const SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'ogp.png', 'kakomo.png', 'icon.png', 'icon-192.png', 'icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('kakogawa-gate-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  // 他サイト（5つのリンク先・Googleフォント）には介入しない
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // ページ本体: ネットワーク優先、失敗したらキャッシュ
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('index.html', copy));
        return res;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }

  // 画像などの静的ファイル: キャッシュ優先＋裏で更新
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
