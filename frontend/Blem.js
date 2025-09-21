/**
 * Установка зависимостей для Expo Managed Workflow:
 * 
 *   npx expo install @react-native-async-storage/async-storage
 *   npx expo install react-native-ble-plx
 * 
 * Если используете bare workflow, следуйте официальной документации по установке.
 * 
 * Запуск приложения с очисткой кэша:
 * 
 *   npx expo start -c
 * 
 * (или для npm: npm start -- --clear)
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BleManager } from 'react-native-ble-plx';

// Добавлен проп onSensorData для передачи данных в DangerLevel
export const Blem = (props) => {
  const [manager] = useState(() => new BleManager());
  const [devices, setDevices] = useState([]);
  const [sensorDataArray, setSensorDataArray] = useState([]);
  // История измерений
  const [sensorHistory, setSensorHistory] = useState([]);
  const [connectedDevices, setConnectedDevices] = useState(new Map());
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(null);
  
  const scanIntervalRef = useRef(null);
  const dataExchangeIntervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // UUID для обмена данными
  const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
  const DATA_EXCHANGE_CHARACTERISTIC = '87654321-4321-4321-4321-cba987654321';

  useEffect(() => {
    initializeBLE();
    loadStoredData();
    loadSensorHistory();
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      cleanup();
      subscription?.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      startContinuousOperations();
    }
    appStateRef.current = nextAppState;
  };

  const initializeBLE = () => {
    const subscription = manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        requestPermissionsAndStart();
      }
    }, true);
    return subscription;
  };

  const requestPermissionsAndStart = async () => {
    // Expo managed workflow: BLE permissions запрашиваются через app.json и expo-permissions
    // Expo автоматически запрашивает разрешения, если они прописаны в app.json
    // Для bare workflow используйте PermissionsAndroid, как ниже (закомментировано)
    /*
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        if (Object.values(granted).every(permission => permission === 'granted')) {
          startContinuousOperations();
        } else {
          Alert.alert('Ошибка', 'Необходимы разрешения для работы с Bluetooth');
        }
      } catch (error) {
        console.log('Ошибка запроса разрешений:', error);
      }
    } else {
      startContinuousOperations();
    }
    */
    startContinuousOperations();
  };

  const startContinuousOperations = () => {
    // Сканирование каждые 10 секунд
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = setInterval(() => {
      scanForDevices();
    }, 10000);

    // Обмен данными каждые 5 секунд
    if (dataExchangeIntervalRef.current) clearInterval(dataExchangeIntervalRef.current);
    dataExchangeIntervalRef.current = setInterval(() => {
      exchangeDataWithConnectedDevices();
    }, 5000);

    scanForDevices();
  };

  // Случайная генерация типа устройства и данных для тестирования DangerLevel
  const scanForDevices = () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setLastScanTime(new Date().toLocaleTimeString());

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('Ошибка сканирования:', error);
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        // --- СИМУЛЯЦИЯ данных для DangerLevel ---
        // Случайная генерация типа устройства
        const types = ['regular', 'scanner', 'user'];
        // Стабильно по id, чтобы тип не прыгал при каждом скане
        let hash = 0;
        for (let i = 0; i < device.id.length; i++) hash += device.id.charCodeAt(i);
        const type = types[hash % types.length];

        // Обновляем список найденных устройств
        setDevices(prevDevices => {
          const existingIndex = prevDevices.findIndex(d => d.id === device.id);
          const deviceData = {
            id: device.id,
            name: device.name,
            rssi: device.rssi,
            lastSeen: new Date().toLocaleTimeString(),
            hasData: connectedDevices.has(device.id),
            lastDataUpdate: getDeviceLastUpdate(device.id),
            deviceType: type // для отладки
          };

          if (existingIndex >= 0) {
            const updated = [...prevDevices];
            updated[existingIndex] = deviceData;
            return updated;
          } else {
            return [...prevDevices, deviceData];
          }
        });

        // Генерация случайных данных для устройств типа scanner и user
        if (type === 'scanner' || type === 'user') {
          // Случайная температура и влажность
          const temp = 18 + Math.random() * 10; // 18-28°C
          const hum = 40 + Math.random() * 30;  // 40-70%
          // Случайные координаты в пределах Москвы для теста
          const lat = 55.75 + Math.random() * 0.1;
          const lng = 37.6 + Math.random() * 0.2;
          const nowIso = new Date().toISOString();
          const sensorData = {
            id: `${device.id}_${Date.now()}`,
            deviceId: device.id,
            deviceName: device.name,
            temperature: temp,
            humidity: hum,
            lastUpdate: nowIso,
            position: { lat, lng },
            deviceType: type
          };
          // Добавляем в sensorDataArray и историю
          setSensorDataArray(prev => {
            const updated = [...prev.filter(d => d.deviceId !== device.id), sensorData];
            saveDataToStorage(updated);
            return updated;
          });
          setSensorHistory(prev => {
            const updated = [...prev, { ...sensorData, historyTimestamp: nowIso }];
            AsyncStorage.setItem('sensorHistory', JSON.stringify(updated));
            return updated;
          });
          // Передаём данные в DangerLevel через проп
          if (props && typeof props.onSensorData === 'function') {
            props.onSensorData(sensorData);
          }
        }
        // --- КОНЕЦ СИМУЛЯЦИИ ---

        // Автоподключение к BLE устройствам
        if (!connectedDevices.has(device.id)) {
          if (device.name.includes('Sensor') || device.name.includes('ESP32') || 
              device.name.includes('BLE') || device.name.includes('Arduino')) {
            connectToDevice(device);
          }
        }
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 8000);
  };

  const getDeviceLastUpdate = (deviceId) => {
    const deviceData = sensorDataArray.find(item => item.deviceId === deviceId);
    return deviceData ? deviceData.lastUpdate : null;
  };

  const connectToDevice = async (device) => {
    try {
      if (connectedDevices.has(device.id)) return;

      console.log('Подключение к устройству:', device.name);
      
      const connectedDevice = await device.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();

      setConnectedDevices(prev => new Map(prev).set(device.id, {
        device: connectedDevice,
        name: device.name,
        connected: true,
        lastDataExchange: null
      }));

      // Обновляем статус устройства в списке
      updateDeviceStatus(device.id, true, null);
      
      console.log(`Подключено к ${device.name}`);

    } catch (error) {
      console.log('Ошибка подключения к', device.name, ':', error);
      updateDeviceStatus(device.id, false, null);
    }
  };

  const updateDeviceStatus = (deviceId, hasData, lastUpdate) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, hasData, lastDataUpdate: lastUpdate }
        : device
    ));
  };

  const exchangeDataWithConnectedDevices = async () => {
    for (const [deviceId, deviceInfo] of connectedDevices) {
      try {
        const device = deviceInfo.device;
        
        // Читаем данные от устройства
        const characteristic = await device.readCharacteristicForService(
          SERVICE_UUID,
          DATA_EXCHANGE_CHARACTERISTIC
        );

        if (characteristic?.value) {
          try {
            // Expo не предоставляет atob/btoa, используйте Buffer или глобальные polyfill или npm пакет base-64
            // Например:
            // import { decode as atob, encode as btoa } from 'base-64';
            // const receivedData = JSON.parse(atob(characteristic.value));
            // Здесь для простоты:
            const receivedData = JSON.parse(global.atob ? global.atob(characteristic.value) : Buffer.from(characteristic.value, 'base64').toString('utf8'));
            const currentTime = new Date().toISOString();
            
            if (receivedData.sensorData && Array.isArray(receivedData.sensorData)) {
              // Обрабатываем полученный массив данных
              mergeReceivedData(receivedData.sensorData, deviceId, currentTime);
            } else if (receivedData.temperature !== undefined || receivedData.humidity !== undefined) {
              // Обрабатываем одиночные данные датчика
              const singleDataItem = {
                id: `${deviceId}_${Date.now()}`,
                deviceId: deviceId,
                deviceName: deviceInfo.name,
                temperature: receivedData.temperature,
                humidity: receivedData.humidity,
                lastUpdate: currentTime,
                position: receivedData.position || null
              };
              
              mergeReceivedData([singleDataItem], deviceId, currentTime);
            }
          } catch (parseError) {
            console.log('Ошибка парсинга данных от', deviceId, ':', parseError);
          }
        }

        // Отправляем наши данные устройству (если есть что отправить)
        if (sensorDataArray.length > 0) {
          const dataToSend = {
            type: 'DATA_EXCHANGE',
            timestamp: new Date().toISOString(),
            sensorData: sensorDataArray
          };
          // Expo не предоставляет btoa, используйте base-64 (см. выше)
          // await device.writeCharacteristicWithoutResponseForService(
          //   SERVICE_UUID,
          //   DATA_EXCHANGE_CHARACTERISTIC,
          //   btoa(JSON.stringify(dataToSend))
          // );
          await device.writeCharacteristicWithoutResponseForService(
            SERVICE_UUID,
            DATA_EXCHANGE_CHARACTERISTIC,
            global.btoa ? global.btoa(JSON.stringify(dataToSend)) : Buffer.from(JSON.stringify(dataToSend), 'utf8').toString('base64')
          );
        }

        // Обновляем время последнего обмена
        setConnectedDevices(prev => {
          const updated = new Map(prev);
          if (updated.has(deviceId)) {
            updated.get(deviceId).lastDataExchange = new Date().toISOString();
          }
          return updated;
        });

      } catch (error) {
        console.log(`Ошибка обмена данными с ${deviceId}:`, error);
        
        // Удаляем отключенное устройство
        setConnectedDevices(prev => {
          const updated = new Map(prev);
          updated.delete(deviceId);
          return updated;
        });
        
        updateDeviceStatus(deviceId, false, null);
      }
    }
  };

  // Добавить новые данные в историю (merge)
  const mergeHistory = async (newEntries) => {
    try {
      // Получить текущую историю
      let history = sensorHistory;
      if (!Array.isArray(history)) history = [];
      // Добавить новые записи
      const merged = [...history, ...newEntries];
      setSensorHistory(merged);
      await AsyncStorage.setItem('sensorHistory', JSON.stringify(merged));
    } catch (error) {
      console.log('Ошибка сохранения истории:', error);
    }
  };

  const mergeReceivedData = (receivedDataArray, fromDeviceId, currentTime) => {
    setSensorDataArray(prevData => {
      const mergedData = [...prevData];
      let newHistoryEntries = [];
      receivedDataArray.forEach(newItem => {
        if (newItem.temperature !== undefined || newItem.humidity !== undefined) {
          const existingIndex = mergedData.findIndex(
            existing => existing.deviceId === newItem.deviceId
          );
          // Для истории: сохраняем каждое новое измерение
          newHistoryEntries.push({
            ...newItem,
            historyTimestamp: currentTime
          });
          if (existingIndex >= 0) {
            // Обновляем существующую запись если новые данные свежее
            if (new Date(newItem.lastUpdate) > new Date(mergedData[existingIndex].lastUpdate)) {
              mergedData[existingIndex] = newItem;
            }
          } else {
            // Добавляем новую запись
            mergedData.push(newItem);
          }
        }
      });
      // Сортируем по времени обновления
      const sorted = mergedData.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
      // Обновляем статус устройства
      updateDeviceStatus(fromDeviceId, true, currentTime);
      // Сохраняем данные
      saveDataToStorage(sorted);
      // Добавляем в историю
      if (newHistoryEntries.length > 0) {
        mergeHistory(newHistoryEntries);
      }
      console.log(`Получены реальные данные от ${fromDeviceId}`);
      return sorted;
    });
  };

  const saveDataToStorage = async (data) => {
    try {
      await AsyncStorage.setItem('sensorDataArray', JSON.stringify(data));
    } catch (error) {
      console.log('Ошибка сохранения данных:', error);
    }
  };

  const loadStoredData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('sensorDataArray');
      if (storedData) {
        setSensorDataArray(JSON.parse(storedData));
      }
    } catch (error) {
      console.log('Ошибка загрузки данных:', error);
    }
  };

  // Загрузить историю измерений
  const loadSensorHistory = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem('sensorHistory');
      if (storedHistory) {
        setSensorHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.log('Ошибка загрузки истории:', error);
    }
  };

  const cleanup = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (dataExchangeIntervalRef.current) clearInterval(dataExchangeIntervalRef.current);
    
    connectedDevices.forEach(async (deviceInfo) => {
      try {
        await deviceInfo.device.cancelConnection();
      } catch (error) {
        console.log('Ошибка отключения устройства:', error);
      }
    });
    
    manager.destroy();
  };

  const renderDevice = ({ item }) => (
    <View style={styles.deviceItem}>
      <View style={styles.deviceHeader}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { 
            backgroundColor: item.hasData ? '#27ae60' : '#e74c3c' 
          }]} />
          <Text style={styles.statusText}>
            {item.hasData ? 'Данные получены' : 'Нет данных'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.deviceId}>ID: {item.id}</Text>
      <Text style={styles.deviceInfo}>RSSI: {item.rssi} | Найден: {item.lastSeen}</Text>
      
      {item.lastDataUpdate && (
        <Text style={styles.lastUpdate}>
          Последние данные: {new Date(item.lastDataUpdate).toLocaleString()}
        </Text>
      )}
    </View>
  );

  const renderSensorData = ({ item }) => (
    <View style={styles.sensorItem}>
      <View style={styles.sensorHeader}>
        <Text style={styles.sensorDeviceName}>{item.deviceName || `Устройство ${item.deviceId.slice(-4)}`}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.lastUpdate).toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.dataRow}>
        {item.temperature !== undefined && (
          <Text style={styles.sensorValue}>🌡️ {item.temperature.toFixed(1)}°C</Text>
        )}
        {item.humidity !== undefined && (
          <Text style={styles.sensorValue}>💧 {item.humidity.toFixed(1)}%</Text>
        )}
      </View>
      
      {item.position && (
        <Text style={styles.position}>
          📍 {item.position.lat.toFixed(4)}, {item.position.lng.toFixed(4)}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BLE Обмен данными</Text>
      
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Подключено: {connectedDevices.size} | Записей: {sensorDataArray.length}
        </Text>
        <Text style={styles.scanStatus}>
          {isScanning ? '🔍 Сканирование...' : `⏸️ ${lastScanTime || 'Ожидание'}`}
        </Text>
      </View>

      {/* Блок устройств */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Найденные устройства ({devices.length})</Text>
        <FlatList
          data={devices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id}
          style={[styles.list, { maxHeight: 200 }]}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Блок данных */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Полученные данные ({sensorDataArray.length})</Text>
        <FlatList
          data={sensorDataArray}
          renderItem={renderSensorData}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
      
      {sensorDataArray.length === 0 && (
        <Text style={styles.noData}>Нет данных с устройств</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#2c3e50',
  },
  statusBar: {
    backgroundColor: '#ecf0f1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#2980b9',
    fontWeight: '600',
  },
  scanStatus: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
  },
  section: {
    flex: 1,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#34495e',
  },
  list: {
    flex: 1,
  },
  deviceItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginVertical: 3,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  deviceId: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 3,
  },
  deviceInfo: {
    fontSize: 12,
    color: '#95a5a6',
  },
  lastUpdate: {
    fontSize: 11,
    color: '#27ae60',
    marginTop: 5,
    fontStyle: 'italic',
  },
  sensorItem: {
    backgroundColor: '#e8f4fd',
    padding: 15,
    marginVertical: 3,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sensorDeviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  timestamp: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sensorValue: {
    fontSize: 15,
    color: '#27ae60',
    fontWeight: '500',
  },
  position: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
  },
  noData: {
    textAlign: 'center',
    color: '#bdc3c7',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 20,
  },
});