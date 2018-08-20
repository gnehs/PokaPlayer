// install
self.addEventListener('install', event => {
    // 如果監聽到了 service worker 已經安裝成功的話，就會調用 event.waitUntil 回調函數
    event.waitUntil(
        // 安裝成功後操作 CacheStorage 快取，使用之前需要先通過 caches.open() 打開對應快取空間。
        caches.open('PokaPlayer').then(function(cache) {
            // 通過 cache 快取對象的 addAll 方法添加 precache 快取
            return cache.addAll([
                '/',
                '/css/style.css',
                '/js/api.js',
                '/js/base64.js',
                '/js/color-theme.js',
                '/js/login.js',
                '/js/lyrics.min.js',
                '/js/navigo.min.js',
                '/js/script.js',
                '/js/setting.js',
                '/js/template.js',
                '/socket.io/socket.io.js',
                '/img/PokaPlayer.jpg'
            ]);
        })
    );
});



self.addEventListener('fetch', function(event) {
    //console.log(event.request)
    if (event.request.destination != "audio" && event.request.method == "GET" && !event.request.url.match(/socket.io|meting|info|ping|github|login/))
        event.respondWith(
            caches.match(event.request).then(function(response) {
                // 擷取 HTTP 請求
                // 如果 Service Worker 有 response，直接 response，減少一次 http 請求
                if (response) return response;

                // 如果 service worker 沒有 response，那就得直接請求真實遠端服務
                var request = event.request.clone(); // 把原始請求拷過來
                return fetch(request).then(httpRes => {
                    // 已擷取 http 請求

                    // 請求失敗了，直接返回失敗的結果就好了。。
                    if (!httpRes || httpRes.status !== 200) {
                        return httpRes;
                    }

                    // 請求成功的話，將請求快取起來。
                    var responseClone = httpRes.clone();
                    caches.open('PokaPlayer').then(function(cache) {
                        cache.put(event.request, responseClone);
                    });

                    return httpRes;
                });
            })
        );
});