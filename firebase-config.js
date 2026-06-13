// ============================================================
//  Firebase configuration & shared instances
//  Loaded as an ES module (type="module") on both index.html
//  and admin.html. The public apiKey is safe to expose — access
//  is enforced by Firestore security rules + Auth, not this key.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBHWPl9QuzrDr0qHzom7UXMwEyQ4jozo8",
  authDomain: "sakara-portfolio.firebaseapp.com",
  projectId: "sakara-portfolio",
  storageBucket: "sakara-portfolio.firebasestorage.app",
  messagingSenderId: "804381803013",
  appId: "1:804381803013:web:6416c0a400a9446c13926c"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// ------------------------------------------------------------
//  Roles
//  Fill these two UIDs after the first Google sign-in. Until
//  then, everyone resolves to "visitor". The admin panel shows
//  each signed-in user their own UID so you can capture them.
// ------------------------------------------------------------
export const ROLES = {
  ENGINEER_UID: "87JhMCZlJlYnyZabxX5oKz4aqbr2",   // you (engineer)
  DOCTOR_UID: "WcGOqJl1ewO3gryfuPGGjY6mHft1",     // Dr. Sakara Ajhor
};

export function roleForUid(uid) {
  if (uid && uid === ROLES.ENGINEER_UID) return "engineer";
  if (uid && uid === ROLES.DOCTOR_UID) return "doctor";
  return "visitor";
}

export function isAdmin(uid) {
  const r = roleForUid(uid);
  return r === "engineer" || r === "doctor";
}

// ------------------------------------------------------------
//  Planned Firestore data model (built out across phases)
//  ----------------------------------------------------------
//  content/{section}          – editable section text (Phase 2)
//  content/cards/{collection} – research/timeline/skills/etc (Phase 2/3)
//  posts/{postId}             – blog & research entries (Phase 3)
//  users/{uid}                – profile + role mirror (Phase 1/4)
//  conversations/{uid}            – one per visitor (Phase 4)
//  conversations/{uid}/messages/* – chat messages (Phase 4)
//  analytics/summary          – KPI counters (Phase 6)
//  surprises/{id}             – engineer → doctor cards (Phase 7)
// ------------------------------------------------------------

// Third-party service identifiers (used in later phases).
export const CLOUDINARY = {
  cloudName: "dxit0ozzz",
  uploadPreset: "becgmupc",
};

export const EMAILJS = {
  serviceId: "service_53y4m2k",
  publicKey: "KNLx0NysL7ttvPOjm",
  templateId: "", // <-- add from EmailJS → Email Templates (Phase 5)
};
