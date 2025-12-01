// app/(tabs)/camera.tsx

import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Linking from 'expo-linking';
import * as MediaLibrary from 'expo-media-library';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  background: '#f5f3eb',
  darkGreen: '#4d7c0f',
  lightGreen: '#709d43',
  card: '#e8dcc8',
  textDark: '#2d4a0a',
  textLight: '#ffffff',
  black: '#000000',
};

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'create'>('scan');
  const [qrText, setQrText] = useState('');
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const viewShotRef = useRef<any>(null);
  const scanLinePosition = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Keyboard listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Animated scanning line
  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLinePosition, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLinePosition, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    animate();
  }, []);

  const handleSaveQR = async () => {
    if (!qrText.trim()) {
      Alert.alert('Error', 'Please enter text or URL for the QR code');
      return;
    }

    try {
      if (!mediaPermission?.granted) {
        const result = await requestMediaPermission();
        if (!result.granted) {
          Alert.alert('Permission Required', 'Please grant permission to save images');
          return;
        }
      }

      const uri = await viewShotRef.current.capture();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', 'QR code saved to your gallery!');
    } catch (error) {
      console.error('Error saving QR code:', error);
      Alert.alert('Error', 'Failed to save QR code');
    }
  };

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

    setTimeout(() => setScanned(false), 2000);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <MaterialCommunityIcons name="camera" size={60} color={COLORS.lightGreen} />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <MaterialCommunityIcons name="camera-off" size={60} color={COLORS.lightGreen} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionSubtext}>
            We need camera access to scan QR codes for volunteer opportunities
          </Text>
          <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
            <Text style={styles.grantButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const scanLineTranslateY = scanLinePosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >

{/* Header - Matches search.tsx styling */}
<View style={styles.header}>
  <View style={styles.logoContainer}>
    <MaterialCommunityIcons
      name="tree-outline"
      size={35}
      color={COLORS.darkGreen}
    />
    <View>
      <Text style={styles.logoText}>ROOTED</Text>
      <Text style={styles.subLogoText}>VOLUNTEER & COMMUNITY</Text>
    </View>
  </View>
</View>

        {/* Tabs - Moved up */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'scan' && styles.activeTab]}
            onPress={() => setActiveTab('scan')}
          >
            <Text style={[styles.tabText, activeTab === 'scan' && styles.activeTabText]}>
              Scan QR
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'create' && styles.activeTab]}
            onPress={() => setActiveTab('create')}
          >
            <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
              Create QR
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'scan' ? (
          <>
  {/* Camera View */}
  <View style={styles.cameraContainer}>
    <CameraView
      style={StyleSheet.absoluteFillObject}
      onBarcodeScanned={scanned ? undefined : handleScan}
      barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
    />

    {/* Scan Frame */}
    <View style={styles.scanArea}>
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
      
      <Animated.View 
        style={[
          styles.scanLine,
          { transform: [{ translateY: scanLineTranslateY }] }
        ]} 
      />
    </View>

    {scanned && (
      <View style={styles.successOverlay}>
        <MaterialCommunityIcons name="check-circle" size={80} color={COLORS.lightGreen} />
      </View>
    )}
  </View>

  {/* Bottom Info Card - Moved up with marginBottom */}
  <View style={[styles.bottomCard, styles.scanBottomCard]}>
    <View style={styles.iconCircle}>
      <MaterialCommunityIcons name="qrcode-scan" size={20} color={COLORS.darkGreen} />
    </View>
    <Text style={styles.instructionTitle}>Scan QR Code</Text>
    <Text style={styles.instructionText}>
      Point your camera at a QR code to discover volunteer opportunities
    </Text>
  </View>
</>
        ) : (
          <>
            {/* Create QR Content - Very compact */}
            <View style={styles.createContainer}>
              
              {/* QR Code Preview - Even smaller */}
              <View style={styles.qrPreviewCard}>
                <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                  <View style={styles.qrCodeWrapper}>
                    {qrText.trim() ? (
                      <QRCode
                        value={qrText}
                        size={100}
                        color={COLORS.black}
                        backgroundColor={COLORS.textLight}
                      />
                    ) : (
                      <View style={styles.qrPlaceholder}>
                        <MaterialCommunityIcons 
                          name="qrcode" 
                          size={50} 
                          color={COLORS.lightGreen} 
                          style={{ opacity: 0.3 }}
                        />
                      </View>
                    )}
                  </View>
                </ViewShot>
              </View>

              {/* Input Card - Fixed at bottom, rises with keyboard */}
              <View style={[
                styles.inputCard, 
                keyboardVisible && styles.inputCardWithKeyboard
              ]}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="qrcode-plus" size={18} color={COLORS.darkGreen} />
                  <Text style={styles.instructionTitle}>Create QR Code</Text>
                </View>
                
                <Text style={styles.instructionText}>
                  Enter text or URL to generate QR code
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter text or URL..."
                  placeholderTextColor="#999"
                  value={qrText}
                  onChangeText={setQrText}
                  multiline
                  numberOfLines={2}
                />

                {/* Save Button - Always visible above keyboard */}
                <TouchableOpacity 
                  style={[styles.saveButton, !qrText.trim() && styles.saveButtonDisabled]}
                  onPress={handleSaveQR}
                  disabled={!qrText.trim()}
                >
                  <MaterialCommunityIcons name="download" size={16} color={COLORS.textLight} />
                  <Text style={styles.saveButtonText}>Save to Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  // Replace these styles in the StyleSheet:

header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  paddingVertical: 10,
  marginBottom: 10,
  backgroundColor: 'transparent',
},
logoContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 5,
},
logoText: {
  fontSize: 18,
  fontWeight: 'bold',
  color: COLORS.darkGreen,
},
subLogoText: {
  fontSize: 8,
  color: COLORS.darkGreen,
  fontWeight: '500',
},
menuButton: {
  backgroundColor: COLORS.lightGreen,
  borderRadius: 8,
  padding: 5,
},
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d1d1',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.darkGreen,
  },
  tabText: {
    fontSize: 15,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.darkGreen,
    fontWeight: '700',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  scanArea: {
    position: 'absolute',
    top: '25%',
    left: '15%',
    width: '70%',
    height: 200,
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: COLORS.lightGreen,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: COLORS.lightGreen,
    shadowColor: COLORS.lightGreen,
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(77, 124, 15, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomCard: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 15,
    alignItems: 'center',
  },
  createContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  qrPreviewCard: {
    backgroundColor: COLORS.textLight,
    borderRadius: 12,
    padding: 15,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
    elevation: 2,
  },
  qrCodeWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.card,
    borderStyle: 'dashed',
  },
  inputCard: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 'auto',
    minHeight: 250,
  },
  inputCardWithKeyboard: {
    marginBottom: 0,
    paddingBottom: 30, // Extra padding when keyboard is up
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  instructionText: {
    fontSize: 12,
    color: COLORS.textDark,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.textLight,
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: COLORS.textDark,
    marginBottom: 12,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.darkGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonText: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  saveButtonDisabled: {
    backgroundColor: '#c9d1b8',
    opacity: 0.6,
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 30,
  },
  permissionText: {
    color: COLORS.textDark,
    fontSize: 16,
    marginTop: 20,
  },
  permissionTitle: {
    color: COLORS.textDark,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionSubtext: {
    color: COLORS.textDark,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 30,
    lineHeight: 20,
  },
  grantButton: {
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    elevation: 3,
  },
  grantButtonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  iconCircle: {
    backgroundColor: COLORS.textLight,
    padding: 8,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  scanBottomCard: {
  marginBottom: 45, // Adds space above the navigation tab
},
});