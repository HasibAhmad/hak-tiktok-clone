import firebase from 'firebase'

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBHakpW83f92EqvOWTq4kAKBh0JP2dlXt0",
  authDomain: "hak-tik-tok.firebaseapp.com",
  projectId: "hak-tik-tok",
  storageBucket: "hak-tik-tok.appspot.com",
  messagingSenderId: "894169991984",
  appId: "1:894169991984:web:d2d767e5d2bf6539ec96f5",
  measurementId: "G-XJ0S5B74C0"
};

const firebaseApp = firebase.initializeApp(firebaseConfig)

const db = firebaseApp.firestore()
const auth = firebase.auth()
const storage = firebase.storage();

export { db, auth, storage };