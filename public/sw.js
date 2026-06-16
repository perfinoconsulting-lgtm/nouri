const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

const TTL_30_JOURS = 30 * 24 * 60 * 60 * 1000;
const TTL_1H = 60 * 60 * 1000;

// Ressources à précacher au install
const PRECACHE_URLS = [
  '/',
  '/tarifs',
  '/a-propos',
  '/offline.html',
  '/manifest.json',
];

// Routes jamais mises en cache
const NEVER_CACHE = [
  '/api/stripe',
  '/api/auth',
  '/admin',
];

// Stockage IndexedDB pour la sync queue offline
const DB_NAME = 'Lisani-sync';
const DB_STORE = 'progress-queue';

function ouvrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(DB_STORE, { autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

async function ajouterALaQueue(requete) {
  const db = await ouvrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).add({
      url: requete.url,
      method: requete.method,
      body: requete.body,
      headers: Object.fromEntries(requete.headers.entries()),
      timestamp: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function rejouerQueue() {
  const db = await ouvrirDB();
  const tx = db.transaction(DB_STORE, 'readwrite');
  const store = tx.objectStore(DB_STORE);
  const items = await new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });
  const keys = await new Promise((resolve) => {
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result);
  });

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      store.delete(keys[i]);
    } catch {
      // Garder dans la queue si la requête échoue encore
    }
  }
}

// Vérifie si une URL est dans la liste des routes jamais cachées
function jamaisCacher(url) {
  return NEVER_CACHE.some((path) => url.pathname.startsWith(path));
}

// Vérifie si le cache est encore valide selon TTL
function cacheValide(response, ttl) {
  if (!response) return false;
  const dateHeader = response.headers.get('sw-cached-at');
  if (!dateHeader) return true; // Pas de date = considéré valide
  return Date.now() - parseInt(dateHeader, 10) < ttl;
}

// Enveloppe la réponse avec un header de timestamp
async function cacherAvecDate(cache, requete, reponse) {
  const headers = new Headers(reponse.headers);
  headers.set('sw-cached-at', String(Date.now()));
  const reponseHorodatee = new Response(await reponse.clone().arrayBuffer(), {
    status: reponse.status,
    statusText: reponse.statusText,
    headers,
  });
  cache.put(requete, reponseHorodatee);
}

// INSTALL — précacher les ressources essentielles
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ACTIVATE — supprimer les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// FETCH — routage des stratégies de cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorer les requêtes non-HTTP et les routes sensibles
  if (!url.protocol.startsWith('http')) return;
  if (jamaisCacher(url)) return;

  // Assets statiques et données alphabet → Cache First (30j)
  if (
    url.pathname.match(/\.(svg|png|jpg|jpeg|webp|woff2?|ttf|ico)$/) ||
    url.pathname.startsWith('/lib/data') ||
    url.pathname.startsWith('/_next/static')
  ) {
    event.respondWith(strategieCacheFirst(event.request, STATIC_CACHE, TTL_30_JOURS));
    return;
  }

  // API progress et review → Network First + fallback cache (1h)
  if (
    url.pathname.startsWith('/api/progress') ||
    url.pathname.startsWith('/api/review')
  ) {
    if (event.request.method === 'GET') {
      event.respondWith(strategieNetworkFirst(event.request, API_CACHE, TTL_1H));
    } else {
      // POST offline → stocker dans IndexedDB
      event.respondWith(strategiePostOffline(event.request));
    }
    return;
  }

  // Pages statiques → Stale While Revalidate
  if (
    event.request.mode === 'navigate' &&
    ['/', '/tarifs', '/a-propos'].includes(url.pathname)
  ) {
    event.respondWith(strategieStaleWhileRevalidate(event.request, DYNAMIC_CACHE));
    return;
  }

  // Navigation vers des pages non cachées → Network avec fallback offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Tout le reste → Network First simple
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Cache First : sert depuis le cache, va chercher sur le réseau si absent ou expiré
async function strategieCacheFirst(requete, nomCache, ttl) {
  const cache = await caches.open(nomCache);
  const cached = await cache.match(requete);
  if (cached && cacheValide(cached, ttl)) return cached;

  try {
    const reponse = await fetch(requete);
    if (reponse.ok) await cacherAvecDate(cache, requete, reponse);
    return reponse;
  } catch {
    if (cached) return cached;
    throw new Error('Ressource introuvable en cache et hors ligne');
  }
}

// Network First : essaie le réseau, tombe sur le cache si offline
async function strategieNetworkFirst(requete, nomCache, ttl) {
  const cache = await caches.open(nomCache);
  try {
    const reponse = await fetch(requete);
    if (reponse.ok) await cacherAvecDate(cache, requete, reponse);
    return reponse;
  } catch {
    const cached = await cache.match(requete);
    if (cached && cacheValide(cached, ttl)) return cached;
    return new Response(JSON.stringify({ error: 'Hors ligne', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Stale While Revalidate : sert depuis le cache et met à jour en arrière-plan
async function strategieStaleWhileRevalidate(requete, nomCache) {
  const cache = await caches.open(nomCache);
  const cached = await cache.match(requete);

  const promesseReseau = fetch(requete).then(async (reponse) => {
    if (reponse.ok) await cacherAvecDate(cache, requete, reponse);
    return reponse;
  });

  return cached || promesseReseau;
}

// POST offline : stocker dans IndexedDB et retourner une réponse optimiste
async function strategiePostOffline(requete) {
  try {
    return await fetch(requete);
  } catch {
    // Cloner avant de lire le body
    const clone = requete.clone();
    const body = await clone.text();
    await ajouterALaQueue({
      url: requete.url,
      method: requete.method,
      body,
      headers: requete.headers,
    });
    return new Response(JSON.stringify({ queued: true, offline: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// SYNC — rejouer la queue quand la connexion revient
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(rejouerQueue());
  }
});

// PUSH — notifications push
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: data.tag,
      data: { url: data.url },
      actions: [
        { action: 'play', title: 'Jouer maintenant' },
        { action: 'later', title: 'Plus tard' },
      ],
    })
  );
});

// NOTIFICATIONCLICK — ouvrir l'app au clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'later') return;
  const url = event.notification.data.url;
  event.waitUntil(clients.openWindow(url));
});
