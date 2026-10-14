export function getCurrentLocation(options = {}) {
  if (!navigator.geolocation) return Promise.reject(Object.assign(new Error('Geolocation is unavailable.'), { code: 'UNAVAILABLE' }));
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      reject,
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000, ...options }
    );
  });
}
