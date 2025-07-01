import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';

const credentialPath = process.env.FIREBASE_CREDENTIAL_PATH;

if (!credentialPath) {
  throw new Error('FIREBASE_CREDENTIAL_PATH is not defined in the environment variables.');
}

const serviceAccount = require(path.resolve(credentialPath)) as ServiceAccount;

initializeApp({
  credential: cert(serviceAccount)
});

export const db = getFirestore();
