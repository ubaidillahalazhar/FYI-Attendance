export const OFFICE_COORDS = {
  lat: Number(import.meta.env.VITE_OFFICE_LAT || -6.3017),
  lng: Number(import.meta.env.VITE_OFFICE_LNG || 107.1705),
  radiusMeters: Number(import.meta.env.VITE_OFFICE_RADIUS_METERS || 150),
  name: 'HQ Office — Corporate Tower',
};

/**
 * Haversine formula to calculate distance between two GPS coordinates in meters.
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Request live browser geolocation and validate against office radius.
 */
export function checkRealBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung oleh browser ini.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = calculateDistanceMeters(
          latitude,
          longitude,
          OFFICE_COORDS.lat,
          OFFICE_COORDS.lng
        );
        resolve({
          lat: latitude,
          lng: longitude,
          distance,
          isInside: distance <= OFFICE_COORDS.radiusMeters,
        });
      },
      (err) => {
        reject(new Error(err.message || 'Gagal mengakses izin GPS browser.'));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
