import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Sidebar from './Sidebar'; // Sidebar.js
import ChatBLE from './ChatBLE'; // ChatBLE.js
import {Login} from './Login';
import {MapScreen} from './MapScreen';
import {History} from './History';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Sidebar />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="MapScreen" component={MapScreen} />
        <Stack.Screen name="History" component={History} />
        <Stack.Screen name="ChatBLE" component={ChatBLE} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
