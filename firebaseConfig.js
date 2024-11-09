import { initializeApp } from 'firebase/app';

// Optionally import the services that you want to use
 import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
 import AsyncStorage from '@react-native-async-storage/async-storage';
  import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics'; // Import Analytics and isSupported


// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBPVJIbA9BnPTKLy_Bs-OarJl9z7MuTRSc",
  authDomain: "aere-react-native.firebaseapp.com",
  projectId: "aere-react-native",
  storageBucket: "aere-react-native.appspot.com",
  messagingSenderId: "159308643479",
  appId: "1:159308643479:web:96d56470853dec79a07dd2"
};

export const FIREBASE_APP = initializeApp(firebaseConfig);

let firebaseAuth;
try {
  firebaseAuth = initializeAuth(FIREBASE_APP, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  if (error.code === 'auth/already-initialized') {
    firebaseAuth = getAuth(FIREBASE_APP);
  } else {
    throw error;
  }
}

export const FIREBASE_AUTH = firebaseAuth;
export const FIREBASE_DB = getFirestore(FIREBASE_APP);
export const FIREBASE_STORAGE = getStorage(FIREBASE_APP);

let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(FIREBASE_APP); // Initialize Firebase Analytics
  } else {
    console.warn('Firebase Analytics is not supported in this environment.');
  }
}).catch((error) => {
  console.error('Error checking analytics support:', error);
});

export { analytics };