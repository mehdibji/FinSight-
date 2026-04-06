import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
 apiKey: "AIzaSyBW8pVk_omIHrH95PqDPlnIZsI9tjkGFUI",
  authDomain: "finsight-d27a6.firebaseapp.com",
  projectId: "finsight-d27a6",
  storageBucket: "finsight-d27a6.firebasestorage.app",
  messagingSenderId: "494049581436",
  appId: "1:494049581436:web:cacb4ccd22e51e0e9eacf9",
  measurementId: "G-XTGP2G6M0F"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
