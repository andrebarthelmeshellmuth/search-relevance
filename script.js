// The five explorer steps live in index.html as real markup, not as data here — this file only knows
// how to switch between them. Each panel declares its own behaviour: data-visual names the
// illustration to draw into it, and data-fragments lists the formula fragments to light up.
const explorerShell = document.getElementById("explorer-shell");
const stepPanels = [...explorerShell.querySelectorAll(".step-panel")];
const stepFragments = (index) => (stepPanels[index].dataset.fragments || "").split(" ").filter(Boolean);

const tabButtons = [...document.querySelectorAll("[data-step]")];
const formulas = [...document.querySelectorAll(".formula")];
let activeStep = 0;

function chartSvg(markerX = 145, markerY = 131, showK = false) {
  return `<svg class="chart-svg" viewBox="0 0 420 250" role="img" aria-label="Saturation curve">
    <line class="chart-grid" x1="52" y1="65" x2="390" y2="65" />
    <line class="chart-grid" x1="52" y1="130" x2="390" y2="130" />
    <line class="chart-axis" x1="52" y1="215" x2="390" y2="215" />
    <line class="chart-axis" x1="52" y1="215" x2="52" y2="25" />
    <path class="chart-curve" d="M52 215 C78 173, 104 143, 135 119 C186 80, 255 58, 390 43" />
    <circle class="chart-marker" cx="${markerX}" cy="${markerY}" r="7" />
    <text class="chart-label" x="18" y="69">1.0</text>
    <text class="chart-label" x="18" y="134">0.5</text>
    <text class="chart-label" x="52" y="238">0</text>
    <text class="chart-label" x="352" y="238">raw _score</text>
    ${showK ? `<line x1="${markerX}" y1="${markerY + 10}" x2="${markerX}" y2="215" stroke="var(--teal)" stroke-dasharray="4 4"/><text class="chart-label" x="${markerX - 6}" y="238">k</text>` : ""}
  </svg>`;
}

// Keyed by each panel's data-visual. These are illustrations rather than content, which is why they
// stay here instead of moving into the HTML with the prose — a reader without scripting loses nothing
// but decoration. Built once at module scope; the old version rebuilt all five on every step change.
const VISUALS = {
    overview: `<div class="visual-card visual-split">
      <div class="metric-box"><small>Text term</small><strong>α · relevance</strong></div>
      <div class="metric-box"><small>Signal term</small><strong>(1−α) · signals</strong></div>
      <div class="metric-box"><small>Input</small><strong>Elasticsearch _score</strong></div>
      <div class="metric-box"><small>Output</small><strong>Explainable final score</strong></div>
    </div>`,
    curve: `<div class="visual-card">${chartSvg()}<p class="big-equation">score / (score + k)</p></div>`,
    saturation: `<div class="visual-card calibration-visual">
      <div class="calibration-flow">
        <div class="metric-box"><small>1 · Upload</small><strong>query CSV</strong></div>
        <span aria-hidden="true">→</span>
        <div class="metric-box"><small>2 · Sample</small><strong>top X scores</strong></div>
        <span aria-hidden="true">→</span>
        <div class="metric-box"><small>3 · Calculate</small><strong>average _score</strong></div>
      </div>
      ${chartSvg(145, 131, true)}
      <div class="metric-box"><small>Suggested saturation point</small><strong>k = average score of sampled results</strong></div>
    </div>`,
    signals: `<div class="visual-card histogram-fit">
      <figure class="fit-figure single-fit">
        <svg viewBox="0 0 520 260" role="img" aria-label="Observed business metric profile and selected normalization function in one coordinate system">
          <line class="mini-grid" x1="48" y1="68" x2="490" y2="68" />
          <line class="mini-grid" x1="48" y1="132" x2="490" y2="132" />
          <line class="mini-grid" x1="48" y1="196" x2="490" y2="196" />
          <line class="mini-axis" x1="48" y1="226" x2="490" y2="226" />
          <line class="mini-axis" x1="48" y1="226" x2="48" y2="26" />
          <path class="metric-profile" d="M48 226 C73 219, 95 205, 120 185 C150 160, 181 129, 214 107 C252 82, 294 66, 339 54 C386 42, 436 34, 490 30" />
          <path class="mini-fit" d="M48 226 C88 183, 127 148, 168 120 C215 88, 271 65, 334 50 C387 38, 439 31, 490 27" />
          <circle class="mini-point observed-point" cx="214" cy="107" r="5"/>
          <circle class="mini-point" cx="334" cy="50" r="5"/>
          <text class="mini-label" x="58" y="246">raw metric value</text>
          <text class="mini-label" x="7" y="34">normalized</text>
        </svg>
        <figcaption class="fit-legend"><span><i class="legend-line observed"></i>Observed metric profile</span><span><i class="legend-line fitted"></i>Selected normalization function</span></figcaption>
      </figure>
      <div class="function-selector" aria-label="Normalization function choices">
        <span>Normalization function</span>
        <button class="selected" type="button">atan(x / avg)</button>
        <button type="button">x / max</button>
        <button type="button">custom expression</button>
      </div>
      <div class="random-note"><span>Recommended companion signal</span><strong>low-weight random()</strong></div>
    </div>`,
    weights: `<div class="visual-card">
      <div class="visual-split">
        <div class="metric-box"><small>Entered</small><strong>30</strong></div>
        <div class="metric-box"><small>Normalized</small><strong>0.75</strong></div>
        <div class="metric-box"><small>Entered</small><strong>10</strong></div>
        <div class="metric-box"><small>Normalized</small><strong>0.25</strong></div>
      </div>
      <p class="big-equation">Σ wᵢ = 1</p>
    </div>`
};

// Drawn once for all five panels. The inactive ones are display:none, so their contents cost nothing
// in layout and stay out of the tab order exactly as before.
stepPanels.forEach(panel => {
  panel.querySelector(".step-visual").innerHTML = VISUALS[panel.dataset.visual] ?? "";
});

function closeAllCrumbs() {
  optimizationCrumbs.classList.remove("is-open");
  optimizationToggle.setAttribute("aria-expanded", "false");
  optimizationPanel.hidden = true;

  specificityCrumbs.classList.remove("is-open");
  specificityToggle.setAttribute("aria-expanded", "false");
  specificityPanel.hidden = true;
  specificityFormulaCard.hidden = true;

  explorerShell.hidden = false;
}

function highlightFormulaFragments(names) {
  const fragments = [...document.querySelectorAll(".formula-fragment")];
  fragments.forEach(fragment => fragment.classList.remove("is-active", "has-active-child"));
  names.forEach(name => {
    document.querySelectorAll(`[data-fragment="${name}"]`).forEach(fragment => {
      fragment.classList.add("is-active");
      const parentFragment = fragment.parentElement?.closest(".formula-fragment");
      if (parentFragment) parentFragment.classList.add("has-active-child");
    });
  });
  formulas.forEach(formula => {
    formula.classList.toggle("is-focused", formula.querySelector(".formula-fragment.is-active") !== null);
  });
}

// aria-current names the one button whose content is on screen. It's removed rather than set to
// "false" so `[aria-current]` alone is a valid CSS/query selector for "the active one".
function setCurrent(button, isCurrent) {
  if (isCurrent) button.setAttribute("aria-current", "step");
  else button.removeAttribute("aria-current");
}

// Arrow keys walk a row of step buttons without leaving it, and Home/End jump to its ends. Tab still
// stops on every button: these rows are plain groups, not tablists, so hiding all but one button from
// Tab would be surprising rather than helpful.
function wireArrowKeys(buttons, activate) {
  buttons.forEach((button, i) => {
    button.addEventListener("keydown", event => {
      const targets = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: buttons.length - 1 };
      if (!(event.key in targets)) return;
      event.preventDefault();
      const next = (targets[event.key] + buttons.length) % buttons.length;
      activate(next);
      buttons[next].focus();
    });
  });
}

function showStep(index, scrollTabIntoView = true) {
  closeAllCrumbs();
  activeStep = (index + stepPanels.length) % stepPanels.length;
  stepPanels.forEach((panel, i) => panel.classList.toggle("is-active", i === activeStep));

  tabButtons.forEach((button, i) => {
    const isActive = i === activeStep;
    setCurrent(button, isActive);
    if (isActive && scrollTabIntoView) button.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  });

  highlightFormulaFragments(stepFragments(activeStep));
}

tabButtons.forEach((button, i) => button.addEventListener("click", () => showStep(i)));
wireArrowKeys(tabButtons, showStep);

const optimizationToggle = document.getElementById("optimization-toggle");
const optimizationCrumbs = document.getElementById("optimization-crumbs");
const optimizationPanel = document.getElementById("optimization-panel");
const optCrumbs = [...document.querySelectorAll("#optimization-crumbs .crumb")];
const optContentIds = [
  "optimization-dataset",
  "optimization-rank-eval",
  "optimization-cmaes",
  "optimization-parameters",
  "optimization-runtime"
];

const specificityToggle = document.getElementById("specificity-toggle");
const specificityCrumbs = document.getElementById("specificity-crumbs");
const specificityPanel = document.getElementById("specificity-panel");
const specificityFormulaCard = document.getElementById("specificity-formula-card");
const specCrumbs = [...document.querySelectorAll("#specificity-crumbs .crumb")];
const specContentIds = [
  "specificity-terms",
  "specificity-raw",
  "specificity-normalize",
  "specificity-shift",
  "specificity-calibrate"
];
// Each Query Specificity crumb highlights the slice of the three secondary formula lines it's currently
// explaining: which term-level inputs feed raw specificity, which stage of the pipeline is active, or —
// on the last step — every parameter that specificity's own calibration pass can tune.
const SPEC_STEP_FRAGMENTS = [
  ["alpha", "spec-log"],
  ["alpha", "spec-max", "spec-hmean"],
  ["alpha", "d-fraction"],
  ["alpha", "d-shift"],
  ["alpha", "spec-param"]
];

function showOptStep(index) {
  optCrumbs.forEach((crumb, i) => setCurrent(crumb, i === index));
  optContentIds.forEach((id, i) => {
    const card = document.getElementById(id);
    if (card) card.hidden = i !== index;
  });
}

optCrumbs.forEach((crumb, i) => crumb.addEventListener("click", () => showOptStep(i)));
wireArrowKeys(optCrumbs, showOptStep);

function showSpecStep(index) {
  specCrumbs.forEach((crumb, i) => setCurrent(crumb, i === index));
  specContentIds.forEach((id, i) => {
    const card = document.getElementById(id);
    if (card) card.hidden = i !== index;
  });
  highlightFormulaFragments(SPEC_STEP_FRAGMENTS[index] ?? ["alpha"]);
}

specCrumbs.forEach((crumb, i) => crumb.addEventListener("click", () => showSpecStep(i)));
wireArrowKeys(specCrumbs, showSpecStep);

function toggleBreadcrumbLine(willOpen, { crumbs, toggle, panel, onOpen, activeFragments }) {
  closeAllCrumbs();
  if (willOpen) {
    crumbs.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    explorerShell.hidden = true;
    onOpen();
  }
  tabButtons.forEach((button, i) => setCurrent(button, !willOpen && i === activeStep));
  highlightFormulaFragments(willOpen ? activeFragments : stepFragments(activeStep));
}

optimizationToggle.addEventListener("click", () => {
  toggleBreadcrumbLine(!optimizationCrumbs.classList.contains("is-open"), {
    crumbs: optimizationCrumbs,
    toggle: optimizationToggle,
    panel: optimizationPanel,
    onOpen: () => showOptStep(0),
    activeFragments: ["alpha", "weights"]
  });
});

specificityToggle.addEventListener("click", () => {
  toggleBreadcrumbLine(!specificityCrumbs.classList.contains("is-open"), {
    crumbs: specificityCrumbs,
    toggle: specificityToggle,
    panel: specificityPanel,
    onOpen: () => { specificityFormulaCard.hidden = false; showSpecStep(0); },
    activeFragments: SPEC_STEP_FRAGMENTS[0]
  });
});

// No scrollIntoView here: this is the initial render, before the visitor has scrolled or interacted at
// all, so the tab strip (which sits below the hero, off-screen at scroll 0) has no business being pulled
// into view — every real user action still calls showStep() with its default (true), keeping the active
// tab visible during click/keyboard navigation.
showStep(0, false);
