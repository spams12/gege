import type { NextApiRequest, NextApiResponse } from 'next';
import { dbAdmin, authAdmin } from '@/lib/firebaseAdmin'; // Corrected import names
import { Timestamp } from 'firebase-admin/firestore'; // Use admin Timestamp

// Define expected request body structure (adjust as per client-side data)
interface OrderItemClient {
  productId: string;
  name: string; // Name from client, can be re-verified
  price: number; // Price from client, MUST be re-verified
  quantity: number;
  image: string; // Image from client
}

interface CreateOrderRequestBody {
  customerDetails: {
    name: string;
    email: string;
    city: string;
    address: string;
    phone: string;
  };
  cartItems: OrderItemClient[];
  shippingCost: number;
  clientTotal: number; // Total calculated by the client, for cross-checking
}

// Define a more detailed product structure for server-side validation
interface ProductData {
  id: string;
  name: string;
  price: number;
  stock: number; // Assuming stock is a field in your product documents
  // Add other relevant fields like description, category, images etc. if needed for validation or order details
}

interface CustomApiError {
  message: string;
  code: 'PRICE_MISMATCH' | 'INSUFFICIENT_STOCK';
  productId?: string;
  correctPrice?: number;
  availableStock?: number;
}

function isCustomApiError(obj: unknown): obj is CustomApiError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'message' in obj &&
    typeof obj.message === 'string' &&
    'code' in obj &&
    (obj.code === 'PRICE_MISMATCH' || obj.code === 'INSUFFICIENT_STOCK')
  );
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { customerDetails, cartItems, shippingCost, clientTotal } = req.body as CreateOrderRequestBody;

  // 1. Authenticate User (Server-Side)
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).json({ error: 'Authentication required: No token provided.' });
  }

  let decodedToken;
  try {
    decodedToken = await authAdmin.verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return res.status(401).json({ error: 'Authentication required: Invalid token.' });
  }

  const userId = decodedToken.uid;
  const userEmail = decodedToken.email;
  const userName = decodedToken.name || customerDetails.name; // Fallback to provided name

  if (!userId) {
    return res.status(401).json({ error: 'Authentication failed: User ID not found in token.' });
  }

  // Basic validation of incoming data
  if (!customerDetails || !cartItems || cartItems.length === 0 || shippingCost === undefined || clientTotal === undefined) {
    return res.status(400).json({ error: 'Missing required order information.' });
  }
  if (typeof shippingCost !== 'number' || shippingCost < 0) {
    return res.status(400).json({ error: 'Invalid shipping cost.' });
  }
  if (typeof clientTotal !== 'number' || clientTotal < 0) {
    return res.status(400).json({ error: 'Invalid client total.' });
  }


  // TODO:
  // 2. Validate Product IDs, Quantities, Prices, and Stock
  // 3. Recalculate Total Order Amount
  // 4. Save Order to Firestore
  // 5. Handle potential errors and send appropriate responses

  try {
    let serverCalculatedSubtotal = 0;
    const validatedItems = [];
    const productUpdates: { ref: FirebaseFirestore.DocumentReference, newStock: number }[] = [];

    for (const item of cartItems) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0 || typeof item.price !== 'number') {
        return res.status(400).json({ error: `Invalid data for product: ${item.name || item.productId}. Quantity must be positive and price must be a number.` });
      }

      const productRef = dbAdmin.collection('products').doc(item.productId);
      const productSnap = await productRef.get();

      if (!productSnap.exists) {
        return res.status(400).json({ error: `Product with ID ${item.productId} not found.` });
      }

      const productData = productSnap.data() as ProductData;

      // Validate price (allow for small discrepancies if necessary, or be strict)
      // For now, strict price check.
      if (productData.price !== item.price) {
        // Optionally, inform client about price change or just reject
        return res.status(400).json({
          error: `Price for ${productData.name} has changed. Expected ${productData.price}, got ${item.price}. Please review your cart.`,
          errorCode: 'PRICE_MISMATCH',
          productId: item.productId,
          correctPrice: productData.price
        });
      }

      // Validate stock
      if (productData.stock < item.quantity) {
        return res.status(400).json({
          error: `Not enough stock for ${productData.name}. Available: ${productData.stock}, Requested: ${item.quantity}.`,
          errorCode: 'INSUFFICIENT_STOCK',
          productId: item.productId,
          availableStock: productData.stock
        });
      }

      const itemTotal = productData.price * item.quantity;
      serverCalculatedSubtotal += itemTotal;

      validatedItems.push({
        productId: item.productId,
        name: productData.name, // Use server-side name
        price: productData.price, // Use server-side price
        quantity: item.quantity,
        image: item.image, // Keep client-side image for now, or re-fetch/validate if necessary
        total: itemTotal,
      });
      
      // Prepare stock update
      productUpdates.push({ ref: productRef, newStock: productData.stock - item.quantity });
    }

    const serverCalculatedTotal = serverCalculatedSubtotal + shippingCost;

    // Optional: Cross-check with clientTotal. Allow for minor discrepancies or be strict.
    // if (Math.abs(serverCalculatedTotal - clientTotal) > 0.01) { // e.g. 1 cent tolerance
    //   console.warn(`Client total ${clientTotal} differs from server total ${serverCalculatedTotal}`);
    //   // Decide whether to reject or proceed with server total
    // }

    const orderId = `ORD-S-${Date.now()}`;
    const newOrderData = {
      id: orderId,
      customerId: userId,
      customerName: userName,
      customerEmail: userEmail,
      customerPhone: customerDetails.phone,
      date: Timestamp.now(),
      status: 'قيد التجهيز',
      total: serverCalculatedTotal,
      shippingAddress: {
        name: customerDetails.name,
        address: customerDetails.address,
        city: customerDetails.city,
        postalCode: '',
        country: 'العراق',
      },
      billingAddress: {
        name: customerDetails.name,
        address: customerDetails.address,
        city: customerDetails.city,
        postalCode: '',
        country: 'العراق',
        email: customerDetails.email,
        phone: customerDetails.phone,
      },
      paymentMethod: 'الدفع عند الاستلام',
      shippingMethod: 'شحن عادي',
      items: validatedItems,
      subtotal: serverCalculatedSubtotal,
      shipping: shippingCost,
      discount: 0,
      clientCalculatedTotal: clientTotal,
      _serverValidationPassed: true,
    };

    // Use a Firestore transaction to save the order and update stock atomically
    await dbAdmin.runTransaction(async (transaction) => {
      const orderRef = dbAdmin.collection('orders').doc(orderId);
      transaction.set(orderRef, newOrderData);

      for (const update of productUpdates) {
        transaction.update(update.ref, { stock: update.newStock });
      }
    });

    res.status(201).json({ message: 'Order created successfully.', orderId, order: newOrderData });

  } catch (error: unknown) {
    console.error('Error processing order:', error);
    
    if (isCustomApiError(error)) {
      // Destructure known properties and pass the rest
      const { message, code, ...additionalDetails } = error;
      return res.status(400).json({
        error: message,
        errorCode: code,
        ...additionalDetails
      });
    }
    
    let errorMessage = 'Failed to process order.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ error: 'Failed to process order.', details: errorMessage });
  }
}