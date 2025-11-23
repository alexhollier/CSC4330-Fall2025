import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator, } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { collection, setDoc, doc } from 'firebase/firestore';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AuthModal({ visible, onClose }: AuthModalProps) {
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log(`User is ${user ? 'signed in' : 'not signed in'} and modal is ${visible ? 'present' : 'not present'}`);
    });
    return unsubscribe;
  }, [visible]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      resetForm();
      onClose();
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email
      await sendEmailVerification(userCredential.user);
      
      setVerificationEmailSent(true);
      Alert.alert(
        'Verification Email Sent',
        `A verification email has been sent to ${email}. Please check your inbox and verify your email to complete your registration.`,
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setIsSignUp(false);
    setVerificationEmailSent(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>
            {isSignUp ? 'Create Account' : 'Welcome to Rooted'}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={isSignUp ? handleSignUp : handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!isSignUp) {
                setShowSignUpModal(true);
              } else {
                setIsSignUp(false);
                resetForm();
              }
            }}
            disabled={loading}
          >
            <Text style={styles.toggleText}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <SignUpModal 
        visible={showSignUpModal} 
        onClose={() => setShowSignUpModal(false)}
        onBackToLogin={() => {
          setShowSignUpModal(false);
          resetForm();
        }}
      />
    </Modal>
  );
}

interface SignUpModalProps {
  visible: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

function SignUpModal({ visible, onClose, onBackToLogin }: SignUpModalProps) {
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    if (!signUpName || !signUpEmail || !signUpPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (signUpPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (signUpPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword);
      
      // Save user information to Firestore
      await setDoc(doc(db, 'UserInformation', userCredential.user.uid), {
        email: signUpEmail,
        name: signUpName,
        createdAt: new Date(),
      });
      
      // Send verification email
      await sendEmailVerification(userCredential.user);
      
      Alert.alert(
        'Sign Up Link Sent!',
        `A sign-up link has been sent to ${signUpEmail}. Please check your inbox and verify your email to complete your registration.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSignUpName('');
              setSignUpEmail('');
              setSignUpPassword('');
              setConfirmPassword('');
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Sign up error code:', error.code);
      console.error('Sign up error message:', error.message);
      
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Email Already Registered', 'This email is already registered. Please sign in instead.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Weak Password', 'Password should be at least 6 characters.');
      } else {
        Alert.alert('Sign Up Failed', error.message || 'An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={signUpName}
            onChangeText={setSignUpName}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={signUpEmail}
            onChangeText={setSignUpEmail}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={signUpPassword}
            onChangeText={setSignUpPassword}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCreateAccount}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onBackToLogin}
            disabled={loading}
          >
            <Text style={styles.toggleText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fcfaf0',
    padding: 30,
    borderRadius: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4d7c0f',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#4d7c0f',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleText: {
    color: '#4d7c0f',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});
