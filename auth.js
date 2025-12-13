// auth.js - Firebase Authentication + Firestore (Email/Password)

import { firebaseAuth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =========================
   HELPERS
========================= */
function $(id) {
  return document.getElementById(id);
}

/* =========================
   SIGN UP
========================= */
const signupForm = $("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = $("signupName").value.trim();
    const email = $("signupEmail").value.trim().toLowerCase();
    const password = $("signupPassword").value;
    const errorEl = $("signupError");

    try {
      const cred = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );

      // Create Firestore user profile
      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        email,
        role: "user",
        createdAt: new Date()
      });

      window.location.href = "index.html";
    } catch (err) {
      errorEl.innerText = err.message;
    }
  });
}

/* =========================
   LOGIN
========================= */
const loginForm = $("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = $("loginEmail").value.trim().toLowerCase();
    const password = $("loginPassword").value;
    const errorEl = $("loginError");

    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      window.location.href = "index.html";
    } catch (err) {
      errorEl.innerText = "Invalid email or password";
    }
  });
}

/* =========================
   LOGOUT
========================= */
window.logout = async function () {
  await signOut(firebaseAuth);
  window.location.href = "login.html";
};

/* =========================
   AUTH STATE + GLOBAL ACCESS
========================= */
window.auth = {
  user: null,

  checkLogin(redirect = "login.html") {
    onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) {
        window.location.href = redirect;
      }
    });
  },

  async getLoggedInUser() {
    return new Promise((resolve) => {
      onAuthStateChanged(firebaseAuth, async (user) => {
        if (!user) {
          resolve(null);
          return;
        }

        const snap = await getDoc(doc(db, "users", user.uid));
        resolve({ uid: user.uid, ...snap.data() });
      });
    });
  }
};

/* =========================
   PROFILE DISPLAY
========================= */
const profileInfo = $("profileInfo");
if (profileInfo) {
  onAuthStateChanged(firebaseAuth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    const data = snap.data();

    profileInfo.innerHTML = `
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Role:</strong> ${data.role}</p>
    `;
  });
}
