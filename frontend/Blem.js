import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Platform, AppState } from 'react-native';

import RNFS from 'react-native-fs';

const SENSOR_HISTORY_PATH = `${RNFS.DocumentDirectoryPath}/sensorHistory.json`;
import { BleManager } from 'react-native-ble-plx';

export const Blem = (props) => {
  const [manager] = useState(() => new BleManager());
  const [devices, setDevices] = useState([]);
  const [sensorDataArray, setSensorDataArray] = useState([]);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [connectedDevices, setConnectedDevices] = useState(new Map());
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(null);
  
  const scanIntervalRef = useRef(null);
  const dataExchangeIntervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

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
  }

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
        const types = ['regular', 'scanner', 'user'];
        let hash = 0;
        for (let i = 0; i < device.id.length; i++) hash += device.id.charCodeAt(i);
        const type = types[hash % types.length];

        setDevices(prevDevices => {
          const existingIndex = prevDevices.findIndex(d => d.id === device.id);
          const deviceData = {
            id: device.id,
            name: device.name,
            rssi: device.rssi,
            lastSeen: new Date().toLocaleTimeString(),
            hasData: connectedDevices.has(device.id),
            lastDataUpdate: getDeviceLastUpdate(device.id),
            deviceType: type 
          };

          if (existingIndex >= 0) {
            const updated = [...prevDevices];
            updated[existingIndex] = deviceData;
            return updated;
          } else {
            return [...prevDevices, deviceData];
          }
        });

        if (type === 'scanner' || type === 'user') {
          const temp = 18 + Math.random() * 10; // 18-28°C
          const hum = 40 + Math.random() * 30;  // 40-70%
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
          setSensorDataArray(prev => {
            const updated = [...prev.filter(d => d.deviceId !== device.id), sensorData];
            saveDataToStorage(updated);
            return updated;
          });
          setSensorHistory(prev => {
            const updated = [...prev, { ...sensorData, historyTimestamp: nowIso }];
            saveSensorHistoryToFile(updated);
            return updated;
          });
          if (props && typeof props.onSensorData === 'function') {
            props.onSensorData(sensorData);
          }
        }

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
        
        const characteristic = await device.readCharacteristicForService(
          SERVICE_UUID,
          DATA_EXCHANGE_CHARACTERISTIC
        );

        if (characteristic?.value) {
          try {
            
            const receivedData = JSON.parse(global.atob ? global.atob(characteristic.value) : Buffer.from(characteristic.value, 'base64').toString('utf8'));
            const currentTime = new Date().toISOString();
            
            if (receivedData.sensorData && Array.isArray(receivedData.sensorData)) {
              mergeReceivedData(receivedData.sensorData, deviceId, currentTime);
            } else if (receivedData.temperature !== undefined || receivedData.humidity !== undefined) {
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

        if (sensorDataArray.length > 0) {
          const dataToSend = {
            type: 'DATA_EXCHANGE',
            timestamp: new Date().toISOString(),
            sensorData: sensorDataArray
          };
          
          await device.writeCharacteristicWithoutResponseForService(
            SERVICE_UUID,
            DATA_EXCHANGE_CHARACTERISTIC,
            global.btoa ? global.btoa(JSON.stringify(dataToSend)) : Buffer.from(JSON.stringify(dataToSend), 'utf8').toString('base64')
          );
        }

        setConnectedDevices(prev => {
          const updated = new Map(prev);
          if (updated.has(deviceId)) {
            updated.get(deviceId).lastDataExchange = new Date().toISOString();
          }
          return updated;
        });

      } catch (error) {
        console.log(`Ошибка обмена данными с ${deviceId}:`, error);
        
        setConnectedDevices(prev => {
          const updated = new Map(prev);
          updated.delete(deviceId);
          return updated;
        });
        
        updateDeviceStatus(deviceId, false, null);
      }
    }
  };

  const mergeHistory = async (newEntries) => {
    try {
      let history = sensorHistory;
      if (!Array.isArray(history)) history = [];
      const merged = [...history, ...newEntries];
      setSensorHistory(merged);
      await saveSensorHistoryToFile(merged);
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
          newHistoryEntries.push({
            ...newItem,
            historyTimestamp: currentTime
          });
          if (existingIndex >= 0) {
            if (new Date(newItem.lastUpdate) > new Date(mergedData[existingIndex].lastUpdate)) {
              mergedData[existingIndex] = newItem;
            }
          } else {
            mergedData.push(newItem);
          }
        }
      });
      const sorted = mergedData.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
      updateDeviceStatus(fromDeviceId, true, currentTime);
      saveDataToStorage(sorted);
      if (newHistoryEntries.length > 0) {
        mergeHistory(newHistoryEntries);
      }
      console.log(`Получены реальные данные от ${fromDeviceId}`);
      return sorted;
    });
  };

  const saveDataToStorage = async (data) => {
    try {
      let fileObj = { sensorDataArray: [], sensorHistory: [] };
      if (await RNFS.exists(SENSOR_HISTORY_PATH)) {
        const fileContent = await RNFS.readFile(SENSOR_HISTORY_PATH);
        try {
          fileObj = JSON.parse(fileContent);
        } catch (e) {}
      }
      fileObj.sensorDataArray = data;
      await RNFS.writeFile(SENSOR_HISTORY_PATH, JSON.stringify(fileObj), 'utf8');
    } catch (error) {
      console.log('Ошибка сохранения данных:', error);
    }
  };

  const saveSensorHistoryToFile = async (history) => {
    try {
      let fileObj = { sensorDataArray: [], sensorHistory: [] };
      if (await RNFS.exists(SENSOR_HISTORY_PATH)) {
        const fileContent = await RNFS.readFile(SENSOR_HISTORY_PATH);
        try {
          fileObj = JSON.parse(fileContent);
        } catch (e) {}
      }
      fileObj.sensorHistory = history;
      await RNFS.writeFile(SENSOR_HISTORY_PATH, JSON.stringify(fileObj), 'utf8');
    } catch (error) {
      console.log('Ошибка сохранения истории:', error);
    }
  };

  const loadStoredData = async () => {
    try {
      if (await RNFS.exists(SENSOR_HISTORY_PATH)) {
        const fileContent = await RNFS.readFile(SENSOR_HISTORY_PATH);
        const obj = JSON.parse(fileContent);
        if (obj && Array.isArray(obj.sensorDataArray)) {
          setSensorDataArray(obj.sensorDataArray);
        }
      }
    } catch (error) {
      console.log('Ошибка загрузки данных:', error);
    }
  };

  const loadSensorHistory = async () => {
    try {
      if (await RNFS.exists(SENSOR_HISTORY_PATH)) {
        const fileContent = await RNFS.readFile(SENSOR_HISTORY_PATH);
        const obj = JSON.parse(fileContent);
        if (obj && Array.isArray(obj.sensorHistory)) {
          setSensorHistory(obj.sensorHistory);
        }
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