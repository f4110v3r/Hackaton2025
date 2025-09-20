import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Sidebar from './Sidebar';
import * as Location from 'expo-location';

export function MapScreen() {
  const [markers, setMarkers] = useState([
    { id: '1', title: 'Опасный объект', description: 'Скорость: 1200 м/с', coordinate: { latitude: 55.751244, longitude: 37.618423 } },
    { id: '2', title: 'Пир-сосед', description: 'Активен', coordinate: { latitude: 55.752, longitude: 37.615 } },
    { id: '3', title: 'Датчик', description: 'Активен', coordinate: { latitude: 55.752, longitude: 37.615 } }
  ]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    let subscription = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation(null);
        return;
      }
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
      if (subscription) {
        subscription.remove();
      }
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
          description: 'Появился недавно',
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
      <MapView
        style={styles.map}
        region={{
          latitude: userLocation ? userLocation.latitude : 55.751244,
          longitude: userLocation ? userLocation.longitude : 37.618423,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        }}
      >
        {markers.map(marker => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
          />
        ))}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Вы здесь"
            pinColor="green"
          />
        )}
      </MapView>

      {/* Отладочный оверлей с координатами пользователя */}
      {userLocation && (
        <View style={styles.debugOverlay}>
          <Text style={styles.debugText}>Lat: {userLocation.latitude.toFixed(6)}</Text>
          <Text style={styles.debugText}>Lng: {userLocation.longitude.toFixed(6)}</Text>
        </View>
      )}

      {/* Сайдбар поверх карты */}
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
  debugText: {
    color: 'white',
    fontSize: 12,
  },
});