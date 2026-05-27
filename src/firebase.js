// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqrpCJw2t2HzCfMz9Fp_yvaD_KGfW50iY",
  authDomain: "horn-lake-fire-app.firebaseapp.com",
  projectId: "horn-lake-fire-app",
  storageBucket: "horn-lake-fire-app.firebasestorage.app",
  messagingSenderId: "516723923276",
  appId: "1:516723923276:web:73bba5fa2d66e5522457e9",
  measurementId: "G-93MTZT8RNN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);