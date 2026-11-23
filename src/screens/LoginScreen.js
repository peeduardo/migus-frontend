import React, { useRef, useState } from "react";
import { ApiError } from "../services/auth";
import FeedbackMessage from "../components/FeedbackMessage";
import PasswordInput from "../components/Password";
import TextField from "../components/TextField";


const styles = String.raw`
.form-content h2 { margin: 10px 0 8px; font: 500 clamp(28px,2.6vw,36px)/1.15 Georgia,serif; letter-spacing: -1px; }
.intro { margin: 0 0 25px; color: #4f6159; font-size: 13px; line-height: 1.65; }
.primary-button { width: 100%; min-height: 48px; margin-top: 3px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; border: 0; border-radius: 9px; color: white; background: var(--teal); font-size: 13px; font-weight: 700; cursor: pointer; }
.primary-button:hover:not(:disabled) { background: #1d5e57; }
.primary-button:disabled { cursor: wait; opacity: .7; }
.primary-button span { font-size: 18px; font-weight: 400; }
.form-switch { margin: 21px 0 0; color: #4f6159; font-size: 12px; text-align: center; }
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  async function submit(event) {
    event.preventDefault();
    setError("");
    const erros = {};
    if (!email.trim()) erros.email = "Escreva seu e-mail.";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) erros.email = "Escreva um e-mail completo, como voce@exemplo.com.";
    if (!senha) erros.senha = "Escreva sua senha.";
    setFieldErrors(erros);
    const primeiro = Object.keys(erros)[0];
    if (primeiro) {
      setError("Alguns campos precisam de ajuda. Veja as mensagens abaixo de cada campo.");
      formRef.current?.elements[primeiro]?.focus();
      return;
    }
    setLoading(true);
    try {
      await onLogin(email.trim(), senha);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("O e-mail ou a senha estão errados. Confira e tente de novo.");
      } else if (err instanceof ApiError && err.status === 403) {
        setError("Esta conta está desativada. Fale com a equipe de atendimento.");
      } else {
        setError(err.message || "Não conseguimos entrar. Tente de novo.");
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
      <p className="intro">Escreva seu e-mail e sua senha para entrar.</p>
      <FeedbackMessage type="success">{successMessage}</FeedbackMessage>
      <form ref={formRef} onSubmit={submit} noValidate aria-label="Entrar na conta">
        <FeedbackMessage>{error}</FeedbackMessage>
        <TextField
          label="Seu e-mail"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          maxLength="254"
          value={email}
          onChange={event => { setEmail(event.target.value); setFieldErrors(c => ({ ...c, email: undefined })); }}
          error={fieldErrors.email}
        />
        <PasswordInput
          label="Senha"
          name="senha"
          autoComplete="current-password"
          placeholder="Digite sua senha"
          value={senha}
          onChange={event => { setSenha(event.target.value); setFieldErrors(c => ({ ...c, senha: undefined })); }}
          visible={showPassword}
          onToggle={() => setShowPassword(current => !current)}
          error={fieldErrors.senha}
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


