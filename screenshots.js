const PACKAGES = [
  {
    id: "search-feedback",
    label: "Search Feedback",
    screenshots: [
      { title: "File a ticket from the SRP", description: "The “Not happy with these results?” box renders below the product grid on the search results page, outside the filter form. It's only visible to a B2B customer signed in under a company account whose role has been explicitly granted the submit-ticket permission — a guest or a customer without that permission sees the search results page as normal, with no box at all. Once visible, picking a topic and adding free text and submitting ties the ticket to the exact query, active filters, page number, and SKUs shown at that moment, then hands the conversation off entirely to Zed — the storefront side never reads the ticket or any reply back.", src: "screenshots/search-feedback/ticket-form.png" },
      { title: "Ticket list", description: "The Zed ticket grid: ID, topic, search term, a colored status badge (orange Open / green Answered or Closed), filed-at timestamp, and a View action per row — sortable and searchable via DataTables. Any Zed admin with access to the module sees every ticket, since Zed users and Yves customers are separate identity systems with no built-in link.", src: "screenshots/search-feedback/ticket-list.png" },
      { title: "Ticket detail", description: "A ticket's full context (topic, search term, active filters as JSON, page number, the exact SKUs shown, store/locale) plus the conversation thread and a reply form. Posting a reply auto-transitions an Open ticket to Answered; status can also be changed manually in either direction independently of replying.", src: "screenshots/search-feedback/ticket-detail.png" }
    ]
  },
  {
    id: "search-debug",
    label: "Search Debug",
    screenshots: [
      { title: "SRP score overlay", description: "The query-token headline (each token color-coded, with its own magnifying-glass link into the analyzer pipeline) sits above the results grid; every product gets a real Elasticsearch _score badge. One card's overlay is pinned open here, showing the final score first — the matched-token and BM25 boost/idf/tf breakdown underneath stays collapsed behind its own toggle until you want that level of detail, so the headline number is never buried in noise. Visible only to a B2B customer signed in under a company account whose role has been granted the see-search-debug-info permission — anyone else sees the ordinary results page, with no badges or overlay at all.", src: "screenshots/search-debug/srp-overlay.png" },
      { title: "Matched tokens breakdown", description: "\"Text signals\" and \"Matched tokens\" unfolded: each query token gets its own real per-field contribution — whichever field actually won the score for that term, at the query's real, live boost value (e.g. full-text-boosted: 5 — nothing hardcoded) — followed by \"Other score contributions\" for whatever else the explain tree scored (type, store, locale, is-active) so the numbers always account for the full score, never a partial view. Other Spryker Community packages can contribute their own sections into this same overlay via a dedicated extension-point interface — search-ranking's business-signal breakdown (metric × weight = contribution, a total, an optional baseline, and the combining formula) is built entirely on it, not a special case wired into search-debug itself.", src: "screenshots/search-debug/matched-tokens.png" },
      { title: "Compare BM25 across tokens", description: "Two products pinned open side by side for the same query, \"office chair\" — the left card's BM25 breakdown is expanded for the token \"office\", the right card's for \"chair\". Their inverse document frequency tells the real story neither product's headline score reveals alone: idf 0.326 for \"office\" (a near-ubiquitous word across this demo shop's catalog) against idf 3.013 for \"chair\" (comparatively rare) — the same query-time boost and a similar term frequency, but \"chair\" is worth roughly 9× more per occurrence simply because it's more specific. Pinning turns the overlay from a per-product tooltip into a real side-by-side comparison tool.", src: "screenshots/search-debug/bm25-compare.png" },
      { title: "Trace a token to its database field", description: "Clicking the magnifying glass next to a matched token opens this page: every field the query could have matched, labeled with the real column it came from — spy_product_abstract_localized_attributes.name, spy_category_attribute.name, spy_merchant.name, and so on — not an abstracted \"title\"/\"category\" placeholder. Each highlighted fragment marks a literal, byte-for-byte occurrence of the text that produced the token, one mark per occurrence rather than one per field, since two occurrences of the \"same\" word can trace back to genuinely different source text. Any project-specific field a shop's own indexing contributes gets a real label too, via a small extension-point interface other packages and project code can register against — never a bare, unexplained value. Every highlighted mark carries its own magnifying-glass link into the exact tokenizer/filter pipeline that produced that specific occurrence's token — that's the next screenshot.", src: "screenshots/search-debug/token-source.png" },
      { title: "Full German analyzer pipeline (index time)", description: "An example of the richest path a German analyzer chain like this one can take on a real word: \"Bürostuhl\" (office chair), found inside a product description while searching \"stuhl\". Eight stages run in sequence — a char filter that protects the real brand name \"Brennenstuhl\" from being mistaken for \"Stuhl\" further down the chain, the standard tokenizer, lowercasing, german_normalization folding \"ü\" to \"u\", a German stopword filter, a dictionary decompounder splitting the compound into \"büro\" + \"stuhl\", a light German stemmer, and finally the edge-ngram filter used for prefix matching — each stage's own real, live filter definition shown inline, not just its name.", src: "screenshots/search-debug/token-analysis.png" },
      { title: "Same word, search-time pipeline", description: "The mirror image of the previous screenshot, reached the same way a shopper would: searching \"bürostuhl\" and clicking the magnifying glass on the \"stuhl\" badge in the SRP's own query-token headline. The raw text at the top is the literal query, \"bürostuhl\" — not product text, since the search-time analyzer only ever runs on what a shopper typed, never on stored documents. The first six stages are identical to the index-time path (char filter, tokenizer, lowercasing, normalization, stopwords, decompounding), since a query and a document go through the same groundwork. The chain then diverges: the index-time path ends in the edge-ngram filter (for prefix matching); the search-time path ends in the synonym filter instead, whose own caption shows the full mapping, \"stuhl => stuhl, sessel\" — a real, honest limit of a linear step-by-step trace like this one, since the badge itself can only ever follow the one token it started with, not fan out to show \"sessel\" appearing alongside it.", src: "screenshots/search-debug/token-analysis-search.png" }
    ]
  },
  {
    id: "search-ranking",
    label: "Search Ranking",
    screenshots: [
      { title: "Signal weights", description: "Add a description for this screenshot." },
      { title: "Saturation point calibration", description: "Add a description for this screenshot." },
      { title: "Metric history", description: "Add a description for this screenshot." },
      { title: "Scope copy", description: "Add a description for this screenshot." }
    ]
  },
  {
    id: "search-optimization",
    label: "Search Optimization",
    screenshots: [
      { title: "Optimization run form", description: "Add a description for this screenshot." },
      { title: "Rank eval dataset", description: "Add a description for this screenshot." },
      { title: "CMA-ES progress", description: "Add a description for this screenshot." },
      { title: "Parameter checklist", description: "Add a description for this screenshot." }
    ]
  }
];

const tabButtons = [...document.querySelectorAll("[data-package]")];
const track = document.getElementById("carousel-track");
const prevBtn = document.querySelector(".carousel-prev");
const nextBtn = document.querySelector(".carousel-next");
const frame = document.getElementById("screenshot-frame");
const indexEl = document.getElementById("screenshot-index");
const titleEl = document.getElementById("screenshot-title");
const descEl = document.getElementById("screenshot-description");

let activePackage = PACKAGES[0];
let activeIndex = 0;
let itemStep = 0;
let copyWidth = 0;
let scrollRaf = null;
let isOverflowing = false;

function placeholderIcon() {
  return `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="15" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 8"/></svg>`;
}

function thumbHTML(shot, i) {
  const media = shot.src
    ? `<img src="${shot.src}" alt="">`
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
  frame.innerHTML = shot.src
    ? `<img src="${shot.src}" alt="${shot.title}">`
    : `<div class="screenshot-placeholder">${placeholderIcon()}<span>Screenshot coming soon</span></div>`;
}

function selectPackage(pkg, { updateHash = true } = {}) {
  activePackage = pkg;
  activeIndex = 0;
  tabButtons.forEach(btn => btn.setAttribute("aria-selected", String(btn.dataset.package === pkg.id)));
  renderCarousel();
  renderViewer();
  if (updateHash) history.replaceState(null, "", `#${pkg.id}`);
}

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const pkg = PACKAGES.find(p => p.id === btn.dataset.package);
    if (pkg) selectPackage(pkg);
  });
});

let resizeRaf = null;
window.addEventListener("resize", () => {
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => {
    renderCarousel();
    resizeRaf = null;
  });
});

const initial = PACKAGES.find(p => p.id === location.hash.slice(1)) || PACKAGES[0];
selectPackage(initial, { updateHash: false });

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
  const img = event.target.closest("img");
  if (!img) return;
  openLightbox(img.src, img.alt);
});

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
});
