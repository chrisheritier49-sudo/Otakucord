import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAQIYFUGxsMrAjsKCcMG62gZFcC99PYQeQ",
  authDomain: "otakucord.firebaseapp.com",
  projectId: "otakucord",
  storageBucket: "otakucord.firebasestorage.app",
  messagingSenderId: "898702202846",
  appId: "1:898702202846:web:b93fd4e7eaf729c6876f4f",
  measurementId: "G-7E8BRY4KDN"
};

let app;
let db: any = null;
let auth: any = null;
let isFirebaseEnabled = false;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  db = getFirestore(app);
  auth = getAuth(app);
  isFirebaseEnabled = true;

  // Enable offline persistence for extra robustness
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firebase persistence failed-precondition: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firebase persistence unimplemented in this browser');
      }
    });
  } catch (persistenceErr) {
    console.warn('IndexedDB persistence setup skipped:', persistenceErr);
  }
} catch (error) {
  console.error("Firebase failed to initialize. Falling back to local database engine.", error);
}

export { db, auth, isFirebaseEnabled };
