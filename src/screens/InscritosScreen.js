import React, { useCallback, useEffect, useRef, useState } from "react";
import Brand from "../components/PagInicial";
import FeedbackMessage from "../components/FeedbackMessage";
import SiteFooter from "../components/SiteFooter";
import { listarMeusProgramas, listarInscritos, listarProgramasAtivos, responderInscricao, transferirInscricao } from "../services/programas";

const styles = String.raw`
.inscritos-page { color: var(--ink); background: var(--cream); }
.inscritos-page header { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 88px; border-bottom: 1px solid #173e3b1a; }
.inscritos-page main { width: min(860px, 100%); margin: 36px auto; padding: clamp(20px, 4vw, 38px); border: 1px solid #24423912; border-radius: 24px; background: var(--paper); box-shadow: 0 22px 75px #1f3c510c; }
.inscritos-page h1 { margin: 0 0 12px; font: 500 clamp(29px, 4vw, 36px)/1.15 Georgia, serif; letter-spacing: -1px; }
.inscritos-page .intro { color: #526b62; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
.inscritos-page .field { display: grid; gap: 7px; margin-bottom: 18px; font-size: 14px; font-weight: 600; }
.inscritos-page select { width: 100%; min-height: 44px; padding: 11px; border: 1px solid #a4b6ac; border-radius: 8px; color: var(--ink); background: white; font: inherit; font-weight: 400; }
.inscritos-page button { min-height: 40px; padding: 8px 16px; border: 1px solid var(--teal); border-radius: 9px; color: var(--teal); background: transparent; cursor: pointer; font: inherit; font-size: 13px; }
.inscritos-page button:hover:not(:disabled) { background: #e4eee7; }
.inscritos-page :is(select, button):focus-visible { outline: 3px solid var(--teal); outline-offset: 3px; }
.inscritos-tabela-wrap { overflow-x: auto; }
.inscritos-tabela { width: 100%; border-collapse: collapse; font-size: 13px; }
.inscritos-tabela caption { padding: 0 0 10px; text-align: left; color: #82918a; font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
.inscritos-tabela th, .inscritos-tabela td { padding: 11px 12px; border-bottom: 1px solid #e8ece5; text-align: left; vertical-align: top; }
.inscritos-tabela th { color: #82918a; font-size: 10px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
.inscritos-vazio { padding: 30px 10px; text-align: center; color: #526b62; }
.inscritos-status { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.inscritos-status.aceita { color: #1e5e3a; background: #edf7ef; }
.inscritos-status.recusada { color: #984936; background: #fff2ed; }
.inscritos-status.pendente { color: #8a6a1f; background: #fbf1d3; }
.inscritos-status.transferida { color: #526b62; background: #eaecef; }
.inscritos-acoes { display: flex; gap: 8px; flex-wrap: wrap; }
.inscritos-page .inscritos-acoes button { min-height: 34px; padding: 5px 12px; font-size: 12px; font-weight: 700; }
.inscritos-page .inscritos-acoes .aceitar { color: white; background: var(--teal); }
.inscritos-page .inscritos-acoes .aceitar:hover:not(:disabled) { background: #1d5e57; }
.inscritos-page .inscritos-acoes .transferir { color: #3b5bdb; border-color: #3b5bdb; }
.inscritos-page .inscritos-acoes .transferir:hover:not(:disabled) { background: #eef2ff; }
.inscritos-page .inscritos-acoes button:disabled { cursor: wait; opacity: .6; }
.modal-overlay { position: fixed; inset: 0; background: #0006; display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-box { background: var(--paper, #fff); border-radius: 16px; padding: 28px; width: min(420px, 100%); box-shadow: 0 24px 80px #0003; display: grid; gap: 16px; }
.modal-box h2 { margin: 0; font: 500 20px/1.3 Georgia, serif; letter-spacing: -.5px; }
.modal-box p { margin: 0; font-size: 14px; color: #526b62; }
.modal-box .field { display: grid; gap: 7px; font-size: 14px; font-weight: 600; }
.modal-box select { width: 100%; min-height: 44px; padding: 11px; border: 1px solid #a4b6ac; border-radius: 8px; color: var(--ink); background: white; font: inherit; font-weight: 400; }
.modal-acoes { display: flex; gap: 10px; justify-content: flex-end; }
.modal-acoes .confirmar { color: white; background: #3b5bdb; border-color: #3b5bdb; }
.modal-acoes .confirmar:hover:not(:disabled) { background: #2f4abf; }
.modal-acoes .cancelar { color: #526b62; border-color: #a4b6ac; }
.modal-acoes .cancelar:hover:not(:disabled) { background: #f0f4f0; }
`;

function formatarData(valor) {
  if (!valor) return "—";
  const match = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(valor);
}

function formatarTelefone(tel) {
  if (!tel) return "—";
  const d = String(tel).replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return String(tel);
}

// O status exato vem do backend; reconhece variações comuns e trata o restante como pendente.
function situacao(inscrito) {
  const status = String(inscrito?.status || "").toUpperCase();
  if (status.startsWith("APROV") || status.startsWith("ACEIT")) return { chave: "aceita", rotulo: "Aceita" };
  if (status.startsWith("RECUS")) return { chave: "recusada", rotulo: "Recusada" };
  if (status.startsWith("TRANSF")) return { chave: "transferida", rotulo: "Transferida" };
  return { chave: "pendente", rotulo: "Pendente" };
}

function idInscricao(inscrito) {
  return inscrito?.inscricaoId || inscrito?.id;
}

export default function InscritosScreen({ usuario, onInicio }) {
  const permitido = usuario?.tipoUsuario === "RESPONSAVEL" && usuario?.ativo === true;

  const [programas, setProgramas] = useState([]);
  const [programasAtivos, setProgramasAtivos] = useState([]);
  const [programaId, setProgramaId] = useState("");
  const [inscritos, setInscritos] = useState([]);
  const [loadingProgramas, setLoadingProgramas] = useState(permitido);
  const [loadingInscritos, setLoadingInscritos] = useState(false);
  const [error, setError] = useState("");
  const [respondendo, setRespondendo] = useState(null);
  const [erroResposta, setErroResposta] = useState("");
  const selecaoAtual = useRef("");

  // Estado do modal de transferência
  const [modalTransferir, setModalTransferir] = useState(null); // inscrito alvo
  const [programaDestinoId, setProgramaDestinoId] = useState("");
  const [transferindo, setTransferindo] = useState(false);
  const [erroTransferencia, setErroTransferencia] = useState("");

  const carregarProgramas = useCallback(async () => {
    setLoadingProgramas(true);
    setError("");
    try {
      setProgramas(await listarMeusProgramas());
    } catch (err) {
      setError(err.message || "Não foi possível carregar os programas.");
    } finally {
      setLoadingProgramas(false);
    }
  }, []);

  useEffect(() => {
    if (permitido) carregarProgramas();
  }, [permitido, carregarProgramas]);

  async function selecionar(event) {
    const id = event.target.value;
    selecaoAtual.current = id;
    setProgramaId(id);
    setInscritos([]);
    setError("");
    setErroResposta("");
    if (!id) return;
    setLoadingInscritos(true);
    try {
      const lista = await listarInscritos(id);
      if (selecaoAtual.current === id) {
        setInscritos(lista.filter((i) => !("programaId" in i) || String(i.programaId) === id));
      }
    } catch (err) {
      if (selecaoAtual.current === id) setError(err.message || "Não foi possível carregar os inscritos.");
    } finally {
      if (selecaoAtual.current === id) setLoadingInscritos(false);
    }
  }

  useEffect(() => {
    if (!modalTransferir) return;
    let cancelada = false;
    setProgramasAtivos([]);
    listarProgramasAtivos()
      .then(lista => { if (!cancelada) setProgramasAtivos(lista); })
      .catch(err => { if (!cancelada) setErroTransferencia(err.message || "Não foi possível carregar os destinos."); });
    return () => { cancelada = true; };
  }, [modalTransferir]);

  function abrirModalTransferir(inscrito) {
    setModalTransferir(inscrito);
    setProgramaDestinoId("");
    setErroTransferencia("");
  }

  function fecharModalTransferir() {
    if (transferindo) return;
    setModalTransferir(null);
    setProgramaDestinoId("");
    setErroTransferencia("");
  }

  async function confirmarTransferencia() {
    if (!modalTransferir || !programaDestinoId || transferindo) return;
    const idAlvo = idInscricao(modalTransferir);
    const programaOrigem = programaId;
    setErroTransferencia("");
    setTransferindo(true);
    try {
      await transferirInscricao(programaOrigem, idAlvo, programaDestinoId);
      if (selecaoAtual.current === programaOrigem) {
        setInscritos((atual) => atual.filter((i) => idInscricao(i) !== idAlvo));
      }
      setModalTransferir(null);
      setProgramaDestinoId("");
    } catch (err) {
      setErroTransferencia(err.message || "Não foi possível transferir o voluntário.");
    } finally {
      setTransferindo(false);
    }
  }

  async function responder(inscrito, decisao) {
    const idAlvo = idInscricao(inscrito);
    if (respondendo || !idAlvo) return;
    const programaDaAcao = programaId;
    setErroResposta("");
    setRespondendo(idAlvo);
    try {
      const atualizada = await responderInscricao(programaDaAcao, idAlvo, decisao);
      if (selecaoAtual.current !== programaDaAcao) return;
      const status = atualizada?.status || (decisao === "aprovar" ? "APROVADA" : "RECUSADA");
      setInscritos((atual) => atual.map((i) => (idInscricao(i) === idAlvo ? { ...i, status } : i)));
    } catch (err) {
      if (selecaoAtual.current === programaDaAcao) {
        setErroResposta(err.message || "Não foi possível responder à inscrição.");
      }
    } finally {
      setRespondendo(null);
    }
  }

  const programaSelecionado = programas.find((p) => String(p.id) === programaId);
  const programasDestino = programasAtivos.filter((p) => String(p.id) !== programaId);

  return (
    <div className="site-shell inscritos-page">
      <style>{styles}</style>
      <header>
        <Brand href="/inicio" onClick={onInicio} />
        <button type="button" onClick={onInicio}>Voltar ao início</button>
      </header>
      <main>
        <h1>Inscritos por programa</h1>
        {!permitido ? (
          <FeedbackMessage>Somente um responsável ativo pode ver os inscritos dos programas.</FeedbackMessage>
        ) : (
          <>
            <p className="intro">Escolha um dos programas que você criou para ver quem se inscreveu.</p>
            <FeedbackMessage>{error}</FeedbackMessage>
            <FeedbackMessage>{erroResposta}</FeedbackMessage>

            {loadingProgramas && <p className="inscritos-vazio" role="status">Carregando programas...</p>}

            {!loadingProgramas && programas.length === 0 && !error && (
              <p className="inscritos-vazio">Você ainda não cadastrou nenhum programa.</p>
            )}

            {!loadingProgramas && programas.length > 0 && (
              <div className="field">
                <label htmlFor="programa">Programa</label>
                <select id="programa" value={programaId} onChange={selecionar} disabled={loadingInscritos}>
                  <option value="">Selecione um programa</option>
                  {programas.map((p) => (
                    <option key={p.id} value={String(p.id)}>{p.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {loadingInscritos && <p className="inscritos-vazio" role="status">Carregando inscritos...</p>}

            {programaId && !loadingInscritos && !error && (
              inscritos.length === 0
                ? <p className="inscritos-vazio">Nenhuma pessoa inscrita neste programa ainda.</p>
                : (
                  <div className="inscritos-tabela-wrap">
                    <table className="inscritos-tabela">
                      <caption>{inscritos.length} inscrito(s) em {programaSelecionado?.nome}</caption>
                      <thead>
                        <tr>
                          <th scope="col">Nome</th>
                          <th scope="col">E-mail</th>
                          <th scope="col">Telefone</th>
                          <th scope="col">Inscrito em</th>
                          <th scope="col">Situação</th>
                          <th scope="col">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inscritos.map((i, indice) => {
                          const { chave, rotulo } = situacao(i);
                          const idAlvo = idInscricao(i);
                          return (
                            <tr key={idAlvo || i.usuarioId || i.email || indice}>
                              <td>{i.nome || "—"}</td>
                              <td>{i.email || "—"}</td>
                              <td>{formatarTelefone(i.telefone)}</td>
                              <td>{formatarData(i.dataInscricao || i.criadoEm || i.dataCadastro)}</td>
                              <td><span className={`inscritos-status ${chave}`}>{rotulo}</span></td>
                              <td>
                                <div className="inscritos-acoes">
                                  {i.status === "PENDENTE" && (
                                    <>
                                      <button
                                        type="button"
                                        className="aceitar"
                                        onClick={() => responder(i, "aprovar")}
                                        disabled={respondendo !== null || !idAlvo}
                                        aria-label={`Aceitar inscrição de ${i.nome}`}
                                      >
                                        {respondendo === idAlvo ? "Enviando..." : "Aceitar"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => responder(i, "recusar")}
                                        disabled={respondendo !== null || !idAlvo}
                                        aria-label={`Recusar inscrição de ${i.nome}`}
                                      >
                                        Recusar
                                      </button>
                                    </>
                                  )}
                                  {chave === "aceita" && (
                                    <button
                                      type="button"
                                      className="transferir"
                                      onClick={() => abrirModalTransferir(i)}
                                      disabled={respondendo !== null}
                                      aria-label={`Transferir ${i.nome} para outro programa`}
                                    >
                                      Transferir
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
            )}
          </>
        )}
      </main>
      <SiteFooter />

      {modalTransferir && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
          <div className="modal-box">
            <h2 id="modal-titulo">Transferir voluntário</h2>
            <p>
              Transferir <strong>{modalTransferir.nome || "este voluntário"}</strong> para outro programa.
              Ele será removido do programa atual.
            </p>
            <FeedbackMessage>{erroTransferencia}</FeedbackMessage>
            <div className="field">
              <label htmlFor="programa-destino">Programa de destino</label>
              <select
                id="programa-destino"
                value={programaDestinoId}
                onChange={(e) => setProgramaDestinoId(e.target.value)}
                disabled={transferindo}
              >
                <option value="">Selecione o programa destino</option>
                {programasDestino.map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.nome}</option>
                ))}
              </select>
            </div>
            <div className="modal-acoes inscritos-acoes">
              <button
                type="button"
                className="cancelar"
                onClick={fecharModalTransferir}
                disabled={transferindo}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="confirmar"
                onClick={confirmarTransferencia}
                disabled={transferindo || !programaDestinoId}
              >
                {transferindo ? "Transferindo..." : "Confirmar transferência"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
