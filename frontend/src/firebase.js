// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAAmYHhhPWOVIWCcw4CXuk6vA4CiSSWlzg",
    authDomain: "project-5829217217396088533.firebaseapp.com",
    databaseURL: "https://project-5829217217396088533-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "project-5829217217396088533",
    storageBucket: "project-5829217217396088533.appspot.com",
    messagingSenderId: "901597966480",
    appId: "1:901597966480:web:71639a181d156ba2956815"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the database instance
const database = getDatabase(app);
export { database };