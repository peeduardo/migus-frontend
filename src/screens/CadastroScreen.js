import React, { useRef, useState } from "react";
import { cadastrar } from "../services/auth";
import FeedbackMessage from "../components/FeedbackMessage";
import PasswordInput from "../components/Password";
import TextField from "../components/TextField";

function ultimoDiaValido() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
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

.signup .intro { margin-bottom: 16px; }
.signup .field { gap: 5px; margin-bottom: 10px; }
.signup .field input { height: 42px; }
.signup .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
.signup .field-grid .field { margin-bottom: 10px; }
.signup .primary-button { min-height: 45px; }
.signup .form-switch { margin-top: 14px; }
.consent { margin: 9px 0 0; color: #4f6159; font-size: 12px; line-height: 1.5; text-align: center; }
@media (max-width: 430px) {
  .signup .field-grid { grid-template-columns: 1fr; gap: 0; }
  .signup .field-grid .field { margin-bottom: 10px; }
}

`;

// A ordem das chaves segue a ordem de foco da tela: Nome → E-mail → CPF → Telefone → Nascimento → Senha → Confirmação.
function validarCampos(values) {
  const erros = {};
  const cpf = values.cpf.replace(/\D/g, "");
  const telLimpo = values.telefone.replace(/\D/g, "");

  if (!values.nome.trim()) erros.nome = "Escreva seu nome completo.";
  if (!values.email.trim()) erros.email = "Escreva seu e-mail.";
  else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) erros.email = "Escreva um e-mail completo, como voce@exemplo.com.";
  if (!cpf) erros.cpf = "Escreva seu CPF.";
  else if (cpf.length !== 11) erros.cpf = "O CPF precisa ter 11 números.";
  if (telLimpo.length > 0 && !validarTelefone(telLimpo)) erros.telefone = "Esse telefone não parece certo. Use o DDD e o número, como (11) 99999-9999.";
  if (!values.senha) erros.senha = "Crie uma senha.";
  else if (values.senha.length < 8 || values.senha.length > 72) erros.senha = "A senha precisa ter de 8 a 72 caracteres.";
  if (!values.confirmarSenha) erros.confirmarSenha = "Escreva a senha novamente.";
  else if (values.senha !== values.confirmarSenha) erros.confirmarSenha = "As duas senhas precisam ser iguais.";
  return erros;
}

export default function CadastroScreen({ onCreated, onLogin }) {
  const maxDate = ultimoDiaValido();
  const formRef = useRef(null);
  const [values, setValues] = useState({
    nome: "", email: "", senha: "", confirmarSenha: "", cpf: "", telefone: "", dataNascimento: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function update(event) {
    const { name, value } = event.target;
    setFieldErrors(current => (current[name] ? { ...current, [name]: undefined } : current));
    if (name === "telefone") {
      setValues(current => ({ ...current, [name]: formatarInputTelefone(value) }));
    } else {
      setValues(current => ({ ...current, [name]: value }));
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const erros = validarCampos(values);
    setFieldErrors(erros);
    const primeiro = Object.keys(erros)[0];
    if (primeiro) {
      setError("Alguns campos precisam de ajuda. Veja as mensagens abaixo de cada campo.");
      formRef.current?.elements[primeiro]?.focus();
      return;
    }
    const cpf = values.cpf.replace(/\D/g, "");
    const telLimpo = values.telefone.replace(/\D/g, "");

    setLoading(true);
    try {
      await cadastrar({
        nome: values.nome.trim(),
        email: values.email.trim(),
        senha: values.senha,
        cpf,
        telefone: telLimpo || null,
        dataNascimento: values.dataNascimento || null,
      });
      onCreated();
    } catch (err) {
      setError(err.message || "Não conseguimos criar sua conta. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{styles}</style>

      <div className="form-content signup">
        <span className="kicker">UM BOM COMEÇO</span>
        <h2>Vamos nos conhecer<span className="coral">?</span></h2>
        <p className="intro">Crie seu acesso para fazer parte dessa rede. Os campos sem a indicação "(opcional)" são obrigatórios.</p>
        <form ref={formRef} onSubmit={submit} noValidate aria-label="Criar conta">
          <FeedbackMessage>{error}</FeedbackMessage>
          <TextField label="Nome completo" name="nome" autoComplete="name" placeholder="Como podemos chamar você?" maxLength="120" value={values.nome} onChange={update} error={fieldErrors.nome} />
          <TextField label="Seu e-mail" type="email" name="email" autoComplete="email" placeholder="voce@exemplo.com" maxLength="254" value={values.email} onChange={update} error={fieldErrors.email} />
          <div className="field-grid">
            <TextField label="CPF" name="cpf" inputMode="numeric" autoComplete="off" placeholder="Somente números" maxLength="11" value={values.cpf} onChange={update} help="Escreva os 11 números, sem pontos." error={fieldErrors.cpf} />
            <TextField label="Telefone" optional required={false} type="tel" name="telefone" autoComplete="tel" placeholder="(11) 99999-9999" maxLength="15" inputMode="tel" value={values.telefone} onChange={update} help="Com o DDD." error={fieldErrors.telefone} />
          </div>
          <TextField label="Data de nascimento" optional required={false} type="date" name="dataNascimento" autoComplete="bday" max={maxDate} value={values.dataNascimento} onChange={update} />
          <PasswordInput
            label="Crie uma senha"
            name="senha"
            autoComplete="new-password"
            placeholder="Pelo menos 8 caracteres"
            value={values.senha}
            onChange={update}
            visible={showPassword}
            onToggle={() => setShowPassword(current => !current)}
            minLength="8"
            maxLength="72"
            help="Use de 8 a 72 caracteres."
            error={fieldErrors.senha}
          />
          <PasswordInput
            label="Confirme sua senha"
            name="confirmarSenha"
            autoComplete="new-password"
            placeholder="Digite a senha novamente"
            value={values.confirmarSenha}
            onChange={update}
            visible={showPassword}
            onToggle={() => setShowPassword(current => !current)}
            maxLength="72"
            error={fieldErrors.confirmarSenha}
          />
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Criando seu acesso..." : "Criar minha conta"} {!loading && <span>→</span>}
          </button>
          <p className="consent">Ao continuar, você diz que os dados são seus e estão certos.</p>
        </form>
        <p className="form-switch">Já tem uma conta? <button type="button" onClick={onLogin}>Entrar</button></p>
      </div>

    </>
  );
}



