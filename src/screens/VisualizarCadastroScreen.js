import React, { useCallback, useEffect, useState } from "react";
import DesativarConta from "../components/DesativarConta";
import Brand from "../components/PagInicial";
import SkipLink from "../components/SkipLink";
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
.dashboard header { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 88px; border-bottom: 1px solid #173e3b1a; max-width: 1260px; margin: auto; }
.dashboard header button { min-height: 44px; padding: 8px 16px; border: 1px solid var(--teal); border-radius: 9px; color: var(--teal); background: transparent; cursor: pointer; font: inherit; font-size: 13px; }
.dashboard header button:hover { background: #e4eee7; }

.perfil-main { min-height: calc(100vh - 90px); display: flex; flex-direction: column; align-items: center; padding: 32px 18px 60px; }
.perfil-wrapper { width: min(840px, 100%); display: flex; flex-direction: column; gap: 16px; }

/* Card Principal Ampliado */
.perfil-card { width: 100%; border: 1px solid rgba(36,66,57,0.1); border-radius: 28px; background: var(--paper); box-shadow: 0 28px 80px rgba(31,60,81,0.08), 0 4px 12px rgba(31,60,81,0.03); overflow: hidden; }

/* Cabeçalho do Card */
.perfil-header { display: flex; align-items: center; gap: 20px; padding: 32px clamp(24px, 5vw, 48px) 28px; background: linear-gradient(180deg, #fdfcf7 0%, var(--paper) 100%); border-bottom: 1px solid #e8ece5; }
.perfil-avatar { width: 62px; height: 62px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 20px; color: #1d5e57; background: #dcece3; font-size: 26px; font-weight: 750; box-shadow: 0 4px 14px rgba(29,94,87,0.12); border: 2px solid #ffffff; }
.perfil-header-info { flex: 1; min-width: 0; }
.perfil-header-info h2 { margin: 0 0 4px; font: 500 26px Georgia,serif; letter-spacing: -.5px; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.perfil-header-info small { color: #4f6159; font-size: 13px; }
.perfil-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; color: #1d5e57; background: #dcece3; font-size: 11px; font-weight: 700; white-space: nowrap; border: 1px solid rgba(29,94,87,0.15); }
.perfil-badge::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #26766d; }

/* Seções do Formulário */
.perfil-section { padding: 30px clamp(24px, 5vw, 48px); }
.perfil-section + .perfil-section { border-top: 1px solid #f0f3ed; }
.perfil-section-title { margin: 0 0 18px; color: #4f6159; font-size: 11px; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
.perfil-section-title::after { content: ""; flex: 1; height: 1px; background: #f0f3ed; }

/* Grid e Campos */
.perfil-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 24px; }
.perfil-field { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; border: 1px solid #edf1eb; border-radius: 12px; background: #fafbfa; transition: all .15s ease; }
.perfil-field:hover { border-color: #dfe6de; background: #f8faf8; }
.perfil-field.editing { border-color: #5c9f91; background: #ffffff; box-shadow: 0 0 0 3px rgba(64,142,126,0.12); }
.perfil-field.full { grid-column: 1 / -1; }

.perfil-label-row { display: flex; align-items: center; justify-content: space-between; }
.perfil-label { color: #4f6159; font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
.perfil-label-immutable { color: #4f6159; font-size: 12px; font-weight: 500; text-transform: none; background: #edf1ec; padding: 2px 7px; border-radius: 4px; }

/* Botão do Lápis */
.btn-pencil { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border: 1px solid var(--border-ui); border-radius: 6px; color: var(--teal); background: #ffffff; font-size: 11px; font-weight: 650; cursor: pointer; transition: all .15s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.btn-pencil:hover { background: #eaf3ee; border-color: #b8d4c6; color: #173e3b; }
.btn-pencil:focus-visible { outline: 2px solid var(--teal); outline-offset: 1px; }
.btn-pencil.active { background: #dcece3; border-color: #1d5e57; color: #1d5e57; font-weight: 700; }

.perfil-value { color: #1f2328; font-size: 14px; font-weight: 500; min-height: 24px; display: flex; align-items: center; }
.perfil-value.empty { color: #4f6159; font-style: italic; }

.perfil-input { width: 100%; height: 42px; padding: 0 13px; border: 1px solid var(--border-ui); border-radius: 8px; outline: none; color: var(--ink); background: white; font-size: 13.5px; font-family: inherit; font-weight: 500; transition: border-color .15s ease, box-shadow .15s ease; }
.perfil-input:focus { border-color: #5c9f91; box-shadow: 0 0 0 3px rgba(64,142,126,0.18); }
.perfil-input:disabled { background: #f4f6f2; color: #4f6159; cursor: not-allowed; }

/* Barra de Ações ao Editar */
.perfil-edit-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e8ece5; }
.perfil-btn-save { padding: 11px 24px; border: 0; border-radius: 10px; color: white; background: var(--teal); font-size: 13px; font-weight: 700; cursor: pointer; transition: all .15s ease; box-shadow: 0 2px 8px rgba(38,118,109,0.25); }
.perfil-btn-save:hover:not(:disabled) { background: #1d5e57; transform: translateY(-1px); }
.perfil-btn-save:disabled { cursor: wait; opacity: .7; }
.perfil-btn-cancel { padding: 11px 20px; border: 1px solid var(--border-ui); border-radius: 10px; color: #4e6c65; background: transparent; font-size: 13px; font-weight: 680; cursor: pointer; transition: background .15s ease; }
.perfil-btn-cancel:hover:not(:disabled) { background: #f3f5ed; color: #173e3b; }
.perfil-btn-cancel:disabled { cursor: not-allowed; opacity: .7; }

/* Loading & Erro */
.perfil-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 70px 20px; color: #4f6159; font-size: 14px; }
.perfil-spinner { width: 32px; height: 32px; border: 3px solid #e0e8e4; border-top-color: var(--teal); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.perfil-error { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 24px; text-align: center; }
.perfil-error-icon { font-size: 36px; }
.perfil-error p { margin: 0; color: #4f6159; font-size: 14px; line-height: 1.6; }
.perfil-retry { padding: 10px 22px; border: 1px solid var(--border-ui); border-radius: 999px; color: #4e6c65; background: transparent; font-size: 13px; font-weight: 680; cursor: pointer; transition: background .15s ease; }
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
  const [fieldErrors, setFieldErrors] = useState({});
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
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
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
    setFieldErrors({});
  }

  async function handleSave(event) {
    if (event) event.preventDefault();
    setError("");
    setSuccess("");

    const telLimpo = formValues.telefone.replace(/\D/g, "");
    const erros = {};
    if (!formValues.nome.trim()) erros.nome = "Escreva seu nome completo.";
    if (!formValues.email.trim()) erros.email = "Escreva seu e-mail.";
    else if (!/^\S+@\S+\.\S+$/.test(formValues.email.trim())) erros.email = "Escreva um e-mail completo, como voce@exemplo.com.";
    if (telLimpo.length > 0 && !validarTelefone(telLimpo)) erros.telefone = "Esse telefone não parece certo. Use o DDD e o número, como (11) 99999-9999.";
    setFieldErrors(erros);
    const primeiro = Object.keys(erros)[0];
    if (primeiro) {
      setError("Alguns campos precisam de ajuda. Veja as mensagens abaixo de cada campo.");
      document.getElementById(`perfil-${primeiro}`)?.focus();
      return;
    }

    const userId = dados?.id || session?.usuario?.id || session?.usuario?._id;
    if (!userId) {
      return setError("Não encontramos o seu usuário. Entre de novo e tente outra vez.");
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
      setError(err.message || "Não conseguimos salvar seus dados. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <style>{styles}</style>

      <div className="dashboard">
        <SkipLink />
        <header>
          <Brand href="/inicio" onClick={onVoltar} />
          <button type="button" onClick={onVoltar}>Voltar ao início</button>
        </header>

        <main id="conteudo" tabIndex={-1} className="perfil-main">
          <div className="perfil-wrapper">
            <div className="perfil-card">
              {loading && (
                <div className="perfil-loading">
                  <span className="perfil-spinner" role="status" aria-label="Carregando" />
                  Carregando seus dados...
                </div>
              )}

              {!loading && error && !dados && (
                <div className="perfil-error">
                  <span className="perfil-error-icon" aria-hidden="true">⚠</span>
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
                    <span className="perfil-avatar" aria-hidden="true">
                      {(dados.nome || "V").charAt(0).toUpperCase()}
                    </span>
                    <div className="perfil-header-info">
                      <h2>{dados.nome}</h2>
                      <small>{dados.email}</small>
                    </div>
                    <span className="perfil-badge">{perfil}</span>
                  </div>

                  <form className="perfil-section" onSubmit={handleSave} noValidate aria-label="Dados pessoais">
                    <p className="perfil-section-title">Dados pessoais</p>

                    <FeedbackMessage type="error">{error}</FeedbackMessage>
                    <FeedbackMessage type="success">{success}</FeedbackMessage>

                    <div className="perfil-grid">
                      {/* Nome completo */}
                      <div className={`perfil-field full${isEditing ? " editing" : ""}`}>
                        <div className="perfil-label-row">
                          <label className="perfil-label" htmlFor="perfil-nome">Nome completo</label>
                          <button
                            type="button"
                            className={`btn-pencil${isEditing ? " active" : ""}`}
                            onClick={() => (isEditing ? handleCancel() : handleStartEditing("nome"))}
                            aria-label={isEditing ? "Cancelar edição" : "Editar nome completo"}
                            title={isEditing ? "Cancelar edição" : "Editar campos"}
                            disabled={saving}
                          >
                            <LapisIcon />
                            <span>{isEditing ? "Editando" : "Editar"}</span>
                          </button>
                        </div>
                        {isEditing ? (
                          <input
                            id="perfil-nome"
                            type="text"
                            aria-invalid={fieldErrors.nome ? "true" : undefined}
                            aria-describedby={fieldErrors.nome ? "perfil-nome-erro" : undefined}
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
                        {fieldErrors.nome && <span id="perfil-nome-erro" className="field-error">{fieldErrors.nome}</span>}
                      </div>

                      {/* E-mail */}
                      <div className={`perfil-field full${isEditing ? " editing" : ""}`}>
                        <div className="perfil-label-row">
                          <label className="perfil-label" htmlFor="perfil-email">E-mail</label>
                          <button
                            type="button"
                            className={`btn-pencil${isEditing ? " active" : ""}`}
                            onClick={() => (isEditing ? handleCancel() : handleStartEditing("email"))}
                            aria-label={isEditing ? "Cancelar edição" : "Editar e-mail"}
                            title={isEditing ? "Cancelar edição" : "Editar campos"}
                            disabled={saving}
                          >
                            <LapisIcon />
                            <span>{isEditing ? "Editando" : "Editar"}</span>
                          </button>
                        </div>
                        {isEditing ? (
                          <input
                            id="perfil-email"
                            type="email"
                            aria-invalid={fieldErrors.email ? "true" : undefined}
                            aria-describedby={fieldErrors.email ? "perfil-email-erro" : undefined}
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
                        {fieldErrors.email && <span id="perfil-email-erro" className="field-error">{fieldErrors.email}</span>}
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
                          <label className="perfil-label" htmlFor="perfil-telefone">Telefone</label>
                          <button
                            type="button"
                            className={`btn-pencil${isEditing ? " active" : ""}`}
                            onClick={() => (isEditing ? handleCancel() : handleStartEditing("telefone"))}
                            aria-label={isEditing ? "Cancelar edição" : "Editar telefone"}
                            title={isEditing ? "Cancelar edição" : "Editar campos"}
                            disabled={saving}
                          >
                            <LapisIcon />
                            <span>{isEditing ? "Editando" : "Editar"}</span>
                          </button>
                        </div>
                        {isEditing ? (
                          <input
                            id="perfil-telefone"
                            type="tel"
                            aria-invalid={fieldErrors.telefone ? "true" : undefined}
                            aria-describedby={fieldErrors.telefone ? "perfil-telefone-erro" : undefined}
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
                        {fieldErrors.telefone && <span id="perfil-telefone-erro" className="field-error">{fieldErrors.telefone}</span>}
                      </div>

                      {/* Data de nascimento */}
                      <div className={`perfil-field full${isEditing ? " editing" : ""}`}>
                        <div className="perfil-label-row">
                          <label className="perfil-label" htmlFor="perfil-nascimento">Data de nascimento</label>
                          <button
                            type="button"
                            className={`btn-pencil${isEditing ? " active" : ""}`}
                            onClick={() => (isEditing ? handleCancel() : handleStartEditing("dataNascimento"))}
                            aria-label={isEditing ? "Cancelar edição" : "Editar data de nascimento"}
                            title={isEditing ? "Cancelar edição" : "Editar campos"}
                            disabled={saving}
                          >
                            <LapisIcon />
                            <span>{isEditing ? "Editando" : "Editar"}</span>
                          </button>
                        </div>
                        {isEditing ? (
                          <input
                            id="perfil-nascimento"
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
