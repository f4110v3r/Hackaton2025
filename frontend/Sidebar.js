import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal, PanResponder, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const sidebarWidth = 240;

export default function Sidebar() {
  const navigation = useNavigation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const animation = useRef(new Animated.Value(-sidebarWidth)).current;

  const screenWidth = Dimensions.get('window').width;

  const openSidebar = () => {
    setIsSidebarOpen(true);
    Animated.timing(animation, {
      toValue: 0,
      duration: 320,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(animation, {
      toValue: -sidebarWidth,
      duration: 320,
      useNativeDriver: true,
    }).start(() => setIsSidebarOpen(false));
  };

  const panResponder = useRef(
    PanResponder.create({ 
      onStartShouldSetPanResponder: (evt, gestureState) => {
        if (!isSidebarOpen && evt.nativeEvent.pageX < 20) {
          return true;
        }
        if (isSidebarOpen) {
          return true;
        }
        return false;
      },
      onPanResponderMove: (evt, gestureState) => {
        let dx = gestureState.dx;
        if (!isSidebarOpen) {
          if (dx > 0 && dx <= sidebarWidth) {
            animation.setValue(dx - sidebarWidth);
          }
        } else {
          if (dx < 0 && dx >= -sidebarWidth) {
            animation.setValue(dx);
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        let dx = gestureState.dx;
        let vx = gestureState.vx;

        if (!isSidebarOpen) {
          if (dx > sidebarWidth / 2 || vx > 0.5) {
            openSidebar();
          } else {
            closeSidebar();
          }
        } else {
          if (dx < -sidebarWidth / 2 || vx < -0.5) {
            closeSidebar();
          } else {
            openSidebar();
          }
        }
      },
    })
  ).current;

  const handleNavigate = (screen) => {
    closeSidebar();
    navigation.navigate(screen);
  };

  const handleLogout = () => {
    setShowLogoutPopup(true);
  };

  const confirmLogout = () => {
    setShowLogoutPopup(false);
    closeSidebar();
    navigation.navigate('Login');
  };

  const cancelLogout = () => {
    setShowLogoutPopup(false);
  };

  return (
    <>
      <View style={styles.gestureZone} {...panResponder.panHandlers} />
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: animation }],
          },
        ]}
      >
        <View style={styles.list}>
          <TouchableOpacity style={styles.item} onPress={() => handleNavigate('Login')}>
            <Text style={styles.itemText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={() => handleNavigate('MapScreen')}>
            <Text style={styles.itemText}>MapScreen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={() => handleNavigate('History')}>
            <Text style={styles.itemText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={() => handleNavigate('ChatBLE')}>
            <Text style={styles.itemText}>Chat</Text>
          </TouchableOpacity>
                    <TouchableOpacity style={styles.item} onPress={() => handleNavigate('BleChat')}>
            <Text style={styles.itemText}>BleChat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={handleLogout}>
            <Text style={styles.itemText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      {isSidebarOpen && (
        <TouchableOpacity style={styles.overlay} onPress={closeSidebar} />
      )}
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
}

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: sidebarWidth,
    height: '100%',
    paddingVertical: 24,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(40,40,40,0.9)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 40,
    elevation: 10,
    overflow: 'visible',
    zIndex: 999,
  },
  gestureZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'transparent',
    zIndex: 1000,
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    marginBottom: 12,
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
    color: '#000000ff',
    fontSize: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 500,
  },
});