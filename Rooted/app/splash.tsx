// app/index.tsx
import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Show nothing while checking auth state
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/images/rooted_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Buttons Container */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.signInButton}
          onPress={() => router.push('/auth/signin')}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signUpButton}
          onPress={() => router.push('/auth/signup')}
        >
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcfaf0',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: width * 0.6,
    height: height * 0.3,
    maxWidth: 300,
    maxHeight: 300,
  },
  loadingText: {
    fontSize: 18,
    color: '#4d7c0f',
    fontWeight: '600',
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 40,
    gap: 15,
    marginBottom: 40,
  },
  signInButton: {
    backgroundColor: '#4d7c0f',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4d7c0f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signUpButtonText: {
    color: '#4d7c0f',
    fontSize: 18,
    fontWeight: 'bold',
  },
});