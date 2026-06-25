// ============================================================
// Dr. Sakara Ajhor — Portfolio interactions
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const progress = document.getElementById("scrollProgress");

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Nav background + scroll progress
  const onScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    nav.classList.toggle("scrolled", scrollTop > 40);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progress.style.width = pct + "%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu toggle
  const closeMenu = () => {
    navToggle.classList.remove("open");
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  };
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

  // Reveal on scroll
  const revealEls = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // small stagger for siblings entering together
          setTimeout(() => entry.target.classList.add("visible"), i * 70);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  // Animate skill bars when visible
  const barTracks = document.querySelectorAll(".bar__track");
  const barObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate");
          barObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  barTracks.forEach((b) => barObserver.observe(b));

  // Scroll-spy: highlight the nav link of the section in view.
  // Exposed so content-loader can re-init after custom sections are added.
  let spyObserver = null;
  window.setupScrollSpy = function () {
    if (spyObserver) spyObserver.disconnect();
    const links = [...navLinks.querySelectorAll('a[href^="#"]')];
    const map = new Map();
    links.forEach((a) => {
      const id = a.getAttribute("href").slice(1);
      const sec = document.getElementById(id);
      if (sec) map.set(sec, a);
    });
    spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            links.forEach((l) => l.classList.remove("active"));
            const a = map.get(entry.target);
            if (a) a.classList.add("active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    map.forEach((_a, sec) => spyObserver.observe(sec));
  };
  window.setupScrollSpy();

  // Birthday easter egg (27th) — gentle petals + a one-time greeting
  try {
    const now = new Date();
    if (now.getDate() === 27) {
      const key = "bday-" + now.toISOString().slice(0, 10);
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, "1");
        runBirthday();
      }
    }
  } catch (e) {}

  function runBirthday() {
    const layer = document.createElement("div");
    layer.className = "petals";
    const petals = ["🌸", "🌷", "🌹", "✨", "💛", "🎀"];
    let html = "";
    for (let i = 0; i < 36; i++) {
      const left = (i * 2.7 % 100).toFixed(2);
      const delay = (i % 12 * 0.4).toFixed(2);
      const dur = (6 + (i % 5)).toFixed(2);
      html += `<span style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s">${petals[i % petals.length]}</span>`;
    }
    layer.innerHTML = html;
    document.body.appendChild(layer);

    const toast = document.createElement("div");
    toast.className = "bday-toast";
    toast.innerHTML = "🎂 <strong>Happy Birthday, Dr. Sakara</strong> — wishing you a beautiful year ahead.";
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => toast.classList.remove("show"), 8000);
    setTimeout(() => { layer.remove(); toast.remove(); }, 16000);
  }
});
