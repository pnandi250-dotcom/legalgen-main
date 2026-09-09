import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Hardcoded Firebase configuration (fixed for deployment)
const firebaseConfig = {
  apiKey: "AIzaSyAP_9_u9OHZ5IeRoSWGqJqT-mgJlAR7pBE",
  authDomain: "legalgen-ce2cd.firebaseapp.com",
  projectId: "legalgen-ce2cd",
  storageBucket: "legalgen-ce2cd.firebasestorage.app",
  messagingSenderId: "703332266493",
  appId: "1:703332266493:web:43267e0be2764ce8a82994"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { app, auth, googleProvider, db, firebaseConfig };