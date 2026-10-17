import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAQj9PaUy4z0YCfdAvvSJxLEkbFXIBwTkA",
  authDomain: "kuldeep-fcb48.firebaseapp.com",
  databaseURL: "https://kuldeep-fcb48-default-rtdb.firebaseio.com",
  projectId: "kuldeep-fcb48",
  storageBucket: "kuldeep-fcb48.firebasestorage.app",
  messagingSenderId: "868463391327",
  appId: "1:868463391327:web:798219ac1b6809c55721ea",
  measurementId: "G-C8W01TS9XT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
