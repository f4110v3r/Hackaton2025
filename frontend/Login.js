// frontend/Login.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export function Login() {
  const navigation = useNavigation();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (login === 'Serega' && password === '1234') {
      navigation.navigate("MapScreen");
    } else {
      Alert.alert('Ошибка', 'Неверный логин или пароль');
    }
  };

  const handleSign = () => {
    navigation.navigate('History');
  };

  return (
    <View style={styles.loginForm}>
      <Text style={styles.loginTitle}>Log in</Text>

      <TextInput
        style={styles.loginInput}
        placeholder="Login"
        value={login}
        onChangeText={setLogin}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.loginInput}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log in</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginSignin} onPress={handleSign}>
        <Text style={styles.signinText}>Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loginForm: {
    width: 320,
    padding: 30,
    marginTop: 80,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignSelf: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 5,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
  },
  loginInput: {
    width: '100%',
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  loginButton: {
    width: '100%',
    height: 45,
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginSignin: {
    width: '100%',
    height: 45,
    borderColor: '#4a90e2',
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: 'bold',
  },
});