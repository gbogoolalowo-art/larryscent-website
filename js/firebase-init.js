// Shared Firebase connection, used by the shop and by the admin dashboard.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

export const isConfigured = Object.values(firebaseConfig).every(
  value => value && !String(value).startsWith("YOUR_")
);
export const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;

// All products, sorted by id. Returns null if Firebase is not set up.
export async function fetchProducts() {
  if (!db) return null;
  const snapshot = await getDocs(collection(db, "products"));
  return snapshot.docs
    .map(item => item.data())
    .filter(item => item && typeof item.id === "number")
    .sort((a, b) => a.id - b.id);
}

// Saves a customer order and returns its id.
export async function submitOrder(order) {
  if (!db) return null;
  const ref = await addDoc(collection(db, "orders"), {
    customer: order.customer,
    items: order.items,
    total: order.total,
    status: "new",
    createdAt: serverTimestamp()
  });
  return ref.id;
}
