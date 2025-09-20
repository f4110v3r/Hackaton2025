// frontend/App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Login } from './Login';

// Заглушка Dashboard
function Dashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Добро пожаловать в Калворлд!</Text>
    </View>
  );
}

// Заглушка SignIn
function SignIn() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Страница регистрации</Text>
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