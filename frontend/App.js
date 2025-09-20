@ -1,44 +1,20 @@
// frontend/App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Login } from './Login';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Заглушка Dashboard
function Dashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Добро пожаловать в Калворлд!</Text>
    </View>
  );
}
import { Dashboard } from './Dashboard'

// Заглушка SignIn
function SignIn() {
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Страница регистрации</Text>
      <Text></Text>
      <StatusBar style="auto" />
      <Text style={styles.text}>Страница регистации</Text>
    </View>
  );
}

import { View, Text, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="SignIn" component={SignIn} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' },
});
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});