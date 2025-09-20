import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { saveMessage } from '../db/index';

const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const CHAR_UUID = 'abcd1234-ab12-cd34-ef56-abcdef123456';

const bleManager = new BleManager();
let connectedDevice = null;

// Сканирование BLE устройств
export function startScan() {
  bleManager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.error(error);
      return;
    }
    if (device && device.name?.startsWith('P2PNode')) {
      connectToPeer(device);
    }
  });
}

// Подключение к пиру
function connectToPeer(device) {
  device.connect()
    .then(d => d.discoverAllServicesAndCharacteristics())
    .then(d => {
      connectedDevice = d;
      d.monitorCharacteristicForService(
        SERVICE_UUID,
        CHAR_UUID,
        (error, char) => {
          if (error) return console.error(error);
          const text = Buffer.from(char.value, 'base64').toString('utf-8');
          saveMessage(d.name, text);
        }
      );
      console.log('Connected to', d.name);
    })
    .catch(console.error);
}

// Отправка сообщения
export function sendMessage(text) {
  if (!connectedDevice) return;
  const data = Buffer.from(text, 'utf-8').toString('base64');
  connectedDevice.writeCharacteristicWithResponseForService(SERVICE_UUID, CHAR_UUID, data)
    .then(() => console.log('Message sent'))
    .catch(console.error);
}