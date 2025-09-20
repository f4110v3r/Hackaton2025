import React, { useEffect, useState } from 'react';
import * as Device from 'expo-device';    
      // ✅ вместо react-native-device-info
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  StyleSheet,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const manager = new BleManager();

export function BLE() {
  const [devices, setDevices] = useState([]);
  const [deviceName, setDeviceName] = useState(Device.deviceName || 'Unknown'); // имя устройства

  useEffect(() => {
    // Запрашиваем имя устройства (expo-device)
    setDeviceName(Device.deviceName || 'Unknown');

    // Запрос прав на Android
    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
    }

    // Когда Bluetooth включён — стартуем скан
    const subscription = manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        scanDevices();
        subscription.remove();
      }
    }, true);

    return () => {
      manager.stopDeviceScan();
    };
  }, []);

  const scanDevices = () => {
    setDevices([]); // очистка списка
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('Scan error', error);
        return;
      }

      if (device && device.name) {
        setDevices((prev) => {
          const exists = prev.find((d) => d.id === device.id);
          if (!exists) return [...prev, device];
          return prev;
        });
      }
    });
  };

  const connectToDevice = async (device) => {
    manager.stopDeviceScan();
    try {
      const connectedDevice = await manager.connectToDevice(device.id);
      await connectedDevice.discoverAllServicesAndCharacteristics();
      alert(`Подключено к ${device.name}`);
    } catch (err) {
      console.log('Connect error', err);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(item)}
    >
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceId}>{item.id}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BLE Scanner</Text>
      <Text style={styles.myDevice}>📱 My device name: {deviceName}</Text>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f3f3f3',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  myDevice: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  deviceItem: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
  },
});
