import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyCWrD1REye2r6kLFjko6X4GGfoC837RRhY',
    authDomain: 'sabpepgs.firebaseapp.com',
    projectId: 'sabpepgs',
    storageBucket: 'sabpepgs.firebasestorage.app',
    messagingSenderId: '746657296912',
    appId: '1:746657296912:web:da8fb1a52a351bd29b1095',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);


