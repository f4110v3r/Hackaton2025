import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Sidebar from './Sidebar';
import { requestLocationPermission, getCurrentLocation, startWatchPosition, stopWatchPosition } from './locationService';

export function MapScreen() {
  const [markers, setMarkers] = useState([
    { id: '1', title: 'Опасный объект', description: 'Скорость: 1200 м/с', coordinate: { latitude: 55.751244, longitude: 37.618423 } },
    { id: '2', title: 'Пир-сосед', description: 'Активен', coordinate: { latitude: 55.752, longitude: 37.615 } },
    { id: '3', title: 'Датчик', description: 'Активен', coordinate: { latitude: 55.752, longitude: 37.615 } }
  ]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    let watchId;

    async function initLocation() {
      const granted = await requestLocationPermission();
      if (granted) {
        const location = await getCurrentLocation();
        if (location) {
          setUserLocation(location);
        }
        watchId = startWatchPosition(pos => {
          setUserLocation({
            latitude: pos.latitude,
            longitude: pos.longitude,
          });
        });
      }
    }

    initLocation();

    return () => {
      if (watchId !== undefined) {
        stopWatchPosition(watchId);
      }
    };
  }, []);

  // Динамическое добавление маркеров
  useEffect(() => {
    const interval = setInterval(() => {
      setMarkers(prev => [
        ...prev,
        {
          id: String(prev.length + 1),
          title: 'Новый объект',
          description: 'Появился недавно',
          coordinate: { latitude: 55.751 + Math.random() * 0.01, longitude: 37.618 + Math.random() * 0.01 }
        }
      ]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!userLocation) {
    return (
      <View style={styles.container}>
        <Sidebar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
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
        <Marker
          coordinate={userLocation}
          title="Вы здесь"
          pinColor="green"
        />
      </MapView>

      {/* Отладочный оверлей с координатами пользователя */}
      <View style={styles.debugOverlay}>
        <Text style={styles.debugText}>Lat: {userLocation.latitude.toFixed(6)}</Text>
        <Text style={styles.debugText}>Lng: {userLocation.longitude.toFixed(6)}</Text>
      </View>

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