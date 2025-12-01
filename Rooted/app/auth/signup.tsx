// app/auth/signup.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<'user' | 'organization'>('user');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
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
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Store account type in Firestore
      await setDoc(doc(db, 'UserInformation', userCredential.user.uid), {
        email: email,
        accountType: accountType,
        createdAt: new Date().toISOString(),
      });
      
      // Send verification email
      await sendEmailVerification(userCredential.user);
      
      // Sign out the user immediately after signup
      await signOut(auth);
      
      Alert.alert(
        'Verification Email Sent',
        `A verification email has been sent to ${email}. Please verify your email and then sign in.`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/splash');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Sign up error:', error.code);
      
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcon name="arrow-back" size={24} color="#4d7c0f" />
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          {/* Account Type Selection */}
          <View style={styles.accountTypeContainer}>
            <TouchableOpacity 
              style={[
                styles.accountTypeButton, 
                accountType === 'user' && styles.accountTypeButtonActive
              ]}
              onPress={() => setAccountType('user')}
              disabled={loading}
            >
              <Text style={[
                styles.accountTypeText,
                accountType === 'user' && styles.accountTypeTextActive
              ]}>User</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.accountTypeButton, 
                accountType === 'organization' && styles.accountTypeButtonActive
              ]}
              onPress={() => setAccountType('organization')}
              disabled={loading}
            >
              <Text style={[
                styles.accountTypeText,
                accountType === 'organization' && styles.accountTypeTextActive
              ]}>Organization</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={"#777"}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={"#777"}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={"#777"}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/auth/signin')}
            disabled={loading}
          >
            <Text style={styles.link}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcfaf0',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  formContainer: {
    width: '100%',
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4d7c0f',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  accountTypeContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
    gap: 10,
  },
  accountTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4d7c0f',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  accountTypeButtonActive: {
    backgroundColor: '#4d7c0f',
  },
  accountTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4d7c0f',
  },
  accountTypeTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    marginBottom: 16,
    borderRadius: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4d7c0f',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    color: '#4d7c0f',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});