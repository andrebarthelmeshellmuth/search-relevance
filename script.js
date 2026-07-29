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
    title: "Let query entropy shift the balance",
    lead: "Entropy does not change the formula. It moves α before the final score is calculated.",
    body: `<p>Not every query deserves the same ranking balance. A precise query with one dominant result can rely more heavily on text relevance; a broad or ambiguous query leaves more room for popularity, availability, conversion, and other business signals.</p><p>Three parameters define that behavior: <strong>N</strong> controls how many leading results are inspected, <strong>m</strong> limits the maximum change applied to α, and <strong>γ</strong> shapes how gradually or aggressively the shift reacts to normalized entropy.</p>`,
    implementation: "N = probe depth · m = maximum ± shift · γ = response-curve exponent",
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
      <div class="fit-graphs">
        <figure class="fit-figure">
          <svg viewBox="0 0 260 170" role="img" aria-label="Aggregate frequency distribution of a business metric">
            <line class="mini-axis" x1="24" y1="145" x2="246" y2="145" />
            <line class="mini-axis" x1="24" y1="145" x2="24" y2="15" />
            <g class="mini-bars">
              <rect x="34" y="126" width="17" height="19"/><rect x="56" y="102" width="17" height="43"/><rect x="78" y="62" width="17" height="83"/><rect x="100" y="35" width="17" height="110"/><rect x="122" y="50" width="17" height="95"/><rect x="144" y="78" width="17" height="67"/><rect x="166" y="101" width="17" height="44"/><rect x="188" y="119" width="17" height="26"/><rect x="210" y="130" width="17" height="15"/>
            </g>
          </svg>
          <figcaption>Observed metric distribution</figcaption>
        </figure>
        <figure class="fit-figure">
          <svg viewBox="0 0 260 170" role="img" aria-label="Suggested normalization curve fitted to the metric distribution">
            <line class="mini-grid" x1="24" y1="80" x2="246" y2="80" />
            <line class="mini-axis" x1="24" y1="145" x2="246" y2="145" />
            <line class="mini-axis" x1="24" y1="145" x2="24" y2="15" />
            <path class="mini-fit" d="M24 145 C47 115, 72 88, 99 67 C135 40, 181 27, 246 22" />
            <circle class="mini-point" cx="99" cy="67" r="5"/>
          </svg>
          <figcaption>Suggested normalization curve</figcaption>
        </figure>
      </div>
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
        <div class="query-box"><small>Broad query</small><strong>drill</strong><div class="entropy-scale"><div class="entropy-track"><i class="entropy-dot" style="left:76%"></i></div><div class="entropy-caption"><span>more relevance</span><span>more signals</span></div></div></div>
      </div>
      <div class="entropy-parameters">
        <div class="parameter-card"><small>Probe result size</small><strong>N = 10</strong><p>How many top results are used to estimate query ambiguity.</p></div>
        <div class="parameter-card"><small>Shift magnitude</small><strong>m = 0.25</strong><p>The maximum positive or negative change entropy may apply to α.</p></div>
        <div class="parameter-card"><small>Weight exponent</small><strong>γ = 1.0</strong><p>The response-curve shape; larger values concentrate the strongest shifts near the extremes.</p></div>
      </div>
    </div>`
  };
  visual.innerHTML = visuals[kind];
}

function showStep(index, focus = false) {
  activeStep = (index + steps.length) % steps.length;
  const step = steps[activeStep];
  count.textContent = `${String(activeStep + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`;
  title.textContent = step.title;
  lead.textContent = step.lead;
  body.innerHTML = step.body;
  implementation.textContent = step.implementation;
  renderVisual(step.visual);

  tabButtons.forEach((button, i) => {
    const isActive = i === activeStep;
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
    if (isActive) button.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  });

  const fragments = [...document.querySelectorAll(".formula-fragment")];
  fragments.forEach(fragment => fragment.classList.remove("is-active", "has-active-child"));
  formula.classList.toggle("is-focused", step.fragments.length > 0);
  step.fragments.forEach(name => {
    document.querySelectorAll(`[data-fragment="${name}"]`).forEach(fragment => {
      fragment.classList.add("is-active");
      const parentFragment = fragment.parentElement?.closest(".formula-fragment");
      if (parentFragment) parentFragment.classList.add("has-active-child");
    });
  });

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

document.querySelectorAll("[data-direction]").forEach(button => {
  button.addEventListener("click", () => showStep(activeStep + (button.dataset.direction === "next" ? 1 : -1)));
});

showStep(0);
