// ============================================================
//  Public content hydration
//  Reads content/site from Firestore and overrides the static
//  HTML where values exist. If Firestore is unreachable or empty,
//  the hard-coded HTML stays as the fallback — the site never breaks.
// ============================================================

import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

(async () => {
  let data;
  try {
    const snap = await getDoc(doc(db, "content", "site"));
    if (!snap.exists()) return;
    data = snap.data();
  } catch (e) {
    return; // offline / blocked → keep static fallback
  }

  // Text content
  document.querySelectorAll("[data-content]").forEach((el) => {
    const v = getPath(data, el.getAttribute("data-content"));
    if (v != null && String(v).trim() !== "") el.textContent = v;
  });

  // Plain hrefs
  document.querySelectorAll("[data-href]").forEach((el) => {
    const v = getPath(data, el.getAttribute("data-href"));
    if (v) el.setAttribute("href", v);
  });

  // mailto: hrefs
  document.querySelectorAll("[data-href-mailto]").forEach((el) => {
    const v = getPath(data, el.getAttribute("data-href-mailto"));
    if (v) el.setAttribute("href", "mailto:" + v);
  });

  // tel: hrefs (strip spaces)
  document.querySelectorAll("[data-href-tel]").forEach((el) => {
    const v = getPath(data, el.getAttribute("data-href-tel"));
    if (v) el.setAttribute("href", "tel:" + String(v).replace(/\s+/g, ""));
  });
})();
