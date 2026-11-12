import React, { useEffect, useState } from "react";
import Brand from "../components/PagInicial";
import FeedbackMessage from "../components/FeedbackMessage";
import SiteFooter from "../components/SiteFooter";
import { listarMinhasInscricoes } from "../services/programas";

const styles = String.raw`
.minhas-inscricoes { color: var(--ink); background: var(--cream); }
.minhas-inscricoes header { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 88px; border-bottom: 1px solid #173e3b1a; }
.minhas-inscricoes main { width: min(860px, 100%); margin: 36px auto; padding: clamp(20px, 4vw, 38px); border: 1px solid #24423912; border-radius: 24px; background: var(--paper); }
.minhas-inscricoes h1 { margin: 0 0 12px; font: 500 clamp(29px, 4vw, 36px)/1.15 Georgia, serif; letter-spacing: -1px; }
.minhas-inscricoes .intro { margin: 0 0 24px; color: #526b62; font-size: 14px; line-height: 1.6; }
.minhas-inscricoes button { min-height: 44px; padding: 8px 16px; border: 1px solid var(--teal); border-radius: 9px; color: var(--teal); background: transparent; cursor: pointer; font: inherit; font-size: 13px; }
.minhas-inscricoes button:hover { background: #e4eee7; }
.minhas-inscricoes :is(button, a):focus-visible { outline: 3px solid var(--teal); outline-offset: 3px; }
.minhas-inscricoes-lista { list-style: none; padding: 0; margin: 0; }
.minhas-inscricoes-lista li { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 0; border-top: 1px solid #e8ece5; }
.minhas-inscricoes-lista h2 { margin: 0 0 8px; font: 500 21px Georgia, serif; overflow-wrap: anywhere; }
.minhas-inscricoes-lista p { margin: 0; color: #526b62; font-size: 13px; line-height: 1.5; }
.minha-inscricao-status { flex-shrink: 0; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.minha-inscricao-status.PENDENTE { color: #795c13; background: #fbf1d3; }
.minha-inscricao-status.APROVADA { color: #1e5e3a; background: #edf7ef; }
.minha-inscricao-status.TRANSFERIDA { color: #526b62; background: #eaecef; }
.minha-inscricao-status.RECUSADA { color: #984936; background: #fff2ed; }
@media (max-width: 430px) {
  .minhas-inscricoes header { min-height: 72px; }
  .minhas-inscricoes-lista li { align-items: flex-start; flex-direction: column; gap: 12px; }
}
`;

const estados = { PENDENTE: "Pendente", APROVADA: "Aprovada", RECUSADA: "Recusada", TRANSFERIDA: "Transferida" };

function formatarData(valor) {
  if (!valor) return "Data não informada";
  const match = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(valor);
}

export default function MinhasInscricoesScreen({ onInicio }) {
  const [inscricoes, setInscricoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelada = false;
    setLoading(true);
    setError("");
    setInscricoes([]);
    async function carregar() {
      try {
        const lista = await listarMinhasInscricoes();
        if (!cancelada) setInscricoes(lista);
      } catch (err) {
        if (!cancelada) setError(err.message || "Não foi possível carregar suas inscrições.");
      } finally {
        if (!cancelada) setLoading(false);
      }
    }
    carregar();
    // Ao sair da tela ou trocar de conta, ignora a resposta antiga.
    return () => { cancelada = true; };
  }, [tentativa]);

  return (
    <div className="site-shell minhas-inscricoes">
      <style>{styles}</style>
      <header>
        <Brand href="/inicio" onClick={onInicio} />
        <button type="button" onClick={onInicio}>Voltar ao início</button>
      </header>
      <main>
        <h1>Minhas inscrições</h1>
        <p className="intro">Acompanhe a situação das suas inscrições nos programas.</p>
        {loading && <p role="status">Carregando inscrições...</p>}
        {!loading && error && (
          <div>
            <FeedbackMessage>{error}</FeedbackMessage>
            <button type="button" onClick={() => setTentativa(atual => atual + 1)}>Tentar novamente</button>
          </div>
        )}
        {!loading && !error && (inscricoes.length === 0
          ? <p>Você ainda não se inscreveu em nenhum programa.</p>
          : <ul className="minhas-inscricoes-lista" aria-label="Suas inscrições">
            {inscricoes.map(inscricao => (
              <li key={inscricao.inscricaoId}>
                <div>
                  <h2>{inscricao.programaNome || "Programa indisponível"}</h2>
                  <p>Inscrito em: <time dateTime={inscricao.dataInscricao || undefined}>{formatarData(inscricao.dataInscricao)}</time></p>
                </div>
                <span className={`minha-inscricao-status ${estados[inscricao.status] ? inscricao.status : ""}`}>
                  {estados[inscricao.status] || inscricao.status || "Situação não informada"}
                </span>
              </li>
            ))}
          </ul>)}
      </main>
      <SiteFooter />
    </div>
  );
}
