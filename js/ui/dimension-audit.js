/**
 * dimension-audit.js — DimensionAuditPanel
 * 30-dimension validation matrix with semaphore status indicators,
 * summary distribution chart, row drill-down, and export.
 *
 * @module ui/dimension-audit
 */

import { ChartManager } from './charts.js';

// Import ontological data from the book
let ONTOLOGY = [];
try {
  const mod = await import('../data/ontology-data.js');
  ONTOLOGY = mod.DIMENSIONS_ONTOLOGY || [];
} catch (_) {
  // Fallback: ontology data not yet available
}

/* ── Status definitions ── */
const STATUS = {
  PROVEN:        { emoji: '🟢', label: 'PROVEN',        color: '#66BB6A', cls: 'status-pass' },
  SATURATED:     { emoji: '🟡', label: 'SATURATED',     color: '#FFA726', cls: 'status-warning' },
  FALLIBLE:      { emoji: '🔴', label: 'FALLIBLE',      color: '#EF5350', cls: 'status-fail' },
  INDETERMINATE: { emoji: '⚪', label: 'INDETERMINATE', color: '#718096', cls: 'status-indeterminate' },
  ANOMALOUS:     { emoji: '🚫', label: 'ANOMALOUS',     color: '#E040FB', cls: 'status-anomalous' },
  STATIC:        { emoji: '⚫', label: 'STATIC',        color: '#455A64', cls: 'status-static' },
};

const COLUMNS = [
  'Convergence', 'Saturation', 'Stability',
  'Pair Impact', 'Sensitivity', 'Cross-Falsifiability'
];

export class DimensionAuditPanel {
  constructor(container) {
    this.root = container;
    this._expanded = null;
  }

  /* ─── Main render ─── */
  render(validationResults = {}) {
    this.root.innerHTML = '';
    this.root.classList.add('audit-root');

    const dims = validationResults.dimensions || this._generatePlaceholder();

    // ── Title
    const header = _el('div', 'audit-header');
    header.innerHTML = `
      <h2 class="section-title">${window.t('route.dimensions.title')}</h2>
      <p class="section-subtitle">${dims.length} ${window.getCurrentLanguage() === 'en' ? 'dimensions evaluated · 7 functional types · 3 operational bands' : 'dimensões avaliadas · 7 tipos funcionais · 3 faixas operacionais'}</p>
    `;
    this.root.appendChild(header);

    // ── Summary bar
    const counts = this._countStatuses(dims);
    const summaryRow = _el('div', 'audit-summary');
    for (const [key, st] of Object.entries(STATUS)) {
      const badge = _el('span', `audit-summary-badge ${st.cls}`);
      badge.innerHTML = `${st.emoji} ${st.label}: <strong>${counts[key] || 0}</strong>`;
      summaryRow.appendChild(badge);
    }
    this.root.appendChild(summaryRow);

    // ── Summary chart
    const chartDiv = _el('div', 'audit-chart'); chartDiv.style.height = '180px';
    this.root.appendChild(chartDiv);
    this._drawSummaryChart(chartDiv, counts);

    // ── Table
    const tableWrap = _el('div', 'audit-table-wrap');
    const table = _el('table', 'audit-table');

    // thead
    const thead = document.createElement('thead');
    const hRow  = document.createElement('tr');
    ['Dim', 'Nome', 'Tipo', ...COLUMNS, 'Overall'].forEach(c => {
      const th = document.createElement('th'); th.textContent = c; hRow.appendChild(th);
    });
    thead.appendChild(hRow);
    table.appendChild(thead);

    // tbody
    const tbody = document.createElement('tbody');
    dims.forEach((dim, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'audit-row';
      tr.dataset.dim = idx;

      // Dim #
      const onto = ONTOLOGY[idx] || {};
      const tdNum = document.createElement('td');
      tdNum.textContent = `D${idx + 1}`;
      tdNum.className = 'dim-num';
      tr.appendChild(tdNum);

      // Dimension name (from the book)
      const isEn = window.getCurrentLanguage ? window.getCurrentLanguage() === 'en' : false;
      const tdName = document.createElement('td');
      tdName.textContent = (isEn ? onto.nameEn : onto.name) || `Dimension ${idx + 1}`;
      tdName.className = 'dim-name';
      tdName.title = onto.description || '';
      tr.appendChild(tdName);

      // Dimension type (color-coded from the book's 7 types)
      const tdType = document.createElement('td');
      const bandIcon = idx < 10 ? '🟢' : (idx < 20 ? '🟡' : '🔵');
      const typeNameStr = (isEn && window.DIMENSION_TYPES && window.DIMENSION_TYPES[onto.type]) 
        ? window.DIMENSION_TYPES[onto.type].nameEn 
        : (onto.typeName || '—');
      tdType.innerHTML = `<span class="dim-type-badge" style="background:${onto.color || '#666'};color:#fff;padding:2px 8px;border-radius:4px;font-size:0.75rem">${bandIcon} ${typeNameStr}</span>`;
      tr.appendChild(tdType);

      // Criterion cells
      const overall = { PROVEN: 0, SATURATED: 0, FALLIBLE: 0, INDETERMINATE: 0, ANOMALOUS: 0, STATIC: 0 };
      COLUMNS.forEach(col => {
        const key = dim[col] || 'INDETERMINATE';
        overall[key]++;
        const td = document.createElement('td');
        const s = STATUS[key] || STATUS.INDETERMINATE;
        td.innerHTML = `<span class="status-badge ${s.cls}">${s.emoji} ${s.label}</span>`;
        tr.appendChild(td);
      });

      // Overall
      const overallStatus = this._deriveOverall(overall);
      const os = STATUS[overallStatus];
      const tdO = document.createElement('td');
      tdO.innerHTML = `<span class="status-badge ${os.cls}">${os.emoji} ${os.label}</span>`;
      tr.appendChild(tdO);

      // Click to expand
      tr.addEventListener('click', () => this._toggleDetail(idx, dim, tr));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    this.root.appendChild(tableWrap);

    // ── Export buttons
    const exportRow = _el('div', 'audit-export-row');
    exportRow.appendChild(_btn('⬇ Export JSON', 'sim-btn btn-start', () => this._exportJSON(dims)));
    exportRow.appendChild(_btn('⬇ Export CSV',  'sim-btn btn-pause', () => this._exportCSV(dims)));
    this.root.appendChild(exportRow);
  }

  /* ─── Detail drill-down ─── */
  _toggleDetail(idx, dim, tr) {
    // Remove existing detail row
    const existing = this.root.querySelector('.audit-detail-row');
    if (existing) existing.remove();
    if (this._expanded === idx) { this._expanded = null; return; }
    this._expanded = idx;

    const detailTr = document.createElement('tr');
    detailTr.className = 'audit-detail-row';
    const td = document.createElement('td');
    td.colSpan = COLUMNS.length + 4;
    const onto = ONTOLOGY[idx] || {};
    const isEn = window.getCurrentLanguage ? window.getCurrentLanguage() === 'en' : false;
    const nameStr = isEn ? onto.nameEn : onto.name;
    const appStr = isEn ? 'Application' : 'Aplicação';
    td.innerHTML = `
      <div class="audit-detail-card hud-card">
        <h4>${onto.icon || '🔷'} ${isEn ? 'Dimension' : 'Dimensão'} ${idx + 1} — ${nameStr || 'Análise Detalhada'}</h4>
        ${onto.description ? `<p style="color:var(--text-secondary);margin:4px 0 8px;font-style:italic">${onto.description}</p>` : ''}
        ${onto.application ? `<p style="color:var(--text-secondary);margin:0 0 12px"><strong>${appStr}:</strong> ${onto.application}</p>` : ''}
        <ul style="list-style:none;padding:0;margin:8px 0">
          ${COLUMNS.map(col => {
            const key = dim[col] || 'INDETERMINATE';
            const s = STATUS[key];
            const reason = dim[`${col}_reason`] || 'No detailed reason recorded.';
            return `<li style="margin:6px 0"><span class="status-badge ${s.cls}">${s.emoji} ${col}</span> — ${reason}</li>`;
          }).join('')}
        </ul>
      </div>
    `;
    detailTr.appendChild(td);
    tr.after(detailTr);
    this.root.dispatchEvent(new CustomEvent('dimension-inspected', { bubbles: true, detail: { dimension: idx } }));
  }

  /* ─── Summary chart ─── */
  _drawSummaryChart(div, counts) {
    const labels = Object.keys(STATUS);
    const values = labels.map(k => counts[k] || 0);
    const colors = labels.map(k => STATUS[k].color);
    ChartManager.createBarChart(div, [{
      x: labels, y: values, marker: { color: colors }
    }], {
      title: { text: 'Status Distribution', font: { family: 'Space Grotesk, sans-serif', size: 13, color: '#E2E8F0' } },
      margin: { t: 32, b: 30, l: 36, r: 12 },
      yaxis: { title: 'Count', dtick: 5 }
    });
  }

  /* ─── Helpers ─── */
  _countStatuses(dims) {
    const c = {};
    dims.forEach(dim => {
      COLUMNS.forEach(col => {
        const k = dim[col] || 'INDETERMINATE';
        c[k] = (c[k] || 0) + 1;
      });
    });
    return c;
  }

  _deriveOverall(counts) {
    if (counts.ANOMALOUS > 0) return 'ANOMALOUS';
    if (counts.STATIC > 0 && (counts.PROVEN || 0) === 0) return 'STATIC';
    if (counts.FALLIBLE > 0) return 'FALLIBLE';
    if (counts.INDETERMINATE >= 3) return 'INDETERMINATE';
    if (counts.SATURATED >= 2) return 'SATURATED';
    return 'PROVEN';
  }

  _generatePlaceholder() {
    const pick = () => ['PROVEN','PROVEN','PROVEN','SATURATED','FALLIBLE','INDETERMINATE'][Math.floor(Math.random()*6)];
    return Array.from({ length: 30 }, () => {
      const d = {};
      COLUMNS.forEach(c => { d[c] = pick(); d[`${c}_reason`] = 'Placeholder — awaiting engine results.'; });
      return d;
    });
  }

  _exportJSON(dims) {
    const blob = new Blob([JSON.stringify(dims, null, 2)], { type: 'application/json' });
    _download(blob, 'dimension-audit.json');
  }

  _exportCSV(dims) {
    const header = ['Dim', ...COLUMNS].join(',');
    const rows = dims.map((d, i) => [i + 1, ...COLUMNS.map(c => d[c] || 'INDETERMINATE')].join(','));
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    _download(blob, 'dimension-audit.csv');
  }
}

/* ─── Utilities ─── */
function _el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
function _btn(text, cls, handler) {
  const b = document.createElement('button'); b.className = cls; b.textContent = text;
  b.addEventListener('click', handler); return b;
}
function _download(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Named export via class declaration above
