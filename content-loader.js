// ============================================================
//  Public content hydration
//  Reads content/site from Firestore and overrides the static
//  HTML where values exist. If Firestore is unreachable or a
//  field is absent, the hard-coded HTML stays as the fallback —
//  the site never breaks.
// ============================================================

import { db } from "./firebase-config.js?v=3";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const RESEARCH_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v4l-5 9a3 3 0 0 0 3 4h10a3 3 0 0 0 3-4l-5-9V3"/><path d="M7 3h10M8.5 13h7"/></svg>';

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

// ---- renderers ------------------------------------------------

function renderTimeline(items) {
  const el = document.getElementById("timelineList");
  if (!el || !Array.isArray(items)) return;
  el.innerHTML = items
    .map(
      (it) => `
      <article class="tl-item">
        <div class="tl-item__dot"></div>
        <div class="tl-item__date">${esc(it.date)}</div>
        <div class="tl-item__body">
          ${it.tag ? `<span class="tl-item__tag">${esc(it.tag)}</span>` : ""}
          <h3>${esc(it.title)}</h3>
          ${it.org ? `<p class="tl-item__org">${esc(it.org)}</p>` : ""}
          ${it.desc ? `<p>${esc(it.desc)}</p>` : ""}
        </div>
      </article>`
    )
    .join("");
}

function renderResearch(items) {
  const el = document.getElementById("researchCards");
  if (!el || !Array.isArray(items)) return;
  el.innerHTML = items
    .map((c, i) => {
      const bullets = asArray(c.bullets)
        .filter((b) => String(b).trim() !== "")
        .map((b) => `<li>${esc(b)}</li>`)
        .join("");
      return `
      <article class="card${i === 0 ? " card--feature" : ""}">
        <div class="card__icon" aria-hidden="true">${RESEARCH_ICON}</div>
        ${c.period ? `<span class="card__period">${esc(c.period)}</span>` : ""}
        <h3>${esc(c.title)}</h3>
        ${c.sub ? `<p class="card__sub">${esc(c.sub)}</p>` : ""}
        ${c.meta ? `<p class="card__meta">${esc(c.meta)}</p>` : ""}
        ${bullets ? `<ul class="card__list">${bullets}</ul>` : ""}
      </article>`;
    })
    .join("");
}

function renderSkills(skills) {
  if (!skills || typeof skills !== "object") return;

  // Competencies (chips)
  if (Array.isArray(skills.competencies)) {
    const ul = document.getElementById("skillsCompetencies");
    if (ul) ul.innerHTML = skills.competencies.filter(Boolean).map((c) => `<li>${esc(c)}</li>`).join("");
  }

  // Tools (bars)
  if (Array.isArray(skills.tools)) {
    const box = document.getElementById("skillsBars");
    if (box) {
      box.innerHTML = skills.tools
        .map((t) => {
          let pct = parseInt(t.pct, 10);
          if (isNaN(pct)) pct = 0;
          pct = Math.max(0, Math.min(100, pct));
          return `<div class="bar"><span class="bar__label">${esc(t.label)}</span><div class="bar__track"><i style="--w:${pct}%"></i></div></div>`;
        })
        .join("");
      // animate fills shortly after insertion
      setTimeout(() => box.querySelectorAll(".bar__track").forEach((b) => b.classList.add("animate")), 200);
    }
  }

  // Languages
  if (skills.languages && (Array.isArray(skills.languages.rows) || skills.languages.note)) {
    const box = document.getElementById("skillsLanguages");
    if (box) {
      const rows = asArray(skills.languages.rows)
        .map((r) => `<div class="lang__row"><span>${esc(r.name)}</span><span class="lang__level">${esc(r.level)}</span></div>`)
        .join("");
      box.innerHTML = rows + (skills.languages.note ? `<p class="lang__note">${esc(skills.languages.note)}</p>` : "");
    }
  }
}

function renderLeadership(items) {
  const el = document.getElementById("leadershipList");
  if (!el || !Array.isArray(items)) return;
  el.innerHTML = items
    .map(
      (it) => `
      <li>
        <div class="lead-list__year">${esc(it.year)}</div>
        <div>
          <strong>${esc(it.role)}</strong>${it.event ? ` — ${esc(it.event)}` : ""}
          ${it.desc ? `<p>${esc(it.desc)}</p>` : ""}
        </div>
      </li>`
    )
    .join("");
}

function renderCustomSections(sections) {
  const mount = document.getElementById("customSections");
  if (!mount || !Array.isArray(sections)) return;
  mount.innerHTML = sections
    .map((s, i) => {
      const cards = asArray(s.cards)
        .map((c) => {
          const bullets = asArray(c.bullets)
            .filter((b) => String(b).trim() !== "")
            .map((b) => `<li>${esc(b)}</li>`)
            .join("");
          return `
          <article class="card">
            <h3>${esc(c.title)}</h3>
            ${c.subtitle ? `<p class="card__period">${esc(c.subtitle)}</p>` : ""}
            ${c.body ? `<p class="card__sub">${esc(c.body)}</p>` : ""}
            ${bullets ? `<ul class="card__list">${bullets}</ul>` : ""}
          </article>`;
        })
        .join("");
      const sid = "custom-" + (s.id || i);
      return `
        <section class="section${i % 2 === 0 ? " section--alt" : ""}" id="${sid}">
          <div class="section__head"><h2 class="section__title">${esc(s.title)}</h2></div>
          ${s.intro ? `<p class="custom-intro">${esc(s.intro)}</p>` : ""}
          ${cards ? `<div class="cards">${cards}</div>` : ""}
        </section>`;
    })
    .join("");

  // Add nav links for custom sections (before the CV link)
  const nav = document.getElementById("navLinks");
  const cvLink = nav ? nav.querySelector('a[href="#cv"]') : null;
  if (nav && cvLink) {
    sections.forEach((s, i) => {
      if (!s.title) return;
      const a = document.createElement("a");
      a.href = "#custom-" + (s.id || i);
      a.textContent = s.title;
      nav.insertBefore(a, cvLink);
    });
  }
}

// ---- run ------------------------------------------------------

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

  // CV (replace download + view links with the uploaded file, if any)
  const cvUrl = getPath(data, "cv.url");
  if (cvUrl) {
    document.querySelectorAll("[data-cv-href]").forEach((el) => {
      let href = cvUrl;
      if (el.hasAttribute("download") && cvUrl.includes("/upload/")) {
        href = cvUrl.replace("/upload/", "/upload/fl_attachment/");
      }
      el.setAttribute("href", href);
    });
  }

  // Card collections + custom sections
  if (data.cards) {
    renderTimeline(data.cards.timeline);
    renderResearch(data.cards.research);
    renderSkills(data.cards.skills);
    renderLeadership(data.cards.leadership);
  }
  renderCustomSections(data.customSections);
})();
