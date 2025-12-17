import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  initializeAuth,
  Auth,
  // @ts-ignore
  getReactNativePersistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBDdWlYX8FPI0Vc_Z5iTSWqYBe0UTbM3Ks",
  authDomain: "cleaningapp-4a065.firebaseapp.com",
  projectId: "cleaningapp-4a065",
  storageBucket: "cleaningapp-4a065.firebasestorage.app",
  messagingSenderId: "63277880839",
  appId: "1:63277880839:web:b5bdc015c1f1dcb4f97ca2",
  measurementId: "G-607PY08J85",
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

const db = getFirestore(app);

export { auth, db };
