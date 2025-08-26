import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA57whZTBJc7SGgHhhVQMcicUaWHn-bqZA",
  authDomain: "flutter-15d5a.firebaseapp.com",
  databaseURL:
    "https://flutter-15d5a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "flutter-15d5a",
  storageBucket: "flutter-15d5a.firebasestorage.app",
  messagingSenderId: "231875555899",
  appId: "1:231875555899:web:7c536068c8271af255221e",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
