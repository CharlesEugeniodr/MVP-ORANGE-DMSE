/**
 * apophis-panel.js — Apophis Protocol Panel
 * Displays the countdown to 2029 and the theoretical prediction of +244m anomaly.
 *
 * @module ui/apophis-panel
 */

export class ApophisPanel {
    constructor(container) {
        this.root = container;
        this.targetDate = new Date('2029-04-13T21:46:00Z').getTime(); // Approx closest approach
        this.timer = null;
    }

    render() {
        this.root.innerHTML = '';
        this.root.classList.add('apophis-root');

        // Header
        const header = document.createElement('div');
        header.className = 'audit-header';
        header.innerHTML = `
            <h2 class="section-title" style="color: #FF5E00; font-size: 1.8rem; text-transform: uppercase; letter-spacing: 2px;">
                ${window.t('route.apophis.title')}
            </h2>
            <p class="section-subtitle" style="color: #A0AEC0;">
                ${window.t('route.apophis.sub')}
            </p>
        `;
        this.root.appendChild(header);

        // Grid Layout
        const grid = document.createElement('div');
        grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px;';
        
        // Left Column: Countdown & Prediction
        const leftCol = document.createElement('div');
        
        // Countdown Card
        const countdownCard = document.createElement('div');
        countdownCard.className = 'hud-card';
        countdownCard.style.cssText = 'background: rgba(10,12,20,0.8); border: 1px solid rgba(255,94,0,0.3); text-align: center; padding: 32px; border-radius: 12px; margin-bottom: 24px;';
        
        const countdownTitle = document.createElement('h3');
        countdownTitle.textContent = window.t('apophis.countdown');
        countdownTitle.style.cssText = 'color: #A0AEC0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;';
        
        this.countdownTimer = document.createElement('div');
        this.countdownTimer.style.cssText = 'font-family: "JetBrains Mono", monospace; font-size: 2.5rem; font-weight: 700; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.2);';
        
        countdownCard.appendChild(countdownTitle);
        countdownCard.appendChild(this.countdownTimer);
        leftCol.appendChild(countdownCard);

        // Prediction Card
        const predCard = document.createElement('div');
        predCard.className = 'hud-card';
        predCard.style.cssText = 'padding: 24px;';
        predCard.innerHTML = `
            <h3 style="color: #66BB6A; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                <span>🎯</span> ${window.t('apophis.prediction')}
            </h3>
            <p style="color: #E2E8F0; line-height: 1.6; margin-bottom: 16px;">
                A predição teórica da Malha Octogonal estabelece um desvio gravitacional exato de <strong>+244 metros</strong> em relação aos modelos clássicos de Newton e Einstein.
            </p>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="background: rgba(255,255,255,0.05); padding: 12px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #A0AEC0;">${window.t('apophis.newton')}</span>
                    <span style="font-family: monospace; color: #EF5350;">0.00m (Base)</span>
                </div>
                <div style="background: rgba(255,94,0,0.1); border: 1px solid rgba(255,94,0,0.3); padding: 12px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #FF5E00; font-weight: 600;">${window.t('apophis.orange')}</span>
                    <span style="font-family: monospace; color: #66BB6A; font-weight: 700; font-size: 1.1rem;">+244.00m</span>
                </div>
            </div>
        `;
        leftCol.appendChild(predCard);
        
        // Right Column: Visualization
        const rightCol = document.createElement('div');
        rightCol.className = 'hud-card';
        rightCol.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; position: relative; overflow: hidden;';
        
        const vizTitle = document.createElement('h4');
        vizTitle.textContent = 'Trajetória de Aproximação (Simulação Escalar)';
        vizTitle.style.cssText = 'position: absolute; top: 16px; left: 16px; color: #A0AEC0; font-size: 0.9rem;';
        rightCol.appendChild(vizTitle);

        // Simple SVG visualization of earth and asteroid
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", "0 0 400 400");
        
        svg.innerHTML = `
            <!-- Earth -->
            <circle cx="200" cy="200" r="40" fill="#1E88E5" opacity="0.8" />
            <circle cx="200" cy="200" r="45" fill="none" stroke="#1E88E5" stroke-width="1" opacity="0.4" />
            <text x="200" y="200" fill="white" font-size="10" text-anchor="middle" dominant-baseline="middle">Terra</text>
            
            <!-- Newton Trajectory -->
            <path d="M 50 350 Q 150 150 350 50" fill="none" stroke="#A0AEC0" stroke-width="2" stroke-dasharray="4,4" />
            <text x="320" y="40" fill="#A0AEC0" font-size="10">Newton (Clássico)</text>

            <!-- Orange-DMSE Trajectory -->
            <path d="M 50 350 Q 140 140 360 40" fill="none" stroke="#FF5E00" stroke-width="3" />
            <text x="360" y="25" fill="#FF5E00" font-size="10" font-weight="bold">Orange-DMSE (+244m)</text>
            
            <!-- Deviation Indicator -->
            <line x1="330" y1="65" x2="340" y2="55" stroke="#66BB6A" stroke-width="2" />
            <circle cx="340" cy="55" r="3" fill="#66BB6A" />
            
            <!-- Asteroid -->
            <circle id="asteroid" cx="150" cy="230" r="6" fill="#718096" />
        `;
        rightCol.appendChild(svg);

        // Inject animation style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes flyby {
                0% { cx: 50; cy: 350; }
                50% { cx: 145; cy: 145; }
                100% { cx: 360; cy: 40; }
            }
            #asteroid {
                animation: flyby 4s infinite ease-in-out;
            }
            @media (max-width: 768px) {
                .apophis-root > div:nth-child(2) {
                    grid-template-columns: 1fr !important;
                }
            }
        `;
        this.root.appendChild(style);

        grid.appendChild(leftCol);
        grid.appendChild(rightCol);
        this.root.appendChild(grid);

        this._startCountdown();
    }

    _startCountdown() {
        if (this.timer) clearInterval(this.timer);
        
        const update = () => {
            if (!this.countdownTimer) return;
            const now = new Date().getTime();
            const distance = this.targetDate - now;

            if (distance < 0) {
                this.countdownTimer.textContent = "ALCANÇADO!";
                clearInterval(this.timer);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            this.countdownTimer.textContent = 
                \`\${days}d \${hours.toString().padStart(2, '0')}h \${minutes.toString().padStart(2, '0')}m \${seconds.toString().padStart(2, '0')}s\`;
        };

        update();
        this.timer = setInterval(update, 1000);
    }
}
