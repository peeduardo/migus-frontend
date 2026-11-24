import React, { useCallback, useEffect, useRef, useState } from "react";
import Brand from "../components/PagInicial";
import SkipLink from "../components/SkipLink";
import FeedbackMessage from "../components/FeedbackMessage";
import SiteFooter from "../components/SiteFooter";
import { listarMeusProgramas, listarInscritos, listarProgramasAtivos, responderInscricao, transferirInscricao, registrarSaida } from "../services/programas";
import { inativarVoluntario } from "../services/auth";

const LIMITE_RECADO = 500;

const styles = String.raw`
.inscritos-page { color: var(--ink); background: var(--cream); }
.inscritos-page header { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 88px; border-bottom: 1px solid #173e3b1a; }
.inscritos-page main { width: min(860px, 100%); margin: 36px auto; padding: clamp(20px, 4vw, 38px); border: 1px solid #24423912; border-radius: 24px; background: var(--paper); box-shadow: 0 22px 75px #1f3c510c; }
.inscritos-page h1 { margin: 0 0 12px; font: 500 clamp(29px, 4vw, 36px)/1.15 Georgia, serif; letter-spacing: -1px; }
.inscritos-page .intro { color: #526b62; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
.inscritos-page .field { display: grid; gap: 7px; margin-bottom: 18px; font-size: 14px; font-weight: 600; }
.inscritos-page select { width: 100%; min-height: 44px; padding: 11px; border: 1px solid var(--border-ui); border-radius: 8px; color: var(--ink); background: white; font: inherit; font-weight: 400; }
.inscritos-page button { min-height: 40px; padding: 8px 16px; border: 1px solid var(--teal); border-radius: 9px; color: var(--teal); background: transparent; cursor: pointer; font: inherit; font-size: 13px; }
.inscritos-page button:hover:not(:disabled) { background: #e4eee7; }
.inscritos-page :is(select, button):focus-visible { outline: 3px solid var(--teal); outline-offset: 3px; }
.inscritos-tabela-wrap { overflow-x: auto; }
.inscritos-tabela { width: 100%; border-collapse: collapse; font-size: 13px; }
.inscritos-tabela caption { padding: 0 0 10px; text-align: left; color: #4f6159; font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
.inscritos-tabela th, .inscritos-tabela td { padding: 11px 12px; border-bottom: 1px solid #e8ece5; text-align: left; vertical-align: top; }
.inscritos-tabela th { color: #4f6159; font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
.inscritos-vazio { padding: 30px 10px; text-align: center; color: #526b62; }
.inscritos-status { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.inscritos-status.aceita { color: #1e5e3a; background: #edf7ef; }
.inscritos-status.recusada { color: #984936; background: #fff2ed; }
.inscritos-status.pendente { color: #6e5316; background: #fbf1d3; }
.inscritos-status.transferida { color: #526b62; background: #eaecef; }
.inscritos-status.saiu { color: #984936; background: #fff2ed; }
.inscritos-status.cadastro-inativo { margin-top: 6px; color: #526b62; background: #eaecef; }
.inscritos-acoes { display: flex; gap: 8px; flex-wrap: wrap; }
.inscritos-page .inscritos-acoes button { min-height: 34px; padding: 5px 12px; font-size: 12px; font-weight: 700; }
.inscritos-page .inscritos-acoes .aceitar { color: white; background: var(--teal); }
.inscritos-page .inscritos-acoes .aceitar:hover:not(:disabled) { background: #1d5e57; }
.inscritos-page .inscritos-acoes .transferir { color: #3b5bdb; border-color: #3b5bdb; }
.inscritos-page .inscritos-acoes .transferir:hover:not(:disabled) { background: #eef2ff; }
.inscritos-page .inscritos-acoes .sair { color: #984936; border-color: #984936; }
.inscritos-page .inscritos-acoes .sair:hover:not(:disabled) { background: #fff2ed; }
.inscritos-page .inscritos-acoes .inativar { color: #984936; border-color: #984936; }
.inscritos-page .inscritos-acoes .inativar:hover:not(:disabled) { background: #fff2ed; }
.modal-acoes .perigo { color: white; background: #984936; border-color: #984936; }
.modal-acoes .perigo:hover:not(:disabled) { background: #7d3b2b; }
.inscritos-page .inscritos-acoes button:disabled { cursor: wait; opacity: .6; }
.modal-overlay { position: fixed; inset: 0; background: #0006; display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-box { background: var(--paper, #fff); border-radius: 16px; padding: 28px; width: min(420px, 100%); box-shadow: 0 24px 80px #0003; display: grid; gap: 16px; }
.modal-box h2 { margin: 0; font: 500 20px/1.3 Georgia, serif; letter-spacing: -.5px; }
.modal-box p { margin: 0; font-size: 14px; color: #526b62; }
.modal-box .field { display: grid; gap: 7px; font-size: 14px; font-weight: 600; }
.modal-box select { width: 100%; min-height: 44px; padding: 11px; border: 1px solid var(--border-ui); border-radius: 8px; color: var(--ink); background: white; font: inherit; font-weight: 400; }
.modal-acoes { display: flex; gap: 10px; justify-content: flex-end; }
.modal-acoes .confirmar { color: white; background: #3b5bdb; border-color: #3b5bdb; }
.modal-acoes .confirmar:hover:not(:disabled) { background: #2f4abf; }
.modal-acoes .cancelar { color: #526b62; border-color: var(--border-ui); }
.modal-acoes .cancelar:hover:not(:disabled) { background: #f0f4f0; }
.modal-box textarea { width: 100%; min-width: 0; padding: 11px; border: 1px solid var(--border-ui); border-radius: 8px; color: var(--ink); background: white; font: inherit; font-weight: 400; line-height: 1.5; resize: vertical; }
.modal-box textarea:focus-visible { outline: 3px solid var(--teal); outline-offset: 3px; }
.modal-box .field small { color: #526b62; font-size: 12px; font-weight: 400; }
.inscritos-mensagem { max-width: 260px; margin: 0; white-space: pre-line; overflow-wrap: anywhere; }
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
  if (status === "SAIU" || status === "SAIDA" || status.startsWith("SAIU") || status.startsWith("SAIDA")) return { chave: "saiu", rotulo: "Saiu" };
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
  const [recadoTransferencia, setRecadoTransferencia] = useState("");

  // Estado do modal de recusa
  const [modalRecusa, setModalRecusa] = useState(null); // inscrito alvo
  const [recadoRecusa, setRecadoRecusa] = useState("");
  const [erroRecusa, setErroRecusa] = useState("");

  // Estado do modal de saída
  const [modalSaida, setModalSaida] = useState(null); // inscrito alvo
  const [registrandoSaida, setRegistrandoSaida] = useState(false);
  const [erroSaida, setErroSaida] = useState("");
  const [sucessoSaida, setSucessoSaida] = useState("");
  const [recadoSaida, setRecadoSaida] = useState("");

  const [modalInativar, setModalInativar] = useState(null);
  const [inativando, setInativando] = useState(false);
  const [erroInativar, setErroInativar] = useState("");
  const [sucessoInativar, setSucessoInativar] = useState("");

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
    setSucessoInativar("");
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
    setRecadoTransferencia("");
    setErroTransferencia("");
  }

  function fecharModalTransferir() {
    if (transferindo) return;
    setModalTransferir(null);
    setProgramaDestinoId("");
    setRecadoTransferencia("");
    setErroTransferencia("");
  }

  async function confirmarTransferencia() {
    if (!modalTransferir || !programaDestinoId || transferindo) return;
    const idAlvo = idInscricao(modalTransferir);
    const programaOrigem = programaId;
    setErroTransferencia("");
    setTransferindo(true);
    try {
      await transferirInscricao(programaOrigem, idAlvo, programaDestinoId, recadoTransferencia);
      if (selecaoAtual.current === programaOrigem) {
        setInscritos((atual) => atual.filter((i) => idInscricao(i) !== idAlvo));
      }
      setModalTransferir(null);
      setProgramaDestinoId("");
      setRecadoTransferencia("");
    } catch (err) {
      setErroTransferencia(err.message || "Não foi possível transferir o voluntário.");
    } finally {
      setTransferindo(false);
    }
  }

  function abrirModalSaida(inscrito) {
    setModalSaida(inscrito);
    setRecadoSaida("");
    setErroSaida("");
    setSucessoSaida("");
  }

  function fecharModalSaida() {
    if (registrandoSaida) return;
    setModalSaida(null);
    setRecadoSaida("");
    setErroSaida("");
    setSucessoSaida("");
  }

  function abrirModalRecusa(inscrito) {
    setModalRecusa(inscrito);
    setRecadoRecusa("");
    setErroRecusa("");
  }

  function fecharModalRecusa() {
    if (respondendo) return;
    setModalRecusa(null);
    setRecadoRecusa("");
    setErroRecusa("");
  }

  async function confirmarRecusa() {
    const idAlvo = idInscricao(modalRecusa);
    if (!modalRecusa || respondendo || !idAlvo) return;
    const programaDaAcao = programaId;
    setErroRecusa("");
    setRespondendo(idAlvo);
    try {
      const atualizada = await responderInscricao(programaDaAcao, idAlvo, "recusar", recadoRecusa);
      if (selecaoAtual.current === programaDaAcao) {
        const status = atualizada?.status || "RECUSADA";
        setInscritos((atual) => atual.map((i) => (idInscricao(i) === idAlvo ? { ...i, status } : i)));
      }
      setModalRecusa(null);
      setRecadoRecusa("");
    } catch (err) {
      setErroRecusa(err.message || "Não foi possível recusar a inscrição.");
    } finally {
      setRespondendo(null);
    }
  }

  async function confirmarSaida() {
    if (!modalSaida || registrandoSaida) return;
    const idAlvo = idInscricao(modalSaida);
    const programaDaAcao = programaId;
    setErroSaida("");
    setRegistrandoSaida(true);
    try {
      await registrarSaida(programaDaAcao, idAlvo, recadoSaida);
      if (selecaoAtual.current === programaDaAcao) {
        setInscritos((atual) =>
          atual.map((i) => (idInscricao(i) === idAlvo ? { ...i, status: "SAIU" } : i))
        );
      }
      setSucessoSaida("Saída registrada com sucesso.");
      setTimeout(() => {
        setModalSaida(null);
        setSucessoSaida("");
      }, 1500);
    } catch (err) {
      setErroSaida(err.message || "Não foi possível registrar a saída.");
    } finally {
      setRegistrandoSaida(false);
    }
  }

  function abrirModalInativar(inscrito) {
    setModalInativar(inscrito);
    setErroInativar("");
    setSucessoInativar("");
  }

  function fecharModalInativar() {
    if (inativando) return;
    setModalInativar(null);
    setErroInativar("");
  }

  async function confirmarInativacao() {
    if (!modalInativar || inativando) return;
    const usuarioAlvo = modalInativar.usuarioId;
    const nomeAlvo = modalInativar.nome || "voluntário";
    setErroInativar("");
    setInativando(true);
    try {
      await inativarVoluntario(usuarioAlvo);
      setInscritos((atual) =>
        atual.map((i) => (i.usuarioId === usuarioAlvo ? { ...i, usuarioAtivo: false } : i))
      );
      setSucessoInativar(`Cadastro de ${nomeAlvo} inativado com sucesso.`);
      setModalInativar(null);
    } catch (err) {
      setErroInativar(err.message || "Não foi possível inativar o cadastro.");
    } finally {
      setInativando(false);
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
      <SkipLink />
      <header>
        <Brand href="/inicio" onClick={onInicio} />
        <button type="button" onClick={onInicio}>Voltar ao início</button>
      </header>
      <main id="conteudo" tabIndex={-1}>
        <h1>Inscritos por programa</h1>
        {!permitido ? (
          <FeedbackMessage>Somente um responsável ativo pode ver os inscritos dos programas.</FeedbackMessage>
        ) : (
          <>
            <p className="intro">Escolha um dos programas que você criou para ver quem se inscreveu.</p>
            <FeedbackMessage>{error}</FeedbackMessage>
            <FeedbackMessage>{erroResposta}</FeedbackMessage>
            <FeedbackMessage type="success">{sucessoInativar}</FeedbackMessage>

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
                          <th scope="col">Mensagem</th>
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
                              <td>{i.mensagem ? <p className="inscritos-mensagem">{i.mensagem}</p> : "—"}</td>
                              <td>{formatarData(i.dataInscricao || i.criadoEm || i.dataCadastro)}</td>
                              <td>
                                <span className={`inscritos-status ${chave}`}>{rotulo}</span>
                                {i.usuarioAtivo === false && (
                                  <>
                                    <br />
                                    <span className="inscritos-status cadastro-inativo">Cadastro inativo</span>
                                  </>
                                )}
                              </td>
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
                                        onClick={() => abrirModalRecusa(i)}
                                        disabled={respondendo !== null || !idAlvo}
                                        aria-label={`Recusar inscrição de ${i.nome}`}
                                      >
                                        Recusar
                                      </button>
                                    </>
                                  )}
                                  {chave === "aceita" && (
                                    <>
                                      <button
                                        type="button"
                                        className="transferir"
                                        onClick={() => abrirModalTransferir(i)}
                                        disabled={respondendo !== null}
                                        aria-label={`Transferir ${i.nome} para outro programa`}
                                      >
                                        Transferir
                                      </button>
                                      <button
                                        type="button"
                                        className="sair"
                                        onClick={() => abrirModalSaida(i)}
                                        disabled={respondendo !== null}
                                        aria-label={`Registrar saída de ${i.nome}`}
                                      >
                                        Registrar saída
                                      </button>
                                    </>
                                  )}
                                  {i.usuarioId && i.usuarioAtivo !== false && (
                                    <button
                                      type="button"
                                      className="inativar"
                                      onClick={() => abrirModalInativar(i)}
                                      disabled={respondendo !== null}
                                      aria-label={`Inativar cadastro de ${i.nome}`}
                                    >
                                      Inativar cadastro
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
            <div className="field">
              <label htmlFor="recado-transferencia">Recado para o voluntário (opcional)</label>
              <textarea
                id="recado-transferencia"
                rows="3"
                maxLength={LIMITE_RECADO}
                value={recadoTransferencia}
                onChange={(e) => setRecadoTransferencia(e.target.value)}
                disabled={transferindo}
                aria-describedby="recado-transferencia-ajuda"
              />
              <small id="recado-transferencia-ajuda">O voluntário verá este recado em "Minhas inscrições". {recadoTransferencia.length}/{LIMITE_RECADO}</small>
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

      {modalSaida && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-saida-titulo">
          <div className="modal-box">
            <h2 id="modal-saida-titulo">Registrar saída</h2>
            <p>
              Confirma a saída de <strong>{modalSaida.nome || "este voluntário"}</strong> do programa atual?
              Esta ação não pode ser desfeita.
            </p>
            {erroSaida && <FeedbackMessage>{erroSaida}</FeedbackMessage>}
            {sucessoSaida && <p style={{ color: "#1e5e3a", fontSize: "14px", margin: 0 }}>{sucessoSaida}</p>}
            <div className="field">
              <label htmlFor="recado-saida">Recado para o voluntário (opcional)</label>
              <textarea
                id="recado-saida"
                rows="3"
                maxLength={LIMITE_RECADO}
                value={recadoSaida}
                onChange={(e) => setRecadoSaida(e.target.value)}
                disabled={registrandoSaida || Boolean(sucessoSaida)}
                aria-describedby="recado-saida-ajuda"
              />
              <small id="recado-saida-ajuda">O voluntário verá este recado em "Minhas inscrições". {recadoSaida.length}/{LIMITE_RECADO}</small>
            </div>
            <div className="modal-acoes inscritos-acoes">
              <button
                type="button"
                className="cancelar"
                onClick={fecharModalSaida}
                disabled={registrandoSaida}
              >
                Cancelar
              </button>
              <button
                type="button"
                style={{ color: "white", background: "#984936", borderColor: "#984936" }}
                onClick={confirmarSaida}
                disabled={registrandoSaida}
              >
                {registrandoSaida ? "Registrando..." : "Confirmar saída"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalInativar && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-inativar-titulo">
          <div className="modal-box">
            <h2 id="modal-inativar-titulo">Inativar cadastro</h2>
            <p>
              Confirma a inativação do cadastro de <strong>{modalInativar.nome || "este voluntário"}</strong>?
              A pessoa não poderá mais acessar a plataforma. O histórico de inscrições será mantido.
            </p>
            <FeedbackMessage>{erroInativar}</FeedbackMessage>
            <div className="modal-acoes inscritos-acoes">
              <button type="button" className="cancelar" onClick={fecharModalInativar} disabled={inativando}>
                Cancelar
              </button>
              <button type="button" className="perigo" onClick={confirmarInativacao} disabled={inativando}>
                {inativando ? "Inativando..." : "Confirmar inativação"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalRecusa && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-recusa-titulo">
          <div className="modal-box">
            <h2 id="modal-recusa-titulo">Recusar inscrição</h2>
            <p>
              Confirma a recusa da inscrição de <strong>{modalRecusa.nome || "esta pessoa"}</strong>?
            </p>
            {modalRecusa.mensagem && <p><em>Mensagem da pessoa:</em> {modalRecusa.mensagem}</p>}
            <FeedbackMessage>{erroRecusa}</FeedbackMessage>
            <div className="field">
              <label htmlFor="recado-recusa">Motivo ou recado (opcional)</label>
              <textarea
                id="recado-recusa"
                rows="3"
                maxLength={LIMITE_RECADO}
                value={recadoRecusa}
                onChange={(e) => setRecadoRecusa(e.target.value)}
                disabled={respondendo !== null}
                aria-describedby="recado-recusa-ajuda"
              />
              <small id="recado-recusa-ajuda">A pessoa verá este texto em "Minhas inscrições". {recadoRecusa.length}/{LIMITE_RECADO}</small>
            </div>
            <div className="modal-acoes inscritos-acoes">
              <button
                type="button"
                className="cancelar"
                onClick={fecharModalRecusa}
                disabled={respondendo !== null}
              >
                Cancelar
              </button>
              <button
                type="button"
                style={{ color: "white", background: "#984936", borderColor: "#984936" }}
                onClick={confirmarRecusa}
                disabled={respondendo !== null}
              >
                {respondendo !== null ? "Recusando..." : "Confirmar recusa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
