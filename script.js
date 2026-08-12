const steps = [
  {
    title: "How a result gets its score",
    lead: "Every hit is a convex combination of normalized text relevance and a weighted sum of business signals.",
    body: `<p>The model has exactly two terms. <strong>α</strong> decides how much influence text relevance receives; <strong>1 − α</strong> gives the remaining influence to business signals.</p><p>Because both terms are normalized, their contributions remain comparable and the final score stays interpretable.</p>`,
    implementation: "Implemented by Search Ranking · explained by Search Debug",
    fragments: [],
    visual: "overview"
  },
  {
    title: "Normalize Elasticsearch relevance",
    lead: "Elasticsearch's unbounded _score is squashed into a stable range from zero up to—but never reaching—one.",
    body: `<p>The transformation preserves the ordering of results while preventing large raw scores from overwhelming every other signal.</p><p>It uses the same saturation shape that BM25 applies to term frequency, here applied to the complete document score.</p>`,
    implementation: "score / (score + k)",
    fragments: ["relevance"],
    visual: "curve"
  },
  {
    title: "Choose the saturation point",
    lead: "The parameter k controls where normalized relevance reaches exactly 0.5.",
    body: `<p>When <strong>score = k</strong>, the relevance term equals <strong>0.5</strong>. Lower values saturate earlier; higher values preserve more differentiation between large Elasticsearch scores.</p><p>Rather than choosing <strong>k</strong> by guesswork, Search Ranking can estimate a practical starting point from representative searches. Import a CSV of typical queries and define the depth to inspect; the package executes the set, samples the highest-ranked results, analyzes their raw <code>_score</code> values, and recommends the observed mean as the initial saturation point.</p>`,
    implementation: "Representative queries + sampling depth → observed _score distribution → suggested k",
    fragments: ["saturation"],
    visual: "saturation"
  },
  {
    title: "Add normalized business signals",
    lead: "The second term combines product-level signals such as click-through rate, conversion rate, availability, or margin.",
    body: `<p>Each metric is transformed into a value between zero and one before it enters the formula. This makes signals with very different units comparable.</p><p>Search Ranking derives an <strong>aggregate frequency distribution</strong> from the metric data and evaluates the available normalization functions against that observed shape. The analysis view presents the empirical distribution beside the fitted curve and recommends the closest match; the selected expression remains fully configurable.</p><p>A low-weight <strong>random()</strong> signal is also worth including in the business term. It breaks deterministic ties, introduces controlled variation, and prevents the same products from becoming permanently locked into identical positions.</p>`,
    implementation: "Distribution analysis → normalization-function suggestion · low-weight random() for controlled variation",
    fragments: ["signals"],
    visual: "signals"
  },
  {
    title: "Keep signal weights comparable",
    lead: "Entered signal weights are force-normalized so their sum always equals one.",
    body: `<p>Editors can express relative importance without manually maintaining a perfect total. A weight of 30 and a weight of 10 become 0.75 and 0.25.</p><p>This normalization runs once when configuration is published, keeping the query itself simple.</p>`,
    implementation: "wi = enteredWeighti / Σ enteredWeightj",
    fragments: ["weights"],
    visual: "weights"
  }
];

const tabButtons = [...document.querySelectorAll("[data-step]")];
const formulas = [...document.querySelectorAll(".formula")];
const title = document.getElementById("step-title");
const lead = document.getElementById("step-lead");
const body = document.getElementById("step-body");
const implementation = document.getElementById("step-implementation");
const count = document.getElementById("step-count");
const visual = document.getElementById("step-visual");
const explorerShell = document.getElementById("explorer-shell");
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

function renderVisual(kind) {
  const visuals = {
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
  visual.innerHTML = visuals[kind];
}

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
  activeStep = (index + steps.length) % steps.length;
  const step = steps[activeStep];
  // The two breadcrumb toggles are not counted here: opening either one hides this panel outright
  // rather than advancing it, so a denominator including them could never be reached.
  count.textContent = `${String(activeStep + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`;
  title.textContent = step.title;
  lead.textContent = step.lead;
  body.innerHTML = step.body;
  implementation.textContent = step.implementation;
  implementation.hidden = !step.implementation;
  renderVisual(step.visual);

  tabButtons.forEach((button, i) => {
    const isActive = i === activeStep;
    setCurrent(button, isActive);
    if (isActive && scrollTabIntoView) button.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  });

  highlightFormulaFragments(step.fragments);
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
  highlightFormulaFragments(willOpen ? activeFragments : steps[activeStep].fragments);
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
