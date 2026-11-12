import React, { useCallback, useEffect, useState } from "react";
import DesativarConta from "../components/DesativarConta";
import Brand from "../components/PagInicial";
import FeedbackMessage from "../components/FeedbackMessage";
import { obterCadastro, atualizarUsuario } from "../services/auth";
import { useAuth } from "../context/auth";

function ultimoDiaValido() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

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

function formatarInputTelefone(valor) {
  if (!valor) return "";
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length > 0 ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

function validarTelefone(tel) {
  if (!tel) return true;
  const d = tel.replace(/\D/g, "");
  if (d.length === 0) return true;
  if (d.length !== 10 && d.length !== 11) return false;
  if (/^(\d)\1+$/.test(d)) return false;
  const ddd = parseInt(d.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;
  if (d.length === 11 && d[2] !== "9") return false;
  return true;
}

function formatarData(valor) {
  if (!valor) return null;
  const match = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return valor;
}

function LapisIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

const styles = String.raw`
.dashboard { min-height: 100vh; padding: 0 7%; background: var(--cream); }
.topbar { min-height: 88px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(23,62,59,.1); max-width: 1260px; margin: auto; }
.topbar-actions { display: flex; align-items: center; gap: 10px; }
.nav-profile-btn { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px 6px 8px; border: 1px solid #1d5e57; border-radius: 999px; color: #1d5e57; background: #eaf3ee; font-size: 12px; font-weight: 700; cursor: default; }
.nav-avatar { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; color: #1d5e57; background: #dcece3; font-size: 11px; font-weight: 750; }
.logout { padding: 10px 15px; border: 1px solid #dce4dc; border-radius: 999px; color: #4e6c65; background: transparent; font-size: 12px; font-weight: 680; cursor: pointer; transition: all .15s ease; }
.logout:hover { background: #f3f5ed; color: #173e3b; }

.perfil-main { min-height: calc(100vh - 90px); display: flex; flex-direction: column; align-items: center; padding: 32px 18px 60px; }
.perfil-wrapper { width: min(840px, 100%); display: flex; flex-direction: column; gap: 16px; }

/* Botão voltar no topo esquerdo */
.perfil-top-nav { width: 100%; display: flex; justify-content: flex-start; }
.perfil-back-link { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border: 1px solid #dce4dc; border-radius: 999px; color: #4e6c65; background: var(--paper); font-size: 13px; font-weight: 680; cursor: pointer; transition: all .18s ease; box-shadow: 0 2px 8px rgba(23,62,59,0.04); }
.perfil-back-link:hover { background: #f0f4ed; color: var(--teal); border-color: #bcd0c5; transform: translateX(-2px); }
.perfil-back-link span { font-size: 16px; transition: transform .18s ease; }
.perfil-back-link:hover span { transform: translateX(-3px); }

/* Card Principal Ampliado */
.perfil-card { width: 100%; border: 1px solid rgba(36,66,57,0.1); border-radius: 28px; background: var(--paper); box-shadow: 0 28px 80px rgba(31,60,81,0.08), 0 4px 12px rgba(31,60,81,0.03); overflow: hidden; }

/* Cabeçalho do Card */
.perfil-header { display: flex; align-items: center; gap: 20px; padding: 32px clamp(24px, 5vw, 48px) 28px; background: linear-gradient(180deg, #fdfcf7 0%, var(--paper) 100%); border-bottom: 1px solid #e8ece5; }
.perfil-avatar { width: 62px; height: 62px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 20px; color: #1d5e57; background: #dcece3; font-size: 26px; font-weight: 750; box-shadow: 0 4px 14px rgba(29,94,87,0.12); border: 2px solid #ffffff; }
.perfil-header-info { flex: 1; min-width: 0; }
.perfil-header-info h2 { margin: 0 0 4px; font: 500 26px Georgia,serif; letter-spacing: -.5px; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.perfil-header-info small { color: #78857f; font-size: 13px; }
.perfil-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; color: #1d5e57; background: #dcece3; font-size: 11px; font-weight: 700; white-space: nowrap; border: 1px solid rgba(29,94,87,0.15); }
.perfil-badge::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #26766d; }

/* Seções do Formulário */
.perfil-section { padding: 30px clamp(24px, 5vw, 48px); }
.perfil-section + .perfil-section { border-top: 1px solid #f0f3ed; }
.perfil-section-title { margin: 0 0 18px; color: #64766d; font-size: 11px; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
.perfil-section-title::after { content: ""; flex: 1; height: 1px; background: #f0f3ed; }

/* Grid e Campos */
.perfil-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 24px; }
.perfil-field { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; border: 1px solid #edf1eb; border-radius: 12px; background: #fafbfa; transition: all .15s ease; }
.perfil-field:hover { border-color: #dfe6de; background: #f8faf8; }
.perfil-field.editing { border-color: #5c9f91; background: #ffffff; box-shadow: 0 0 0 3px rgba(64,142,126,0.12); }
.perfil-field.full { grid-column: 1 / -1; }

.perfil-label-row { display: flex; align-items: center; justify-content: space-between; }
.perfil-label { color: #798780; font-size: 10px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
.perfil-label-immutable { color: #9aa49e; font-size: 10px; font-weight: 500; text-transform: none; background: #edf1ec; padding: 2px 7px; border-radius: 4px; }

/* Botão do Lápis */
.btn-pencil { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border: 1px solid #dce5dd; border-radius: 6px; color: var(--teal); background: #ffffff; font-size: 11px; font-weight: 650; cursor: pointer; transition: all .15s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.btn-pencil:hover { background: #eaf3ee; border-color: #b8d4c6; color: #173e3b; }
.btn-pencil:focus-visible { outline: 2px solid var(--teal); outline-offset: 1px; }
.btn-pencil.active { background: #dcece3; border-color: #1d5e57; color: #1d5e57; font-weight: 700; }

.perfil-value { color: #1f2328; font-size: 14px; font-weight: 500; min-height: 24px; display: flex; align-items: center; }
.perfil-value.empty { color: #a4aca6; font-style: italic; }

.perfil-input { width: 100%; height: 42px; padding: 0 13px; border: 1px solid #dfe5dd; border-radius: 8px; outline: none; color: var(--ink); background: white; font-size: 13.5px; font-family: inherit; font-weight: 500; transition: border-color .15s ease, box-shadow .15s ease; }
.perfil-input:focus { border-color: #5c9f91; box-shadow: 0 0 0 3px rgba(64,142,126,0.18); }
.perfil-input:disabled { background: #f4f6f2; color: #78857f; cursor: not-allowed; }

/* Barra de Ações ao Editar */
.perfil-edit-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e8ece5; }
.perfil-btn-save { padding: 11px 24px; border: 0; border-radius: 10px; color: white; background: var(--teal); font-size: 13px; font-weight: 700; cursor: pointer; transition: all .15s ease; box-shadow: 0 2px 8px rgba(38,118,109,0.25); }
.perfil-btn-save:hover:not(:disabled) { background: #1d5e57; transform: translateY(-1px); }
.perfil-btn-save:disabled { cursor: wait; opacity: .7; }
.perfil-btn-cancel { padding: 11px 20px; border: 1px solid #dce4dc; border-radius: 10px; color: #4e6c65; background: transparent; font-size: 13px; font-weight: 680; cursor: pointer; transition: background .15s ease; }
.perfil-btn-cancel:hover:not(:disabled) { background: #f3f5ed; color: #173e3b; }
.perfil-btn-cancel:disabled { cursor: not-allowed; opacity: .7; }

/* Loading & Erro */
.perfil-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 70px 20px; color: #82918a; font-size: 14px; }
.perfil-spinner { width: 32px; height: 32px; border: 3px solid #e0e8e4; border-top-color: var(--teal); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.perfil-error { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 24px; text-align: center; }
.perfil-error-icon { font-size: 36px; }
.perfil-error p { margin: 0; color: #78857f; font-size: 14px; line-height: 1.6; }
.perfil-retry { padding: 10px 22px; border: 1px solid #dce4dc; border-radius: 999px; color: #4e6c65; background: transparent; font-size: 13px; font-weight: 680; cursor: pointer; transition: background .15s ease; }
.perfil-retry:hover { background: #f3f5ed; }

@media (max-width: 760px) {
  .topbar { min-height: 72px; }
  .perfil-main { padding: 24px 12px 48px; }
  .perfil-header { padding: 24px 20px 20px; }
  .perfil-section { padding: 22px 20px; }
}
@media (max-width: 520px) {
  .topbar { min-height: 65px; }
  .perfil-grid { grid-template-columns: 1fr; }
  .perfil-field.full { grid-column: 1; }
  .perfil-edit-actions { flex-direction: column-reverse; }
  .perfil-edit-actions button { width: 100%; }
}
`;

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

export default function VisualizarCadastroScreen({ onVoltar, onLogout, onContaDesativada }) {
  const { session, atualizarUsuarioSessao } = useAuth();
  const maxDate = ultimoDiaValido();

  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [formValues, setFormValues] = useState({
    nome: "",
    email: "",
    telefone: "",
    dataNascimento: "",
  });

  const nomesPerfis = { RESPONSAVEL: "Responsável", interessado: "Interessado", VOLUNTARIO: "Voluntário" };
  const perfil = nomesPerfis[dados?.tipoUsuario] || dados?.tipoUsuario || "Perfil não informado";

  const carregar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await obterCadastro();
      setDados(data);
      setFormValues({
        nome: data?.nome || "",
        email: data?.email || "",
        telefone: data?.telefone || "",
        dataNascimento: data?.dataNascimento ? data.dataNascimento.slice(0, 10) : "",
      });
    } catch (err) {
      setError(err.message || "Não foi possível carregar os dados do cadastro.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function handleStartEditing(campoParaFocar) {
    setError("");
    setSuccess("");
    setIsEditing(true);

    if (campoParaFocar) {
      setTimeout(() => {
        const input = document.querySelector(`input[name="${campoParaFocar}"]`);
        if (input) input.focus();
      }, 50);
    }
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    if (name === "telefone") {
      setFormValues((prev) => ({ ...prev, [name]: formatarInputTelefone(value) }));
    } else {
      setFormValues((prev) => ({ ...prev, [name]: value }));
    }
  }

  function handleCancel() {
    if (dados) {
      setFormValues({
        nome: dados.nome || "",
        email: dados.email || "",
        telefone: dados.telefone || "",
        dataNascimento: dados.dataNascimento ? dados.dataNascimento.slice(0, 10) : "",
      });
    }
    setIsEditing(false);
    setError("");
  }

  async function handleSave(event) {
    if (event) event.preventDefault();
    setError("");
    setSuccess("");

    if (!formValues.nome.trim()) {
      return setError("Por favor, informe o nome completo.");
    }
    if (!formValues.email.trim()) {
      return setError("Por favor, informe o e-mail.");
    }

    const telLimpo = formValues.telefone.replace(/\D/g, "");
    if (telLimpo.length > 0 && !validarTelefone(telLimpo)) {
      return setError("Informe um telefone válido com DDD (10 ou 11 dígitos, ex: (11) 99999-9999).");
    }

    const userId = dados?.id || session?.usuario?.id || session?.usuario?._id;
    if (!userId) {
      return setError("Identificador do usuário não encontrado.");
    }

    setSaving(true);
    try {
      const payload = {
        nome: formValues.nome.trim(),
        email: formValues.email.trim(),
        telefone: telLimpo || null,
        dataNascimento: formValues.dataNascimento || null,
      };

      const response = await atualizarUsuario(userId, payload);
      const updatedData = { ...dados, ...payload, ...(response || {}) };
      setDados(updatedData);

      if (atualizarUsuarioSessao) {
        atualizarUsuarioSessao(updatedData);
      }

      setIsEditing(false);
      setSuccess("Dados atualizados com sucesso!");
    } catch (err) {
      setError(err.message || "Não foi possível atualizar seus dados.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <style>{styles}</style>

      <div className="dashboard">
        <header className="topbar">
          <Brand href="/inicio" onClick={onVoltar} />
          <div className="topbar-actions">
            <button className="nav-profile-btn" aria-label="Perfil ativo">
              <span className="nav-avatar">
                {((dados && dados.nome) || (session && session.usuario?.nome) || "V")
                  .charAt(0)
                  .toUpperCase()}
              </span>
              <span>Meu perfil</span>
            </button>
            {onLogout && (
              <button className="logout" onClick={onLogout}>
                Sair da conta ↗
              </button>
            )}
          </div>
        </header>

        <main className="perfil-main">
          <div className="perfil-wrapper">
            {/* Voltar ao início no canto superior esquerdo */}
            <div className="perfil-top-nav">
              <button
                type="button"
                className="perfil-back-link"
                onClick={onVoltar}
              >
                <span>←</span> Voltar ao início
              </button>
            </div>

            <div className="perfil-card">
              {loading && (
                <div className="perfil-loading">
                  <span className="perfil-spinner" role="status" aria-label="Carregando" />
                  Carregando seus dados...
                </div>
              )}

              {!loading && error && !dados && (
                <div className="perfil-error">
                  <span className="perfil-error-icon">⚠</span>
                  <p>{error}</p>
                  <button className="perfil-retry" onClick={carregar}>
                    Tentar novamente
                  </button>
                  <button className="perfil-retry" onClick={onVoltar}>
                    Voltar
                  </button>
                </div>
              )}

              {!loading && dados && (
                <>
                  <div className="perfil-header">
                    <span className="perfil-avatar">
                      {(dados.nome || "V").charAt(0).toUpperCase()}
                    </span>
                    <div className="perfil-header-info">
                      <h2>{dados.nome}</h2>
                      <small>{dados.email}</small>
                    </div>
                    <span className="perfil-badge">{perfil}</span>
                  </div>

                  <form className="perfil-section" onSubmit={handleSave}>
                    <p className="perfil-section-title">Dados pessoais</p>

                    <FeedbackMessage type="error">{error}</FeedbackMessage>
                    <FeedbackMessage type="success">{success}</FeedbackMessage>

                    <div className="perfil-grid">
                      {/* Nome completo */}
                      <div className={`perfil-field full${isEditing ? " editing" : ""}`}>
                        <div className="perfil-label-row">
                          <span className="perfil-label">Nome completo</span>
                          <button
                            type="button"
                            className={`btn-pencil${isEditing ? " active" : ""}`}
                            onClick={() => (isEditing ? handleCancel() : handleStartEditing("nome"))}
                            aria-label="Editar dados cadastrais"
                            title={isEditing ? "Cancelar edição" : "Editar campos"}
                            disabled={saving}
                          >
                            <LapisIcon />
                            <span>{isEditing ? "Editando" : "Editar"}</span>
                          </button>
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            name="nome"
                            className="perfil-input"
                            autoComplete="name"
                            placeholder="Como podemos chamar você?"
                            maxLength="120"
                            value={formValues.nome}
                            onChange={handleInputChange}
                            required
                            disabled={saving}
                            autoFocus
                          />
                        ) : (
                          <span className="perfil-value">{dados.nome}</span>
                        )}
                      </div>

                      {/* E-mail */}
                      <div className={`perfil-field full${isEditing ? " editing" : ""}`}>
                        <div className="perfil-label-row">
                          <span className="perfil-label">E-mail</span>
                          <button
                            type="button"
                            className={`btn-pencil${isEditing ? " active" : ""}`}
                            onClick={() => (isEditing ? handleCancel() : handleStartEditing("email"))}
                            aria-label="Editar dados cadastrais"
                            title={isEditing ? "Cancelar edição" : "Editar campos"}
                            disabled={saving}
                          >
                            <LapisIcon />
                            <span>{isEditing ? "Editando" : "Editar"}</span>
                          </button>
                        </div>
                        {isEditing ? (
                          <input
                            type="email"
                            name="email"
                            className="perfil-input"
                            autoComplete="email"
                            placeholder="voce@exemplo.com"
                            maxLength="254"
                            value={formValues.email}
                            onChange={handleInputChange}
                            required
                            disabled={saving}
                          />
                        ) : (
                          <span className="perfil-value">{dados.email}</span>
                        )}
                      </div>

                      {/* CPF (imutável) */}
                      <div className="perfil-field">
                        <div className="perfil-label-row">
                          <span className="perfil-label">CPF</span>
                          <span className="perfil-label-immutable">não editável</span>
                        </div>
                        <span className="perfil-value">
                          {formatarCPF(dados.cpf) || "Não informado"}
                        </span>
                      </div>

                      {/* Telefone */}
                      <div className={`perfil-field${isEditing ? " editing" : ""}`}>
                        <div className="perfil-label-row">
                          <span className="perfil-label">Telefone</span>
                          <button
                            type="button"
                            className={`btn-pencil${isEditing ? " active" : ""}`}
                            onClick={() => (isEditing ? handleCancel() : handleStartEditing("telefone"))}
                            aria-label="Editar dados cadastrais"
                            title={isEditing ? "Cancelar edição" : "Editar campos"}
                            disabled={saving}
                          >
                            <LapisIcon />
                            <span>{isEditing ? "Editando" : "Editar"}</span>
                          </button>
                        </div>
                        {isEditing ? (
                          <input
                            type="tel"
                            name="telefone"
                            className="perfil-input"
                            autoComplete="tel"
                            placeholder="(11) 99999-9999"
                            maxLength="15"
                            value={formValues.telefone}
                            onChange={handleInputChange}
                            disabled={saving}
                          />
                        ) : (
                          <span className={`perfil-value${!dados.telefone ? " empty" : ""}`}>
                            {formatarTelefone(dados.telefone) || "Não informado"}
                          </span>
                        )}
                      </div>

                      {/* Data de nascimento */}
                      <div className={`perfil-field full${isEditing ? " editing" : ""}`}>
                        <div className="perfil-label-row">
                          <span className="perfil-label">Data de nascimento</span>
                          <button
                            type="button"
                            className={`btn-pencil${isEditing ? " active" : ""}`}
                            onClick={() => (isEditing ? handleCancel() : handleStartEditing("dataNascimento"))}
                            aria-label="Editar dados cadastrais"
                            title={isEditing ? "Cancelar edição" : "Editar campos"}
                            disabled={saving}
                          >
                            <LapisIcon />
                            <span>{isEditing ? "Editando" : "Editar"}</span>
                          </button>
                        </div>
                        {isEditing ? (
                          <input
                            type="date"
                            name="dataNascimento"
                            className="perfil-input"
                            autoComplete="bday"
                            max={maxDate}
                            value={formValues.dataNascimento}
                            onChange={handleInputChange}
                            disabled={saving}
                          />
                        ) : (
                          <span
                            className={`perfil-value${!dados.dataNascimento ? " empty" : ""}`}
                          >
                            {formatarData(dados.dataNascimento) || "Não informada"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações de salvar/cancelar quando em edição */}
                    {isEditing && (
                      <div className="perfil-edit-actions">
                        <button
                          type="button"
                          className="perfil-btn-cancel"
                          onClick={handleCancel}
                          disabled={saving}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="perfil-btn-save"
                          disabled={saving}
                        >
                          {saving ? "Salvando..." : "Salvar alterações"}
                        </button>
                      </div>
                    )}
                  </form>

                  {(dados.dataCadastro || dados.dataAtualizacao || typeof dados.ativo === "boolean") && (
                    <div className="perfil-section">
                      <p className="perfil-section-title">Informações da conta</p>
                      <div className="perfil-grid">
                        {typeof dados.ativo === "boolean" && (
                          <CampoInfo label="Status" value={dados.ativo ? "Ativo" : "Inativo"} />
                        )}
                        {dados.dataCadastro && (
                          <CampoInfo label="Cadastrado em" value={formatarData(dados.dataCadastro)} />
                        )}
                        {dados.dataAtualizacao && (
                          <CampoInfo
                            label="Atualizado em"
                            value={formatarData(dados.dataAtualizacao)}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  {!isEditing && dados.ativo === true && ["interessado", "voluntario"].includes(dados.tipoUsuario?.toLowerCase()) && (
                    <DesativarConta onSucesso={onContaDesativada} />
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
