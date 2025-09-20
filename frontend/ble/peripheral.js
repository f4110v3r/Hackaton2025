import { BlePeripheral } from 'react-native-ble-peripheral';
import { Buffer } from 'buffer';
import { saveMessage } from '../db/index';

const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const CHAR_UUID = 'abcd1234-ab12-cd34-ef56-abcdef123456';

export async function startAdvertising() {
  try {
    await BlePeripheral.addService(SERVICE_UUID, true);

    await BlePeripheral.addCharacteristicToService(
      SERVICE_UUID,
      CHAR_UUID,
      BlePeripheral.properties.READ |
        BlePeripheral.properties.WRITE |
        BlePeripheral.properties.NOTIFY,
      BlePeripheral.permissions.READABLE | BlePeripheral.permissions.WRITEABLE
    );

    // Когда клиент пишет данные
    BlePeripheral.onWrite((uuid, value) => {
      if (uuid === CHAR_UUID) {
        const text = Buffer.from(value, 'base64').toString('utf-8');
        console.log('Received:', text);
        saveMessage('peer', text);
      }
    });

    await BlePeripheral.startAdvertising('P2PNode', [SERVICE_UUID]);
    console.log('Advertising started as P2PNode');
  } catch (e) {
    console.error('Failed to advertise:', e);
  }
}

export async function stopAdvertising() {
  try {
    await BlePeripheral.stopAdvertising();
    console.log('Advertising stopped');
  } catch (e) {
    console.error(e);
  }
}