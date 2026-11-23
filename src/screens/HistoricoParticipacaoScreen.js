import React, { useEffect, useState } from "react";
import Brand from "../components/PagInicial";
import FeedbackMessage from "../components/FeedbackMessage";
import SiteFooter from "../components/SiteFooter";
import { listarHistoricoParticipacao } from "../services/programas";

const styles = [
  ".historico-participacao { color: var(--ink); background: var(--cream); }",
  ".historico-participacao header { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 88px; border-bottom: 1px solid #173e3b1a; }",
  ".historico-participacao main { width: min(900px, 100%); margin: 36px auto; padding: clamp(20px, 4vw, 38px); border: 1px solid #24423912; border-radius: 24px; background: var(--paper); }",
  ".historico-participacao h1 { margin: 0 0 12px; font: 500 clamp(29px, 4vw, 36px)/1.15 Georgia, serif; letter-spacing: -1px; }",
  ".historico-participacao .intro { margin: 0 0 24px; color: #526b62; font-size: 14px; line-height: 1.6; }",
  ".historico-participacao button { min-height: 44px; padding: 8px 16px; border: 1px solid var(--teal); border-radius: 9px; color: var(--teal); background: transparent; cursor: pointer; font: inherit; font-size: 13px; }",
  ".historico-participacao button:hover { background: #e4eee7; }",
  ".historico-participacao :is(button, a):focus-visible { outline: 3px solid var(--teal); outline-offset: 3px; }",
  ".historico-filtros { display: flex; align-items: center; gap: 10px; margin: 0 0 18px; color: #526b62; font-size: 13px; }",
  ".historico-filtros select { min-height: 40px; padding: 7px 34px 7px 11px; border: 1px solid #dce4dc; border-radius: 9px; color: var(--ink); background: white; font: inherit; }",
  ".historico-filtros select:focus-visible { outline: 3px solid var(--teal); outline-offset: 2px; }",
  ".historico-lista { display: grid; gap: 14px; list-style: none; padding: 0; margin: 0; }",
  ".historico-lista li { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding: 20px; border: 1px solid #e8ece5; border-radius: 14px; background: #fffefa; }",
  ".historico-lista h2 { margin: 0 0 14px; font: 500 21px Georgia, serif; overflow-wrap: anywhere; }",
  ".historico-detalhes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 20px; margin: 0; }",
  ".historico-detalhes div { min-width: 0; }",
  ".historico-detalhes dt { color: #82918a; font-size: 10px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }",
  ".historico-detalhes dd { margin: 4px 0 0; color: #526b62; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }",
  ".historico-status { flex: 0 0 auto; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }",
  ".historico-status.PENDENTE { color: #795c13; background: #fbf1d3; }",
  ".historico-status.APROVADA { color: #1e5e3a; background: #edf7ef; }",
  ".historico-status.TRANSFERIDA { color: #526b62; background: #eaecef; }",
  ".historico-status.RECUSADA, .historico-status.SAIDA { color: #984936; background: #fff2ed; }",
  ".historico-vazio { padding: 28px 20px; border-radius: 12px; color: #526b62; background: #f3f5ed; text-align: center; line-height: 1.6; }",
  "@media (max-width: 620px) {",
  "  .historico-participacao header { min-height: 72px; }",
  "  .historico-lista li { flex-direction: column; gap: 12px; }",
  "  .historico-detalhes { grid-template-columns: 1fr; gap: 10px; }",
  "}",
].join("\n");

const situacoes = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
  TRANSFERIDA: "Transferida",
  SAIDA: "Saída registrada",
};

function formatarData(valor) {
  if (!valor) return null;
  const match = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? [match[3], match[2], match[1]].join("/") : String(valor);
}

function dataMaisRecente(registro) {
  const valor = registro.fimParticipacao || registro.inicioParticipacao || registro.dataInscricao;
  const data = valor ? Date.parse(valor) : 0;
  return Number.isNaN(data) ? 0 : data;
}

export default function HistoricoParticipacaoScreen({ onInicio }) {
  const [historico, setHistorico] = useState([]);
  const [situacaoFiltro, setSituacaoFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelada = false;
    setLoading(true);
    setError("");
    setHistorico([]);

    async function carregar() {
      try {
        const registros = await listarHistoricoParticipacao();
        if (!cancelada) {
          setHistorico([...registros].sort((a, b) => dataMaisRecente(b) - dataMaisRecente(a)));
        }
      } catch (err) {
        if (!cancelada) setError(err.message || "Não foi possível carregar seu histórico de participação.");
      } finally {
        if (!cancelada) setLoading(false);
      }
    }

    carregar();
    return () => { cancelada = true; };
  }, [tentativa]);

  const historicoFiltrado = situacaoFiltro
    ? historico.filter(registro => registro.situacao === situacaoFiltro)
    : historico;

  return (
    <div className="site-shell historico-participacao">
      <style>{styles}</style>
      <header>
        <Brand href="/inicio" onClick={onInicio} />
        <button type="button" onClick={onInicio}>Voltar ao início</button>
      </header>
      <main>
        <h1>Histórico de participação</h1>
        <p className="intro">Consulte os programas em que você se inscreveu e acompanhe as situações e períodos registrados.</p>

        {loading && <p role="status">Carregando histórico de participação...</p>}

        {!loading && error && (
          <div>
            <FeedbackMessage>{error}</FeedbackMessage>
            <button type="button" onClick={() => setTentativa(atual => atual + 1)}>Tentar novamente</button>
          </div>
        )}

        {!loading && !error && historico.length === 0 && (
          <p className="historico-vazio">Você ainda não possui participações registradas.</p>
        )}

        {!loading && !error && historico.length > 0 && (
          <>
            <div className="historico-filtros">
              <label htmlFor="filtro-situacao">Filtrar por situação</label>
              <select
                id="filtro-situacao"
                value={situacaoFiltro}
                onChange={evento => setSituacaoFiltro(evento.target.value)}
              >
                <option value="">Todas</option>
                {Object.entries(situacoes).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>{rotulo}</option>
                ))}
              </select>
            </div>

            {historicoFiltrado.length === 0 ? (
              <p className="historico-vazio">Não há participações com essa situação.</p>
            ) : (
              <ul className="historico-lista" aria-label="Histórico de participação">
                {historicoFiltrado.map(registro => {
              const inicio = formatarData(registro.inicioParticipacao);
              const fim = formatarData(registro.fimParticipacao);
              const status = registro.situacao || "Situação não informada";
              return (
                <li key={registro.inscricaoId}>
                  <div>
                    <h2>{registro.programaNome || "Programa indisponível"}</h2>
                    <dl className="historico-detalhes">
                      <div>
                        <dt>Inscrição</dt>
                        <dd>{formatarData(registro.dataInscricao) || "Data não informada"}</dd>
                      </div>
                      <div>
                        <dt>Início da participação</dt>
                        <dd>{inicio || "Ainda não iniciado"}</dd>
                      </div>
                      <div>
                        <dt>Fim da participação</dt>
                        <dd>{fim || (inicio ? "Em andamento" : "Não se aplica")}</dd>
                      </div>
                    </dl>
                  </div>
                  <span className={"historico-status " + (situacoes[registro.situacao] ? registro.situacao : "")}>
                    {situacoes[registro.situacao] || status}
                  </span>
                </li>
              );
                })}
              </ul>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
