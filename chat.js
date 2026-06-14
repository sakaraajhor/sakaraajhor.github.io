// ============================================================
//  Visitor chat widget
//  Google login required (no anonymous). Each visitor has one
//  conversation (doc id = their uid). Messages are real-time.
// ============================================================

import { auth, db, googleProvider, roleForUid } from "./firebase-config.js?v=2";
import {
  onAuthStateChanged, signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, updateDoc, collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const $ = (s) => document.querySelector(s);
const fab = $("#chatFab");
const panel = $("#chatPanel");
const signinView = $("#chatSignin");
const messagesView = $("#chatMessages");
const form = $("#chatForm");
const input = $("#chatInput");

let currentUser = null;
let unsub = null; // message listener

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---- panel open/close ----
function togglePanel(open) {
  const show = open !== undefined ? open : panel.hasAttribute("hidden");
  panel.toggleAttribute("hidden", !show);
  fab.classList.toggle("chat__fab--open", show);
  if (show && currentUser) setTimeout(scrollToBottom, 50);
}
fab.addEventListener("click", () => togglePanel());
$("#chatClose").addEventListener("click", () => togglePanel(false));

// ---- sign in ----
$("#chatGoogle").addEventListener("click", async () => {
  try { await signInWithPopup(auth, googleProvider); }
  catch (e) { alert("Sign-in failed: " + (e && e.message ? e.message : e)); }
});

function scrollToBottom() {
  messagesView.scrollTop = messagesView.scrollHeight;
}

function renderMessages(docs) {
  if (!docs.length) {
    messagesView.innerHTML = `<p class="chat__empty">Say hello 👋 — your message goes straight to Dr. Sakara.</p>`;
    return;
  }
  messagesView.innerHTML = docs
    .map((m) => {
      const mine = m.senderRole !== "admin";
      return `<div class="chat__row ${mine ? "chat__row--me" : "chat__row--them"}"><div class="chat__msg ${mine ? "chat__msg--me" : "chat__msg--them"}">${esc(m.text)}</div></div>`;
    })
    .join("");
  scrollToBottom();
}

async function ensureConversation(user) {
  const ref = doc(db, "conversations", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      visitorUid: user.uid,
      visitorName: user.displayName || "",
      visitorEmail: user.email || "",
      visitorPhoto: user.photoURL || "",
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      lastSender: "",
      unreadAdmin: 0,
      unreadVisitor: 0,
    });
  } else {
    // clear visitor's unread when they open the chat
    await updateDoc(ref, { unreadVisitor: 0 });
  }
  // mirror a lightweight user profile
  await setDoc(doc(db, "users", user.uid), {
    name: user.displayName || "",
    email: user.email || "",
    photo: user.photoURL || "",
    role: roleForUid(user.uid),
    lastSeen: serverTimestamp(),
  }, { merge: true });
}

function subscribeMessages(uid) {
  if (unsub) unsub();
  const q = query(collection(db, "conversations", uid, "messages"), orderBy("ts", "asc"));
  unsub = onSnapshot(q, (snap) => {
    renderMessages(snap.docs.map((d) => d.data()));
    // keep visitor unread cleared while viewing
    updateDoc(doc(db, "conversations", uid), { unreadVisitor: 0 }).catch(() => {});
  });
}

// ---- send ----
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || !currentUser) return;
  input.value = "";
  const uid = currentUser.uid;
  try {
    await addDoc(collection(db, "conversations", uid, "messages"), {
      senderUid: uid, senderRole: "visitor", text, ts: serverTimestamp(),
    });
    await updateDoc(doc(db, "conversations", uid), {
      lastMessage: text, lastMessageAt: serverTimestamp(), lastSender: "visitor",
      unreadAdmin: increment(1), unreadVisitor: 0,
    });
  } catch (err) {
    input.value = text;
    alert("Couldn't send: " + (err && err.message ? err.message : err));
  }
});

// ---- auth state ----
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!user) {
    if (unsub) { unsub(); unsub = null; }
    signinView.removeAttribute("hidden");
    messagesView.setAttribute("hidden", "");
    form.setAttribute("hidden", "");
    $(".chat__sub").textContent = "Sign in to chat — usually replies within a day";
    return;
  }
  signinView.setAttribute("hidden", "");
  messagesView.removeAttribute("hidden");
  form.removeAttribute("hidden");
  $(".chat__sub").textContent = "Signed in as " + (user.displayName || user.email || "you");
  try {
    await ensureConversation(user);
    subscribeMessages(user.uid);
  } catch (e) {
    messagesView.innerHTML = `<p class="chat__empty">Couldn't load chat: ${esc(e.message || e)}</p>`;
  }
});
