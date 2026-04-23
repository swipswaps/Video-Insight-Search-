import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * FIREBASE_APPLET_CONFIG
 * This configuration file is dynamically generated during the 'set_up_firebase' tool call.
 * It contains the specific identifiers (API Keys, Project IDs) needed to connect to 
 * the cloud nodes.
 */
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize the root Firebase Application instance.
const app = initializeApp(firebaseConfig);

/**
 * FIRESTORE_DB
 * We initialize the database using the specific 'firestoreDatabaseId' provided 
 * in the config. This ensures we are connecting to the correct Enterprise-tier 
 * database instance provisioned for this project.
 */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * FIREBASE_AUTH
 * Identity management service for the analytical node.
 */
export const auth = getAuth(app);

// Configure Google as our primary Identity Provider (IdP).
export const googleProvider = new GoogleAuthProvider();

/**
 * AUTH_ACTIONS
 * signIn: Opens a Google Login popup. This 'Verified Session' is what proves human
 * identity to the backend analytic scrapers when YouTube triggers a bot challenge.
 * 
 * logout: Destroys the local token and clears the analytical session.
 */
export const signIn = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
