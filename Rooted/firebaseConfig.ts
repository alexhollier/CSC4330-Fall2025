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

// Validate all required Firebase config values
const requiredFields = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
] as const;

const missingFields = requiredFields.filter(
  (field) => !firebaseConfig[field]
);

if (missingFields.length > 0) {
  console.error(
    '[firebaseConfig] Missing Firebase configuration:',
    missingFields.join(', ')
  );
  console.error('[firebaseConfig] Check app.config.js and .env file');
  console.error('[firebaseConfig] Extra config received:', extra);
  throw new Error(
    `Firebase configuration incomplete. Missing: ${missingFields.join(', ')}`
  );
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
