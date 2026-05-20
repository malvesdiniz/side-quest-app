import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { getAuth } from 'firebase/auth';

export const firebaseApp = initializeApp(environment.firebaseConfig);
export const firestore = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
