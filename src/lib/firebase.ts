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
const db = getFirestore(app, firebaseConfig.databaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { db, collection, doc, getDoc, setDoc, updateDoc, getDocs, addDoc, query, where, deleteDoc };
