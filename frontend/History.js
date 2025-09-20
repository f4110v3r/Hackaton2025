import { View, Text,ScrollView, StyleSheet } from 'react-native';
import Sidebar from './Sidebar';

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
      
    <Text style={styles.title}>Reces users upload </Text>
     <Sidebar />
    <ScrollView style={styles.scrollContainer}>
        {info.map((data,index)=>
        <View key={index} style={styles.container}>
          <View style={styles.subcomtainer}>
            <Text>{index}. {data} | </Text>
            <Text>id:{}</Text>
          </View>
          <Text>time: {}</Text>
        </View>
        )
}

    </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#d3d3d3',
    borderRadius: 10,
    height: 60,
    marginBottom: 15,
    paddingHorizontal: 15,
    marginLeft: 40,

    

    
    elevation: 5,
  },
  scrollContainer: {
                  
  paddingVertical: 10,       
  paddingHorizontal: 10,    
  backgroundColor: '#e9e9e9ff', 

  },
  title: {
    marginTop: 15,
    marginBottom: 15,
    textAlign:'center',
    fontSize: 25,
    color: '#1c1c1cff',
  },
  subcomtainer: {
    flexDirection: 'row',
  }
});