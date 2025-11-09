import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

// Read config from Expo runtime config (set via app.config.js) or fall back to process.env
const extra = (Constants.expoConfig && Constants.expoConfig.extra) ? Constants.expoConfig.extra : {} as Record<string, string>;

const firebaseConfig = {
  apiKey: extra.FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
  authDomain: extra.FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: extra.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: extra.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: extra.FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
  measurementId: extra.FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || '',
};

// Basic validation to help catch missing env during development
if (!firebaseConfig.apiKey) {
  // eslint-disable-next-line no-console
  console.warn('[firebaseConfig] No FIREBASE_API_KEY found in Constants.expoConfig.extra or process.env. Make sure your .env and app.config.js are set up.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
