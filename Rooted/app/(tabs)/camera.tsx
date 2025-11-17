// app/(tabs)/camera.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Linking from 'expo-linking';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleScan = async (result: any) => {
  if (scanned) return;

  const url = result.data;
  setScanned(true);

  const supported = await Linking.canOpenURL(url);

  if (supported) {
    await Linking.openURL(url);
  } else {
    alert(`Scanned: ${url}`);
  }

  setTimeout(() => setScanned(false), 1000);
};



  if (!permission) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
        <Text style={styles.link} onPress={requestPermission}>
          Grant Permission
        </Text>
      </View>
    );
  }

  return (
  <View style={styles.container}>
    <View style={styles.cameraWrapper}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* 🔳 QR Scan Frame Overlay */}
      <View style={styles.frame} />
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
    flex: 0.7,
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

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  link: { color: '#4da6ff', marginTop: 10 },

  frame: {
  position: 'absolute',
  top: '25%',   // adjust up/down
  left: '15%',  // adjust left/right
  width: '70%', // square width
  height: '50%', // adjust for perfect square depending on phone ratio
  borderWidth: 3,
  borderColor: '#00FFAA',
  borderRadius: 10,
},

});
