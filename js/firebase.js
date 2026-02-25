import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCo-RUqFOsQqHGsnXUkFVOjANqEFj6JTpg",
  authDomain: "affitto-manager.firebaseapp.com",
  projectId: "affitto-manager",
  storageBucket: "affitto-manager.firebasestorage.app",
  messagingSenderId: "961351310754",
  appId: "1:961351310754:web:476e4e69f77adffb8766fb",
  measurementId: "G-WNV2FXTS3E"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// 🔥 FONDAMENTALE
setPersistence(auth, browserLocalPersistence);
