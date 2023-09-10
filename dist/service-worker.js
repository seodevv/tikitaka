self.addEventListener('push', (event) => {
  const { title, body, image } = event.data.json();
  const options = {
    body,
    icon: image ? image : 'https://seodevv.github.io/tikitaka-mini.png',
    badge: 'https://seodevv.github.io/tikitaka-mini.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
