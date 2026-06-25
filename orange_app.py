# orange_app.py — Dashboard Científico Orange - DMS
# Executa a simulação e exibe gráficos interativos

import streamlit as st
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
import time
import os

# Import do núcleo de simulação
import orange_core as core

# Configurações de Página
st.set_page_config(
    page_title="Orange - DMS | Plataforma de Simulação Dimensional",
    page_icon="🍊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Estilização CSS Avançada (Aesthetics)
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Space+Grotesk:wght@400;600;700&display=swap');

/* Fontes */
html, body, [class*="css"], .stMarkdown {
    font-family: 'Outfit', sans-serif;
}

h1, h2, h3, h4, h5, h6 {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
}

/* Títulos */
.main-title {
    font-size: 3rem;
    font-weight: 800;
    background: linear-gradient(135deg, #FF9E00 0%, #FF5E00 50%, #FF2E00 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.1rem;
    letter-spacing: -1px;
}

.sub-title {
    font-size: 1.1rem;
    color: #A0AEC0;
    margin-bottom: 2rem;
    font-weight: 300;
}

/* Cards HUD Glassmorphism */
.hud-card {
    background: rgba(25, 30, 40, 0.6);
    backdrop-filter: blur(12px);
    border-radius: 16px;
    border: 1px solid rgba(255, 94, 0, 0.15);
    padding: 24px;
    margin-bottom: 16px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    transition: all 0.3s ease;
}

.hud-card:hover {
    border: 1px solid rgba(255, 94, 0, 0.4);
    box-shadow: 0 8px 32px 0 rgba(255, 94, 0, 0.1);
}

.hud-label {
    font-size: 0.85rem;
    color: #A0AEC0;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 8px;
    font-weight: 600;
}

.hud-value {
    font-size: 2.2rem;
    font-weight: 800;
    color: #FFFFFF;
    line-height: 1.2;
}

.hud-value-gradient {
    font-size: 2.2rem;
    font-weight: 800;
    background: linear-gradient(45deg, #FF9E00, #FF5E00);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.2;
}

.hud-unit {
    font-size: 0.9rem;
    color: #718096;
    margin-left: 4px;
    font-weight: 400;
}
</style>
""", unsafe_allow_html=True)

# Inicialização de Estados do Streamlit
if "engine" not in st.session_state:
    st.session_state.engine = None
if "params" not in st.session_state:
    st.session_state.params = core.DMSEParams()
if "metrics_history" not in st.session_state:
    st.session_state.metrics_history = []
if "simulation_run" not in st.session_state:
    st.session_state.simulation_run = False
if "sim_steps" not in st.session_state:
    st.session_state.sim_steps = 0

# Cabeçalho Principal
st.markdown('<div class="main-title">Orange - DMS</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-title">Sistema de Emergência e Simulação Dimensional da Malha Octogonal Vetorial</div>', unsafe_allow_html=True)

# -----------------------------
# Barra Lateral (Parâmetros)
# -----------------------------
with st.sidebar:
    st.image("https://img.icons8.com/color/96/orange.png", width=64)
    st.header("Parâmetros do Modelo")
    
    tab_p1, tab_p2 = st.tabs(["Física PDE", "Acoplamento & Grid"])
    
    with tab_p1:
        rho = st.slider("Densidade do Meio (ρ)", 0.1, 5.0, 1.0, 0.1)
        eta = st.slider("Dissipação (η)", 0.0, 1.0, 0.15, 0.05)
        alpha = st.slider("Difusão Espacial (α)", 0.1, 2.0, 0.6, 0.1)
        E0 = st.number_input("Escala de Campo (E0)", 0.1, 10.0, 1.0, 0.1)
        
        st.subheader("Controlador κ Adaptativo")
        kappa_init = st.number_input("κ Inicial", 0.01, 100.0, 1.0)
        kappa_gain = st.slider("Ganho de Ajuste", 0.01, 2.0, 0.5, 0.05)
        r_rms_target = st.number_input("Target de r_rms", 0.001, 0.2, 0.02, 0.005)
        
    with tab_p2:
        grid_sel = st.selectbox("Dimensão da Grade", ["64x64", "128x128", "256x256"], index=0)
        grid_w = 64 if grid_sel == "64x64" else (128 if grid_sel == "128x128" else 256)
        
        n_channels = st.slider("Número de Canais/Dimensões (C)", 1, 30, 30)
        boundary = st.selectbox("Condição de Contorno", ["neumann", "periodic"], index=0)
        
        st.subheader("Acoplamento de Malha")
        coupling_strength = st.slider("Força de Acoplamento", 0.0, 0.5, 0.02, 0.01)
        pairwise_coupling = st.checkbox("Acoplamento Pareado (d, C-1-d)", value=True)

    st.subheader("Controle de Tempo")
    steps = st.number_input("Passos de Integração (dt=0.02)", 50, 2000, 300, 50)
    seed = st.number_input("Semente Aleatória (Seed)", 0, 100000, 123)

    st.markdown("---")
    st.caption("Orange - DMS MVP • Postulado ω · ε₋ = -1")

# Instanciação dos Parâmetros atualizados
p_active = core.DMSEParams(
    grid=(grid_w, grid_w),
    n_channels=n_channels,
    dx=1.0,
    dt=0.02,
    rho=rho,
    eta=eta,
    alpha=alpha,
    E0=E0,
    kappa_init=kappa_init,
    kappa_gain=kappa_gain,
    r_rms_target=r_rms_target,
    boundary=boundary,
    coupling_strength=coupling_strength,
    pairwise_coupling=pairwise_coupling
)

# -----------------------------
# Abas Principais da Interface
# -----------------------------
tab_sim, tab_abl, tab_quantum, tab_theory = st.tabs([
    "⚡ Simulação da Malha", 
    "📊 Ablação de Modelos", 
    "⚛️ Protótipo Quântico", 
    "📖 Fundamentação Teórica"
])

# --------------------------------------------------
# TAB 1: Simulação Principal (Orange Core)
# --------------------------------------------------
with tab_sim:
    col_ctrl, col_space = st.columns([1, 4])
    
    with col_ctrl:
        st.subheader("Ações")
        run_btn = st.button("▶️ Iniciar Simulação", use_container_width=True)
        reset_btn = st.button("🔄 Resetar Estado", use_container_width=True)
        
        if reset_btn:
            st.session_state.engine = None
            st.session_state.metrics_history = []
            st.session_state.simulation_run = False
            st.session_state.sim_steps = 0
            st.success("Estado resetado com sucesso!")
            
    with col_space:
        # Quando clicar em Iniciar Simulação
        if run_btn:
            st.session_state.engine = core.DMSEngine(p_active)
            st.session_state.engine.reset(seed=seed)
            st.session_state.metrics_history = []
            
            # Loop de Simulação com barra de progresso
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            t_start = time.perf_counter()
            for step_idx in range(steps):
                m = st.session_state.engine.step()
                st.session_state.metrics_history.append(m)
                
                # Atualiza progresso periodicamente
                if step_idx % max(1, steps // 20) == 0 or step_idx == steps - 1:
                    progress_bar.progress((step_idx + 1) / steps)
                    status_text.text(f"Passo {step_idx+1}/{steps} | r_rms = {m.r_rms:.4f} | κ = {st.session_state.engine.state.kappa:.3f}")
            
            elapsed = time.perf_counter() - t_start
            st.session_state.simulation_run = True
            st.session_state.sim_steps = steps
            st.success(f"Simulação concluída em {elapsed:.2f} segundos!")
            
    # Se a simulação já rodou, exibe os resultados
    if st.session_state.simulation_run and st.session_state.metrics_history:
        history = st.session_state.metrics_history
        engine = st.session_state.engine
        last_m = history[-1]
        
        # --- CARDS DE MÉTRICAS (Aesthetics/HUD) ---
        col_m1, col_m2, col_m3, col_m4 = st.columns(4)
        
        with col_m1:
            st.markdown(f"""
            <div class="hud-card">
                <div class="hud-label">Divergência r_rms</div>
                <div class="hud-value-gradient">{last_m.r_rms:.5f}</div>
                <div class="hud-unit">alvo: {p_active.r_rms_target:.3f}</div>
            </div>
            """, unsafe_allow_html=True)
            
        with col_m2:
            st.markdown(f"""
            <div class="hud-card">
                <div class="hud-label">Controlador κ</div>
                <div class="hud-value">{engine.state.kappa:.3f}</div>
                <div class="hud-unit">atrator não-linear</div>
            </div>
            """, unsafe_allow_html=True)
            
        with col_m3:
            st.markdown(f"""
            <div class="hud-card">
                <div class="hud-label">Energia Cinética</div>
                <div class="hud-value">{last_m.energy_kin:.2e}</div>
                <div class="hud-unit">E_kin / N</div>
            </div>
            """, unsafe_allow_html=True)
            
        with col_m4:
            st.markdown(f"""
            <div class="hud-card">
                <div class="hud-label">Suavidade (TV)</div>
                <div class="hud-value">{last_m.tv:.4f}</div>
                <div class="hud-unit">Variação Total</div>
            </div>
            """, unsafe_allow_html=True)
            
        # --- RENDERIZAÇÃO DA LARANJA 3D (Orange Spheroidal Mesh) ---
        st.subheader("Holograma da Malha Dimensional (Orange Spheroidal Mesh)")
        
        # Gerar médias de E por canal para colorir
        E_current = engine.state.E # shape (C, H, W)
        E_means = np.mean(E_current, axis=(1, 2))
        
        # Calcula r_rms local por canal
        r_current = core.residual_r(E_current, engine.state.omega_tilde, p_active.E0)
        r_rms_channels = np.sqrt(np.mean(r_current**2, axis=(1, 2)))
        
        # Gerar coordenadas dos gomos da laranja
        xs, ys, zs = [], [], []
        colors = []
        hover_texts = []
        
        d_phi = 2 * np.pi / n_channels
        
        # Criar malha esferoidal de pontos 3D
        for c in range(n_channels):
            phi_start = c * d_phi
            phi_end = (c + 1) * d_phi
            
            val = E_means[c]
            r_rms_c = r_rms_channels[c]
            
            # Latitudes e longitudes do gomo
            n_lat = 10
            n_lon = 5
            for theta_val in np.linspace(0.1, np.pi - 0.1, n_lat):
                for phi_val in np.linspace(phi_start, phi_end, n_lon):
                    # Superfície externa
                    x_ext = np.sin(theta_val) * np.cos(phi_val)
                    y_ext = np.sin(theta_val) * np.sin(phi_val)
                    z_ext = np.cos(theta_val)
                    
                    xs.append(x_ext)
                    ys.append(y_ext)
                    zs.append(z_ext)
                    colors.append(val)
                    hover_texts.append(f"Canal {c+1} (Dimensão)<br>E_mean: {val:.4f}<br>r_rms: {r_rms_c:.4f}")
                    
                    # Pontos internos de espessura (70% do raio)
                    xs.append(x_ext * 0.75)
                    ys.append(y_ext * 0.75)
                    zs.append(z_ext * 0.75)
                    colors.append(val)
                    hover_texts.append(f"Canal {c+1} (Dimensão)<br>E_mean: {val:.4f}<br>r_rms: {r_rms_c:.4f}")

        # Gráfico 3D em Plotly
        fig_3d = go.Figure(data=[go.Scatter3d(
            x=xs, y=ys, z=zs,
            mode='markers',
            marker=dict(
                size=3.5,
                color=colors,
                colorscale='YlOrRd', # Laranja e Vermelho (Orange Theme)
                colorbar=dict(title="E Médio", thickness=15),
                opacity=0.85
            ),
            text=hover_texts,
            hoverinfo='text'
        )])
        
        fig_3d.update_layout(
            scene=dict(
                xaxis=dict(showbackground=False, showgrid=False, zeroline=False, visible=False),
                yaxis=dict(showbackground=False, showgrid=False, zeroline=False, visible=False),
                zaxis=dict(showbackground=False, showgrid=False, zeroline=False, visible=False),
                bgcolor='rgba(0,0,0,0)'
            ),
            margin=dict(l=0, r=0, b=0, t=0),
            height=500,
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)'
        )
        
        # Exibe o gráfico 3D da Laranja
        col_mesh, col_info = st.columns([2, 1])
        with col_mesh:
            st.plotly_chart(fig_3d, use_container_width=True)
        with col_info:
            st.markdown("""
            **Sobre o Holograma 3D:**
            - O modelo esferoidal é dividido em **30 gomos logitudinais**.
            - Cada gomo representa uma dimensão projetada da malha.
            - A escala de cor indica a amplitude média do campo eletromagnético $E$ de cada dimensão.
            - Tons quentes (laranja/vermelho) indicam condensação energética.
            - O acoplamento pareado força as dimensões opostas $(d, 30-d+1)$ a ressoarem em equilíbrio conjugado.
            """)
            
            # Escolha de canal para ver o campo 2D
            canal_sel = st.selectbox("Selecione um Canal para visualizar o Campo 2D", range(1, n_channels + 1))
            E_2d = E_current[canal_sel - 1]
            fig_heatmap = px.imshow(
                E_2d,
                color_continuous_scale='YlOrRd',
                title=f"Distribuição de Campo 2D - Canal {canal_sel}"
            )
            fig_heatmap.update_layout(height=280, margin=dict(l=0, r=0, b=0, t=30))
            st.plotly_chart(fig_heatmap, use_container_width=True)

        # --- GRÁFICOS DE EVOLUÇÃO ---
        st.subheader("Gráficos de Convergência Temporal")
        
        steps_arr = np.arange(1, len(history) + 1)
        r_rms_series = [m.r_rms for m in history]
        kappa_series = [history[i].r_rms # temporário, precisamos recuperar o kappa histórico
                        for i in range(len(history))]
        # Na verdade, como adapt_kappa roda a cada passo, vamos calcular a série de kappa real
        k_val = p_active.kappa_init
        k_series_real = []
        for m in history:
            k_series_real.append(k_val)
            k_val = core.adapt_kappa(k_val, m.r_rms, p_active)
            
        e_kin_series = [m.energy_kin for m in history]
        e_grad_series = [m.energy_grad for m in history]
        
        col_g1, col_g2 = st.columns(2)
        
        with col_g1:
            fig_conv = go.Figure()
            fig_conv.add_trace(go.Scatter(x=steps_arr, y=r_rms_series, name="r_rms (Divergência)", line=dict(color='#FF5E00', width=2)))
            fig_conv.add_trace(go.Scatter(x=steps_arr, y=[p_active.r_rms_target]*len(steps_arr), name="Alvo Target", line=dict(color='#718096', dash='dash')))
            fig_conv.update_layout(
                title="Convergência do Resíduo (r_rms)",
                xaxis_title="Passo Temporal",
                yaxis_title="Divergência",
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(15,20,30,0.4)',
                height=300,
                margin=dict(l=40, r=20, b=40, t=40)
            )
            st.plotly_chart(fig_conv, use_container_width=True)
            
        with col_g2:
            fig_kap = go.Figure()
            fig_kap.add_trace(go.Scatter(x=steps_arr, y=k_series_real, name="κ (Atrator)", line=dict(color='#FF9E00', width=2)))
            fig_kap.update_layout(
                title="Adaptação do Coeficiente κ",
                xaxis_title="Passo Temporal",
                yaxis_title="Valor de κ",
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(15,20,30,0.4)',
                height=300,
                margin=dict(l=40, r=20, b=40, t=40)
            )
            st.plotly_chart(fig_kap, use_container_width=True)
            
        # Energias
        fig_nrg = go.Figure()
        fig_nrg.add_trace(go.Scatter(x=steps_arr, y=e_kin_series, name="Energia Cinética", line=dict(color='#3182CE', width=1.5)))
        fig_nrg.add_trace(go.Scatter(x=steps_arr, y=e_grad_series, name="Energia de Gradiente", line=dict(color='#319795', width=1.5)))
        fig_nrg.update_layout(
            title="Evolução Energética da Malha",
            xaxis_title="Passo Temporal",
            yaxis_title="Energia / N",
            yaxis_type="log",
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(15,20,30,0.4)',
            height=300,
            margin=dict(l=40, r=20, b=40, t=40)
        )
        st.plotly_chart(fig_nrg, use_container_width=True)

# --------------------------------------------------
# TAB 2: Ablação de Modelos (AIC/BIC)
# --------------------------------------------------
with tab_abl:
    st.subheader("Análise Comparativa de Ablação")
    st.markdown("""
    A ablação permite testar diferentes restrições geométricas ou físicas do modelo para identificar qual oferece a melhor relação entre **ajuste de dados** (menor RSS) e **complexidade** (número de parâmetros livres).
    O critério **BIC (Bayesian Information Criterion)** penaliza o número de dimensões. Modelos com menor BIC são estatisticamente preferíveis.
    """)
    
    col_abl_ctrl, col_abl_results = st.columns([1, 3])
    
    with col_abl_ctrl:
        st.markdown("**Configurações para Testar:**")
        ablate_30 = st.checkbox("1. Modelo 30D Completo Pareado", value=True)
        ablate_15 = st.checkbox("2. Modelo 15D Pareado", value=True)
        ablate_10 = st.checkbox("3. Modelo 10D Sem Acoplamento", value=False)
        ablate_1 = st.checkbox("4. Modelo 1D Clássico (Controle)", value=True)
        
        steps_abl = st.slider("Passos por Teste", 50, 500, 200, 50)
        run_abl_btn = st.button("🔥 Executar Ablação", use_container_width=True)
        
    with col_abl_results:
        if run_abl_btn:
            cfgs_to_test = []
            if ablate_30:
                cfgs_to_test.append({"n_channels": 30, "coupling_strength": 0.02, "pairwise_coupling": True, "label": "30D Pareado"})
            if ablate_15:
                cfgs_to_test.append({"n_channels": 15, "coupling_strength": 0.02, "pairwise_coupling": True, "label": "15D Pareado"})
            if ablate_10:
                cfgs_to_test.append({"n_channels": 10, "coupling_strength": 0.0, "pairwise_coupling": False, "label": "10D Sem Acoplamento"})
            if ablate_1:
                cfgs_to_test.append({"n_channels": 1, "coupling_strength": 0.0, "pairwise_coupling": False, "label": "1D Clássico"})
                
            if not cfgs_to_test:
                st.error("Por favor, selecione pelo menos uma configuração para a ablação.")
            else:
                with st.spinner("Executando simulações de ablação consecutivas..."):
                    # Executa ablação usando o core
                    # Precisamos remover o rótulo temporário 'label' antes de passar para o core
                    core_cfgs = [{k: v for k, v in c.items() if k != "label"} for c in cfgs_to_test]
                    t_abl_start = time.perf_counter()
                    raw_res = core.ablation_compare(p_active, core_cfgs, steps=steps_abl, seed=seed)
                    t_abl_elapsed = time.perf_counter() - t_abl_start
                    
                    # Reassocia os labels
                    res = []
                    for r in raw_res:
                        # Encontra a config correspondente nos testes para obter o label
                        label = "Desconhecido"
                        for orig in cfgs_to_test:
                            match = True
                            for k, v in orig.items():
                                if k != "label" and r["cfg"].get(k) != v:
                                    match = False
                                    break
                            if match:
                                label = orig["label"]
                                break
                        r["Modelo"] = label
                        res.append(r)
                        
                    st.success(f"Ablação de {len(res)} modelos concluída em {t_abl_elapsed:.2f}s!")
                    
                    # Gráfico de comparação de BIC
                    bics = [r["BIC"] for r in res]
                    models = [r["Modelo"] for r in res]
                    
                    fig_bic = go.Figure(data=[go.Bar(
                        x=models, y=bics,
                        text=[f"{b:.1f}" for b in bics],
                        textposition='auto',
                        marker_color='#FF5E00'
                    )])
                    fig_bic.update_layout(
                        title="Comparação de BIC por Configuração (Menor é Melhor)",
                        xaxis_title="Modelo",
                        yaxis_title="BIC Score",
                        paper_bgcolor='rgba(0,0,0,0)',
                        plot_bgcolor='rgba(15,20,30,0.4)',
                        height=350
                    )
                    st.plotly_chart(fig_bic, use_container_width=True)
                    
                    # Tabela detalhada
                    st.subheader("Resultados Detalhados")
                    import pandas as pd
                    data_df = []
                    for r in res:
                        data_df.append({
                            "Modelo": r["Modelo"],
                            "Dimensões": r["cfg"].get("n_channels", p_active.n_channels),
                            "Acoplamento": r["cfg"].get("coupling_strength", p_active.coupling_strength),
                            "Parâmetros (k)": r["k_params"],
                            "Log-Likelihood": f"{r['logL']:.2f}",
                            "AIC": f"{r['AIC']:.2f}",
                            "BIC": f"{r['BIC']:.2f}",
                            "RSS Total": f"{r['RSS']:.3e}",
                            "RMSE": f"{r['RMSE']:.4e}",
                            "Tempo (s)": f"{r['time_sec']:.3f}s"
                        })
                    st.dataframe(pd.DataFrame(data_df), use_container_width=True)

# --------------------------------------------------
# TAB 3: Protótipo Quântico
# --------------------------------------------------
with tab_quantum:
    st.subheader("Codificação de Amplitude e Kernel Quântico")
    st.markdown("""
    O Orange - DMS inclui um backend experimental para codificação de vetores em estados de qubits.
    Um vetor real de 30 dimensões (representando o estado da malha vetorial) é mapeado por **Amplitude Encoding** em um registrador de **5 qubits** ($2^5 = 32$ estados possíveis, sendo 2 usados como padding nulo).
    
    A partir de dois vetores de estado $v_1$ e $v_2$, o simulador calcula a sobreposição quântica (Quantum Kernel):
    $$K(v_1, v_2) = |\\langle \\psi_{v_1} | \\psi_{v_2} \\rangle|^2$$
    """)
    
    col_q1, col_q2 = st.columns(2)
    
    with col_q1:
        st.markdown("**Gerador de Vetor v1 (30 Dimensões)**")
        v1_type = st.radio("Método para v1", ["Aleatório", "Senoide", "Constante"], key="v1_type")
        if v1_type == "Aleatório":
            v1_seed = st.number_input("Semente v1", 0, 1000, 7)
            rng1 = np.random.default_rng(v1_seed)
            v1 = rng1.normal(0.0, 1.0, size=30)
        elif v1_type == "Senoide":
            v1 = np.sin(np.linspace(0, 4*np.pi, 30))
        else:
            v1 = np.ones(30)
        st.caption(f"v1 norm: {np.linalg.norm(v1):.4f}")
        st.line_chart(v1, height=120)
        
    with col_q2:
        st.markdown("**Gerador de Vetor v2 (30 Dimensões)**")
        v2_type = st.radio("Método para v2", ["Aleatório", "Senoide", "Constante"], key="v2_type")
        if v2_type == "Aleatório":
            v2_seed = st.number_input("Semente v2", 0, 1000, 8)
            rng2 = np.random.default_rng(v2_seed)
            v2 = rng2.normal(0.0, 1.0, size=30)
        elif v2_type == "Senoide":
            v2 = np.sin(np.linspace(0, 4*np.pi + 0.5, 30)) # leve defasagem
        else:
            v2 = np.ones(30) * 0.8
        st.caption(f"v2 norm: {np.linalg.norm(v2):.4f}")
        st.line_chart(v2, height=120)

    # Executa cálculo de Kernel
    enc = core.QuantumAmplitudeEncoder()
    psi1 = enc.encode(v1)
    psi2 = enc.encode(v2)
    kernel_val = enc.kernel(v1, v2)
    
    st.markdown("---")
    
    col_k_res, col_k_code = st.columns([1, 2])
    with col_k_res:
        st.markdown(f"""
        <div class="hud-card" style="text-align: center;">
            <div class="hud-label">Quantum Kernel Score</div>
            <div class="hud-value-gradient" style="font-size: 3rem;">{kernel_val:.6f}</div>
            <div class="hud-unit">Medida de Proximidade Espacial de Hilbert</div>
        </div>
        """, unsafe_allow_html=True)
    with col_k_code:
        st.markdown("**Circuito Qiskit de Inicialização (QASM):**")
        qc = enc.try_qiskit_circuit(v1)
        if qc is not None:
            st.code(qc.qasm(), language="qasm")
        else:
            # Qiskit não instalado, exibe representação simulada do circuito
            st.warning("Biblioteca Qiskit não instalada no ambiente Python. Exibindo simulado do circuito de preparação:")
            fake_qasm = f"""// Quantum Volume Initialization para 30D (5 Qubits)
OPENQASM 2.0;
include "qelib1.inc";
qreg q[5];
creg c[5];
// Codificando amplitudes normalizadas do vetor v1
initialize({psi1[0].real:.4f}+{psi1[0].imag:.4f}j, ..., {psi1[29].real:.4f}+{psi1[29].imag:.4f}j) q[0],q[1],q[2],q[3],q[4];
measure q -> c;
"""
            st.code(fake_qasm, language="qasm")

# --------------------------------------------------
# TAB 4: Fundamentação Teórica
# --------------------------------------------------
with tab_theory:
    st.subheader("Fundamentação Científica da Malha Dimensional")
    
    st.markdown(r"""
    O **Orange - DMS** é fundamentado na teoria original de emergência dimensional por estabilização ressonante, proposta por **Charles de Paula Eugênio**.
    
    ### 1. O Postulado Fundamental
    A projeção e estabilização de cada dimensão espacial obedece à condição vetorial do vácuo:
    $$\omega \cdot \varepsilon_- = -1$$
    Onde:
    - $\omega$ representa a frequência angular da dimensão projetada ($rad/s$);
    - $\varepsilon_-$ representa a resistência negativa vetorial do vácuo ($\Omega^{-1}\cdot m$);
    
    Quando esse balanço vetorial se equilibra em exatamente $-1$, a dimensão atinge estabilidade estática e se comporta como uma dimensão real observável.
    
    ### 2. A Geometria da Laranja (Spheroidal Mesh)
    A malha vetorial dimensional funciona de forma análoga a uma **laranja fatiada em 30 gomos**.
    - O espaço tridimensional convencional serve como a casca (envelope de confinamento).
    - As dimensões internas (canais do sistema de equações diferenciais parciais) são os gomos seccionados.
    - Através do **acoplamento pareado** ($d$ acoplada com $30-d+1$), canais opostos estabelecem uma ressonância de fase que impede o colapso estocástico.
    
    ### 3. A Dinâmica PDE do Sistema
    A evolução de campo eletrodinâmico é modelada pela equação diferencial parcial hiperbólica amortecida por canal $c$:
    $$\rho \frac{\partial^2 E_c}{\partial t^2} + \eta \frac{\partial E_c}{\partial t} - \alpha \nabla^2 E_c + \frac{\kappa_c}{E_0} \omega_c \left( \omega_c \frac{E_c}{E_0} - 1 \right) + \text{Coupling}(E_c) = 0$$
    Onde:
    - $\kappa_c$ é o coeficiente de acoplamento não-linear adaptado dinamicamente para minimizar a divergência local em relação ao vácuo ($r_{rms}$).
    """)
