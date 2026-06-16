# Skill : PWA (Progressive Web App)

## Quand lire ce skill
Avant toute configuration Service Worker, manifest, ou cache.

## Manifest requis
```json
{
  "name": "NourAl — Apprendre l'Arabe",
  "short_name": "NourAl",
  "description": "Apprends l'arabe avec ta famille",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1A3A5C",
  "theme_color": "#F5A623",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "shortcuts": [
    { "name": "Apprendre", "url": "/jouer", "icons": [{"src": "/icons/icon-96.png", "sizes": "96x96"}] },
    { "name": "Réviser", "url": "/reviser", "icons": [{"src": "/icons/icon-96.png", "sizes": "96x96"}] }
  ]
}
```

## Stratégies de cache par ressource
| Ressource | Stratégie | TTL |
|-----------|-----------|-----|
| Pages statiques (/, /tarifs) | Cache First | 24h |
| Assets (SVG, fonts) | Cache First | 30 jours |
| API /api/progress | Network First + fallback | 1h |
| Données alphabet /lib/data | Cache First | 30 jours |
| API Supabase | Network First | pas de cache |

## Mode offline
- Alphabet complet → disponible sans internet
- QCM déjà vus → accessibles offline
- Progression offline → stockée en localStorage → sync au retour réseau
- Page offline.html → si aucune ressource en cache

## Service Worker — événements clés
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: data.tag,
      data: { url: data.url },
      actions: [
        { action: 'play', title: 'Jouer maintenant' },
        { action: 'later', title: 'Plus tard' }
      ]
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'later') return
  const url = event.notification.data.url
  event.waitUntil(clients.openWindow(url))
})
```

## Meta tags dans layout.tsx
```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#F5A623" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="NourAl" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

## VAPID Keys (notifications push)
```bash
# Générer les clés une seule fois
npx web-push generate-vapid-keys
# Copier dans .env.local :
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=
# VAPID_PRIVATE_KEY=
# VAPID_EMAIL=mailto:contact@https://maghribdelice.com
```

## Install prompt
- Afficher APRÈS 3 sessions (pas à la première visite)
- Notre modal AVANT le prompt natif du navigateur
- Si refusé → ne pas redemander avant 7 jours (localStorage)
- Bouton dans le header après installation : "📱 App installée ✓"

## Pièges à éviter
- Ne pas enregistrer le SW sur les routes /api/* → interférence webhooks
- Ne pas cacher les réponses Stripe → données sensibles
- Le SW ne peut pas accéder aux cookies Supabase → auth côté client seulement
- iOS Safari : pas de Web Push avant iOS 16.4
