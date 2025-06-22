import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyAY5-m0_KeZO04-u4XSgy6xyAH2jfFpmAs",
  authDomain: "smart-scheduler-e0406.firebaseapp.com",
  projectId: "smart-scheduler-e0406",
  storageBucket: "smart-scheduler-e0406.firebasestorage.app",
  messagingSenderId: "5413006646",
  appId: "1:5413006646:web:7ee00a20b3bb19f4939797"
};

const app = initializeApp(firebaseConfig);

// Optional advanced stable config
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);