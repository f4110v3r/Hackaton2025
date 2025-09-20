import { View, Text,ScrollView, StyleSheet } from 'react-native';

export function History() {
    const info=["User 1 uploaded file",
    "User 2 uploaded file",
    "User 3 uploaded file",
    "User 4 uploaded file",
    "User 5 uploaded file",
    "User 6 uploaded file",
    "User 7 uploaded file",
    "User 8 uploaded file",
    "User 9 uploaded file",
    "User 10 uploaded file",
    "User 11 uploaded file",
    "User 12 uploaded file",
    "User 13 uploaded file",
    "User 14 uploaded file",
    "User 15 uploaded file",
    "User 16 uploaded file",
    "User 17 uploaded file",
    "User 18 uploaded file",
    "User 19 uploaded file",
    "User 20 uploaded file",];
  return (
    <View>
        
    <Text style={styles.title}>Recents users upload </Text>
    <ScrollView style={styles.scrollContainer}>
        {info.map((data,index)=>
        <View key={index} style={styles.container}>
            <Text>{data}</Text>
        </View>
        )
}

    </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // по вертикали
    alignItems: 'center',     // по горизонтали
    backgroundColor: '#858585ff',
    marginTop: 15,
    marginLeft: 60,
    borderRadius: 10,
    height: 60,
  },
  scrollContainer: {
    color: '#000000ff',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 100,
  },
  title: {
    marginTop: 15,
    marginBottom: 15,
    textAlign:'center',
    fontSize: 25,
    color: '#1d1d1dff',
  },
});