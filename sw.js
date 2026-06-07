const CACHE_NAME = 'backrooms-td-v2';

// 需要缓存的资源列表（所有同源文件）
const PRE_CACHE_URLS = [
  './',
  'index.html',
  'manifest.json'
];

// 安装时缓存核心文件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRE_CACHE_URLS))
  );
  self.skipWaiting();
});

// 激活时删除旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// 请求拦截：缓存优先，网络更新
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      // 发起网络请求更新缓存
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // 只缓存同源请求
        if (networkResponse && networkResponse.status === 200 &&
            event.request.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});