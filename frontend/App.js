import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Login } from './Login';
import { StyleSheet, Text, View } from 'react-native';
import { MapScreen } from './MapScreen';
<<<<<<< HEAD
import {Ble} from './Ble';
import {BleChat} from './BleChat';
=======
import {Blem}  from './Blem';
import {ChatBLE } from './ChatBLE'
>>>>>>> 84e402816fe9edc0b3f0430a63e4bc88e42167a7

import {History} from './History'

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="MapScreen" component={MapScreen} />
        <Stack.Screen name="History" component={History}/>
        <Stack.Screen name="Blem" component={Blem} />
        <Stack.Screen name="ChatBLE" component={ChatBLE} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' },
});

