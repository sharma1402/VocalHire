import { getApp, getApps, initializeApp} from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAY2aJY9yJPqY82yYb7G802zf2O008FLHs",
  authDomain: "vocalhire-582b1.firebaseapp.com",
  projectId: "vocalhire-582b1",
  storageBucket: "vocalhire-582b1.firebasestorage.app",
  messagingSenderId: "402298401955",
  appId: "1:402298401955:web:5185d87e40a98886d7fb16",
  measurementId: "G-DSW0CVTQ25"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);