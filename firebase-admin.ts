import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config(); // optional, for local .env use

const credentials = process.env.FIREBASE_CREDENTIALS;

if (!credentials) throw new Error('FIREBASE_CREDENTIALS is not set');

let serviceAccount: ServiceAccount;

try {
  serviceAccount = JSON.parse(credentials);
} catch (error) {
  throw new Error('Invalid FIREBASE_CREDENTIALS JSON: ' + error);
}

initializeApp({
  credential: cert(serviceAccount),
});

export const db = getFirestore();
