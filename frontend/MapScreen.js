import { Yamap, Placemark } from 'react-native-yamap'; // ИСПРАВЛЕН ИМПОРТ
import { Sidebar } from './Sidebar';
import * as Location from 'expo-location';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';

export function MapScreen() {
  const [markers, setMarkers] = useState([
    { id: '1', title: 'Опасный объект', coordinate: { latitude: 55.751244, longitude: 37.618423 } },
  ]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    let subscription = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 1 },
        (loc) => {
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      );
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  // Динамическое добавление маркеров
  useEffect(() => {
    const interval = setInterval(() => {
      if (!userLocation) return;
      setMarkers(prev => [
        ...prev,
        {
          id: String(prev.length + 1),
          title: 'Новый объект',
          coordinate: {
            latitude: userLocation.latitude + Math.random() * 0.01,
            longitude: userLocation.longitude + Math.random() * 0.01,
          }
        }
      ]);
    }, 10000);

    return () => clearInterval(interval);
  }, [userLocation]);

  return (
    <View style={styles.container}>
      <Yamap
        style={styles.map}
        apiKey="YOUR_YANDEX_API_KEY"
        camera={{
          target: userLocation || { latitude: 55.751244, longitude: 37.618423 },
          zoom: 10,
        }}
      >
        {markers.map(marker => (
          <Placemark key={marker.id} point={marker.coordinate} /> // ИСПОЛЬЗУЕТСЯ КАК ОТДЕЛЬНЫЙ ТЕГ
        ))}
        {userLocation && (
          <Placemark point={userLocation} /> // ИСПОЛЬЗУЕТСЯ КАК ОТДЕЛЬНЫЙ ТЕГ
        )}
      </Yamap>

      {/* Отладочный оверлей */}
      {userLocation && (
        <View style={styles.debugOverlay}>
          <Text style={styles.debugText}>Lat: {userLocation.latitude.toFixed(6)}</Text>
          <Text style={styles.debugText}>Lng: {userLocation.longitude.toFixed(6)}</Text>
        </View>
      )}

      {/* Сайдбар */}
      <Sidebar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  debugOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 5,
    zIndex: 10,
  },
  debugText: { color: 'white', fontSize: 12 },
});