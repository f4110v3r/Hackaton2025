import { View, Text, ScrollView,TouchableOpacity, StyleSheet } from 'react-native';
import Sidebar from './Sidebar';
import { useNavigation } from '@react-navigation/native';
import Ble from './Ble';
export function History() {
  const info = [
    "User 1 ",
    "User 2 ",
    "User 3 ",
    "User 4 ",
    "User 5 ",
    "User 6 ",
    "User 7 ",
    "User 8 ",
    "User 9 ",
    "User 10 ",
    "User 11 ",
    "User 12 ",
    "User 13 ",
    "User 14 ",
    "User 15 ",
    "User 16 ",
    "User 17 ",
    "User 18 ",
    "User 19 ",
    "User 20 ",
  ];
  const navigation = useNavigation();
  const handleSign = () => {
    navigation.navigate("Ble");
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>Recents users upload</Text>
      <TouchableOpacity  onPress={handleSign}>
              <Text style={styles.buttonText}>Log in</Text>
      </TouchableOpacity>
      <Sidebar />
      <ScrollView style={styles.scrollContainer}>
        {info.map((data, index) => (
          <View key={index} style={styles.container}>
            
            <View style={styles.indexBox}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>

           
            <View style={styles.contentBox}>
              <View style={styles.row}>
                <Text style={styles.userText}>{data}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.infoText}>Time: 12:00</Text>
                <Text style={styles.infoText}> | id: 123</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',            
    alignItems: 'center',
    backgroundColor: '#d3d3d3',
    borderRadius: 10,
    height: 60,
    marginBottom: 15,
    marginHorizontal: 20,
    elevation: 5,
  },
  scrollContainer: {
    paddingVertical: 10,
    backgroundColor: '#e9e9e9ff',
  },
  title: {
    marginTop: 15,
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 25,
    fontWeight: 'bold',
    color: '#1c1c1cff',
  },

  /** Левая колонка — номер */
  indexBox: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#6c6c6cff',
  },
  indexText: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  /** Правая часть */
  contentBox: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userText: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 12,
    color: '#555',
  },
});
