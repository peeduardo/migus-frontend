import React, { useRef, useState } from "react";
import { cadastrar } from "../services/auth";
import FeedbackMessage from "../components/FeedbackMessage";
import PasswordInput from "../components/Password";
import TextField from "../components/TextField";

function formatarData(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// O campo aceita qualquer data passada, mas o usuário deve ter no mínimo 17 anos.
function maxDataNascimento() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 17);
  d.setDate(d.getDate() - 1); // 17 anos completos = aniversário de 17 anos já passou
  return formatarData(d);
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

.transparencia { margin: 0 0 20px; padding: 13px 15px; border: 1px solid #c8dbd7; border-radius: 9px; background: #f4f9f8; color: #3a5048; font-size: 12px; line-height: 1.65; }
.transparencia strong { font-weight: 680; color: #2f4640; }
.transparencia ul { margin: 6px 0 0 16px; padding: 0; }
.transparencia ul li { margin-bottom: 3px; }

.termos-row { display: flex; align-items: flex-start; gap: 10px; margin: 14px 0 10px; }
.termos-row input[type="checkbox"] { flex-shrink: 0; width: 17px; height: 17px; margin-top: 2px; accent-color: var(--teal); cursor: pointer; }
.termos-row label { color: #2f4640; font-size: 12px; font-weight: 450; line-height: 1.55; cursor: pointer; }
.termos-row label a { color: var(--teal); font-weight: 600; text-decoration: underline; }
.termos-row label a:hover { color: #1d5e57; }
.termos-erro { margin: -6px 0 8px; color: #b00020; font-size: 12px; font-weight: 500; }

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
  if (!values.dataNascimento) {
    erros.dataNascimento = "Informe sua data de nascimento.";
  } else {
    const nascimento = new Date(values.dataNascimento + "T00:00:00");
    const limite = new Date();
    limite.setFullYear(limite.getFullYear() - 17);
    if (nascimento > new Date()) erros.dataNascimento = "A data de nascimento precisa ser no passado.";
    else if (nascimento > limite) erros.dataNascimento = "Você precisa ter pelo menos 17 anos para se cadastrar.";
  }
  if (!values.senha) erros.senha = "Crie uma senha.";
  else if (values.senha.length < 8 || values.senha.length > 72) erros.senha = "A senha precisa ter de 8 a 72 caracteres.";
  if (!values.confirmarSenha) erros.confirmarSenha = "Escreva a senha novamente.";
  else if (values.senha !== values.confirmarSenha) erros.confirmarSenha = "As duas senhas precisam ser iguais.";
  return erros;
}

export default function CadastroScreen({ onCreated, onLogin }) {
  const maxDate = maxDataNascimento();
  const formRef = useRef(null);
  const [values, setValues] = useState({
    nome: "", email: "", senha: "", confirmarSenha: "", cpf: "", telefone: "", dataNascimento: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [termosErro, setTermosErro] = useState(false);

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
    const semTermos = !aceitouTermos;
    setTermosErro(semTermos);
    const primeiro = Object.keys(erros)[0];
    if (primeiro || semTermos) {
      if (primeiro) {
        setError("Alguns campos precisam de ajuda. Veja as mensagens abaixo de cada campo.");
        formRef.current?.elements[primeiro]?.focus();
      } else {
        setError("Você precisa aceitar os termos para criar sua conta.");
      }
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
        dataNascimento: values.dataNascimento,
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

        <div className="transparencia" role="note" aria-label="Transparência no uso dos seus dados">
          <strong>Por que pedimos esses dados?</strong>
          <ul>
            <li><strong>Nome e e-mail</strong> — para identificar você e enviar comunicados sobre as atividades.</li>
            <li><strong>CPF</strong> — para confirmar sua identidade e evitar cadastros duplicados.</li>
            <li><strong>Telefone</strong> — opcional; usado para facilitar o contato direto.</li>
            <li><strong>Data de nascimento</strong> — para adequar as atividades ao perfil dos voluntários.</li>
          </ul>
          <p style={{ margin: "7px 0 0" }}>Seus dados ficam guardados com segurança, não são vendidos nem compartilhados com terceiros, e você pode solicitar a exclusão a qualquer momento.</p>
        </div>

        <form ref={formRef} onSubmit={submit} noValidate aria-label="Criar conta">
          <FeedbackMessage>{error}</FeedbackMessage>
          <TextField label="Nome completo" name="nome" autoComplete="name" placeholder="Como podemos chamar você?" maxLength="120" value={values.nome} onChange={update} error={fieldErrors.nome} />
          <TextField label="Seu e-mail" type="email" name="email" autoComplete="email" placeholder="voce@exemplo.com" maxLength="254" value={values.email} onChange={update} error={fieldErrors.email} />
          <div className="field-grid">
            <TextField label="CPF" name="cpf" inputMode="numeric" autoComplete="off" placeholder="Somente números" maxLength="11" value={values.cpf} onChange={update} help="Escreva os 11 números, sem pontos." error={fieldErrors.cpf} />
            <TextField label="Telefone" optional required={false} type="tel" name="telefone" autoComplete="tel" placeholder="(11) 99999-9999" maxLength="15" inputMode="tel" value={values.telefone} onChange={update} help="Com o DDD." error={fieldErrors.telefone} />
          </div>
          <TextField label="Data de nascimento" type="date" name="dataNascimento" autoComplete="bday" max={maxDate} value={values.dataNascimento} onChange={update} error={fieldErrors.dataNascimento} />
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
          <div className="termos-row">
            <input
              type="checkbox"
              id="aceitou-termos"
              name="aceitouTermos"
              checked={aceitouTermos}
              onChange={e => { setAceitouTermos(e.target.checked); if (e.target.checked) setTermosErro(false); }}
              aria-describedby={termosErro ? "termos-erro-msg" : undefined}
              aria-invalid={termosErro ? "true" : undefined}
            />
            <label htmlFor="aceitou-termos">
              Li e aceito os{" "}
              <a href="/politica-e-termos.pdf" target="_blank" rel="noopener noreferrer">
                Termos e condições
              </a>
            </label>
          </div>
          {termosErro && (
            <p id="termos-erro-msg" className="termos-erro" role="alert">
              Você precisa aceitar os termos para criar sua conta.
            </p>
          )}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Criando seu acesso..." : "Criar minha conta"} {!loading && <span>→</span>}
          </button>
          <p className="consent">Ao continuar, você confirma que os dados são seus e estão corretos.</p>
        </form>
        <p className="form-switch">Já tem uma conta? <button type="button" onClick={onLogin}>Entrar</button></p>
      </div>

    </>
  );
}



