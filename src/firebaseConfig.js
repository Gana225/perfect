// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInAnonymously,
    signInWithCustomToken,
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import {getStorage} from 'firebase/storage';

// --- Your Firebase project configuration ---
// IMPORTANT: Replace these with your actual Firebase project's details.
// You can find these in your Firebase project settings -> Project settings -> General -> Your apps -> Firebase SDK snippet -> Config
const firebaseConfig = {
    apiKey: "AIzaSyBX8pz56e3Q_OUOStDl57_ePPgYIW0qRY4",
    authDomain: "egty-c7097.firebaseapp.com",
    projectId: "egty-c7097",
    storageBucket: "egty-c7097.firebasestorage.app",
    messagingSenderId: "616118712325",
    appId: "1:616118712325:web:6afac3703b61266bba446c",
    measurementId: "G-X4YHN217P6"
};

// --- Application ID and Initial Auth Token ---
// For a standard React/Vite app, you often use the projectId as a general app identifier for Firestore paths.
// `initialAuthToken` will be null unless you have a specific system (like Canvas) injecting it.
export const appId = firebaseConfig.projectId; // Using projectId as a convenient general app identifier
export const initialAuthToken = null; // No initial token provided by default

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Export all necessary Firebase instances and functions
// This makes them easily importable across your application.
export {
    app,
    signInAnonymously, // For guest login
    signInWithCustomToken, // For Canvas-provided tokens
    onAuthStateChanged, // To listen for auth state changes
    signOut, // For logging out
    signInWithEmailAndPassword, // For email/password login
    createUserWithEmailAndPassword, // For email/password registration
    // Export Firestore functions needed
    doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, getDocs
};


export const usersdata = "apps/egty-c7097/users/";
export const announcemenstdata = "apps/egty-c7097/public/data/announcements";
export const payrolldata = "payments/egty-c7097/payment";