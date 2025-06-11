self.addEventListener('install', () => {
    self.skipWaiting();
});
self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'detay') {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                for (const client of clientList) {
                    if (client.url && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    }
});