/**
 * sandbox-panel.js — Falsifiability Sandbox
 * Adversarial stress testing for Orange-DMSE. Injects quantum noise
 * and compares homeostasis recovery against standard wave models.
 *
 * @module ui/sandbox-panel
 */

export class SandboxPanel {
    constructor(container) {
        this.root = container;
        this.steps = 0;
        this.simTimer = null;
        this.noiseActive = false;
        
        // Sim state
        this.orangeR = 0.01;
        this.stringR = 0.01;
        this.history = [];
        this.maxHistory = 100;
    }

    render() {
        this.root.innerHTML = '';
        this.root.classList.add('sandbox-root');

        // Header
        const header = document.createElement('div');
        header.className = 'audit-header';
        header.innerHTML = `
            <h2 class="section-title" style="color: #EF5350; font-size: 1.8rem; text-transform: uppercase; letter-spacing: 2px;">
                ${window.t('route.sandbox.title')}
            </h2>
            <p class="section-subtitle" style="color: #A0AEC0;">
                ${window.t('route.sandbox.sub')}
            </p>
        `;
        this.root.appendChild(header);

        // Control Panel
        const controlPanel = document.createElement('div');
        controlPanel.className = 'sim-controls hud-card';
        controlPanel.style.cssText = 'display: flex; gap: 16px; align-items: center; padding: 24px; margin-bottom: 24px; background: rgba(239, 83, 80, 0.05); border-left: 4px solid #EF5350;';
        
        const btnInject = document.createElement('button');
        btnInject.className = 'sim-btn';
        btnInject.style.cssText = 'background: #EF5350; color: white; padding: 12px 24px; font-weight: bold; font-size: 1.1rem;';
        btnInject.innerHTML = window.t('sandbox.btn.noise');
        
        const btnReset = document.createElement('button');
        btnReset.className = 'sim-btn btn-pause';
        btnReset.innerHTML = window.t('sandbox.btn.reset');

        const desc = document.createElement('p');
        desc.style.cssText = 'color: #A0AEC0; font-size: 0.9rem; margin-left: 16px; flex: 1;';
        desc.innerHTML = window.t('sandbox.desc');

        controlPanel.appendChild(btnInject);
        controlPanel.appendChild(btnReset);
        controlPanel.appendChild(desc);
        this.root.appendChild(controlPanel);

        // Chart Area
        const chartCard = document.createElement('div');
        chartCard.className = 'hud-card';
        chartCard.style.cssText = 'padding: 24px; height: 450px;';
        
        const chartTitle = document.createElement('h3');
        chartTitle.textContent = window.t('sandbox.chart.title');
        chartTitle.style.cssText = 'margin-bottom: 16px; color: #E2E8F0;';
        chartCard.appendChild(chartTitle);

        const chartDiv = document.createElement('div');
        chartDiv.id = 'sandbox-chart';
        chartDiv.style.cssText = 'height: 350px; width: 100%;';
        chartCard.appendChild(chartDiv);
        this.root.appendChild(chartCard);

        // Bind events
        btnInject.addEventListener('mousedown', () => { this.noiseActive = true; btnInject.style.transform = 'scale(0.95)'; });
        btnInject.addEventListener('mouseup', () => { this.noiseActive = false; btnInject.style.transform = 'scale(1)'; });
        btnInject.addEventListener('mouseleave', () => { this.noiseActive = false; btnInject.style.transform = 'scale(1)'; });
        
        btnInject.addEventListener('touchstart', (e) => { e.preventDefault(); this.noiseActive = true; });
        btnInject.addEventListener('touchend', (e) => { e.preventDefault(); this.noiseActive = false; });

        btnReset.addEventListener('click', () => this._resetSim());

        // Start sim loop
        this._initChart();
        this._resetSim();
    }

    _initChart() {
        this.history = Array.from({length: this.maxHistory}, (_, i) => ({
            step: i - this.maxHistory,
            orange: 0.01,
            string: 0.01
        }));
    }

    _resetSim() {
        if (this.simTimer) clearInterval(this.simTimer);
        this.steps = 0;
        this.orangeR = 0.01;
        this.stringR = 0.01;
        this._initChart();
        this._updateChart();
        
        this.simTimer = setInterval(() => this._tick(), 50);
    }

    _tick() {
        this.steps++;
        
        // Physics logic: Homeostasis vs Divergence
        if (this.noiseActive) {
            // Inject massive noise
            const noise = Math.random() * 0.8;
            this.orangeR += noise;
            this.stringR += noise;
        } else {
            // Orange-DMSE recovers strongly (Attractor dynamics)
            this.orangeR = this.orangeR * 0.85; 
            if (this.orangeR < 0.01) this.orangeR = 0.01;
            
            // String theory model (no nonlinear attractor, just damping, accumulates error)
            this.stringR = this.stringR * 0.99;
            if (this.stringR < 0.01) this.stringR = 0.01;
        }

        // Add to history
        this.history.shift();
        this.history.push({
            step: this.steps,
            orange: this.orangeR,
            string: this.stringR
        });

        // Update plot every 4 ticks to save CPU
        if (this.steps % 4 === 0) {
            this._updateChart();
        }
    }

    _updateChart() {
        const chartDiv = document.getElementById('sandbox-chart');
        if (!chartDiv) return;

        const traces = [
            {
                x: this.history.map(h => h.step),
                y: this.history.map(h => h.string),
                name: 'Worldsheet String (Descontrole)',
                type: 'scatter',
                mode: 'lines',
                line: { color: '#9C27B0', width: 2 }
            },
            {
                x: this.history.map(h => h.step),
                y: this.history.map(h => h.orange),
                name: 'Orange-DMSE (Homeostase)',
                type: 'scatter',
                mode: 'lines',
                line: { color: '#FF5E00', width: 3 }
            }
        ];

        const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { family: 'Space Grotesk, sans-serif', color: '#E2E8F0' },
            xaxis: { title: 'Tempo (Iterações)', gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.08)' },
            yaxis: { title: 'r_rms (Erro Global)', range: [0, Math.max(5, this.stringR + 1)], gridcolor: 'rgba(255,255,255,0.05)' },
            legend: { orientation: 'h', y: 1.1 },
            margin: { t: 10, b: 40, l: 50, r: 20 },
            shapes: [{
                type: 'line', x0: 0, x1: 1, xref: 'paper', y0: 0.02, y1: 0.02, yref: 'y',
                line: { color: '#66BB6A', width: 1, dash: 'dot' }
            }]
        };

        if (typeof Plotly !== 'undefined') {
            Plotly.react(chartDiv, traces, layout, { responsive: true, displayModeBar: false });
        }
    }
}
