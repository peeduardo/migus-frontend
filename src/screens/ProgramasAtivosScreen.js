import React, { useCallback, useEffect, useRef, useState } from "react";
import Brand from "../components/PagInicial";
import FeedbackMessage from "../components/FeedbackMessage";
import SiteFooter from "../components/SiteFooter";
import { inscreverEmPrograma, listarProgramasAtivos } from "../services/programas";

const ITENS_POR_PAGINA = 6;

const styles = String.raw`
.programas-page { color: var(--ink); background: var(--cream); }
.programas-page header { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 88px; border-bottom: 1px solid #173e3b1a; }
.programas-page main { width: min(980px, 100%); margin: 36px auto; }
.programas-page h1 { margin: 0 0 12px; font: 500 clamp(29px, 4vw, 36px)/1.15 Georgia, serif; letter-spacing: -1px; }
.programas-page .intro { color: #526b62; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
.programas-page button { min-height: 40px; padding: 8px 16px; border: 1px solid var(--teal); border-radius: 9px; color: var(--teal); background: transparent; cursor: pointer; font: inherit; font-size: 13px; }
.programas-page button:hover:not(:disabled) { background: #e4eee7; }
.programas-page button:disabled { cursor: not-allowed; opacity: .6; }
.programas-page :is(button, a):focus-visible { outline: 3px solid var(--teal); outline-offset: 3px; }
.programas-lista { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; margin: 0 0 24px; padding: 0; }
.programas-page .programa-card { display: flex; flex-direction: column; align-items: stretch; gap: 10px; width: 100%; height: 100%; padding: 22px; border: 1px solid #24423912; border-radius: 18px; color: var(--ink); background: var(--paper); box-shadow: 0 12px 40px #1f3c510c; text-align: left; transition: border-color .15s ease, box-shadow .15s ease; }
.programas-page .programa-card:hover:not(:disabled) { background: var(--paper); border-color: #5c9f91; box-shadow: 0 14px 44px #1f3c5018; }
.programa-card h2 { margin: 0; font: 500 21px Georgia, serif; letter-spacing: -.4px; }
.programa-card p { margin: 0; color: #526b62; font-size: 13px; line-height: 1.55; }
.programa-card .resumo { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.programa-card .detalhes-link { margin-top: auto; color: var(--teal); font-size: 12px; font-weight: 700; }
.programa-categorias { display: flex; flex-wrap: wrap; gap: 6px; }
.programa-categoria { padding: 3px 10px; border-radius: 999px; color: #1d5e57; background: #dcece3; font-size: 11px; font-weight: 700; }
.programa-selo { color: #1d5e57; font-size: 11px; font-weight: 700; }
.modal-overlay { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 18px; background: rgba(23, 62, 59, .45); }
.modal-programa { position: relative; width: min(560px, 100%); max-height: 90vh; overflow-y: auto; padding: clamp(22px, 4vw, 34px); border-radius: 22px; background: var(--paper); box-shadow: 0 30px 90px #1f3c5040; }
.modal-programa h2 { margin: 0 36px 12px 0; font: 500 clamp(24px, 4vw, 30px)/1.2 Georgia, serif; letter-spacing: -.6px; }
.modal-programa .descricao { margin: 0 0 18px; color: #526b62; font-size: 14px; line-height: 1.65; white-space: pre-line; }
.modal-programa dl { margin: 18px 0 22px; display: grid; gap: 14px; }
.modal-programa dt { color: #82918a; font-size: 10px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
.modal-programa dd { margin: 3px 0 0; font-size: 14px; }
.programas-page .modal-fechar { position: absolute; top: 14px; right: 14px; width: 38px; height: 38px; min-height: 0; padding: 0; border-radius: 50%; font-size: 18px; line-height: 1; }
.programas-page .modal-programa .escolher { width: 100%; color: white; background: var(--teal); font-weight: 700; }
.programas-page .modal-programa .escolher:hover:not(:disabled) { background: #1d5e57; }
.programas-paginacao { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; }
.programas-paginacao button[aria-current="page"] { color: white; background: var(--teal); font-weight: 700; }
.programas-vazio { padding: 40px 20px; text-align: center; color: #526b62; }
`;

function rotuloHorario(programa) {
  const inicio = programa.horarioInicio ? String(programa.horarioInicio).slice(0, 5) : "";
  const fim = programa.horarioFim ? String(programa.horarioFim).slice(0, 5) : "";
  return inicio && fim ? `${inicio} às ${fim}` : "Não informado";
}

function listaTexto(valor) {
  return Array.isArray(valor) && valor.length ? valor.join(", ") : "Não informado";
}

export default function ProgramasAtivosScreen({ usuario, onInicio }) {
  const [programas, setProgramas] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [erroInscricao, setErroInscricao] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [inscrevendoId, setInscrevendoId] = useState(null);
  const [inscritos, setInscritos] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const botaoFechar = useRef(null);
  const abridor = useRef(null);

  const permitido = usuario?.tipoUsuario !== "RESPONSAVEL";

  const carregar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProgramas(await listarProgramasAtivos());
    } catch (err) {
      setError(err.message || "Não foi possível carregar os programas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (permitido) carregar();
  }, [permitido, carregar]);

  function abrirDetalhes(programa, evento) {
    abridor.current = evento.currentTarget;
    setErroInscricao("");
    setSelecionado(programa);
  }

  const fecharDetalhes = useCallback(() => {
    if (inscrevendoId) return;
    setSelecionado(null);
    if (abridor.current) abridor.current.focus();
  }, [inscrevendoId]);

  useEffect(() => {
    if (!selecionado) return undefined;
    botaoFechar.current?.focus();
    function aoTeclar(evento) {
      if (evento.key === "Escape") fecharDetalhes();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [selecionado, fecharDetalhes]);

  async function escolher(programa) {
    if (inscrevendoId) return;
    setErroInscricao("");
    setSucesso("");
    setInscrevendoId(programa.id);
    try {
      await inscreverEmPrograma(programa.id);
      setInscritos((atual) => [...atual, programa.id]);
      setSucesso(`Você se cadastrou no programa "${programa.nome}".`);
      setSelecionado(null);
    } catch (err) {
      setErroInscricao(err.message || "Não foi possível concluir o cadastro no programa.");
    } finally {
      setInscrevendoId(null);
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(programas.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = programas.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  return (
    <div className="site-shell programas-page">
      <style>{styles}</style>
      <header>
        <Brand href="/inicio" onClick={onInicio} />
        <button type="button" onClick={onInicio}>Voltar ao início</button>
      </header>
      <main>
        <h1>Programas ativos</h1>
        {!permitido ? (
          <FeedbackMessage>Esta página é destinada a usuários que desejam participar de programas.</FeedbackMessage>
        ) : (
          <>
            <p className="intro">Navegue pelos programas disponíveis e escolha um para se cadastrar.</p>
            <FeedbackMessage type="success">{sucesso}</FeedbackMessage>

            {loading && <p className="programas-vazio" role="status">Carregando programas...</p>}

            {!loading && error && (
              <div className="programas-vazio">
                <FeedbackMessage>{error}</FeedbackMessage>
                <button type="button" onClick={carregar}>Tentar novamente</button>
              </div>
            )}

            {!loading && !error && programas.length === 0 && (
              <p className="programas-vazio">Nenhum programa ativo no momento.</p>
            )}

            {!loading && !error && programas.length > 0 && (
              <>
                <ul className="programas-lista">
                  {visiveis.map((programa) => {
                    const jaInscrito = inscritos.includes(programa.id);
                    return (
                      <li key={programa.id}>
                        <button
                          type="button"
                          className="programa-card"
                          onClick={(evento) => abrirDetalhes(programa, evento)}
                          aria-haspopup="dialog"
                          aria-label={`Ver detalhes de ${programa.nome}`}
                        >
                          <h2>{programa.nome}</h2>
                          <p className="resumo">{programa.descricao}</p>
                          {Array.isArray(programa.categoria) && programa.categoria.length > 0 && (
                            <span className="programa-categorias">
                              {programa.categoria.map((cat) => (
                                <span key={cat} className="programa-categoria">{cat}</span>
                              ))}
                            </span>
                          )}
                          {jaInscrito && <span className="programa-selo">Cadastrado ✓</span>}
                          <span className="detalhes-link">Ver detalhes →</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <nav className="programas-paginacao" aria-label="Paginação de programas">
                  <button type="button" onClick={() => setPagina(paginaAtual - 1)} disabled={paginaAtual === 1}>
                    ← Anterior
                  </button>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numero) => (
                    <button
                      key={numero}
                      type="button"
                      onClick={() => setPagina(numero)}
                      aria-current={numero === paginaAtual ? "page" : undefined}
                      aria-label={`Página ${numero}`}
                    >
                      {numero}
                    </button>
                  ))}
                  <button type="button" onClick={() => setPagina(paginaAtual + 1)} disabled={paginaAtual === totalPaginas}>
                    Próxima →
                  </button>
                </nav>
              </>
            )}
          </>
        )}
      </main>

      {selecionado && (
        <div className="modal-overlay" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) fecharDetalhes(); }}>
          <div className="modal-programa" role="dialog" aria-modal="true" aria-labelledby="modal-programa-titulo">
            <button ref={botaoFechar} type="button" className="modal-fechar" onClick={fecharDetalhes} aria-label="Fechar detalhes">✕</button>
            <h2 id="modal-programa-titulo">{selecionado.nome}</h2>
            {Array.isArray(selecionado.categoria) && selecionado.categoria.length > 0 && (
              <div className="programa-categorias" style={{ marginBottom: 14 }}>
                {selecionado.categoria.map((cat) => (
                  <span key={cat} className="programa-categoria">{cat}</span>
                ))}
              </div>
            )}
            <p className="descricao">{selecionado.descricao || "Sem descrição."}</p>
            <dl>
              <div><dt>Dias disponíveis</dt><dd>{listaTexto(selecionado.diasDisponiveis)}</dd></div>
              <div><dt>Horário</dt><dd>{rotuloHorario(selecionado)}</dd></div>
            </dl>
            <FeedbackMessage>{erroInscricao}</FeedbackMessage>
            <button
              type="button"
              className="escolher"
              onClick={() => escolher(selecionado)}
              disabled={inscritos.includes(selecionado.id) || inscrevendoId !== null}
            >
              {inscritos.includes(selecionado.id)
                ? "Cadastrado ✓"
                : inscrevendoId === selecionado.id ? "Cadastrando..." : "Quero me cadastrar"}
            </button>
          </div>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}
