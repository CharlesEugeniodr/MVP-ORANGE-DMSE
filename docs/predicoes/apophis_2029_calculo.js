/**
 * @fileoverview Predição Formal — Apophis 2029
 * 
 * Script de cálculo que gera os valores numéricos da predição
 * do modelo Orange-DMSE para a passagem do asteroide 99942 Apophis
 * em 13 de abril de 2029.
 * 
 * Este script é registrado em 25 de junho de 2026 — 3 anos antes do evento.
 * Os valores aqui computados constituem predição falsificável.
 * 
 * Autor: Charles de Paula Eugênio
 * Propriedade Intelectual: Sigma Sihf Soluções Analíticas S/A
 * CNPJ: 01.851.824/0001-38
 * 
 * Executar: abrir no console do browser ou importar como módulo
 */

// ══════════════════════════════════════════════════════════════
// PARÂMETROS FIXADOS (do motor Orange-DMSE, commit d531917)
// ══════════════════════════════════════════════════════════════

const PARAMS = Object.freeze({
  // Motor PDE
  E0: 1.0,
  kappa_converged: 12.7,       // κ médio após 1000 passos de simulação
  coupling_strength: 0.1,
  thermal_alpha: 0.05,
  n_channels: 30,

  // Modelo gravitacional Orange-DMS
  gamma: 1.5,                  // acoplamento DMS (calibrado para NGC 3198)
  Rs_km: 38000,                // raio de escala = perigeu de Apophis
  beta: 1.5,                   // expoente de queda radial

  // Campo médio pós-convergência
  E_mean: 0.98,                // |E|/E0 médio após convergência (≈ 1.0)
  
  // Apophis (dados NASA/JPL, Horizons System)
  perigee_km: 38000,           // distância mínima ao centro da Terra (km)
  perigee_alt_km: 31600,       // altitude mínima acima da superfície (km)
  v_approach_kms: 7.42,        // velocidade de aproximação (km/s)
  mass_kg: 6.1e10,             // massa estimada (kg)
  diameter_m: 370,             // diâmetro médio (m)
  epoch: '2029-04-13T21:46:00Z', // horário do perigeu (UTC)
});

// ══════════════════════════════════════════════════════════════
// CÁLCULO DA ACELERAÇÃO ADICIONAL DMS
// ══════════════════════════════════════════════════════════════

/**
 * Aceleração adicional prevista pelo modelo Orange-DMS:
 * 
 *   a_dms(R) = γ · E_mean · √κ · 10⁻¹⁰ / (1 + (R/Rs)^β)
 * 
 * No perigeu (R = Rs), o denominador é (1 + 1^1.5) = 2.
 */
function a_dms_at_perigee() {
  const { gamma, E_mean, kappa_converged, Rs_km, beta, perigee_km } = PARAMS;
  const kappaSqrt = Math.sqrt(kappa_converged);
  const denominator = 1.0 + Math.pow(perigee_km / Rs_km, beta);
  const a = (gamma * E_mean * kappaSqrt * 1e-10) / denominator;
  return a; // km/s²
}

/**
 * Aceleração em diferentes distâncias ao longo da trajetória.
 */
function a_dms_profile(R_km) {
  const { gamma, E_mean, kappa_converged, Rs_km, beta } = PARAMS;
  const kappaSqrt = Math.sqrt(kappa_converged);
  const denominator = 1.0 + Math.pow(R_km / Rs_km, beta);
  return (gamma * E_mean * kappaSqrt * 1e-10) / denominator;
}

// ══════════════════════════════════════════════════════════════
// PREDIÇÕES NUMÉRICAS
// ══════════════════════════════════════════════════════════════

const a_perigee = a_dms_at_perigee();

// Janela temporal: ±12 horas ao redor do perigeu
const WINDOW_HOURS = 12;
const WINDOW_SECONDS = WINDOW_HOURS * 3600;

// Desvio radial acumulado: δR ≈ ½ · a_dms · t²
const deltaR_perigee_km = 0.5 * a_perigee * WINDOW_SECONDS * WINDOW_SECONDS;
const deltaR_perigee_m = deltaR_perigee_km * 1000;

// Desvio angular visto da Terra
const angular_deviation_rad = deltaR_perigee_km / PARAMS.perigee_km;
const angular_deviation_arcsec = angular_deviation_rad * (180 / Math.PI) * 3600;

// Variação na velocidade: δv ≈ a_dms · t
const deltaV_kms = a_perigee * WINDOW_SECONDS;
const deltaV_ms = deltaV_kms * 1000;

// Perfil de aceleração em 5 pontos-chave
const R_points = [100000, 75000, 50000, 38000, 50000, 75000, 100000];
const t_points = [-12, -8, -4, 0, 4, 8, 12]; // horas
const profile = R_points.map((R, i) => ({
  t_hours: t_points[i],
  R_km: R,
  a_dms_kms2: a_dms_profile(R),
  a_dms_ms2: a_dms_profile(R) * 1000,
}));

// ══════════════════════════════════════════════════════════════
// RELATÓRIO
// ══════════════════════════════════════════════════════════════

const REPORT = {
  metadata: {
    titulo: 'Predição Formal — Passagem de Apophis 2029',
    modelo: 'Orange-DMSE (Malha Octagonal Vetorial Esferoidal)',
    autor: 'Charles de Paula Eugênio',
    propriedade: 'Sigma Sihf Soluções Analíticas S/A — CNPJ 01.851.824/0001-38',
    data_registro: '2026-06-25T16:44:00Z',
    data_evento: '2029-04-13T21:46:00Z',
    antecedencia_dias: Math.floor((new Date('2029-04-13') - new Date('2026-06-25')) / 86400000),
    commit_ref: 'registrado no commit imediatamente seguinte',
    repositorio: 'https://github.com/CharlesEugeniodr/MVP-ORANGE-DMSE',
  },

  parametros_fixados: PARAMS,

  predicoes: {
    aceleracao_adicional_perigeu: {
      valor: a_perigee,
      unidade: 'km/s²',
      valor_ms2: a_perigee * 1000,
      descricao: 'Aceleração adicional DMS no ponto de perigeu',
    },
    desvio_radial_12h: {
      valor_km: deltaR_perigee_km,
      valor_m: deltaR_perigee_m,
      descricao: 'Desvio radial acumulado em ±12h ao redor do perigeu',
    },
    desvio_angular: {
      valor_arcsec: angular_deviation_arcsec,
      descricao: 'Desvio angular visto da Terra no perigeu',
    },
    variacao_velocidade: {
      valor_kms: deltaV_kms,
      valor_ms: deltaV_ms,
      descricao: 'Variação acumulada na velocidade radial em 12h',
    },
    perfil_aceleracao: profile,
  },

  comparacao_GR: {
    nota: 'A Relatividade Geral não prevê esta aceleração adicional. ' +
          'A predição DMS constitui um RESÍDUO sobre a trajetória GR. ' +
          'Se o resíduo observado em 2029 for consistente com estes valores, ' +
          'constitui evidência a favor do modelo. Se for zero ou diferente, ' +
          'constitui refutação.',
  },

  criterio_validacao: {
    confirmado: 'Se |δR_observado - δR_previsto| < 50% de δR_previsto',
    refutado: 'Se |δR_observado| < 10% de δR_previsto ou sinal oposto',
    inconclusivo: 'Se incerteza experimental > δR_previsto',
  },
};

// Output
console.log('═══════════════════════════════════════════════════════');
console.log('  PREDIÇÃO FORMAL — APOPHIS 2029');
console.log('  Modelo Orange-DMSE (Malha Octagonal Vetorial)');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log(`  Registrado em: ${REPORT.metadata.data_registro}`);
console.log(`  Evento:        ${REPORT.metadata.data_evento}`);
console.log(`  Antecedência:  ${REPORT.metadata.antecedencia_dias} dias`);
console.log('');
console.log('  ── PREDIÇÕES ──');
console.log(`  a_dms (perigeu):     ${(a_perigee * 1000).toExponential(4)} m/s²`);
console.log(`  δR (±12h):           ${deltaR_perigee_m.toFixed(4)} m`);
console.log(`  δθ (angular):        ${angular_deviation_arcsec.toExponential(4)} arcsec`);
console.log(`  δv (12h):            ${(deltaV_ms).toExponential(4)} m/s`);
console.log('');
console.log('  ── PERFIL DE ACELERAÇÃO ──');
profile.forEach(p => {
  console.log(`  t=${p.t_hours.toString().padStart(3)}h  R=${(p.R_km/1000).toFixed(0).padStart(4)}×10³ km  a_dms=${p.a_dms_ms2.toExponential(4)} m/s²`);
});
console.log('');
console.log('═══════════════════════════════════════════════════════');

export { REPORT, PARAMS, a_dms_at_perigee, a_dms_profile };
