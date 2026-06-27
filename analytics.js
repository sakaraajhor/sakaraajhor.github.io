// ============================================================
//  Lightweight analytics
//  Increments counters in analytics/summary. Visitors are not
//  logged in, so writes are public but rules restrict them to a
//  fixed set of numeric counter fields (see Firestore rules).
// ============================================================

import { db } from "./firebase-config.js?v=27";
import {
  doc, setDoc, increment, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const ref = doc(db, "analytics", "summary");
const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
const dailyRef = doc(db, "analyticsDaily", today);

function bump(field) {
  const payload = { [field]: increment(1), updatedAt: serverTimestamp() };
  setDoc(ref, payload, { merge: true }).catch(() => {});      // running totals
  setDoc(dailyRef, payload, { merge: true }).catch(() => {}); // per-day for charts
}

// Page view (once per load)
bump("visits");

// Link / interaction clicks
function track(selector, field, once) {
  document.querySelectorAll(selector).forEach((el) => {
    el.addEventListener("click", () => bump(field), once ? { once: true } : undefined);
  });
}

track('[data-href-mailto]', "linkEmail");
track('[data-href-tel]', "linkPhone");
track('[data-href="contact.linkedinUrl"]', "linkLinkedin");
track('[data-cv-href]', "cvDownloads");

const fab = document.getElementById("chatFab");
if (fab) fab.addEventListener("click", () => bump("chatOpens"), { once: true });
