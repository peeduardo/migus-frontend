import React, { useEffect, useRef, useState } from "react";
import FeedbackMessage from "../components/FeedbackMessage";
import { buscarPrograma, editarPrograma } from "../services/programas";

const camposVazios = {
  nome: "", descricao: "", categoria: "", diasDisponiveis: "",
  horarioInicio: "", horarioFim: "", ativo: "",
};

const styles = String.raw`
.editar-programa { width: min(680px, 100%); margin: 0 auto; padding: clamp(20px, 4vw, 38px); border: 1px solid #24423912; border-radius: 24px; background: var(--paper); box-shadow: 0 22px 75px #1f3c510c; }
.editar-programa h1 { margin: 0 0 12px; font: 500 clamp(29px, 4vw, 36px)/1.15 Georgia, serif; letter-spacing: -1px; color: #173e3b; }
.editar-programa .intro { color: #526b62; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
.editar-programa .field { display: grid; gap: 7px; margin-bottom: 18px; font-size: 14px; font-weight: 600; }
.editar-programa input, .editar-programa textarea, .editar-programa select { width: 100%; min-width: 0; min-height: 44px; padding: 11px; border: 1px solid #a4b6ac; border-radius: 8px; color: var(--ink); background: white; font: inherit; font-weight: 400; }
.editar-programa textarea { resize: vertical; line-height: 1.5; }
.editar-programa .field small { color: #526b62; font-size: 12px; font-weight: 400; }
.editar-programa .horarios { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.editar-programa button { min-height: 44px; padding: 10px 16px; border: 1px solid var(--teal); border-radius: 9px; color: var(--teal); background: transparent; cursor: pointer; }
.editar-programa .acoes { display: flex; gap: 12px; }
.editar-programa .acoes button { flex: 1; }
.editar-programa .enviar { color: white; background: var(--teal); font-weight: 700; }
.editar-programa button:hover:not(:disabled) { background: #e4eee7; }
.editar-programa .enviar:hover:not(:disabled) { background: #1d5e57; }
.editar-programa button:disabled { cursor: wait; opacity: .7; }
.editar-programa :is(input, textarea, select, button):focus-visible { outline: 3px solid var(--teal); outline-offset: 3px; }
.editar-programa fieldset { padding: 0; border: 0; margin: 0; min-width: 0; }
@media (max-width: 480px) { .editar-programa .horarios { grid-template-columns: 1fr; gap: 0; } .editar-programa .acoes { flex-direction: column; } }
`;

function paraFormulario(programa) {
  return {
    nome: programa?.nome || "",
    descricao: programa?.descricao || "",
    categoria: Array.isArray(programa?.categoria) ? programa.categoria.join("\n") : "",
    diasDisponiveis: Array.isArray(programa?.diasDisponiveis) ? programa.diasDisponiveis.join("\n") : "",
    horarioInicio: programa?.horarioInicio || "",
    horarioFim: programa?.horarioFim || "",
    ativo: typeof programa?.ativo === "boolean" ? String(programa.ativo) : "",
  };
}

export default function EditarProgramaScreen({ programaId, onVoltar, onSalvo }) {
  const [values, setValues] = useState(camposVazios);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState("");
  const [error, setError] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);
  const enviando = useRef(false);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErroCarga("");
    buscarPrograma(programaId)
      .then(programa => { if (ativo) setValues(paraFormulario(programa)); })
      .catch(err => { if (ativo) setErroCarga(err.message || "Não foi possível carregar o programa."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [programaId]);

  function update(event) {
    setSucesso(false);
    setValues(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (enviando.current) return;
    setError("");
    setSucesso(false);
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
      const atualizado = await editarPrograma(programaId, dados);
      setValues(paraFormulario(atualizado));
      setSucesso(true);
      if (onSalvo) onSalvo(atualizado);
    } catch (err) {
      setError(err.message || "Não foi possível salvar as alterações. Tente novamente.");
    } finally {
      enviando.current = false;
      setLoading(false);
    }
  }

  return (
    <section className="editar-programa">
      <style>{styles}</style>
      <h1>Editar programa</h1>
      {carregando ? <p className="intro" role="status">Carregando os dados do programa...</p>
        : erroCarga ? <>
          <FeedbackMessage>{erroCarga}</FeedbackMessage>
          <button type="button" onClick={onVoltar}>Voltar aos meus programas</button>
        </> : <>
          <p className="intro">Altere os dados do programa de voluntariado. Todos os campos são obrigatórios.</p>
          <FeedbackMessage>{error}</FeedbackMessage>
          {sucesso && <FeedbackMessage type="success">Programa atualizado com sucesso!</FeedbackMessage>}
          <form onSubmit={submit} aria-label="Edição de programa" aria-busy={loading} autoComplete="off">
            <fieldset disabled={loading}>
              <label className="field">Nome<input name="nome" value={values.nome} onChange={update} required /></label>
              <label className="field">Descrição<textarea name="descricao" rows="3" value={values.descricao} onChange={update} required /></label>
              <div className="field">
                <label htmlFor="editar-categoria">Categorias</label>
                <textarea id="editar-categoria" name="categoria" rows="2" aria-describedby="editar-categorias-ajuda" value={values.categoria} onChange={update} required />
                <small id="editar-categorias-ajuda">Escreva uma categoria por linha.</small>
              </div>
              <div className="field">
                <label htmlFor="editar-dias">Dias disponíveis</label>
                <textarea id="editar-dias" name="diasDisponiveis" rows="2" aria-describedby="editar-dias-ajuda" value={values.diasDisponiveis} onChange={update} required />
                <small id="editar-dias-ajuda">Escreva um dia por linha.</small>
              </div>
              <div className="horarios">
                <label className="field">Horário de início<input type="time" name="horarioInicio" value={values.horarioInicio} onChange={update} required /></label>
                <label className="field">Horário de fim<input type="time" name="horarioFim" value={values.horarioFim} onChange={update} required /></label>
              </div>
              <div className="field"><label htmlFor="editar-ativo">Ativo</label><select id="editar-ativo" name="ativo" value={values.ativo} onChange={update} required>
                <option value="">Selecione</option><option value="true">Sim</option><option value="false">Não</option>
              </select></div>
              <div className="acoes">
                <button type="button" onClick={onVoltar}>Voltar aos meus programas</button>
                <button className="enviar" type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar alterações"}</button>
              </div>
            </fieldset>
          </form>
        </>}
    </section>
  );
}
