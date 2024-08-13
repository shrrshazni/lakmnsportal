// The service worker script

self.addEventListener('push', event => {
    const data = event.data.json();
  
    const options = {
      body: data.message,
      icon: '/assets/img/icons/all-night.png',
      badge: '/assets/img/team/avatar.webp',
      data: {
        url: data.url
      }
    };
  
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  });
  
  self.addEventListener('notificationclick', event => {
    const url = event.notification.data.url;
  
    event.notification.close();
  
    event.waitUntil(
      clients.openWindow(url)
    );
  });
  
