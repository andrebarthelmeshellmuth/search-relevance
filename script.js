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
  },
  {
    title: "Let query specificity shift the balance",
    lead: "Before applying business relevance, the query itself is analysed.",
    body: `<p>Rather than relying solely on the returned search scores, the package estimates how discriminative the query terms are within the indexed catalog. Rare terms indicate a precise search intent, while common terms suggest an exploratory search.</p><p>This specificity estimate dynamically adjusts the balance between textual relevance and business relevance. Highly specific queries favour exact lexical matches, whereas generic queries allow business signals to play a larger role.</p>`,
    implementation: "",
    fragments: ["alpha"],
    visual: "entropy"
  }
];

const tabButtons = [...document.querySelectorAll("[data-step]")];
const formula = document.querySelector(".formula");
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
    ${showK ? `<line x1="${markerX}" y1="${markerY + 10}" x2="${markerX}" y2="215" stroke="#007f83" stroke-dasharray="4 4"/><text class="chart-label" x="${markerX - 6}" y="238">k</text>` : ""}
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
    </div>`,
    entropy: `<div class="visual-card entropy-visual">
      <div class="entropy-examples">
        <div class="query-box"><small>Precise query</small><strong>Bosch GSR 18V-55</strong><div class="entropy-scale"><div class="entropy-track"><i class="entropy-dot" style="left:12%"></i></div><div class="entropy-caption"><span>more relevance</span><span>more signals</span></div></div></div>
        <div class="query-box"><small>Broad query</small><strong>chair</strong><div class="entropy-scale"><div class="entropy-track"><i class="entropy-dot" style="left:76%"></i></div><div class="entropy-caption"><span>more relevance</span><span>more signals</span></div></div></div>
      </div>
      <div class="entropy-parameters">
        <div class="parameter-card"><strong>Analyze Query</strong><table class="freq-table"><tbody><tr><td>chair</td><td>df 58</td></tr><tr><td>bosch</td><td>df 17</td></tr><tr><td>gsr</td><td>df 2</td></tr><tr><td>18v</td><td>df 2</td></tr></tbody></table><p>Every analyzed query term contributes information about how distinctive the user's search is. Rare terms provide much stronger evidence of purchase intent than common catalog terms.</p></div>
        <div class="parameter-card"><strong>Query Specificity</strong><div class="bar-rows"><div class="bar-row"><span>chair</span><span class="mini-bar"><i style="width:50%"></i></span></div><div class="bar-row"><span>bosch gsr</span><span class="mini-bar"><i style="width:100%"></i></span></div></div><p>The collected term statistics are combined into a single specificity score. Rather than classifying queries into fixed groups, the package places every query on a continuous scale between exploratory and known-item search.</p></div>
        <div class="parameter-card"><strong>Adaptive Weighting</strong><div class="shift-state"><small>Specific</small><div class="mini-bar"><i style="width:85%"></i></div><div class="bar-split"><span>Text 85%</span><span>Business 15%</span></div></div><div class="bar-arrow" aria-hidden="true">↓</div><div class="shift-state"><small>Generic</small><div class="mini-bar"><i style="width:40%"></i></div><div class="bar-split"><span>Text 40%</span><span>Business 60%</span></div></div><p>The specificity score controls a continuous shift between lexical relevance and business relevance. The result is deterministic, explainable and configurable for each project.</p></div>
      </div>
    </div>`
  };
  visual.innerHTML = visuals[kind];
}

function closeOptimizationCrumbs() {
  optimizationCrumbs.classList.remove("is-open");
  optimizationToggle.setAttribute("aria-expanded", "false");
  optimizationPanel.hidden = true;
  explorerShell.hidden = false;
}

function highlightFormulaFragments(names) {
  const fragments = [...document.querySelectorAll(".formula-fragment")];
  fragments.forEach(fragment => fragment.classList.remove("is-active", "has-active-child"));
  formula.classList.toggle("is-focused", names.length > 0);
  names.forEach(name => {
    document.querySelectorAll(`[data-fragment="${name}"]`).forEach(fragment => {
      fragment.classList.add("is-active");
      const parentFragment = fragment.parentElement?.closest(".formula-fragment");
      if (parentFragment) parentFragment.classList.add("has-active-child");
    });
  });
}

function showStep(index, focus = false) {
  closeOptimizationCrumbs();
  activeStep = (index + steps.length) % steps.length;
  const step = steps[activeStep];
  const totalPages = steps.length + 1; // + Optimization, the 7th page in the top breadcrumb
  count.textContent = `${String(activeStep + 1).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`;
  title.textContent = step.title;
  lead.textContent = step.lead;
  body.innerHTML = step.body;
  implementation.textContent = step.implementation;
  implementation.hidden = !step.implementation;
  renderVisual(step.visual);

  tabButtons.forEach((button, i) => {
    const isActive = i === activeStep;
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
    if (isActive) button.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  });

  highlightFormulaFragments(step.fragments);

  if (focus) tabButtons[activeStep].focus();
}

tabButtons.forEach((button, i) => {
  button.addEventListener("click", () => showStep(i));
  button.addEventListener("keydown", event => {
    if (event.key === "ArrowRight") { event.preventDefault(); showStep(activeStep + 1, true); }
    if (event.key === "ArrowLeft") { event.preventDefault(); showStep(activeStep - 1, true); }
    if (event.key === "Home") { event.preventDefault(); showStep(0, true); }
    if (event.key === "End") { event.preventDefault(); showStep(steps.length - 1, true); }
  });
});

const optimizationToggle = document.getElementById("optimization-toggle");
const optimizationCrumbs = document.getElementById("optimization-crumbs");
const optimizationPanel = document.getElementById("optimization-panel");
const optCrumbs = [...document.querySelectorAll(".optimization-crumbs-inner .crumb")];
const optContentIds = [
  "optimization-dataset",
  "optimization-rank-eval",
  "optimization-cmaes",
  "optimization-parameters",
  "optimization-runtime"
];

function showOptStep(index) {
  optCrumbs.forEach((crumb, i) => crumb.setAttribute("aria-selected", String(i === index)));
  optContentIds.forEach((id, i) => {
    const card = document.getElementById(id);
    if (card) card.hidden = i !== index;
  });
}

optCrumbs.forEach((crumb, i) => {
  crumb.addEventListener("click", () => showOptStep(i));
});

optimizationToggle.addEventListener("click", () => {
  const isOpen = optimizationCrumbs.classList.toggle("is-open");
  optimizationToggle.setAttribute("aria-expanded", String(isOpen));
  optimizationPanel.hidden = !isOpen;
  explorerShell.hidden = isOpen;
  if (isOpen) showOptStep(0);
  tabButtons.forEach((button, i) => {
    button.setAttribute("aria-selected", String(!isOpen && i === activeStep));
  });
  highlightFormulaFragments(isOpen ? ["alpha", "weights"] : steps[activeStep].fragments);
});

showStep(0);
