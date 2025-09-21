import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, Easing } from 'react-native';
import haversine from 'haversine-distance';
import Sidebar from './Sidebar';
import { LinearGradient } from 'expo-linear-gradient';
import { Magnetometer } from 'expo-sensors';

// Функция для определения сектора по углу
const getSectorFromAngle = (angle) => {
  if (angle >= -22.5 && angle < 22.5) return 'E';
  if (angle >= 22.5 && angle < 67.5) return 'NE';
  if (angle >= 67.5 && angle < 112.5) return 'N';
  if (angle >= 112.5 && angle < 157.5) return 'NW';
  if (angle >= 157.5 || angle < -157.5) return 'W';
  if (angle >= -157.5 && angle < -112.5) return 'SW';
  if (angle >= -112.5 && angle < -67.5) return 'S';
  if (angle >= -67.5 && angle < -22.5) return 'SE';
  return 'N';
};

const sectorToAngle = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: -135,
  W: -90,
  NW: -45,
};

export const DangerLevel = ({ sensorDataArray, userCoords }) => {
  const [threatPercent, setThreatPercent] = useState(0);
  const [safeSector, setSafeSector] = useState('N');
  const [userHeading, setUserHeading] = useState(0);
  const rotation = useRef(new Animated.Value(0)).current;
  const safeRotation = useRef(new Animated.Value(0)).current;
  const lastSafeRotation = useRef(0);

  useEffect(() => {
    if (!sensorDataArray || sensorDataArray.length === 0) return;

    let totalScore = 0;
    const sectorScores = {
      N: 0, NE: 0, E: 0, SE: 0, S: 0, SW: 0, W: 0, NW: 0
    };

    sensorDataArray.forEach(data => {
      const dist = haversine(userCoords, data.position);
      let score = 0;

      if (data.temperature > 40) score += 2;
      if (data.humidity > 85) score += 1;

      if (dist < 100) score += 3;
      else if (dist < 500) score += 2;
      else score += 1;

      totalScore += score;

      const angle = Math.atan2(data.position.lat - userCoords.lat, data.position.lng - userCoords.lng) * 180 / Math.PI;
      const sector = getSectorFromAngle(angle);
      sectorScores[sector] += score;
    });

    const maxScore = sensorDataArray.length * 6;
    setThreatPercent(Math.min(100, Math.round((totalScore / maxScore) * 100)));

    const safest = Object.keys(sectorScores).reduce((a, b) =>
      sectorScores[a] < sectorScores[b] ? a : b
    );
    setSafeSector(safest);

  }, [sensorDataArray, userCoords]);

  // Subscribe to Magnetometer to get device heading
  useEffect(() => {
    const subscription = Magnetometer.addListener(data => {
      let { x, y } = data;
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      // Adjust so that 0 is North
      let heading = (angle + 360) % 360;
      setUserHeading(heading);
    });
    Magnetometer.setUpdateInterval(100);

    return () => {
      subscription && subscription.remove();
    };
  }, []);

  // Animate user heading rotation
  useEffect(() => {
    // Normalize heading to -180 to 180 for smooth animation
    let newValue = userHeading > 180 ? userHeading - 360 : userHeading;
    Animated.timing(rotation, {
      toValue: newValue,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [userHeading]);

  // Animate safe direction arrow rotation relative to user heading
  useEffect(() => {
    const safeAngle = sectorToAngle[safeSector] || 0;
    // Calculate relative angle from user heading
    let relativeAngle = safeAngle - userHeading;
    if (relativeAngle > 180) relativeAngle -= 360;
    else if (relativeAngle < -180) relativeAngle += 360;

    // Animate safe arrow rotation
    let start = lastSafeRotation.current;
    let end = relativeAngle;
    let diff = end - start;

    if (diff > 180) diff -= 360;
    else if (diff < -180) diff += 360;

    const finalValue = start + diff;

    Animated.timing(safeRotation, {
      toValue: finalValue,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      lastSafeRotation.current = finalValue % 360;
    });
  }, [safeSector, userHeading]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  const safeRotateInterpolate = safeRotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  const renderSensor = ({ item }) => (
    <View style={styles.sensorItem}>
      <Text style={styles.sensorDeviceName}>{item.deviceName || item.deviceId}</Text>
      <Text style={styles.sensorText}>Температура: {item.temperature}°C</Text>
      <Text style={styles.sensorText}>Влажность: {item.humidity}%</Text>
      <Text style={styles.sensorText}>Координаты: {item.position.lat.toFixed(4)}, {item.position.lng.toFixed(4)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.compassContainer}>
        <View style={styles.compassCircle}>
          <Animated.View style={[styles.userArrow, { transform: [{ rotate: rotateInterpolate }] }]} />
          <Animated.View style={[styles.safeArrow, { transform: [{ rotate: safeRotateInterpolate }] }]} />
          <Text style={styles.compassLabel}>N</Text>
        </View>
        <Text style={styles.safeDirection}>Безопасное направление: {safeSector}</Text>
      </View>

      <View style={styles.threatContainer}>
        <LinearGradient
          colors={['#ff4e50', '#f9d423']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.threatGradient}
        >
          <Text style={styles.threatPercent}>{threatPercent}%</Text>
        </LinearGradient>
      </View>

      <Sidebar />

      <Text style={styles.sectionTitle}>Ближайшие угрозы</Text>
      <FlatList
        data={sensorDataArray}
        renderItem={renderSensor}
        keyExtractor={(item) => item.deviceId}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f0f4f8' },
  compassContainer: { alignItems: 'center', marginBottom: 20 },
  compassCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  userArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 40,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#2980b9', // Blue color for user direction
    position: 'absolute',
    top: 20,
  },
  safeArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#27ae60', // Green color for safe direction
    position: 'absolute',
    top: 35,
  },
  compassLabel: {
    position: 'absolute',
    top: 10,
    fontWeight: '700',
    fontSize: 16,
    color: '#34495e',
  },
  safeDirection: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  threatContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  threatGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  threatPercent: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#34495e',
  },
  list: {
    flex: 1,
  },
  sensorItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sensorDeviceName: {
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 16,
    color: '#2c3e50',
  },
  sensorText: {
    fontSize: 14,
    color: '#555',
  },
});