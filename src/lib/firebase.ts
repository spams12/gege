import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCNs_jGE7sEM21FxUblls7X3vIqBJiY5OE",
  authDomain: "hey21-b11bb.firebaseapp.com",
  projectId: "hey21-b11bb",
  storageBucket: "hey21-b11bb.firebasestorage.app",
  messagingSenderId: "348825262692",
  appId: "1:348825262692:web:75017e1bfabeb5c5a65d71"
};
  
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Set persistence to local to keep user logged in even after page refresh
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error("Error setting auth persistence:", error);
});
