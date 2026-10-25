import React, { useState } from "react";
import { ApiError } from "../services/auth";
import FeedbackMessage from "../components/FeedbackMessage";
import PasswordInput from "../components/Password";


const styles = String.raw`
.form-content h2 { margin: 10px 0 8px; font: 500 clamp(28px,2.6vw,36px)/1.15 Georgia,serif; letter-spacing: -1px; }
.intro { margin: 0 0 25px; color: #78857f; font-size: 13px; line-height: 1.65; }
.primary-button { width: 100%; min-height: 48px; margin-top: 3px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; border: 0; border-radius: 9px; color: white; background: var(--teal); font-size: 13px; font-weight: 700; cursor: pointer; }
.primary-button:hover:not(:disabled) { background: #1d5e57; }
.primary-button:disabled { cursor: wait; opacity: .7; }
.primary-button span { font-size: 18px; font-weight: 400; }
.form-switch { margin: 21px 0 0; color: #798780; font-size: 12px; text-align: center; }
.form-switch button { margin-left: 5px; padding: 0; border: 0; color: var(--teal); background: none; font-size: inherit; font-weight: 740; cursor: pointer; }
@media (max-width: 760px) { .form-content h2 { font-size: 31px; } }
@media (max-width: 430px) { .form-content h2 { font-size: 28px; } }

.login-screen .intro { margin-bottom: 25px; }

`;

export default function LoginScreen({ successMessage, onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(email.trim(), senha);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("E-mail ou senha não conferem. Confira seus dados e tente novamente.");
      } else if (err instanceof ApiError && err.status === 403) {
        setError("Esta conta está inativa. Entre em contato com a equipe de atendimento.");
      } else {
        setError(err.message || "Não foi possível entrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
      <>
        <style>{styles}</style>

    <div className="form-content login-screen">
      <span className="kicker">BEM-VINDO(A) DE VOLTA</span>
      <h2>Que bom ter você por aqui<span className="coral">.</span></h2>
      <p className="intro">Entre na sua conta para continuar fazendo parte.</p>
      <FeedbackMessage type="success">{successMessage}</FeedbackMessage>
      <form onSubmit={submit}>
        <FeedbackMessage>{error}</FeedbackMessage>
        <label className="field">Seu e-mail
          <input type="email" name="email" autoComplete="email" placeholder="voce@exemplo.com" maxLength="254" value={email} onChange={event => setEmail(event.target.value)} required />
        </label>
        <PasswordInput
          label="Senha"
          name="senha"
          autoComplete="current-password"
          placeholder="Digite sua senha"
          value={senha}
          onChange={event => setSenha(event.target.value)}
          visible={showPassword}
          onToggle={() => setShowPassword(current => !current)}
        />
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar na minha conta"} {!loading && <span>→</span>}
        </button>
      </form>
      <p className="form-switch">Ainda não tem uma conta? <button type="button" onClick={onRegister}>Criar meu cadastro</button></p>
    </div>

      </>
  );
}


