// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "devtexhhub",
  appId: "1:836450046711:web:ce72b97c5e3f172756b9f2",
  storageBucket: "devtexhhub.firebasestorage.app",
  apiKey: "AIzaSyBpe6vvq6GShZqofUofyKRPC-6DPFxwKBc",
  authDomain: "devtexhhub.firebaseapp.com",
  messagingSenderId: "836450046711"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
