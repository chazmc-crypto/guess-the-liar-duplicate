import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Firebase configuration with your actual values
const firebaseConfig = {
  apiKey: "AIzaSyBfHKSTDRQVsoFXSbospWZHJRlRSijgiW0",
  authDomain: "guesstheliar-ca0b6.firebaseapp.com",
  databaseURL: "https://guesstheliar-ca0b6-default-rtdb.firebaseio.com",
  projectId: "guesstheliar-ca0b6",
  storageBucket: "guesstheliar-ca0b6.firebasestorage.app",
  messagingSenderId: "300436562056",
  appId: "1:300436562056:web:8e5368b914a5cbfded7f3d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
