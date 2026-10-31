import React, { useCallback, useEffect, useState } from "react";
import { obterCadastro } from "../services/auth";

const styles = String.raw`
.dashboard { min-height: 100vh; padding: 0 7%; background: var(--cream); }
.perfil-main { min-height: calc(100vh - 90px); display: grid; place-content: start center; padding: 44px 18px 60px; }
.perfil-card { width: min(620px,100%); border: 1px solid #24423912; border-radius: 24px; background: var(--paper); box-shadow: 0 22px 75px #1f3c510c; overflow: hidden; }

.perfil-header { display: flex; align-items: center; gap: 16px; padding: 28px clamp(20px,5vw,40px) 24px; border-bottom: 1px solid #e8ece5; }
.perfil-avatar { width: 52px; height: 52px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 16px; color: #1d5e57; background: #dcece3; font-size: 22px; font-weight: 750; }
.perfil-header-info { flex: 1; min-width: 0; }
.perfil-header-info h2 { margin: 0 0 3px; font: 500 22px Georgia,serif; letter-spacing: -.4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.perfil-header-info small { color: #82918a; font-size: 11px; }
.perfil-badge { padding: 4px 11px; border-radius: 999px; color: #1d5e57; background: #dcece3; font-size: 10px; font-weight: 700; white-space: nowrap; }

.perfil-section { padding: 22px clamp(20px,5vw,40px); }
.perfil-section + .perfil-section { border-top: 1px solid #f0f3ed; }
.perfil-section-title { margin: 0 0 14px; color: #82918a; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }

.perfil-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
.perfil-field { display: flex; flex-direction: column; gap: 3px; }
.perfil-field.full { grid-column: 1 / -1; }
.perfil-label { color: #82918a; font-size: 10px; font-weight: 680; letter-spacing: .04em; text-transform: uppercase; }
.perfil-value { color: #1f2328; font-size: 13px; min-height: 18px; }
.perfil-value.empty { color: #b0b8b2; font-style: italic; }

.perfil-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 60px 20px; color: #82918a; font-size: 13px; }
.perfil-spinner { width: 28px; height: 28px; border: 3px solid #e0e8e4; border-top-color: var(--teal); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.perfil-error { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 50px 24px; text-align: center; }
.perfil-error-icon { font-size: 32px; }
.perfil-error p { margin: 0; color: #78857f; font-size: 13px; line-height: 1.6; }
.perfil-retry { margin-top: 4px; padding: 9px 20px; border: 1px solid #dce4dc; border-radius: 999px; color: #4e6c65; background: transparent; font-size: 12px; font-weight: 680; cursor: pointer; }
.perfil-retry:hover { background: #f3f5ed; }

@media (max-width: 430px) {
  .perfil-main { padding: 28px 0 40px; }
  .perfil-grid { grid-template-columns: 1fr; }
  .perfil-field.full { grid-column: 1; }
}
`;

function formatarCPF(cpf) {
  if (!cpf) return null;
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarTelefone(tel) {
  if (!tel) return null;
  const d = tel.replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return tel;
}

function formatarData(valor) {
  if (!valor) return null;
  // ISO date string yyyy-mm-dd or date-time
  const match = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return valor;
}

function CampoInfo({ label, value, full }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className={`perfil-field${full ? " full" : ""}`}>
      <span className="perfil-label">{label}</span>
      <span className={`perfil-value${empty ? " empty" : ""}`}>
        {empty ? "Não informado" : value}
      </span>
    </div>
  );
}

export default function VisualizarCadastroScreen({ onVoltar }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await obterCadastro();
      setDados(data);
    } catch (err) {
      setError(err.message || "Não foi possível carregar os dados do cadastro.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <>
      <style>{styles}</style>

      <main className="perfil-main">
        <div className="perfil-card">
          {loading && (
            <div className="perfil-loading">
              <span className="perfil-spinner" role="status" aria-label="Carregando" />
              Carregando seus dados...
            </div>
          )}

          {!loading && error && (
            <div className="perfil-error">
              <span className="perfil-error-icon">⚠</span>
              <p>{error}</p>
              <button className="perfil-retry" onClick={carregar}>Tentar novamente</button>
              <button className="perfil-retry" onClick={onVoltar}>Voltar</button>
            </div>
          )}

          {!loading && !error && dados && (
            <>
              <div className="perfil-header">
                <span className="perfil-avatar">
                  {(dados.nome || "V").charAt(0).toUpperCase()}
                </span>
                <div className="perfil-header-info">
                  <h2>{dados.nome}</h2>
                  <small>{dados.email}</small>
                </div>
                <span className="perfil-badge">Voluntário</span>
              </div>

              <div className="perfil-section">
                <p className="perfil-section-title">Dados pessoais</p>
                <div className="perfil-grid">
                  <CampoInfo label="Nome completo" value={dados.nome} full />
                  <CampoInfo label="E-mail" value={dados.email} full />
                  <CampoInfo label="CPF" value={formatarCPF(dados.cpf)} />
                  <CampoInfo label="Telefone" value={formatarTelefone(dados.telefone)} />
                  <CampoInfo label="Data de nascimento" value={formatarData(dados.dataNascimento)} />
                </div>
              </div>

              {(dados.criadoEm || dados.atualizadoEm || dados.status) && (
                <div className="perfil-section">
                  <p className="perfil-section-title">Informações da conta</p>
                  <div className="perfil-grid">
                    {dados.status !== undefined && (
                      <CampoInfo label="Status" value={dados.status} />
                    )}
                    {dados.criadoEm && (
                      <CampoInfo label="Cadastrado em" value={formatarData(dados.criadoEm)} />
                    )}
                    {dados.atualizadoEm && (
                      <CampoInfo label="Atualizado em" value={formatarData(dados.atualizadoEm)} />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <button
          className="perfil-retry"
          style={{ marginTop: 18 }}
          onClick={onVoltar}
        >
          ← Voltar ao início
        </button>
      </main>
    </>
  );
}
