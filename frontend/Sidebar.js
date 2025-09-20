import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal, Dimensions, PanResponder } from 'react-native';
import { useNavigation } from '@react-navigation/native';
const sidebarWidth = 240;
export default function Sidebar() {
  const navigation = useNavigation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [animation] = useState(new Animated.Value(-sidebarWidth));
    useEffect(() => {
    Animated.timing(animation, {
      toValue: isSidebarOpen ? 0 : -sidebarWidth,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [isSidebarOpen]);
    const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Open sidebar if swipe right and sidebar is closed
      if (!isSidebarOpen && gestureState.dx > 20) return true;
      // Close sidebar if swipe left and sidebar is open
      if (isSidebarOpen && gestureState.dx < -20) return true;
      return false;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx >= 0 && !isSidebarOpen) {
        animation.setValue(Math.min(gestureState.dx - sidebarWidth, 0));
      } else if (gestureState.dx <= 0 && isSidebarOpen) {
        animation.setValue(Math.max(gestureState.dx, -sidebarWidth));
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (!isSidebarOpen) {
        if (gestureState.dx > sidebarWidth / 3) {
          setIsSidebarOpen(true);
        } else {
          Animated.timing(animation, {
            toValue: -sidebarWidth,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      } else {
        if (gestureState.dx < -sidebarWidth / 3) {
          setIsSidebarOpen(false);
        } else {
          Animated.timing(animation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      }
    },
  });
    const handleNavigate = (screen) => {
    setIsSidebarOpen(false);
    navigation.navigate(screen);
  };
    const handleLogout = () => {
    setShowLogoutPopup(true);
  };
    const confirmLogout = () => {
    setShowLogoutPopup(false);
    // Implement your logout logic here
    navigation.navigate('Login');
  };
    const cancelLogout = () => {
    setShowLogoutPopup(false);
  };
    return (
    <>
      <Animated.View
        {...panResponder.panHandlers}
        style={[

          styles.sidebar,
          {
            transform: [{ translateX: animation }],
          },
        ]}
      >
        <View style={styles.list}>
          <TouchableOpacity style={styles.item} onPress={() => handleNavigate('Home')}>
            <Text style={styles.itemText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={() => handleNavigate('Profile')}>
            <Text style={styles.itemText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={() => handleNavigate('Settings')}>
            <Text style={styles.itemText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={handleLogout}>
            <Text style={styles.itemText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
            <Modal
        visible={showLogoutPopup}
        transparent
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popup}>
            <Text style={styles.popupText}>Are you sure you want to logout?</Text>
            <View style={styles.popupActions}>
              <TouchableOpacity style={styles.popupButton} onPress={confirmLogout}>
                <Text style={styles.popupButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.popupButton} onPress={cancelLogout}>
                <Text style={styles.popupButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
  const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: sidebarWidth,
    height: '100%',
    paddingVertical: 24,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(40,40,40,0.46)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 40,
    elevation: 10,
    overflow: 'visible',
  },
  list: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
  },
  itemText: {
    color: '#ccc',
    fontSize: 16,
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: 320,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    backdropFilter: 'blur(18px)', // Note: not supported in React Native, can be omitted
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
    alignItems: 'center',
  },
  popupText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  popupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    width: '100%',
  },
  popupButton: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  popupButtonText: {
    color: '#fff',
    fontSize: 16,
  },
})}