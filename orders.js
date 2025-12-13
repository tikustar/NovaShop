// orders.js - Firestore Orders System (Naira)

import { db } from "./firebase.js";
import { firebaseAuth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* =========================
   HELPERS
========================= */
function formatNaira(amount) {
  return "₦" + Number(amount || 0).toLocaleString("en-NG");
}

/* =========================
   PLACE ORDER (USER)
========================= */
export async function placeOrder(orderData) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Not logged in");

  return await addDoc(collection(db, "orders"), {
    userId: user.uid,
    email: user.email,
    items: orderData.items,
    address: orderData.address,
    total: orderData.total,
    status: "pending",
    createdAt: serverTimestamp()
  });
}

/* =========================
   LOAD USER ORDERS
========================= */
export async function loadMyOrders() {
  const user = firebaseAuth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, "orders"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* =========================
   LOAD ALL ORDERS (ADMIN)
========================= */
export async function loadAllOrders() {
  const q = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* =========================
   UPDATE ORDER STATUS (ADMIN)
========================= */
export async function updateOrderStatus(orderId, status) {
  await updateDoc(doc(db, "orders", orderId), {
    status
  });
}

/* =========================
   AUTO-REDIRECT IF NOT LOGGED IN
========================= */
onAuthStateChanged(firebaseAuth, (user) => {
  if (!user && document.body.dataset.protected === "true") {
    window.location.href = "login.html";
  }
});
