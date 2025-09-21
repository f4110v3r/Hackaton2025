import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, Alert, Platform, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import BleAdvertiser from 'react-native-ble-advertiser';
import { Buffer } from 'buffer';
const SERVICE_UUID = '0000feed-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '0000beef-0000-1000-8000-00805f9b34fb';

export default function BleChat() {
  const managerRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('Initializing...');
  const [advertisingStatus, setAdvertisingStatus] = useState('Not advertising');

  useEffect(() => {
    managerRef.current = new BleManager();
    setStatus('BleManager initialized');

    async function requestPermissions() {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);
          setStatus('Permissions requested');
        } catch (err) {
          setStatus(`Permission error: ${err.message}`);
        }
      }
    }

    async function startAdvertising() {
      if (BleAdvertiser === null) {
        setAdvertisingStatus('BleAdvertiser not available (null)');
        return;
      }
      try {
        await requestPermissions();
        BleAdvertiser.setCompanyId(0x1234);
        BleAdvertiser.setIncludeDeviceName(true);
        await BleAdvertiser.broadcast(SERVICE_UUID, [CHARACTERISTIC_UUID], { connectable: true });
        setAdvertisingStatus('Advertising started');
      } catch (error) {
        setAdvertisingStatus(`Advertising error: ${error.message}`);
      }
    }

    const subscription = managerRef.current.onStateChange((state) => {
      setStatus(`Bluetooth state: ${state}`);
      if (state === 'PoweredOn') {
        startAdvertising();
        scanDevices();
        subscription.remove();
      }
    }, true);

    return () => {
      managerRef.current.stopDeviceScan();
      setStatus('Stopped device scan');
      if (BleAdvertiser !== null) {
        BleAdvertiser.stopBroadcast()
          .then(() => setAdvertisingStatus('Advertising stopped'))
          .catch(() => setAdvertisingStatus('Failed to stop advertising'));
      }
    };
  }, []);

  const scanDevices = () => {
    setDevices([]);
    setStatus('Scanning for devices...');
    managerRef.current.startDeviceScan([SERVICE_UUID], null, (error, device) => {
      if (error) {
        setStatus(`Scan error: ${error.message}`);
        return;
      }
      if (device) {
        setStatus(`Found device: ${device.name || device.id}`);
        if (device.name || device.id) {
          setDevices(prev => {
            if (!prev.find(d => d.id === device.id)) return [...prev, device];
            return prev;
          });
        }
      }
    });
  };

  const connectToDevice = async (device) => {
    managerRef.current.stopDeviceScan();
    setStatus(`Connecting to ${device.name || device.id}...`);
    try {
      const connected = await managerRef.current.connectToDevice(device.id);
      setStatus(`Connected to ${device.name || device.id}`);
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      connected.monitorCharacteristicForService(SERVICE_UUID, CHARACTERISTIC_UUID, (err, char) => {
        if (err) {
          setStatus(`Monitor error: ${err.message}`);
          return;
        }
        if (char.value) {
          const msg = Buffer.from(char.value, 'base64').toString();
          setMessages(prev => [...prev, { from: device.name || device.id, text: msg }]);
          setStatus(`Received message from ${device.name || device.id}`);
        } else {
          setStatus('Received empty characteristic value');
        }
      });

      Alert.alert('Connected', `Подключено к ${device.name || device.id}`);
    } catch (err) {
      setStatus(`Connection error: ${err.message}`);
      console.log(err);
    }
  };

  const sendMessage = async () => {
    if (!connectedDevice || !input) return;
    setStatus('Sending message...');
    try {
      await connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        Buffer.from(input).toString('base64')
      );
      setMessages(prev => [...prev, { from: 'Me', text: input }]);
      setInput('');
      setStatus('Message sent');
    } catch (err) {
      setStatus(`Send error: ${err.message}`);
      console.log(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BLE Chat</Text>
      <Text style={styles.status}>Status: {status}</Text>
      <Text style={styles.status}>Advertising: {advertisingStatus}</Text>

      {!connectedDevice && (
        <FlatList
          data={devices}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Button title={`Connect to ${item.name || item.id}`} onPress={() => connectToDevice(item)} />
          )}
          ListEmptyComponent={<Text style={styles.noDevices}>No devices found</Text>}
        />
      )}

      {connectedDevice && (
        <>
          <FlatList
            data={messages}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => <Text style={styles.message}>{item.from}: {item.text}</Text>}
            style={styles.messagesList}
          />
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type message..."
          />
          <Button title="Send" onPress={sendMessage} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  status: { marginBottom: 10, fontStyle: 'italic', color: 'gray' },
  input: { borderWidth: 1, padding: 10, marginVertical: 10 },
  message: { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  messagesList: { maxHeight: 300, marginBottom: 10 },
  noDevices: { textAlign: 'center', marginTop: 20, color: 'gray' },
});