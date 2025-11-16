// app/(tabs)/camera.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleScan = ({ data }: { data: string }) => {
    setScanned(true);
    alert(`Scanned: ${data}`);
    setTimeout(() => setScanned(false), 1000);
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleScan}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <View style={styles.bottomContent}>
        <Text style={styles.text}>Scan a QR Code</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraWrapper: {
    flex: 0.7, // 70% of screen
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  bottomContent: {
    flex: 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  text: { color: '#fff', fontSize: 18 },
});
