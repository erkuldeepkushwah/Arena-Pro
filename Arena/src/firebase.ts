import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCr9M4t9kTgqKK7VlAr-_JfvT_N3Qb2xgY",
  authDomain: "career-68877.firebaseapp.com",
  databaseURL: "https://career-68877-default-rtdb.firebaseio.com",
  projectId: "career-68877",
  storageBucket: "career-68877.firebasestorage.app",
  messagingSenderId: "828433949673",
  appId: "1:828433949673:web:8f7a3436edb0b1655a6178",
  measurementId: "G-9051DT2C2F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
