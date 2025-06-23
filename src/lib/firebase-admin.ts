import { Product } from "@/types";
import { dbAdmin, admin } from "@/lib/firebaseAdmin";

// Helper function to serialize Firestore Timestamps or JS Dates to ISO strings
// Define helper types for serializeDate
interface FirestoreTimestamp {
  toDate: () => Date;
  // Firestore Timestamps also have seconds and nanoseconds, but toDate is key for conversion
}
type SerializableDateInput = Date | FirestoreTimestamp | string | null | undefined;

const serializeDate = (date: SerializableDateInput): string | null => {
  if (!date) {
    return null;
  }
  // Firestore Timestamp (check for toDate method specifically)
  if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as FirestoreTimestamp).toDate === 'function') {
    return (date as FirestoreTimestamp).toDate().toISOString();
  }
  // JavaScript Date object
  if (date instanceof Date) {
    return date.toISOString();
  }
  // Already a string (could be an ISO string or other format)
  if (typeof date === 'string') {
    // This part can be enhanced if strict ISO format is required from string inputs
    return date;
  }
  console.warn('Unrecognized date format for serialization:', date, typeof date);
  return null; // Fallback for unrecognized types
};

export async function fetchAllProductsAdmin(limitCount?: number): Promise<Product[]> {
  if (!dbAdmin) {
    console.error("Firebase Admin SDK is not initialized. Make sure FIREBASE_SERVICE_ACCOUNT_KEY is set in your environment variables.");
    return [];
  }
  let query: admin.firestore.Query = dbAdmin.collection("products");

  if (limitCount) {
    query = query.limit(limitCount);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: serializeDate(data.createdAt),
      updatedAt: serializeDate(data.updatedAt),
      auctionStartDate: serializeDate(data.auctionStartDate),
      auctionEndDate: serializeDate(data.auctionEndDate),
    } as Product;
  });
}