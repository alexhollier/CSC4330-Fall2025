import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FilterSettings {
  distance: number;
  morning: boolean;
  afternoon: boolean;
}

const LOCAL_KEY_PREFIX = 'userFilters';

function localKey(userId?: string | null) {
  return userId ? `${LOCAL_KEY_PREFIX}_${userId}` : `${LOCAL_KEY_PREFIX}_local`;
}

/**
 * Save filters: attempt Firestore (if userId provided), and always persist locally as a fallback.
 */
export async function saveUserFilters(userId: string | null, filters: FilterSettings) {
  const key = localKey(userId);

  // Try saving to Firestore if we have a userId
  if (userId) {
    try {
      const ref = doc(db, 'userSettings', userId);
      await setDoc(ref, { filters }, { merge: true });
    } catch (err) {
      console.error('[filterService] Firestore save failed, falling back to AsyncStorage', err);
    }
  }

  // Always save locally so unsigned users or permission failures still persist
  try {
    await AsyncStorage.setItem(key, JSON.stringify(filters));
  } catch (err) {
    console.error('[filterService] AsyncStorage save failed', err);
  }
}

/**
 * Load filters: attempt Firestore first (if userId provided), else fallback to AsyncStorage.
 * If Firestore read fails (permissions or other), we also fallback to AsyncStorage.
 */
export async function loadUserFilters(userId: string | null): Promise<FilterSettings | null> {
  const key = localKey(userId);

  if (userId) {
    try {
      const ref = doc(db, 'userSettings', userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const filters = (data.filters as FilterSettings) ?? null;
        if (filters) return filters;
      }
    } catch (err) {
      // Provide more actionable logs for permission errors
      try {
        const code = (err as any)?.code ?? (err as any)?.message ?? 'unknown';
        console.error('[filterService] Firestore load failed (code:', code, '), falling back to AsyncStorage', err);
        if ((err as any)?.code === 'permission-denied' || (err as any)?.message?.includes('insufficient permissions')) {
          console.error('[filterService] Permission error when reading Firestore. Verify Firestore rules allow read for userSettings/{uid} and that the app is using the correct Firebase project.');
        }
      } catch (logErr) {
        console.error('[filterService] Firestore load failed and error logging also failed', logErr);
      }
    }
  }

  // Fallback to local storage
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as FilterSettings;
  } catch (err) {
    console.error('[filterService] AsyncStorage load failed', err);
    return null;
  }
}

/**
 * If there are locally-stored (unsigned) filters, attempt to migrate them to the
 * authenticated user's Firestore document and then remove the anonymous local copy.
 */
export async function migrateLocalToUser(userId: string): Promise<void> {
  if (!userId) return;
  const anonKey = localKey(null);
  try {
    const raw = await AsyncStorage.getItem(anonKey);
    if (!raw) return; // nothing to migrate
    const filters = JSON.parse(raw) as FilterSettings;

    try {
      const ref = doc(db, 'userSettings', userId);
      await setDoc(ref, { filters }, { merge: true });
      // remove anonymous local copy only if Firestore write succeeded
      await AsyncStorage.removeItem(anonKey);
      // Also persist under the authenticated user's local key for consistency
      await AsyncStorage.setItem(localKey(userId), JSON.stringify(filters));
      console.log('[filterService] migrated local filters to Firestore for user', userId);
    } catch (err) {
      console.error('[filterService] failed to write migrated filters to Firestore', err);
    }
  } catch (err) {
    console.error('[filterService] failed to read anonymous local filters for migration', err);
  }
}
