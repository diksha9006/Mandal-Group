import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLza3hIR5jtxvtTvfdEliP1nUyxQPGadk",
  authDomain: "mandal-group-erp.firebaseapp.com",
  projectId: "mandal-group-erp",
  storageBucket: "mandal-group-erp.firebasestorage.app",
  messagingSenderId: "233536343180",
  appId: "1:233536343180:web:0e7d05364784beb1db3fa9"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);