// frontend/locationService.js
import { PermissionsAndroid } from 'react-native';

// Запрос разрешений на Android
export async function requestLocationPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Разрешение на доступ к геолокации',
        message: 'Приложению нужен доступ к вашей геолокации для отображения положения на карте.',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
}

// Получение текущей позиции
export function getCurrentLocation(success, error) {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      success(position.coords);
    },
    (err) => {
      if (error) error(err);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
  );
}

// Запуск слежения за позицией
export function startWatchPosition(onUpdate, onError) {
  if (!navigator.geolocation) return null;
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onUpdate(position.coords);
    },
    (err) => {
      if (onError) onError(err);
    },
    { enableHighAccuracy: true, distanceFilter: 5, interval: 5000, fastestInterval: 2000 }
  );
  return watchId;
}

// Остановка слежения
export function stopWatchPosition(watchId) {
  if (navigator.geolocation && watchId != null) {
    navigator.geolocation.clearWatch(watchId);
  }
}