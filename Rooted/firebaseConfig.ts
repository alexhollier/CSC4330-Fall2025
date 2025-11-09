import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

const firebaseConfig = {
  apiKey: extra.FIREBASE_API_KEY as string,
  authDomain: extra.FIREBASE_AUTH_DOMAIN as string,
  projectId: extra.FIREBASE_PROJECT_ID as string,
  storageBucket: extra.FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID as string,
  appId: extra.FIREBASE_APP_ID as string,
  measurementId: extra.FIREBASE_MEASUREMENT_ID as string,
};

if (!firebaseConfig.apiKey) {
  console.warn('[firebaseConfig] No FIREBASE_API_KEY found. Check app.config.js and .env');
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
