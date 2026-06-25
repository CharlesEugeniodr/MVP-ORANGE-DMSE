/**
 * benchmark-panel.js — BenchmarkPanel
 * Comparative field dynamics benchmark UI.
 *
 * Displays results from BenchmarkRunner: ranking cards, overlay charts,
 * metrics table, dimensional stability map, Invisible Code bars, and
 * overall winner banner.
 *
 * @module ui/benchmark-panel
 */

/* ── Try importing external modules; fall back to built-in runner ── */
let BenchmarkRunner = null;
let MODEL_INFO = null;

try {
  const runnerMod = await import('../engine/benchmark-runner.js');
  BenchmarkRunner = runnerMod.BenchmarkRunner;
} catch (_) { /* will use built-in runner */ }

try {
  const modelsMod = await import('../engine/field-models.js');
  MODEL_INFO = modelsMod.MODEL_INFO;
} catch (_) { /* will use built-in model info */ }

// ─── Consistent model definitions (always use these internal keys) ────────────
const MODELS = {
  'klein-gordon': {
    key: 'klein-gordon', extId: 'KLEIN_GORDON',
    label: 'Klein-Gordon', theory: 'Relatividade Geral',
    color: '#2196F3', icon: '⭖',
  },
  'phi4': {
    key: 'phi4', extId: 'PHI4',
    label: 'φ⁴ Theory', theory: 'Teoria Quântica de Campos',
    color: '#FF9800', icon: '⚛',
  },
  'string': {
    key: 'string', extId: 'STRING_WORLDSHEET',
    label: 'Worldsheet String', theory: 'Teoria das Cordas',
    color: '#9C27B0', icon: '〜',
  },
  'orange': {
    key: 'orange', extId: 'ORANGE_DMSE',
    label: 'Orange-DMSE', theory: 'Malha Octagonal Vetorial',
    color: '#FF6B35', icon: '🍊',
  },
};

const MODEL_KEYS   = Object.keys(MODELS);
const MODEL_COLORS = MODEL_KEYS.map(k => MODELS[k].color);
const TOTAL_DIMS   = 30;

// ─── Built-in benchmark runner (used when external is unavailable) ───────────
class BuiltInRunner {
  constructor(steps = 1000) {
    this.steps = steps;
    this._cancelled = false;
  }

  cancel() { this._cancelled = true; }

  /**
   * Run one model simulation and return metrics.
   * Uses a simplified scalar field PDE per model type.
   */
  _runModel(modelKey) {
    const N = 64;
    const dt = 0.01;
    const E0 = 1.0;
    const dims = TOTAL_DIMS;
    const r_rms_history = [];

    // Per-dimension field state
    const E = Array.from({ length: dims }, () => {
      const arr = new Float64Array(N);
      for (let i = 0; i < N; i++) arr[i] = E0 + (Math.random() - 0.5) * 0.5;
      return arr;
    });
    const V = Array.from({ length: dims }, () => new Float64Array(N));

    // Model-specific parameters
    const params = this._modelParams(modelKey);
    let kappa = 1.0;
    let energy0 = null;

    for (let step = 0; step < this.steps; step++) {
      let r_sum = 0;
      let r_count = 0;

      for (let d = 0; d < dims; d++) {
        for (let i = 0; i < N; i++) {
          const e = E[d][i];
          const r = (e - E0) / E0;

          // Laplacian (1D periodic)
          const left  = E[d][(i - 1 + N) % N];
          const right = E[d][(i + 1) % N];
          const lap = left + right - 2 * e;

          // Force term varies by model
          let force = params.alpha * lap - kappa * r * params.restoring;

          // Model-specific non-linearity
          if (modelKey === 'phi4') {
            force += -params.lambda * e * (e * e - E0 * E0);
          } else if (modelKey === 'string') {
            force += params.tension * Math.sin(2 * Math.PI * e / E0);
          } else if (modelKey === 'orange') {
            // Cross-channel coupling
            const partner = dims - 1 - d;
            const coupling = params.coupling * (E[partner][i] - e);
            force += coupling;
          }

          // Damped Verlet update
          V[d][i] = V[d][i] * (1 - params.eta * dt) + force * dt;
          E[d][i] += V[d][i] * dt;

          r_sum += r * r;
          r_count++;
        }
      }

      const r_rms = Math.sqrt(r_sum / r_count);
      r_rms_history.push(r_rms);

      // Adaptive kappa
      const target = 0.01;
      kappa *= r_rms > target ? 1.002 : 0.999;
      kappa = Math.max(0.01, Math.min(100, kappa));

      // Record initial energy
      if (step === 0) {
        energy0 = this._computeEnergy(E, V, dims, N);
      }
    }

    // Final metrics
    const energyFinal = this._computeEnergy(E, V, dims, N);
    const H_drift = energy0 > 0 ? Math.abs(energyFinal - energy0) / energy0 : 0;
    const finalRrms = r_rms_history[r_rms_history.length - 1];

    // Per-dimension convergence check
    const dimConverged = [];
    const threshold = 0.05;
    for (let d = 0; d < dims; d++) {
      let dr = 0;
      for (let i = 0; i < N; i++) {
        const r = (E[d][i] - E0) / E0;
        dr += r * r;
      }
      dimConverged.push(Math.sqrt(dr / N) < threshold);
    }

    // Coherence (Invisible Code analog)
    let omegaSum = 0, epsilonSum = 0;
    for (let d = 0; d < dims; d++) {
      let chanOmega = 0;
      for (let i = 0; i < N; i++) chanOmega += Math.abs(E[d][i]);
      chanOmega /= N;
      omegaSum += chanOmega;
      if (chanOmega > 1e-10) epsilonSum += -(E0 / chanOmega);
    }
    const meanOmega   = omegaSum / dims;
    const meanEpsilon = epsilonSum / dims;
    const omegaEpsilonProduct = meanOmega * meanEpsilon;
    const globalCoherence = Math.max(0, Math.min(1, 1 - Math.abs(omegaEpsilonProduct + 1)));

    // Entropy (Shannon-like over residuals)
    const entropy = this._computeEntropy(E, E0, dims, N);

    // Stabilization time
    const t_estab = r_rms_history.findIndex(v => v < threshold);

    return {
      r_rms_history,
      r_rms_final: finalRrms,
      stableDims: dimConverged.filter(Boolean).length,
      dimConverged,
      H_drift,
      globalCoherence,
      omegaEpsilonProduct,
      entropy,
      t_estab: t_estab >= 0 ? t_estab : this.steps,
    };
  }

  _modelParams(key) {
    const base = { alpha: 0.5, eta: 0.05, restoring: 1.0 };
    switch (key) {
      case 'klein-gordon': return { ...base, restoring: 1.2 };
      case 'phi4':         return { ...base, lambda: 0.3, restoring: 0.8 };
      case 'string':       return { ...base, tension: 0.15, restoring: 0.9 };
      case 'orange':       return { ...base, coupling: 0.08, restoring: 1.5 };
      default:             return base;
    }
  }

  _computeEnergy(E, V, dims, N) {
    let H = 0;
    for (let d = 0; d < dims; d++) {
      for (let i = 0; i < N; i++) {
        H += 0.5 * V[d][i] * V[d][i] + 0.5 * E[d][i] * E[d][i];
      }
    }
    return H;
  }

  _computeEntropy(E, E0, dims, N) {
    const bins = 20;
    const counts = new Array(bins).fill(0);
    let total = 0;
    for (let d = 0; d < dims; d++) {
      for (let i = 0; i < N; i++) {
        const r = Math.abs((E[d][i] - E0) / E0);
        const bin = Math.min(bins - 1, Math.floor(r * bins));
        counts[bin]++;
        total++;
      }
    }
    let entropy = 0;
    for (let b = 0; b < bins; b++) {
      if (counts[b] > 0) {
        const p = counts[b] / total;
        entropy -= p * Math.log2(p);
      }
    }
    return entropy;
  }

  /**
   * Run all models with progress callbacks.
   * @param {function} onProgress - (modelIndex, modelKey, progress01)
   * @returns {Promise<Object>} results keyed by model key
   */
  async run(onProgress) {
    const results = {};
    for (let m = 0; m < MODEL_KEYS.length; m++) {
      if (this._cancelled) break;
      const key = MODEL_KEYS[m];
      const info = MODELS[key];
      if (onProgress) onProgress(m, key, 0);

      // Yield to UI before heavy computation
      await new Promise(r => setTimeout(r, 50));
      results[key] = this._runModel(info.key);
      if (onProgress) onProgress(m, key, 1);
    }
    return results;
  }
}

// ─── Panel ───────────────────────────────────────────────────────────────────
export class BenchmarkPanel {
  constructor(container) {
    this.root = container;
    this._results = null;
    this._running = false;
    this._runner = null;
  }

  /* ─── Main render ─── */
  render() {
    this.root.innerHTML = '';
    this.root.classList.add('benchmark-root');

    // Header
    const header = _el('div', 'audit-header');
    header.innerHTML = `
      <h2 class="section-title" style="background:linear-gradient(135deg,#FF6B35 0%,#FF9800 50%,#2196F3 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-size:1.6rem">
        Benchmark Comparativo de Campo Escalar
      </h2>
      <p class="section-subtitle" style="color:#A0AEC0;margin-top:4px">
        Simulação completa de 1000 passos para 4 modelos de campo — Klein-Gordon, φ⁴, String e Orange-DMS.
        Avaliação automática de convergência, estabilidade dimensional, conservação de energia e coerência.
      </p>
    `;
    this.root.appendChild(header);

    // Control bar
    this._renderControlBar();

    // Results container (hidden until benchmark completes)
    this._resultsContainer = _el('div', '');
    this._resultsContainer.style.display = 'none';
    this.root.appendChild(this._resultsContainer);

    // If results already exist, show them
    if (this._results) {
      this._showResults(this._results);
    }
  }

  /* ─── Control Bar ─── */
  _renderControlBar() {
    const bar = _el('div', 'sim-controls');
    bar.style.cssText = 'display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:16px 0';

    // Start button
    this._btnStart = _btn('🚀  Iniciar Benchmark', 'sim-btn btn-start', () => this._startBenchmark());
    this._btnStart.style.cssText = `
      background:linear-gradient(135deg,#FF6B35,#FF9800);color:#fff;font-weight:700;
      padding:10px 24px;border-radius:8px;border:none;cursor:pointer;font-size:0.95rem;
      box-shadow:0 4px 15px rgba(255,107,53,0.4);transition:all 0.3s ease;
    `;
    bar.appendChild(this._btnStart);

    // Progress area
    const progressWrap = _el('div', '');
    progressWrap.style.cssText = 'flex:1;min-width:250px;display:none';

    const progressLabel = _el('div', '');
    progressLabel.style.cssText = 'font-size:0.82rem;color:#A0AEC0;margin-bottom:4px';
    progressLabel.textContent = 'Executando...';
    this._progressLabel = progressLabel;

    const progressTrack = _el('div', '');
    progressTrack.style.cssText = `
      height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;
      position:relative;
    `;

    const progressFill = _el('div', '');
    progressFill.style.cssText = `
      height:100%;width:0%;border-radius:4px;transition:width 0.4s ease;
      background:linear-gradient(90deg,#FF6B35,#FF9800,#2196F3);
      box-shadow:0 0 12px rgba(255,107,53,0.5);
    `;
    this._progressFill = progressFill;

    // Animated shimmer overlay
    const shimmer = _el('div', '');
    shimmer.style.cssText = `
      position:absolute;top:0;left:-100%;width:100%;height:100%;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
      animation:benchmarkShimmer 1.5s infinite;
    `;
    progressTrack.append(progressFill, shimmer);
    progressWrap.append(progressLabel, progressTrack);
    this._progressWrap = progressWrap;

    bar.appendChild(progressWrap);
    this.root.appendChild(bar);

    // Inject shimmer animation
    if (!document.getElementById('benchmark-keyframes')) {
      const style = document.createElement('style');
      style.id = 'benchmark-keyframes';
      style.textContent = `
        @keyframes benchmarkShimmer {
          0%   { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes benchmarkPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.6; }
        }
        @keyframes benchmarkSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes benchmarkScaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /* ─── Start Benchmark ─── */
  async _startBenchmark() {
    if (this._running) return;
    this._running = true;
    this._btnStart.disabled = true;
    this._btnStart.style.opacity = '0.5';
    this._progressWrap.style.display = 'block';
    this._resultsContainer.style.display = 'none';
    this._resultsContainer.innerHTML = '';

    const totalModels = MODEL_KEYS.length;

    try {
      // Always use BuiltInRunner — it's self-contained and doesn't
      // depend on external PDE engine modules that may fail in browser.
      const runner = new BuiltInRunner(1000);
      this._runner = runner;
      const results = await runner.run((modelIdx, modelKey, progress) => {
        const overall = ((modelIdx + progress) / totalModels) * 100;
        this._progressFill.style.width = `${overall}%`;
        const info = MODELS[modelKey];
        this._progressLabel.innerHTML = `
          <span style="color:${info?.color || '#FF6B35'};font-weight:600">${info?.icon || '⚙️'} ${info?.label || modelKey}</span>
          <span style="margin-left:8px">${Math.round(overall)}%</span>
        `;
      });

      this._results = results;
      this._progressFill.style.width = '100%';
      this._progressLabel.innerHTML = '<span style="color:#66BB6A;font-weight:600">✅ Benchmark concluído!</span>';
      this._showResults(results);
    } catch (err) {
      this._progressLabel.innerHTML = `<span style="color:#EF5350">❌ Erro: ${err.message}</span>`;
      console.error('[Benchmark]', err);
    } finally {
      this._running = false;
      this._btnStart.disabled = false;
      this._btnStart.style.opacity = '1';
    }
  }

  /**
   * Adapt external BenchmarkRunner report to the internal results format
   * expected by _showResults().
   */
  _adaptExternalReport(report) {
    const results = {};
    // Map external MODEL_INFO keys → internal MODELS keys
    for (const intKey of MODEL_KEYS) {
      const extId = MODELS[intKey].extId;
      const m = report.models[extId];
      if (!m) continue;
      results[intKey] = {
        r_rms_history: m.r_rms_history?.map(h => h.r_rms_global) || [],
        r_rms_final: m.final_r_rms,
        stableDims: m.stable_dims,
        dimConverged: Array.from(m.final_r_rms_per_channel || [], v => v <= (report.params?.r_rms_target * 2 || 0.1)),
        H_drift: m.H_drift,
        globalCoherence: m.coherence?.globalCoherence || 0,
        omegaEpsilonProduct: m.coherence?.postulate?.product || 0,
        entropy: m.entropy,
        t_estab: m.convergence_step >= 0 ? m.convergence_step : 1000,
      };
    }
    return results;
  }

  /* ─── Show Results ─── */
  _showResults(results) {
    this._resultsContainer.style.display = 'block';
    this._resultsContainer.innerHTML = '';
    this._resultsContainer.style.animation = 'benchmarkSlideUp 0.6s ease';

    // Compute rankings
    const rankings = this._computeRankings(results);

    // a) Ranking cards
    this._renderRankingCards(rankings);

    // b) Overlay chart
    this._renderOverlayChart(results);

    // c) Metrics table
    this._renderMetricsTable(results, rankings);

    // d) Dimensional stability map
    this._renderStabilityMap(results);

    // e) Invisible Code bar
    this._renderInvisibleCodeBars(results);

    // f) Overall winner
    this._renderWinnerBanner(rankings);
  }

  /* ─── Compute Rankings ─── */
  _computeRankings(results) {
    const defaultData = { r_rms_final: Infinity, stableDims: 0, H_drift: Infinity, globalCoherence: 0, omegaEpsilonProduct: 0, entropy: Infinity, t_estab: 1000, r_rms_history: [], dimConverged: [] };
    const entries = MODEL_KEYS.map(k => ({ key: k, info: MODELS[k], data: results[k] || { ...defaultData } }));

    // Convergence: lowest r_rms_final
    const byConvergence = [...entries].sort((a, b) => (a.data.r_rms_final ?? Infinity) - (b.data.r_rms_final ?? Infinity));

    // Stability: most stable dims
    const byStability = [...entries].sort((a, b) => b.data.stableDims - a.data.stableDims);

    // Energy: lowest H_drift
    const byEnergy = [...entries].sort((a, b) => a.data.H_drift - b.data.H_drift);

    // Coherence: highest globalCoherence
    const byCoherence = [...entries].sort((a, b) => b.data.globalCoherence - a.data.globalCoherence);

    const categories = {
      convergencia:  { label: 'Convergência',           icon: '📉', desc: 'Menor r_rms final',            winner: byConvergence[0] },
      estabilidade:  { label: 'Estabilidade Dimensional',icon: '🏗️', desc: `Dims estáveis (de ${TOTAL_DIMS})`, winner: byStability[0] },
      energia:       { label: 'Conservação de Energia',  icon: '⚡', desc: 'Menor H_drift',                winner: byEnergy[0] },
      coerencia:     { label: 'Coerência / Invisible Code', icon: '🔮', desc: 'Maior globalCoherence',    winner: byCoherence[0] },
    };

    // Overall score: sum of ranks (lower is better)
    const scores = {};
    MODEL_KEYS.forEach(k => { scores[k] = 0; });
    byConvergence.forEach((e, i) => { scores[e.key] += i; });
    byStability.forEach((e, i)   => { scores[e.key] += i; });
    byEnergy.forEach((e, i)      => { scores[e.key] += i; });
    byCoherence.forEach((e, i)   => { scores[e.key] += i; });

    const overallWinner = MODEL_KEYS.reduce((best, k) =>
      scores[k] < scores[best] ? k : best
    , MODEL_KEYS[0]);

    // Per-model rank for table
    const rankOrder = [...MODEL_KEYS].sort((a, b) => scores[a] - scores[b]);
    const rankMap = {};
    rankOrder.forEach((k, i) => { rankMap[k] = i + 1; });

    return { categories, scores, overallWinner, rankMap };
  }

  /* ─── a) Ranking Cards ─── */
  _renderRankingCards(rankings) {
    const row = _el('div', '');
    row.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:24px 0';

    for (const [, cat] of Object.entries(rankings.categories)) {
      const card = _el('div', 'hud-card');
      const w = cat.winner;
      card.style.cssText = `
        background:linear-gradient(145deg,${w.info.color}15,${w.info.color}08);
        border:1px solid ${w.info.color}40;border-radius:12px;padding:16px 20px;
        position:relative;overflow:hidden;animation:benchmarkScaleIn 0.5s ease;
      `;

      // Glow accent
      const glow = _el('div', '');
      glow.style.cssText = `
        position:absolute;top:-30px;right:-30px;width:80px;height:80px;
        border-radius:50%;background:${w.info.color};opacity:0.08;filter:blur(20px);
      `;
      card.appendChild(glow);

      card.innerHTML += `
        <div style="font-size:0.75rem;color:#A0AEC0;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">
          ${cat.icon} ${cat.label}
        </div>
        <div style="font-size:1.3rem;font-weight:700;color:${w.info.color};margin-bottom:4px">
          ${w.info.icon} ${w.info.label}
        </div>
        <div style="font-size:0.78rem;color:#718096">${cat.desc}</div>
      `;

      row.appendChild(card);
    }

    this._resultsContainer.appendChild(row);
  }

  /* ─── b) Overlay Chart ─── */
  _renderOverlayChart(results) {
    const section = _el('div', '');
    section.style.cssText = 'margin:24px 0';

    const title = _el('h3', 'section-title');
    title.style.cssText = 'font-size:1.1rem;margin-bottom:12px';
    title.textContent = 'Evolução r_rms Global — Todos os Modelos';
    section.appendChild(title);

    const chartDiv = _el('div', '');
    chartDiv.style.cssText = 'height:380px;background:rgba(10,12,20,0.5);border-radius:12px;padding:8px';
    section.appendChild(chartDiv);

    this._resultsContainer.appendChild(section);

    // Build Plotly traces
    const traces = MODEL_KEYS.map(k => {
      const info = MODELS[k];
      const hist = results[k].r_rms_history;
      return {
        x: hist.map((_, i) => i),
        y: hist,
        name: info.label,
        type: 'scatter',
        mode: 'lines',
        line: { color: info.color, width: k === 'Orange' ? 3 : 1.8 },
      };
    });

    // Target threshold line
    traces.push({
      x: [0, 1000],
      y: [0.05, 0.05],
      name: 'Limiar',
      type: 'scatter',
      mode: 'lines',
      line: { color: '#66BB6A', width: 1, dash: 'dot' },
    });

    const layout = {
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { family: 'Space Grotesk, Inter, sans-serif', color: '#E2E8F0' },
      title: { text: 'r_rms(t) — Convergência Comparativa', font: { size: 14, color: '#E2E8F0' } },
      xaxis: { title: 'Iteração', gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.08)' },
      yaxis: { title: 'r_rms', type: 'log', gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.08)' },
      legend: { orientation: 'h', y: -0.2, font: { size: 11 } },
      margin: { t: 40, b: 60, l: 60, r: 20 },
    };

    /* global Plotly */
    if (typeof Plotly !== 'undefined') {
      Plotly.newPlot(chartDiv, traces, layout, { responsive: true, displayModeBar: false });
    }
  }

  /* ─── c) Metrics Table ─── */
  _renderMetricsTable(results, rankings) {
    const section = _el('div', '');
    section.style.cssText = 'margin:24px 0;overflow-x:auto';

    const title = _el('h3', 'section-title');
    title.style.cssText = 'font-size:1.1rem;margin-bottom:12px';
    title.textContent = 'Métricas Comparativas';
    section.appendChild(title);

    const headers = ['Modelo', 'r_rms Final', 'Dims Estáveis', 'H Drift', 'Coerência', 'Entropia', 't_estab', 'Rank'];

    let html = `<table class="audit-table" style="width:100%;border-collapse:separate;border-spacing:0">
      <thead><tr>${headers.map(h => `<th style="padding:10px 14px;text-align:left;font-size:0.82rem;color:#A0AEC0;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid rgba(255,255,255,0.1)">${h}</th>`).join('')}</tr></thead>
      <tbody>`;

    MODEL_KEYS.forEach(k => {
      const info = MODELS[k];
      const d = results[k];
      const rank = rankings.rankMap[k];
      const isWinner = k === rankings.overallWinner;
      const rowBg = isWinner ? `background:${info.color}12` : '';

      const rankBadge = rank === 1
        ? `<span style="background:linear-gradient(135deg,#FFD700,#FFA000);color:#000;padding:2px 10px;border-radius:12px;font-weight:700;font-size:0.82rem">🏆 1º</span>`
        : `<span style="background:rgba(255,255,255,0.06);color:#A0AEC0;padding:2px 10px;border-radius:12px;font-size:0.82rem">${rank}º</span>`;

      html += `<tr style="${rowBg};transition:background 0.2s" onmouseenter="this.style.background='rgba(255,255,255,0.04)'" onmouseleave="this.style.background='${isWinner ? info.color + '12' : ''}'">
        <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.05)">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${info.color};margin-right:8px;vertical-align:middle;box-shadow:0 0 6px ${info.color}60"></span>
          <span style="font-weight:600;color:${info.color}">${info.icon} ${info.label}</span>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.05);font-family:'JetBrains Mono',monospace;font-size:0.85rem">${d.r_rms_final.toExponential(3)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.05)">
          <span style="font-weight:700;color:${d.stableDims >= 25 ? '#66BB6A' : d.stableDims >= 15 ? '#FFA726' : '#EF5350'}">${d.stableDims}</span>
          <span style="color:#718096">/${TOTAL_DIMS}</span>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.05);font-family:'JetBrains Mono',monospace;font-size:0.85rem">${d.H_drift.toExponential(3)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.05)">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="flex:1;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;max-width:80px">
              <div style="height:100%;width:${(d.globalCoherence * 100).toFixed(0)}%;background:${d.globalCoherence > 0.8 ? '#66BB6A' : d.globalCoherence > 0.5 ? '#FFA726' : '#EF5350'};border-radius:3px"></div>
            </div>
            <span style="font-size:0.85rem">${(d.globalCoherence * 100).toFixed(1)}%</span>
          </div>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.85rem">${d.entropy.toFixed(3)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.85rem">${d.t_estab < 1000 ? d.t_estab : '<span style="color:#EF5350">N/A</span>'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.05)">${rankBadge}</td>
      </tr>`;
    });

    html += '</tbody></table>';
    section.innerHTML += html;
    this._resultsContainer.appendChild(section);
  }

  /* ─── d) Dimensional Stability Map ─── */
  _renderStabilityMap(results) {
    const section = _el('div', '');
    section.style.cssText = 'margin:24px 0';

    const title = _el('h3', 'section-title');
    title.style.cssText = 'font-size:1.1rem;margin-bottom:12px';
    title.textContent = 'Mapa de Estabilidade Dimensional (4 × 30)';
    section.appendChild(title);

    const mapWrap = _el('div', '');
    mapWrap.style.cssText = `
      background:rgba(10,12,20,0.5);border-radius:12px;padding:16px;overflow-x:auto;
    `;

    // Grid: rows = models, columns = D1-D30
    const grid = _el('div', '');
    grid.style.cssText = 'display:grid;grid-template-columns:120px repeat(30,1fr);gap:2px;min-width:700px';

    // Header row
    const cornerCell = _el('div', '');
    cornerCell.style.cssText = 'font-size:0.7rem;color:#718096;padding:4px';
    grid.appendChild(cornerCell);

    for (let d = 1; d <= TOTAL_DIMS; d++) {
      const hCell = _el('div', '');
      hCell.style.cssText = `font-size:0.6rem;color:#718096;text-align:center;padding:2px 0;
        ${d <= 10 ? 'border-bottom:2px solid #66BB6A30' : d <= 20 ? 'border-bottom:2px solid #FFA72630' : 'border-bottom:2px solid #2196F330'}`;
      hCell.textContent = `D${d}`;
      grid.appendChild(hCell);
    }

    // Data rows
    MODEL_KEYS.forEach(k => {
      const info = MODELS[k];
      const data = results[k];

      // Model label cell
      const labelCell = _el('div', '');
      labelCell.style.cssText = `
        display:flex;align-items:center;gap:4px;padding:4px 8px;font-size:0.78rem;font-weight:600;
        color:${info.color};white-space:nowrap;
      `;
      labelCell.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${info.color};display:inline-block"></span> ${info.label}`;
      grid.appendChild(labelCell);

      // Dimension cells
      for (let d = 0; d < TOTAL_DIMS; d++) {
        const cell = _el('div', '');
        const converged = data.dimConverged[d];
        cell.style.cssText = `
          width:100%;aspect-ratio:1;border-radius:3px;transition:transform 0.2s;cursor:default;
          background:${converged ? '#66BB6A' : '#EF5350'};
          opacity:${converged ? 0.85 : 0.65};
          min-width:14px;min-height:14px;
        `;
        cell.title = `${info.label} — D${d + 1}: ${converged ? 'Convergiu ✓' : 'Não convergiu ✗'}`;
        cell.addEventListener('mouseenter', () => { cell.style.transform = 'scale(1.4)'; cell.style.zIndex = '10'; });
        cell.addEventListener('mouseleave', () => { cell.style.transform = 'scale(1)'; cell.style.zIndex = ''; });
        grid.appendChild(cell);
      }
    });

    mapWrap.appendChild(grid);

    // Legend
    const legend = _el('div', '');
    legend.style.cssText = 'display:flex;gap:16px;margin-top:10px;font-size:0.75rem;color:#A0AEC0';
    legend.innerHTML = `
      <span><span style="display:inline-block;width:12px;height:12px;background:#66BB6A;border-radius:2px;vertical-align:middle;margin-right:4px"></span>Convergiu (r_rms &lt; limiar)</span>
      <span><span style="display:inline-block;width:12px;height:12px;background:#EF5350;border-radius:2px;vertical-align:middle;margin-right:4px"></span>Não convergiu</span>
      <span style="margin-left:auto;color:#718096">D1-D10: Fundamental · D11-D20: Intermediária · D21-D30: Elevada</span>
    `;
    mapWrap.appendChild(legend);

    section.appendChild(mapWrap);
    this._resultsContainer.appendChild(section);
  }

  /* ─── e) Invisible Code Bars ─── */
  _renderInvisibleCodeBars(results) {
    const section = _el('div', '');
    section.style.cssText = 'margin:24px 0';

    const title = _el('h3', 'section-title');
    title.style.cssText = 'font-size:1.1rem;margin-bottom:12px';
    title.textContent = 'Código Invisível — Produto ω·ε₋';
    section.appendChild(title);

    const barsWrap = _el('div', '');
    barsWrap.style.cssText = 'background:rgba(10,12,20,0.5);border-radius:12px;padding:20px';

    // Target marker description
    const desc = _el('div', '');
    desc.style.cssText = 'font-size:0.78rem;color:#718096;margin-bottom:16px';
    desc.innerHTML = 'O teorema prevê ω·ε₋ = <strong style="color:#66BB6A">−1.0</strong>. Barras mais próximas de −1.0 indicam maior satisfação do postulado.';
    barsWrap.appendChild(desc);

    // Find range for normalization
    const values = MODEL_KEYS.map(k => results[k].omegaEpsilonProduct);
    const minVal = Math.min(...values, -1.5);
    const maxVal = Math.max(...values, 0);
    const range = maxVal - minVal || 1;

    MODEL_KEYS.forEach(k => {
      const info = MODELS[k];
      const val = results[k].omegaEpsilonProduct;
      const deviation = Math.abs(val - (-1.0));

      const row = _el('div', '');
      row.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:12px';

      // Label
      const label = _el('div', '');
      label.style.cssText = `width:120px;font-size:0.82rem;font-weight:600;color:${info.color};white-space:nowrap`;
      label.textContent = `${info.icon} ${info.label}`;
      row.appendChild(label);

      // Bar container
      const barContainer = _el('div', '');
      barContainer.style.cssText = 'flex:1;position:relative;height:24px;background:rgba(255,255,255,0.04);border-radius:4px;overflow:visible';

      // Target line at -1.0
      const targetPos = (((-1.0) - minVal) / range) * 100;
      const targetLine = _el('div', '');
      targetLine.style.cssText = `
        position:absolute;left:${targetPos}%;top:-4px;bottom:-4px;width:2px;
        background:#66BB6A;z-index:2;
      `;
      barContainer.appendChild(targetLine);

      // Value bar
      const barPos = ((val - minVal) / range) * 100;
      const barWidth = Math.max(2, Math.abs(barPos - targetPos));
      const barLeft = Math.min(barPos, targetPos);
      const bar = _el('div', '');
      bar.style.cssText = `
        position:absolute;left:${barLeft}%;top:4px;bottom:4px;
        width:${barWidth}%;border-radius:3px;
        background:${info.color};opacity:0.7;
        transition:width 0.6s ease;
      `;
      barContainer.appendChild(bar);

      // Value dot
      const dot = _el('div', '');
      dot.style.cssText = `
        position:absolute;left:${barPos}%;top:50%;transform:translate(-50%,-50%);
        width:12px;height:12px;border-radius:50%;background:${info.color};
        border:2px solid #fff;z-index:3;box-shadow:0 0 8px ${info.color}80;
      `;
      barContainer.appendChild(dot);

      row.appendChild(barContainer);

      // Value text
      const valText = _el('div', '');
      valText.style.cssText = `width:90px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:0.82rem;
        color:${deviation < 0.1 ? '#66BB6A' : deviation < 0.3 ? '#FFA726' : '#EF5350'}`;
      valText.textContent = val.toFixed(4);
      row.appendChild(valText);

      barsWrap.appendChild(row);
    });

    // Target annotation
    const targetNote = _el('div', '');
    targetNote.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:12px;font-size:0.72rem;color:#66BB6A';
    targetNote.innerHTML = '<span style="display:inline-block;width:16px;height:2px;background:#66BB6A"></span> Meta: ω·ε₋ = −1.0';
    barsWrap.appendChild(targetNote);

    section.appendChild(barsWrap);
    this._resultsContainer.appendChild(section);
  }

  /* ─── f) Overall Winner Banner ─── */
  _renderWinnerBanner(rankings) {
    const winnerKey = rankings.overallWinner;
    const info = MODELS[winnerKey];

    const banner = _el('div', '');
    banner.style.cssText = `
      margin:32px 0 16px;padding:24px 32px;border-radius:16px;text-align:center;
      background:linear-gradient(145deg,${info.color}20,${info.color}08);
      border:2px solid ${info.color}60;position:relative;overflow:hidden;
      animation:benchmarkScaleIn 0.8s ease;
    `;

    // Background glow effects
    banner.innerHTML = `
      <div style="position:absolute;top:-40px;left:50%;transform:translateX(-50%);width:200px;height:200px;border-radius:50%;background:${info.color};opacity:0.06;filter:blur(60px)"></div>
      <div style="font-size:0.82rem;color:#A0AEC0;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px">
        🏆 Vencedor Geral do Benchmark
      </div>
      <div style="font-size:2.2rem;font-weight:800;color:${info.color};margin-bottom:8px;text-shadow:0 0 30px ${info.color}40">
        ${info.icon} ${info.label}
      </div>
      <div style="font-size:0.85rem;color:#718096">
        Score agregado: <strong style="color:#E2E8F0">${rankings.scores[winnerKey]}</strong> pontos
        (menor = melhor, baseado em ranking posicional em 4 categorias)
      </div>
      <div style="display:flex;justify-content:center;gap:24px;margin-top:16px;flex-wrap:wrap">
        ${Object.values(rankings.categories).map(cat => {
          const isWinner = cat.winner.key === winnerKey;
          return `<span style="font-size:0.78rem;color:${isWinner ? info.color : '#718096'};font-weight:${isWinner ? '700' : '400'}">
            ${cat.icon} ${cat.label}: ${cat.winner.info.label} ${isWinner ? '✓' : ''}
          </span>`;
        }).join('')}
      </div>
    `;

    this._resultsContainer.appendChild(banner);
  }
}

/* ─── Tiny DOM helpers (file-local) ─── */
function _el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function _btn(text, cls, handler) {
  const b = document.createElement('button');
  b.className = `sim-btn ${cls}`;
  b.textContent = text;
  b.addEventListener('click', handler);
  return b;
}
