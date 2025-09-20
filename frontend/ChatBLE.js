import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, Button, TouchableOpacity, StyleSheet, Alert, Platform, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import BleAdvertiser from 'react-native-ble-advertiser';

const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb'; // Example service UUID
const CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb'; // Example characteristic UUID

export function ChatBLE () {
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isAdvertising, setIsAdvertising] = useState(false);

  const subscriptionRef = useRef(null);
  const managerRef = useRef(null);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [];
        if (Platform.Version >= 31) {
          // Android 12+ permissions
          permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
          permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
          permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE);
        }
        permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        for (const key in granted) {
          if (granted[key] !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission required', `Permission ${key} is required for BLE functionality.`);
            return false;
          }
        }
        return true;
      } catch (err) {
        Alert.alert('Permission error', err.message);
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    managerRef.current = new BleManager();

    const startAdvertising = async () => {
      if (Platform.OS === 'android') {
        try {
          await BleAdvertiser.setCompanyId(0x1234); // Example company ID
          await BleAdvertiser.broadcast(SERVICE_UUID, [CHARACTERISTIC_UUID], { connectable: true });
          setIsAdvertising(true);
        } catch (advError) {
          setError('Advertising error: ' + advError.message);
          setIsAdvertising(false);
        }
      }
    };

    const waitForPoweredOn = async () => {
      try {
        const state = await managerRef.current.state();
        if (state === 'PoweredOn') {
          const permissionGranted = await requestPermissions();
          if (!permissionGranted) {
            setError('Required permissions not granted.');
            return;
          }
          startAdvertising();
          startScan();
        } else {
          setTimeout(waitForPoweredOn, 500);
        }
      } catch (e) {
        setTimeout(waitForPoweredOn, 500);
      }
    };

    waitForPoweredOn();

    return () => {
      if (managerRef.current) {
        managerRef.current.stopDeviceScan();
      }
      subscriptionRef.current && subscriptionRef.current.remove();
      if (Platform.OS === 'android' && isAdvertising) {
        BleAdvertiser.stopBroadcast();
        setIsAdvertising(false);
      }
      if (managerRef.current) {
        managerRef.current.destroy();
      }
    };
  }, []);

  const startScan = async () => {
    if (!managerRef.current) {
      Alert.alert('BLE Manager not initialized');
      return;
    }

    const state = await managerRef.current.state();
    if (state !== 'PoweredOn') {
      Alert.alert('Bluetooth is not powered on', 'Please turn on Bluetooth to scan for devices.');
      return;
    }

    setDevices([]);
    setIsScanning(true);
    setError(null);

    managerRef.current.startDeviceScan([SERVICE_UUID], null, (error, device) => {
      if (error) {
        setError(error.message);
        setIsScanning(false);
        return;
      }
      if (device && device.name) {
        setDevices(prevDevices => {
          if (prevDevices.find(d => d.id === device.id)) {
            return prevDevices;
          }
          return [...prevDevices, device];
        });
      }
    });

    setTimeout(() => {
      managerRef.current.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  const connectToDevice = async (device) => {
    setIsConnecting(true);
    setError(null);
    try {
      const connected = await managerRef.current.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      setMessages([]);
      subscribeForMessages(connected);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const subscribeForMessages = async (device) => {
    subscriptionRef.current && subscriptionRef.current.remove();
    subscriptionRef.current = device.monitorCharacteristicForService(
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          setError(error.message);
          return;
        }
        if (characteristic?.value) {
          const decoded = Buffer.from(characteristic.value, 'base64').toString('utf8');
          setMessages(prev => [...prev, { id: Date.now().toString(), text: decoded, fromRemote: true }]);
        }
      }
    );
  };

  const sendMessage = async () => {
    if (!connectedDevice) {
      Alert.alert('Not connected', 'Please connect to a device first.');
      return;
    }
    if (!input.trim()) {
      return;
    }

    try {
      const encoded = Buffer.from(input, 'utf8').toString('base64');
      await connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        encoded
      );
      setMessages(prev => [...prev, { id: Date.now().toString(), text: input, fromRemote: false }]);
      setInput('');
    } catch (err) {
      setError(err.message);
    }
  };

  const renderDevice = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(item)}
      disabled={isConnecting}
    >
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceId}>{item.id}</Text>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => (
    <View style={[styles.message, item.fromRemote ? styles.remoteMessage : styles.localMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BLE Peripheral (Advertising) Status: {isAdvertising ? 'Advertising' : 'Not Advertising'}</Text>
      {!connectedDevice ? (
        <>
          <Text style={styles.title}>Nearby BLE Devices</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button title={isScanning ? 'Scanning...' : 'Scan for Devices'} onPress={startScan} disabled={isScanning} />
          <FlatList
            data={devices}
            keyExtractor={item => item.id}
            renderItem={renderDevice}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.emptyText}>{isScanning ? 'Scanning...' : 'No devices found'}</Text>}
          />
        </>
      ) : (
        <>
          <Text style={styles.title}>Connected to {connectedDevice.name || connectedDevice.id}</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <FlatList
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            inverted
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type a message"
            />
            <Button title="Send" onPress={sendMessage} />
          </View>
          <Button
            title="Disconnect"
            onPress={async () => {
              subscriptionRef.current && subscriptionRef.current.remove();
              await managerRef.current.cancelDeviceConnection(connectedDevice.id);
              setConnectedDevice(null);
              setMessages([]);
              setError(null);
            }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  deviceItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  deviceName: { fontSize: 16, fontWeight: 'bold' },
  deviceId: { fontSize: 12, color: '#666' },
  list: { paddingBottom: 20 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#999' },
  messagesList: { paddingBottom: 10 },
  message: { marginVertical: 4, padding: 10, borderRadius: 8, maxWidth: '80%' },
  localMessage: { backgroundColor: '#DCF8C6', alignSelf: 'flex-end' },
  remoteMessage: { backgroundColor: '#ECECEC', alignSelf: 'flex-start' },
  messageText: { fontSize: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  input: { flex: 1, borderColor: '#ccc', borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, height: 40, marginRight: 8 },
  errorText: { color: 'red', marginBottom: 8 },
});

export default ChatBLE;