import admin from 'firebase-admin';
// Function to get or initialize the app, making it resilient to HMR
function getAdminApp() {
    // If the app is already initialized, return it
    if (admin.apps.length > 0) {
        return admin.app();
    }

    // Load service account credentials
    let serviceAccount: admin.ServiceAccount | undefined;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        } catch (error) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
        }
    }

    // Initialize the app if service account is available
    if (serviceAccount) {
        try {
            return admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } catch (error) {
            console.error("Firebase Admin SDK initialization error:", error);
        }
    } else {
        console.error("Firebase Admin SDK service account credentials not found. SDK not initialized.");
    }
    
    return undefined;
}

const app = getAdminApp();

export const verifyIdToken = async (token: string) => {
  if (!app) {
    console.error("Firebase Admin App is not available. Cannot verify ID token.");
    return null;
  }
  try {
    // Use the specific app instance for authentication
    const decodedToken = await admin.auth(app).verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
};

export const authAdmin = app ? admin.auth(app) : undefined;
export const dbAdmin = app ? admin.firestore(app) : undefined;

// Export the admin namespace to access types like Timestamp
export { admin };