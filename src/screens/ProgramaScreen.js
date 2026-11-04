import React, { useEffect, useRef, useState } from "react";
import Brand from "../components/PagInicial";
import FeedbackMessage from "../components/FeedbackMessage";
import SiteFooter from "../components/SiteFooter";
import { cadastrarPrograma } from "../services/programas";

const camposVazios = {
  nome: "", descricao: "", categoria: "", diasDisponiveis: "",
  horarioInicio: "", horarioFim: "", ativo: "",
};

const styles = String.raw`
.programa-page { color: var(--ink); background: var(--cream); }
.programa-page header { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 88px; border-bottom: 1px solid #173e3b1a; }
.programa-page main { width: min(680px, 100%); margin: 36px auto; padding: clamp(20px, 4vw, 38px); border: 1px solid #24423912; border-radius: 24px; background: var(--paper); box-shadow: 0 22px 75px #1f3c510c; }
.programa-page h1 { margin: 0 0 12px; font: 500 clamp(29px, 4vw, 36px)/1.15 Georgia, serif; letter-spacing: -1px; }
.programa-page .intro { color: #526b62; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
.programa-page .field { display: grid; gap: 7px; margin-bottom: 18px; font-size: 14px; font-weight: 600; }
.programa-page input, .programa-page textarea, .programa-page select { width: 100%; min-width: 0; min-height: 44px; padding: 11px; border: 1px solid #a4b6ac; border-radius: 8px; color: var(--ink); background: white; font: inherit; font-weight: 400; }
.programa-page textarea { resize: vertical; line-height: 1.5; }
.programa-page .field small { color: #526b62; font-size: 12px; font-weight: 400; }
.programa-page .horarios { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.programa-page button { min-height: 44px; padding: 10px 16px; border: 1px solid var(--teal); border-radius: 9px; color: var(--teal); background: transparent; cursor: pointer; }
.programa-page .enviar { width: 100%; color: white; background: var(--teal); font-weight: 700; }
.programa-page button:hover:not(:disabled) { background: #e4eee7; }
.programa-page .enviar:hover:not(:disabled) { background: #1d5e57; }
.programa-page button:disabled { cursor: wait; opacity: .7; }
.programa-page :is(input, textarea, select, button, a):focus-visible { outline: 3px solid var(--teal); outline-offset: 3px; }
.programa-page fieldset { padding: 0; border: 0; margin: 0; min-width: 0; }
@media (max-width: 480px) { .programa-page .horarios { grid-template-columns: 1fr; gap: 0; } .programa-page main { margin: 24px auto; border-radius: 18px; } }
`;

export default function ProgramaScreen({ usuario, onInicio }) {
  const chaveRascunho = "migus.programa.rascunho." + usuario?.id;
  const [values, setValues] = useState(() => {
    try {
      return { ...camposVazios, ...JSON.parse(sessionStorage.getItem(chaveRascunho)) };
    } catch {
      return camposVazios;
    }
  });
  const [error, setError] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);
  const enviando = useRef(false);

  useEffect(() => {
    // O rascunho fica somente nesta aba e separado por usuário.
    try {
      if (sucesso) sessionStorage.removeItem(chaveRascunho);
      else sessionStorage.setItem(chaveRascunho, JSON.stringify(values));
    } catch {
      // O formulário também funciona se o navegador bloquear o armazenamento.
    }
  }, [chaveRascunho, values, sucesso]);

  function update(event) {
    setValues(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (enviando.current) return;
    setError("");
    const dados = {
      nome: values.nome.trim(), descricao: values.descricao.trim(),
      categoria: values.categoria.split("\n").map(item => item.trim()).filter(Boolean),
      diasDisponiveis: values.diasDisponiveis.split("\n").map(item => item.trim()).filter(Boolean),
      horarioInicio: values.horarioInicio, horarioFim: values.horarioFim, ativo: values.ativo === "true",
    };
    if (!dados.nome || !dados.descricao || !dados.categoria.length || !dados.diasDisponiveis.length
      || !dados.horarioInicio || !dados.horarioFim || values.ativo === "") {
      setError("Preencha todos os campos. Informe pelo menos uma categoria e um dia disponível.");
      return;
    }
    enviando.current = true;
    setLoading(true);
    try {
      await cadastrarPrograma(dados);
      setSucesso(true);
    } catch (err) {
      setError(err.message || "Não foi possível cadastrar o programa. Tente novamente.");
    } finally {
      enviando.current = false;
      setLoading(false);
    }
  }

  const permitido = usuario?.tipoUsuario === "RESPONSAVEL" && usuario?.ativo === true;
  return (
    <div className="site-shell programa-page">
      <style>{styles}</style>
      <header><Brand href="/inicio" onClick={onInicio} /><button type="button" onClick={onInicio}>Voltar ao início</button></header>
      <main>
        <h1>Cadastrar programa</h1>
        {!permitido ? <FeedbackMessage>Somente um responsável ativo pode cadastrar programas.</FeedbackMessage>
          : sucesso ? <>
            <FeedbackMessage type="success">Programa cadastrado com sucesso!</FeedbackMessage>
            <button type="button" onClick={() => { setValues(camposVazios); setSucesso(false); }}>Cadastrar outro programa</button>
          </> : <>
            <p className="intro">Preencha os dados do programa de voluntariado. Todos os campos são obrigatórios.</p>
            <FeedbackMessage>{error}</FeedbackMessage>
            <form onSubmit={submit} aria-label="Cadastro de programa" aria-busy={loading} autoComplete="off">
              <fieldset disabled={loading}>
                <label className="field">Nome<input name="nome" value={values.nome} onChange={update} required /></label>
                <label className="field">Descrição<textarea name="descricao" rows="3" value={values.descricao} onChange={update} required /></label>
                <div className="field">
                  <label htmlFor="categoria">Categorias</label>
                  <textarea id="categoria" name="categoria" rows="2" aria-describedby="categorias-ajuda" value={values.categoria} onChange={update} required />
                  <small id="categorias-ajuda">Escreva uma categoria por linha.</small>
                </div>
                <div className="field">
                  <label htmlFor="diasDisponiveis">Dias disponíveis</label>
                  <textarea id="diasDisponiveis" name="diasDisponiveis" rows="2" aria-describedby="dias-ajuda" value={values.diasDisponiveis} onChange={update} required />
                  <small id="dias-ajuda">Escreva um dia por linha.</small>
                </div>
                <div className="horarios">
                  <label className="field">Horário de início<input type="time" name="horarioInicio" value={values.horarioInicio} onChange={update} required /></label>
                  <label className="field">Horário de fim<input type="time" name="horarioFim" value={values.horarioFim} onChange={update} required /></label>
                </div>
                <div className="field"><label htmlFor="ativo">Ativo</label><select id="ativo" name="ativo" value={values.ativo} onChange={update} required>
                  <option value="">Selecione</option><option value="true">Sim</option><option value="false">Não</option>
                </select></div>
                <button className="enviar" type="submit" disabled={loading}>{loading ? "Cadastrando..." : "Cadastrar programa"}</button>
              </fieldset>
            </form>
          </>}
      </main>
      <SiteFooter />
    </div>
  );
}
