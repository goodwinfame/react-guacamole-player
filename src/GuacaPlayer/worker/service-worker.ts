const CACHE_NAME = 'console-player';

const sw = self as ServiceWorkerGlobalScope;

sw.addEventListener('install', (event) => {
    console.log("installed")
});

sw.addEventListener('fetch', (event: FetchEvent)=>{
    console.log("fetch")

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                return fetch(event.request).then((response) => {
                        // Check if we received a valid response
                        if (!response || (response.status !== 200 && response.status !== 206) || (response.type !== 'basic' && response.type !== "cors")) {
                            return response;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        var responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(function (cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});
