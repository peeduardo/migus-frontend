import React, { useState } from "react";
import { cadastrar } from "../services/auth";
import FeedbackMessage from "../components/FeedbackMessage";
import PasswordInput from "../components/Password";

function ultimoDiaValido() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}


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

.signup .intro { margin-bottom: 16px; }
.signup .field { gap: 5px; margin-bottom: 10px; }
.signup .field input { height: 42px; }
.signup .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
.signup .field-grid .field { margin-bottom: 10px; }
.signup .primary-button { min-height: 45px; }
.signup .form-switch { margin-top: 14px; }
.consent { margin: 9px 0 0; color: #8e9a93; font-size: 9px; line-height: 1.5; text-align: center; }
@media (max-width: 430px) {
  .signup .field-grid { grid-template-columns: 1fr; gap: 0; }
  .signup .field-grid .field { margin-bottom: 10px; }
}

`;

export default function CadastroScreen({ onCreated, onLogin }) {
  const maxDate = ultimoDiaValido();
  const [values, setValues] = useState({
    nome: "", email: "", senha: "", confirmarSenha: "", cpf: "", telefone: "", dataNascimento: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(event) {
    setValues(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const cpf = values.cpf.replace(/\D/g, "");
    if (cpf.length !== 11) return setError("Informe um CPF com 11 números.");
    if (values.senha.length < 8 || values.senha.length > 72) return setError("A senha deve ter entre 8 e 72 caracteres.");
    if (values.senha !== values.confirmarSenha) return setError("As senhas não são iguais.");

    setLoading(true);
    try {
      await cadastrar({
        nome: values.nome.trim(),
        email: values.email.trim(),
        senha: values.senha,
        cpf,
        telefone: values.telefone.trim() || null,
        dataNascimento: values.dataNascimento || null,
      });
      onCreated();
    } catch (err) {
      setError(err.message || "Não foi possível criar a conta. Tente novamente.");
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
        <p className="intro">Crie seu acesso para fazer parte dessa rede.</p>
        <form onSubmit={submit}>
          <FeedbackMessage>{error}</FeedbackMessage>
          <label className="field">Nome completo
            <input name="nome" autoComplete="name" placeholder="Como podemos chamar você?" maxLength="120" value={values.nome} onChange={update} required />
          </label>
          <label className="field">Seu e-mail
            <input type="email" name="email" autoComplete="email" placeholder="voce@exemplo.com" maxLength="254" value={values.email} onChange={update} required />
          </label>
          <div className="field-grid">
            <label className="field">CPF
              <input name="cpf" inputMode="numeric" autoComplete="off" placeholder="Somente números" maxLength="11" value={values.cpf} onChange={update} required />
            </label>
            <label className="field">Telefone
              <input type="tel" name="telefone" autoComplete="tel" placeholder="11 999999999" maxLength="11" value={values.telefone} onChange={update} />
            </label>
          </div>
          <label className="field">Data de nascimento <small>opcional</small>
            <input type="date" name="dataNascimento" autoComplete="bday" max={maxDate} value={values.dataNascimento} onChange={update} />
          </label>
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
          />
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Criando seu acesso..." : "Criar minha conta"} {!loading && <span>→</span>}
          </button>
          <p className="consent">Ao continuar, você confirma que os dados informados são seus e estão corretos.</p>
        </form>
        <p className="form-switch">Já tem uma conta? <button type="button" onClick={onLogin}>Entrar</button></p>
      </div>

    </>
  );
}



