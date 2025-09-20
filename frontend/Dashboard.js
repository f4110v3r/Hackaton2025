
import { View, Text, StyleSheet } from 'react-native';

export function Dashboard() {
  return (
    <View style={styles.container}>
      <Text>Добро пожаловать в Калворлд!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center' }
});