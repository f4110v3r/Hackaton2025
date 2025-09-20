import { BleManager } from 'react-native-ble-plx';

export function Bluetooth (){
const manager = new BleManager();

manager.startDeviceScan(null, null, (error, device) => {
  if (error) {
    console.log('Scan error:', error);
    return;
  }
  
  console.log('Found device:', device.name, device.id);
});

manager.stopDeviceScan();


const connectedDevice = await manager.connectToDevice(deviceId);
await connectedDevice.discoverAllServicesAndCharacteristics();

const characteristic = await connectedDevice.readCharacteristicForService(
  serviceUUID,
  characteristicUUID
);

// Запись
await connectedDevice.writeCharacteristicWithResponseForService(
  serviceUUID,
  characteristicUUID,
  'BASE64_ENCODED_VALUE'
);

return(
    <Text>Priv</Text>
);

}