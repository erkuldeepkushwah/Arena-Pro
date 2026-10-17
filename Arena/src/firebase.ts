import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB4AuvcCqXYvXSfqVSwNNzJvqfDborf1F0",
  authDomain: "arena-5eae8.firebaseapp.com",
  databaseURL: "https://arena-5eae8-default-rtdb.firebaseio.com",
  projectId: "arena-5eae8",
  storageBucket: "arena-5eae8.firebasestorage.app",
  messagingSenderId: "918579400564",
  appId: "1:918579400564:web:83ddf3fb6cdf8c62d36621",
  measurementId: "G-B9FPLL0C2B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
