// import React, { useEffect, useState, useRef } from 'react';
// import { View, Text, FlatList, TextInput, Button, StyleSheet, Alert, Platform, PermissionsAndroid } from 'react-native';
// import { BleManager } from 'react-native-ble-plx';
// import { Buffer } from 'buffer';

// // UUID вашего сервиса и характеристики
// const SERVICE_UUID = '0000feed-0000-1000-8000-00805f9b34fb';
// const CHARACTERISTIC_UUID = '0000beef-0000-1000-8000-00805f9b34fb';

// export default function BLEChat() {
//   const managerRef = useRef(null);
//   const [devices, setDevices] = useState([]);
//   const [connectedDevice, setConnectedDevice] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');

//   useEffect(() => {
//     managerRef.current = new BleManager();

//     if (Platform.OS === 'android') {
//       PermissionsAndroid.requestMultiple([
//         PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
//         PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//       ]);
//     }

//     const subscription = managerRef.current.onStateChange((state) => {
//       if (state === 'PoweredOn') {
//         scanDevices();
//         subscription.remove();
//       }
//     }, true);

//     return () => {
//       managerRef.current.stopDeviceScan();
//     };
//   }, []);

//   const scanDevices = () => {
//     setDevices([]);
//     managerRef.current.startDeviceScan([SERVICE_UUID], null, (error, device) => {
//       if (error) return;
//       if (device && device.name) {
//         setDevices(prev => {
//           if (!prev.find(d => d.id === device.id)) return [...prev, device];
//           return prev;
//         });
//       }
//     });
//   };

//   const connectToDevice = async (device) => {
//     managerRef.current.stopDeviceScan();
//     try {
//       const connected = await managerRef.current.connectToDevice(device.id);
//       await connected.discoverAllServicesAndCharacteristics();
//       setConnectedDevice(connected);

//       // Подписка на входящие сообщения
//       connected.monitorCharacteristicForService(SERVICE_UUID, CHARACTERISTIC_UUID, (err, char) => {
//         if (err) return;
//         const msg = Buffer.from(char.value, 'base64').toString();
//         setMessages(prev => [...prev, { from: device.name, text: msg }]);
//       });

//       Alert.alert('Connected', `Подключено к ${device.name}`);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   const sendMessage = async () => {
//     if (!connectedDevice || !input) return;
//     try {
//       await connectedDevice.writeCharacteristicWithResponseForService(
//         SERVICE_UUID,
//         CHARACTERISTIC_UUID,
//         Buffer.from(input).toString('base64')
//       );
//       setMessages(prev => [...prev, { from: 'Me', text: input }]);
//       setInput('');
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>BLE Chat</Text>

//       {!connectedDevice && (
//         <FlatList
//           data={devices}
//           keyExtractor={item => item.id}
//           renderItem={({ item }) => (
//             <Button title={`Connect to ${item.name}`} onPress={() => connectToDevice(item)} />
//           )}
//         />
//       )}

//       {connectedDevice && (
//         <>
//           <FlatList
//             data={messages}
//             keyExtractor={(item, index) => index.toString()}
//             renderItem={({ item }) => <Text>{item.from}: {item.text}</Text>}
//           />
//           <TextInput
//             style={styles.input}
//             value={input}
//             onChangeText={setInput}
//             placeholder="Type message..."
//           />
//           <Button title="Send" onPress={sendMessage} />
//         </>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20 },
//   title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
//   input: { borderWidth: 1, padding: 10, marginVertical: 10 },
// });