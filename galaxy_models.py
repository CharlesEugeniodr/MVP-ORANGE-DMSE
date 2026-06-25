# galaxy_models.py — Módulo de Astrofísica e Ajuste de Curvas SPARC
# Contém dados reais aproximados e funções para Newton, MOND e Orange - DMS

import numpy as np

# Aceleração crítica de MOND (m/s^2)
A0_MOND = 1.2e-10  

# Conversões de Unidades
KPC_TO_M = 3.085677581e19
KM_S_TO_M_S = 1000.0

# ---------------------------------------------------------
# Dados reais das Galáxias de Referência da Base SPARC
# ---------------------------------------------------------
GALAXY_DATA = {
    "NGC 3198": {
        # R (kpc), Vobs (km/s), errVobs (km/s), Vdisk (km/s), Vbulge (km/s), Vgas (km/s)
        "R": np.array([1.36, 2.72, 4.08, 5.44, 6.80, 9.52, 12.24, 14.96, 17.68, 20.40, 24.48, 28.56, 32.64]),
        "Vobs": np.array([55.0, 92.0, 110.0, 122.0, 135.0, 148.0, 150.0, 149.0, 147.0, 148.0, 149.0, 150.0, 148.0]),
        "Vobs_err": np.array([4.0, 5.0, 5.0, 4.0, 4.0, 3.0, 3.0, 3.0, 4.0, 4.0, 5.0, 5.0, 6.0]),
        "Vdisk": np.array([40.0, 75.0, 90.0, 95.0, 92.0, 85.0, 78.0, 70.0, 64.0, 58.0, 50.0, 44.0, 38.0]),
        "Vbulge": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]), # NGC 3198 sem bojo significativo
        "Vgas": np.array([15.0, 22.0, 28.0, 31.0, 33.0, 35.0, 36.0, 37.0, 36.0, 35.0, 34.0, 32.0, 30.0]),
        "description": "Galáxia espiral barrada clássica, caso de teste padrão para matéria escura."
    },
    "NGC 2403": {
        "R": np.array([0.47, 0.93, 1.86, 2.79, 3.72, 4.65, 5.58, 7.44, 9.30, 11.16, 13.95, 16.74, 19.53]),
        "Vobs": np.array([28.0, 45.0, 70.0, 85.0, 98.0, 105.0, 112.0, 122.0, 128.0, 131.0, 133.0, 134.0, 133.0]),
        "Vobs_err": np.array([3.0, 3.0, 4.0, 4.0, 3.0, 3.0, 2.5, 2.5, 3.0, 3.0, 4.0, 4.0, 5.0]),
        "Vdisk": np.array([20.0, 35.0, 58.0, 70.0, 74.0, 73.0, 70.0, 62.0, 55.0, 48.0, 40.0, 33.0, 28.0]),
        "Vbulge": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "Vgas": np.array([10.0, 15.0, 22.0, 26.0, 28.0, 29.0, 30.0, 31.0, 31.0, 30.0, 29.0, 28.0, 26.0]),
        "description": "Galáxia espiral tardia muito próxima, com dados de rotação de alta resolução."
    },
    "UGC 128": {
        "R": np.array([2.40, 4.80, 7.20, 9.60, 12.00, 14.40, 16.80, 19.20, 21.60, 24.00, 28.80, 33.60]),
        "Vobs": np.array([32.0, 50.0, 68.0, 82.0, 95.0, 108.0, 118.0, 124.0, 128.0, 131.0, 132.0, 131.0]),
        "Vobs_err": np.array([4.0, 4.0, 3.5, 3.0, 3.0, 2.5, 2.5, 3.0, 3.0, 4.0, 5.0, 6.0]),
        "Vdisk": np.array([12.0, 25.0, 38.0, 45.0, 48.0, 49.0, 48.0, 46.0, 43.0, 40.0, 34.0, 28.0]),
        "Vbulge": np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
        "Vgas": np.array([8.0, 16.0, 24.0, 29.0, 32.0, 34.0, 35.0, 36.0, 36.0, 35.0, 33.0, 31.0]),
        "description": "Galáxia de Baixo Brilho Superficial (LSB). Crítica pois o desvio Newtoniano ocorre logo no início."
    }
}

# ---------------------------------------------------------
# Fórmulas de Modelagem de Curva de Rotação
# ---------------------------------------------------------

def velocity_newtonian(disk: np.ndarray, bulge: np.ndarray, gas: np.ndarray) -> np.ndarray:
    """Velocidade newtoniana pura baseada nos componentes bariônicos."""
    return np.sqrt(disk**2 + bulge**2 + gas**2)

def velocity_mond(v_bar: np.ndarray, R_kpc: np.ndarray) -> np.ndarray:
    """
    Velocidade usando MOND com função de interpolação simples mu(x) = x / (1 + x).
    g_mond = g_newt / mu(g_mond / a0) => g_mond^2 - g_newt * g_mond - g_newt * a0 = 0
    """
    R_m = R_kpc * KPC_TO_M
    v_bar_m = v_bar * KM_S_TO_M_S
    
    # g_newt = v_bar^2 / R
    g_newt = (v_bar_m**2) / R_m
    
    # Resolve a equação quadrática para g_mond
    g_mond = 0.5 * g_newt + np.sqrt(0.25 * g_newt**2 + g_newt * A0_MOND)
    
    # v_mond = sqrt(R * g_mond)
    v_mond_m = np.sqrt(R_m * g_mond)
    return v_mond_m / KM_S_TO_M_S


def velocity_orange_dms(v_bar: np.ndarray, R_kpc: np.ndarray, 
                        gamma: float, R_s: float, beta: float,
                        E_mean: float = 1.0, kappa: float = 1.0) -> np.ndarray:
    """
    Velocidade do modelo Orange - DMS.
    Aceleração gravitacional adicional a_add provém do gradiente da malha dimensional:
    a_add = gamma * (E_mean * kappa) * (1 / (1 + (R/R_s)^beta))
    v_dms = sqrt( v_bar^2 + R * a_add )
    """
    R_m = R_kpc * KPC_TO_M
    v_bar_m = v_bar * KM_S_TO_M_S
    
    # Aceleração barionica Newtoniana
    g_newt = (v_bar_m**2) / R_m
    
    # Aceleração adicional da malha vetorial esferoidal
    # Escala de aceleração física básica no vácuo de ~10^-10 m/s^2
    # Acoplamos com E_mean e kappa da simulação para interatividade
    a_base = 1e-10 * gamma * E_mean * np.sqrt(max(kappa, 1e-6))
    
    # Fator de decaimento radial da energia de gradiente da malha
    factor = 1.0 / (1.0 + (R_kpc / R_s)**beta)
    g_add = a_base * factor
    
    g_total = g_newt + g_add
    v_dms_m = np.sqrt(R_m * g_total)
    return v_dms_m / KM_S_TO_M_S

# ---------------------------------------------------------
# Métricas Estatísticas
# ---------------------------------------------------------

def compute_chi2(v_obs: np.ndarray, v_err: np.ndarray, v_model: np.ndarray, n_params: int) -> tuple[float, float]:
    """Calcula o chi2 total e o chi2 reduzido (chi2/dof)."""
    chi2 = np.sum(((v_obs - v_model) / v_err) ** 2)
    dof = len(v_obs) - n_params
    chi2_red = chi2 / max(dof, 1)
    return float(chi2), float(chi2_red)

# ---------------------------------------------------------
# Bateria de Testes de Sanidade Científica (Sanity Checks)
# ---------------------------------------------------------

def check_energy_conservation(metrics_history: list) -> dict:
    """
    Verifica se a soma das energias cinética e de gradiente decai ou permanece estável.
    Retorna parecer de aprovação ou reprovação sob critério termodinâmico.
    """
    if len(metrics_history) < 20:
        return {
            "status": "INSUFFICIENT_DATA",
            "msg": "Execute a simulação na Aba 1 por pelo menos 50 passos para coletar histórico de energias."
        }
    
    # Coleta a soma de energia (cinética + gradiente)
    e_total = np.array([m.energy_kin + m.energy_grad for m in metrics_history])
    
    # Compara a energia nos últimos 20% da simulação em relação ao início
    idx_early = int(len(e_total) * 0.2)
    e_initial = np.mean(e_total[:idx_early])
    e_final = np.mean(e_total[-idx_early:])
    
    delta = (e_final - e_initial) / max(e_initial, 1e-18)
    
    # Se houver crescimento energético descontrolado (> 10%), reprova
    if delta > 0.1:
        return {
            "status": "FAIL",
            "msg": f"Instabilidade termodinâmica! Energia cresceu {delta*100:.2f}% (esperado decaimento ou estabilidade).",
            "metric": f"{delta*100:+.2f}%"
        }
    elif delta > 0.0:
        return {
            "status": "WARNING",
            "msg": f"Estabilidade limítrofe: flutuação de energia positiva de {delta*100:.2f}%.",
            "metric": f"{delta*100:+.2f}%"
        }
    else:
        return {
            "status": "PASS",
            "msg": f"Conservação mantida: decaimento de energia dissipada de {delta*100:.2f}%.",
            "metric": f"{delta*100:+.2f}%"
        }

def check_parameter_universality(gamma_values: list) -> dict:
    """
    Verifica se o parâmetro de acoplamento da malha (gamma) é consistente
    entre diferentes galáxias. Se a variabilidade for muito grande, o modelo é reprovado.
    """
    if len(gamma_values) < 3:
        return {
            "status": "FAIL",
            "msg": "Amostra insuficiente. Salve os parâmetros de ajuste para as 3 galáxias de teste.",
            "metric": "N/A"
        }
        
    g_arr = np.array(gamma_values, dtype=float)
    g_mean = np.mean(g_arr)
    g_std = np.std(g_arr)
    
    var_coef = (g_std / g_mean) if g_mean > 0 else 0
    
    if var_coef > 0.60:
        return {
            "status": "FAIL",
            "msg": f"Inconsistência de Universalidade: Coeficiente de variação de γ é de {var_coef*100:.2f}% (> 60%). Os acoplamentos são muito discrepantes.",
            "metric": f"{var_coef*100:.1f}%"
        }
    elif var_coef > 0.20:
        return {
            "status": "WARNING",
            "msg": f"Ressalva de Universalidade: Variação moderada no parâmetro γ entre galáxias ({var_coef*100:.2f}%). Indica sensibilidade a fatores locais.",
            "metric": f"{var_coef*100:.1f}%"
        }
    else:
        return {
            "status": "PASS",
            "msg": f"Aprovado: Parâmetro γ de acoplamento intergaláctico consistente com desvio de {var_coef*100:.2f}% (< 20%).",
            "metric": f"{var_coef*100:.1f}%"
        }

# ---------------------------------------------------------
# Projeções sobre Eventos Físicos Reais
# ---------------------------------------------------------

def simulate_flyby_anomaly(times_sec: np.ndarray) -> np.ndarray:
    """
    Simula o desvio de aceleração residual em mm/s^2 durante o sobrevoo rasante
    (flyby) de uma sonda espacial pela Terra, causado pelo gradiente da malha local.
    """
    # Perigee ocorre no t = 0
    # Gera uma curva Lorentziana / Gaussiana típica da anomalia de perigeu
    profile = 4.0 / (1.0 + (times_sec / 120.0)**2)  # amplitude ~4 mm/s^2 no perigeu
    # Adiciona ruído de medição simulado
    rng = np.random.default_rng(123)
    noise = rng.normal(0.0, 0.15, size=len(times_sec))
    return profile + noise

def simulate_apophis_deflection(days: np.ndarray) -> np.ndarray:
    """
    Projeta o desvio cumulativo orbital (delta R em metros) do asteroide Apophis 
    durante sua aproximação de 2029 (20 dias antes e depois do perigeu em t=0), 
    induzido pela perturbação gravitacional da malha vetorial esferoidal terrestre.
    """
    # O desvio acumula conforme o asteroide penetra a malha interna do planeta
    # Deflexão cumulativa orbital proporcional ao inverso da distância
    # t=0 representa perigeu de 13 de Abril de 2029
    profile = 250.0 / (1.0 + np.exp(-days / 3.0)) # desvio cumulativo que flatlina após perigeu
    return profile


# Exemplo rápido para autoteste
if __name__ == "__main__":
    print("Testando galaxy_models.py...")
    ngc = GALAXY_DATA["NGC 3198"]
    v_bar = velocity_newtonian(ngc["Vdisk"], ngc["Vbulge"], ngc["Vgas"])
    v_m = velocity_mond(v_bar, ngc["R"])
    v_d = velocity_orange_dms(v_bar, ngc["R"], gamma=1.5, R_s=8.0, beta=1.0)
    
    c_n, c_nr = compute_chi2(ngc["Vobs"], ngc["Vobs_err"], v_bar, 0)
    c_m, c_mr = compute_chi2(ngc["Vobs"], ngc["Vobs_err"], v_m, 1) # MOND tem a0 como parâmetro livre
    c_d, c_dr = compute_chi2(ngc["Vobs"], ngc["Vobs_err"], v_d, 3) # Orange tem gamma, R_s, beta
    
    print(f"NGC 3198 Newton chi2/dof = {c_nr:.2f}")
    print(f"NGC 3198 MOND chi2/dof = {c_mr:.2f}")
    print(f"NGC 3198 Orange-DMS chi2/dof = {c_dr:.2f}")
