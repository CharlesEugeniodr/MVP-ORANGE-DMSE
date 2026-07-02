/**
 * i18n.js — Orange-DMSE Internationalization Module
 */

const DICTIONARY = {
    pt: {
        // Nav & Sidebar
        'nav.simulation': 'Simulação',
        'nav.dimensions': '30 Dimensões',
        'nav.compare': 'Comparativo',
        'nav.benchmark': 'Benchmark',
        'nav.ingest': 'Ingestão de Dados',
        'nav.audit': 'Laudo & Auditoria',
        'nav.apophis': 'Protocolo Apophis',
        'nav.sandbox': 'Falsifiability Sandbox',
        'nav.theory': 'Fundamentação',
        'sidebar.subtitle': 'Validação Dimensional',
        'engine.idle': 'Motor Inativo',
        'engine.running': 'Simulando...',
        'engine.ready': 'Motor Pronto',
        'loading.init': 'Inicializando motor dimensional...',

        // General
        'general.run': 'Executar',
        'general.cancel': 'Cancelar',
        'general.close': 'Fechar',
        'general.error': 'Erro',
        'general.success': 'Sucesso',

        // Route Titles
        'route.dashboard.title': 'Simulação da Malha Octogonal',
        'route.dashboard.sub': 'Motor PDE 30D com integrador Verlet de 2ª ordem e controlador κ adaptativo',
        'route.dimensions.title': '30 Dimensões da Malha Octogonal',
        'route.dimensions.sub': 'Validação individual com falsificabilidade: convergência, saturação, falibilidade cruzada',
        'route.compare.title': 'Análise Comparativa de Modelos',
        'route.compare.sub': 'Newton · MOND · ΛCDM (NFW) · Orange-DMS contra dados observacionais SPARC',
        'route.benchmark.title': 'Benchmark Comparativo de Campo Escalar',
        'route.benchmark.sub': 'Klein-Gordon · φ⁴ Theory · Worldsheet String · Orange-DMSE — mesmo grid, mesmas condições',
        'route.ingest.title': 'Ingestão de Dados Externos',
        'route.ingest.sub': 'Importe dados observacionais em CSV/JSON para testagem comparativa com o modelo preditivo',
        'route.audit.title': 'Laudo Técnico & Auditoria Pública',
        'route.audit.sub': 'Motor fechado, auditoria aberta — certificação de conformidade com transparência total',
        'route.audit.sub': 'Motor fechado, auditoria aberta — certificação de conformidade com transparência total',
        'route.apophis.title': 'Protocolo Apophis 2029',
        'route.apophis.sub': 'Previsão de Falsificabilidade Empírica: Anomalia Orbital de +244 metros',
        'route.sandbox.title': 'Falsifiability Sandbox',
        'route.sandbox.sub': 'Teste de Estresse Adversarial: Injeção de Ruído Quântico vs Homeostase da Malha',
        'route.theory.title': 'Fundamentação Teórica',
        'route.theory.sub': 'Formalismo matemático-físico da Malha Dimensional Vetorial Esferoidal',

        // Dashboard
        'dash.control.panel': 'Painel de Controle — Orange-DMSE',
        'dash.steps': 'Passos:',
        'dash.btn.start': '🚀 Iniciar Simulação (1000 passos)',
        'dash.btn.reset': '🔄 Resetar Motor',
        'dash.metrics.title': 'Métricas em Tempo Real',
        'dash.metric.rrms': 'Resíduo Global (r_rms)',
        'dash.metric.kappa': 'Acoplamento (κ)',
        'dash.metric.energy': 'Energia Cinética',
        'dash.metric.tv': 'Tensão Vetorial (ε)',

        // Dimensions
        'dim.wait.title': '🔬 Validação Dimensional Aguardando Execução',
        'dim.wait.desc': 'Este módulo testa individualmente cada uma das 30 dimensões da malha octogonal com 6 critérios de falsificabilidade popperiana. Cada dimensão será classificada como:',
        'dim.btn.run': '🔬 Executar Validação Completa das 30 Dimensões',
        'dim.val.running': '⏳ Validando (1000 passos × 30 dimensões)...',
        'dim.val.error': '❌ Erro na validação',

        // Comparative
        'comp.title': 'Curvas de Rotação SPARC vs Modelos',
        'comp.desc': 'Selecione uma galáxia do catálogo SPARC para comparar as predições de Newton, MOND, Matéria Escura e Orange-DMS.',
        'comp.galaxy': 'Galáxia',
        'comp.btn.simulate': 'Comparar Modelos na Galáxia',
        
        // Benchmark
        'bench.btn.run': '🚀 Iniciar Benchmark',
        'bench.done': '✅ Benchmark concluído!',
        'bench.convergence': '📉 Convergência',
        'bench.stability': '🏗️ Estabilidade Dimensional',
        'bench.energy': '⚡ Conservação de Energia',
        'bench.coherence': '🔮 Coerência / Invisible Code',

        // Ingestion
        'ingest.btn.upload': 'Carregar Dataset (CSV/JSON)',
        
        // Theory
        'theory.postulate': '1. O Postulado Fundamental',
        'theory.geometry': '2. A Geometria da Laranja (Spheroidal Mesh)',
        'theory.pde': '3. A Dinâmica PDE do Sistema',
        'theory.kappa': '4. Controlador κ Adaptativo',
        'theory.hamiltonian': '5. Conservação Hamiltoniana',
        'theory.falsifiability': '6. Falsificabilidade e Rigor Científico',
        'theory.metrics': '7. Métricas Estatísticas de Validação',

        // Apophis
        'apophis.countdown': 'Contagem Regressiva para 13/04/2029',
        'apophis.prediction': 'A Anomalia de +244m',
        'apophis.newton': 'Padrão Newton/Einstein',
        'apophis.orange': 'Predição Orange-DMSE',
        'apophis.inject': 'Simular Aproximação Terrestre',

        // Sandbox
        'sandbox.btn.noise': '⚡ Injetar Anomalia Vetorial (Ruído Quântico)',
        'sandbox.btn.reset': '🔄 Resetar Sistema',
        'sandbox.chart.title': 'Homeostase vs Colapso',
        'sandbox.desc': 'Verifique se o modelo dissipa o ruído retornando ao equilíbrio (r_rms → 0) ou se acumula erro indefinidamente.',
    },
    en: {
        // Nav & Sidebar
        'nav.simulation': 'Simulation',
        'nav.dimensions': '30 Dimensions',
        'nav.compare': 'Comparative',
        'nav.benchmark': 'Benchmark',
        'nav.ingest': 'Data Ingestion',
        'nav.audit': 'Audit & Report',
        'nav.apophis': 'Apophis Protocol',
        'nav.sandbox': 'Falsifiability Sandbox',
        'nav.theory': 'Theory',
        'sidebar.subtitle': 'Dimensional Validation',
        'engine.idle': 'Engine Idle',
        'engine.running': 'Simulating...',
        'engine.ready': 'Engine Ready',
        'loading.init': 'Initializing dimensional engine...',

        // General
        'general.run': 'Run',
        'general.cancel': 'Cancel',
        'general.close': 'Close',
        'general.error': 'Error',
        'general.success': 'Success',

        // Route Titles
        'route.dashboard.title': 'Octagonal Mesh Simulation',
        'route.dashboard.sub': '30D PDE Engine with 2nd-order Verlet integrator and adaptive κ controller',
        'route.dimensions.title': '30 Dimensions of the Octagonal Mesh',
        'route.dimensions.sub': 'Individual validation with falsifiability: convergence, saturation, cross-fallibility',
        'route.compare.title': 'Comparative Model Analysis',
        'route.compare.sub': 'Newton · MOND · ΛCDM (NFW) · Orange-DMS against SPARC observational data',
        'route.benchmark.title': 'Scalar Field Comparative Benchmark',
        'route.benchmark.sub': 'Klein-Gordon · φ⁴ Theory · Worldsheet String · Orange-DMSE — same grid, same conditions',
        'route.ingest.title': 'External Data Ingestion',
        'route.ingest.sub': 'Import observational data in CSV/JSON for comparative testing with the predictive model',
        'route.audit.title': 'Technical Report & Public Audit',
        'route.audit.sub': 'Closed engine, open audit — compliance certification with full transparency',
        'route.audit.sub': 'Closed engine, open audit — compliance certification with full transparency',
        'route.apophis.title': 'Apophis Protocol 2029',
        'route.apophis.sub': 'Empirical Falsifiability Prediction: Orbital Anomaly of +244 meters',
        'route.sandbox.title': 'Falsifiability Sandbox',
        'route.sandbox.sub': 'Adversarial Stress Test: Quantum Noise Injection vs Mesh Homeostasis',
        'route.theory.title': 'Theoretical Foundation',
        'route.theory.sub': 'Mathematical-physical formalism of the Spheroidal Vector Dimensional Mesh',

        // Dashboard
        'dash.control.panel': 'Control Panel — Orange-DMSE',
        'dash.steps': 'Steps:',
        'dash.btn.start': '🚀 Start Simulation (1000 steps)',
        'dash.btn.reset': '🔄 Reset Engine',
        'dash.metrics.title': 'Real-time Metrics',
        'dash.metric.rrms': 'Global Residual (r_rms)',
        'dash.metric.kappa': 'Coupling (κ)',
        'dash.metric.energy': 'Kinetic Energy',
        'dash.metric.tv': 'Vector Tension (ε)',

        // Dimensions
        'dim.wait.title': '🔬 Dimensional Validation Awaiting Execution',
        'dim.wait.desc': 'This module individually tests each of the 30 dimensions of the octagonal mesh against 6 criteria of Popperian falsifiability. Each dimension will be classified as:',
        'dim.btn.run': '🔬 Run Full Validation on all 30 Dimensions',
        'dim.val.running': '⏳ Validating (1000 steps × 30 dimensions)...',
        'dim.val.error': '❌ Validation error',

        // Comparative
        'comp.title': 'Rotation Curves SPARC vs Models',
        'comp.desc': 'Select a galaxy from the SPARC catalog to compare predictions from Newton, MOND, Dark Matter and Orange-DMS.',
        'comp.galaxy': 'Galaxy',
        'comp.btn.simulate': 'Compare Models on Galaxy',
        
        // Benchmark
        'bench.btn.run': '🚀 Start Benchmark',
        'bench.done': '✅ Benchmark completed!',
        'bench.convergence': '📉 Convergence',
        'bench.stability': '🏗️ Dimensional Stability',
        'bench.energy': '⚡ Energy Conservation',
        'bench.coherence': '🔮 Coerência / Invisible Code',

        // Ingestion
        'ingest.btn.upload': 'Load Dataset (CSV/JSON)',
        
        // Theory
        'theory.postulate': '1. The Fundamental Postulate',
        'theory.geometry': '2. The Orange Geometry (Spheroidal Mesh)',
        'theory.pde': '3. The PDE Dynamics of the System',
        'theory.kappa': '4. Adaptive κ Controller',
        'theory.hamiltonian': '5. Hamiltonian Conservation',
        'theory.falsifiability': '6. Falsifiability and Scientific Rigor',
        'theory.metrics': '7. Statistical Validation Metrics',

        // Apophis
        'apophis.countdown': 'Countdown to April 13, 2029',
        'apophis.prediction': 'The +244m Anomaly',
        'apophis.newton': 'Newton/Einstein Standard',
        'apophis.orange': 'Orange-DMSE Prediction',
        'apophis.inject': 'Simulate Earth Approach',

        // Sandbox
        'sandbox.btn.noise': '⚡ Inject Vector Anomaly (Quantum Noise)',
        'sandbox.btn.reset': '🔄 Reset System',
        'sandbox.chart.title': 'Homeostasis vs Collapse',
        'sandbox.desc': 'Check if the model dissipates noise returning to equilibrium (r_rms → 0) or accumulates error indefinitely.',
    }
};

let currentLang = localStorage.getItem('orange_lang') || 'pt';

/**
 * Get translated string by key.
 * @param {string} key 
 * @returns {string} translated text
 */
export function t(key) {
    const dict = DICTIONARY[currentLang];
    if (dict && dict[key]) {
        return dict[key];
    }
    // Fallback to PT
    return DICTIONARY['pt'][key] || key;
}

/**
 * Set application language.
 * @param {string} lang ('pt' | 'en') 
 */
export function setLanguage(lang) {
    if (lang !== 'pt' && lang !== 'en') return;
    currentLang = lang;
    localStorage.setItem('orange_lang', lang);
    updateStaticTranslations();
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }));
}

export function getCurrentLanguage() {
    return currentLang;
}

/**
 * Updates DOM elements with data-i18n attributes automatically.
 */
export function updateStaticTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
}

// Initialize on load
window.t = t;
window.setLanguage = setLanguage;
window.getCurrentLanguage = getCurrentLanguage;

document.addEventListener('DOMContentLoaded', () => {
    updateStaticTranslations();
});
