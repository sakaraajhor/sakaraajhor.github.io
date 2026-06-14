// ============================================================
//  Lightweight analytics
//  Increments counters in analytics/summary. Visitors are not
//  logged in, so writes are public but rules restrict them to a
//  fixed set of numeric counter fields (see Firestore rules).
// ============================================================

import { db } from "./firebase-config.js?v=3";
import {
  doc, setDoc, increment, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const ref = doc(db, "analytics", "summary");

function bump(field) {
  setDoc(ref, { [field]: increment(1), updatedAt: serverTimestamp() }, { merge: true })
    .catch(() => {});
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
