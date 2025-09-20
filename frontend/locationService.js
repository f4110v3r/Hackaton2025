import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app requires access to your location.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  } else {
    return true;
  }
}

export function getCurrentLocation(successCallback, errorCallback) {
  Geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      successCallback({ latitude, longitude });
    },
    (error) => {
      errorCallback(error.message);
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
  );
}

export function startWatchPosition(successCallback, errorCallback) {
  const watchId = Geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      successCallback({ latitude, longitude });
    },
    (error) => {
      errorCallback(error.message);
    },
    { enableHighAccuracy: true, distanceFilter: 0, interval: 5000, fastestInterval: 2000 }
  );
  return watchId;
}

export function stopWatchPosition(watchId) {
  if (watchId != null) {
    Geolocation.clearWatch(watchId);
  }
}