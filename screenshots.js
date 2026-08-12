// Screenshot content (titles/descriptions/image paths) lives in screenshots-data.json, fetch()'d below —
// kept out of this file so the long-form text doesn't drown out the carousel/lightbox behavior, and kept
// out of screenshots.html so it's editable/diffable on its own. This requires a real HTTP origin (a local
// server, or the deployed GitHub Pages site) — fetch() of a same-directory JSON file is blocked by CORS
// when this page is opened as a plain file:// URL, unlike the inline <script type="application/json">
// tag this replaced. See README for the local-preview docker-compose setup.
let PACKAGES = null;

const tabButtons = [...document.querySelectorAll("[data-package]")];
const track = document.getElementById("carousel-track");
const prevBtn = document.querySelector(".carousel-prev");
const nextBtn = document.querySelector(".carousel-next");
const frame = document.getElementById("screenshot-frame");
const indexEl = document.getElementById("screenshot-index");
const titleEl = document.getElementById("screenshot-title");
const descEl = document.getElementById("screenshot-description");

let activePackage = null;
let activeIndex = 0;
let itemStep = 0;
let copyWidth = 0;
let scrollRaf = null;
let isOverflowing = false;

function placeholderIcon() {
  return `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="15" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 8"/></svg>`;
}

// Every variant falls back to shot.src so a screenshot added to screenshots-data.json by hand still
// renders (just heavier) before `npm run images` has been run over it.
const thumbSrc = (shot) => shot.thumb || shot.src;
const fullSrc = (shot) => shot.full || shot.src;

function thumbHTML(shot, i) {
  // width/height match the fixed .carousel-thumb-media box rather than the file's own 420x240, because
  // object-fit: cover crops to exactly that box -- these attributes are here to reserve layout space.
  const media = shot.src
    ? `<img src="${thumbSrc(shot)}" alt="" width="210" height="120" loading="lazy" decoding="async">`
    : `<span class="carousel-thumb-placeholder">${placeholderIcon()}</span>`;
  return `<button type="button" class="carousel-thumb" data-index="${i}" aria-label="View screenshot: ${shot.title}">
    <span class="carousel-thumb-media">${media}</span>
    <span class="carousel-thumb-label">${shot.title}</span>
  </button>`;
}

// Sits once at the end of every looped copy, between the last thumbnail and the first thumbnail of the
// next copy — the only visual cue that the strip has no real end, it just loops. The "repeat" glyph (two
// arrows chasing each other in a circle) is the same symbol media players use for loop/repeat playback,
// which is a more widely recognized "this wraps around" signal than a plain arrow.
function loopDividerHTML() {
  return `<span class="carousel-loop-divider" aria-hidden="true" title="Loops back to the first screenshot">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
  </span>`;
}

// The thumbnail strip only loops when it actually overflows the visible viewport — a package with few
// enough screenshots to fit on screen at once has nothing to scroll to, so it renders a single, static
// copy with the arrows hidden. When it does overflow, three copies are rendered back to back (clone /
// real / clone), each copy ending in a loop-divider; the middle copy is the "real" one and scrollLeft
// starts there. Once scrolling drifts into either clone copy, normalizeScroll() silently teleports
// scrollLeft by exactly one copy-width (copyWidth, measured from the DOM so the divider's own width is
// automatically accounted for), landing on the pixel-identical spot in the adjacent copy — invisible to
// the eye, but it makes the strip feel endless in both directions.
track.addEventListener("click", (event) => {
  const btn = event.target.closest(".carousel-thumb");
  if (!btn) return;
  activeIndex = Number(btn.dataset.index);
  renderViewer();
  updateActiveThumbs();
});

function renderCarousel() {
  const shots = activePackage.screenshots;
  const plainBlock = shots.map(thumbHTML).join("");

  track.innerHTML = plainBlock;
  requestAnimationFrame(() => {
    const viewportWidth = track.parentElement.clientWidth;
    isOverflowing = track.scrollWidth > viewportWidth + 1;

    const block = isOverflowing ? plainBlock + loopDividerHTML() : plainBlock;
    track.innerHTML = isOverflowing ? block + block + block : block;
    prevBtn.hidden = !isOverflowing;
    nextBtn.hidden = !isOverflowing;

    requestAnimationFrame(() => {
      const items = track.children;
      itemStep = items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : (items[0]?.offsetWidth || 0);
      // childrenPerCopy = one divider per copy on top of the screenshot thumbs.
      const childrenPerCopy = shots.length + 1;
      copyWidth = isOverflowing ? items[childrenPerCopy].offsetLeft - items[0].offsetLeft : 0;
      track.scrollLeft = isOverflowing ? items[childrenPerCopy + activeIndex].offsetLeft - items[0].offsetLeft : 0;
      updateActiveThumbs();
    });
  });
}

function updateActiveThumbs() {
  track.querySelectorAll(".carousel-thumb").forEach(btn => {
    btn.classList.toggle("is-active", Number(btn.dataset.index) === activeIndex);
  });
}

function normalizeScroll() {
  if (!isOverflowing || !copyWidth) return;
  // Must be instant (behavior: "auto"), never smooth — this teleport is meant to be invisible.
  // An animated correction here fights the user's own in-progress scroll/momentum, which is what
  // produced the "runs away and won't stop" and "needs two clicks" bugs this used to have.
  if (track.scrollLeft < copyWidth) {
    track.scrollTo({ left: track.scrollLeft + copyWidth, behavior: "auto" });
  } else if (track.scrollLeft >= copyWidth * 2) {
    track.scrollTo({ left: track.scrollLeft - copyWidth, behavior: "auto" });
  }
}

track.addEventListener("scroll", () => {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    normalizeScroll();
    scrollRaf = null;
  });
});

prevBtn.addEventListener("click", () => track.scrollBy({ left: -itemStep, behavior: "smooth" }));
nextBtn.addEventListener("click", () => track.scrollBy({ left: itemStep, behavior: "smooth" }));

function renderViewer() {
  const shot = activePackage.screenshots[activeIndex];
  indexEl.textContent = `${activeIndex + 1} / ${activePackage.screenshots.length}`;
  titleEl.textContent = shot.title;
  descEl.textContent = shot.description;
  // A real <button> rather than a click handler on the <img>: the zoom-in cursor promises the image
  // opens larger, and that promise has to hold for Enter/Space too, not just a mouse.
  // The image itself is alt="" because the <h2> and description directly below it are its caption --
  // the button's own label is what names it, so an alt here would just repeat the title twice.
  frame.innerHTML = shot.src
    ? `<button type="button" class="screenshot-zoom" aria-label="Enlarge screenshot: ${shot.title}">
         <img src="${fullSrc(shot)}" alt="" width="${shot.width ?? ""}" height="${shot.height ?? ""}" decoding="async">
       </button>`
    : `<div class="screenshot-placeholder">${placeholderIcon()}<span>Screenshot coming soon</span></div>`;
}

function selectPackage(pkg, { updateHash = true } = {}) {
  activePackage = pkg;
  activeIndex = 0;
  // Removed rather than set to "false", so `[aria-current]` alone selects the active button in CSS.
  tabButtons.forEach(btn => {
    if (btn.dataset.package === pkg.id) btn.setAttribute("aria-current", "true");
    else btn.removeAttribute("aria-current");
  });
  renderCarousel();
  renderViewer();
  if (updateHash) history.replaceState(null, "", `#${pkg.id}`);
}

function selectPackageAt(index) {
  if (!PACKAGES) return; // An interaction landing before the fetch below resolves — nothing to select.
  const pkg = PACKAGES.find(p => p.id === tabButtons[index].dataset.package);
  if (pkg) selectPackage(pkg);
}

tabButtons.forEach((btn, i) => {
  btn.addEventListener("click", () => selectPackageAt(i));
  // Arrow keys walk the package row; Tab still reaches every button, matching the homepage.
  btn.addEventListener("keydown", event => {
    const targets = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabButtons.length - 1 };
    if (!(event.key in targets)) return;
    event.preventDefault();
    const next = (targets[event.key] + tabButtons.length) % tabButtons.length;
    selectPackageAt(next);
    tabButtons[next].focus();
  });
});

let resizeRaf = null;
window.addEventListener("resize", () => {
  if (!PACKAGES || resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => {
    renderCarousel();
    resizeRaf = null;
  });
});

fetch("screenshots-data.json")
  .then(response => {
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.json();
  })
  .then(packages => {
    PACKAGES = packages;
    const initial = PACKAGES.find(p => p.id === location.hash.slice(1)) || PACKAGES[0];
    selectPackage(initial, { updateHash: false });
  })
  .catch(() => {
    track.innerHTML = "";
    frame.innerHTML = `<div class="screenshot-placeholder"><span>Couldn't load screenshots-data.json — this page needs to be served over http(s), not opened directly as a file:// URL.</span></div>`;
  });

// Lightbox: clicking the main screenshot opens it larger in a scrollable overlay, closed by the fixed
// close button (stays put regardless of scroll position), the Escape key, or a click on the backdrop
// itself (not the image).
const lightbox = document.createElement("div");
lightbox.className = "lightbox-overlay";
lightbox.hidden = true;
lightbox.setAttribute("role", "dialog");
lightbox.setAttribute("aria-modal", "true");
lightbox.setAttribute("aria-label", "Screenshot preview");
lightbox.innerHTML = `
  <button type="button" class="lightbox-close" aria-label="Close">&times;</button>
  <img class="lightbox-image" src="" alt="">
`;
document.body.appendChild(lightbox);
const lightboxImage = lightbox.querySelector(".lightbox-image");
const lightboxClose = lightbox.querySelector(".lightbox-close");
let lastFocused = null;

function openLightbox(src, alt) {
  lightboxImage.src = src;
  lightboxImage.alt = alt;
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  lastFocused = document.activeElement;
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImage.src = "";
  document.body.style.overflow = "";
  if (lastFocused instanceof HTMLElement) lastFocused.focus();
}

frame.addEventListener("click", (event) => {
  if (!event.target.closest(".screenshot-zoom")) return;
  // Read the shot from state rather than off the DOM node, so the lightbox gets the real title even
  // though the <img> is deliberately alt="".
  const shot = activePackage.screenshots[activeIndex];
  openLightbox(fullSrc(shot), shot.title);
});

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (lightbox.hidden) return;
  if (event.key === "Escape") {
    closeLightbox();
    return;
  }
  // aria-modal="true" tells assistive tech the rest of the page is inert, but it does nothing to the
  // actual tab order -- without this, Tab walks straight out of the overlay and into the page behind
  // it. The close button is the only focusable thing in here, so the trap is just "stay on it".
  if (event.key === "Tab") {
    event.preventDefault();
    lightboxClose.focus();
  }
});
