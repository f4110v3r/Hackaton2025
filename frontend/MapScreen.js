// frontend/MapScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export function MapScreen() {
  const [markers, setMarkers] = useState([
    {
      id: '1',
      title: 'Опасный объект',
      description: 'Скорость: 1200 м/с',
      coordinate: { latitude: 55.751244, longitude: 37.618423 }
    },
    {
      id: '2',
      title: 'Пир-сосед',
      description: 'Активен',
      coordinate: { latitude: 55.752, longitude: 37.615 }
    },
    {
      id: '3',
      title: 'Датчик',
      description: 'Активен',
      coordinate: { latitude: 55.752, longitude: 37.615 }
    }
  ]);

  // Пример динамического обновления (можно заменить на P2P или BLE данные)
  useEffect(() => {
    const interval = setInterval(() => {
      setMarkers(prev => [
        ...prev,
        {
          id: String(prev.length + 1),
          title: 'Новый объект',
          description: 'Появился недавно',
          coordinate: {
            latitude: 55.751 + Math.random() * 0.01,
            longitude: 37.618 + Math.random() * 0.01
          }
        }
      ]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 55.751244,
          longitude: 37.618423,
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
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 }
});