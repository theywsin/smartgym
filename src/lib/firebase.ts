import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, getDocs, addDoc, query, where, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "formal-answer-s18qq",
  appId: "1:25670355003:web:d2ce5ea08420510eaa341e",
  apiKey: "AIzaSyBt4MaMSCx4vuRkADnNII8_0i6At3x86_g",
  authDomain: "formal-answer-s18qq.firebaseapp.com",
  databaseId: "ai-studio-smartgymsaasplat-b45b1cbf-2992-4ae1-9fa1-2f2b5aa492cf",
  storageBucket: "formal-answer-s18qq.firebasestorage.app",
  messagingSenderId: "25670355003"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, doc, getDoc, setDoc, updateDoc, getDocs, addDoc, query, where, deleteDoc };
