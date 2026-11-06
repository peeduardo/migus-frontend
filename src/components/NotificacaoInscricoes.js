import React, { useCallback, useEffect, useRef, useState } from "react";
import { listarInscricoesPendentes, responderInscricao } from "../services/programas";

const INTERVALO_MS = 30000;

const styles = String.raw`
.sino-wrap { position: relative; }
.sino-btn { position: relative; display: inline-grid; place-items: center; width: 38px; height: 38px; padding: 0; border: 1px solid #dce4dc; border-radius: 50%; color: #173e3b; background: white; cursor: pointer; transition: all .15s ease; }
.sino-btn:hover { background: #f3f5ed; border-color: #c4d0c5; }
.sino-btn:focus-visible, .sino-acao:focus-visible { outline: 3px solid var(--teal); outline-offset: 2px; }
.sino-badge { position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; color: white; background: #d9534f; font-size: 10px; font-weight: 700; line-height: 18px; text-align: center; }
.sino-painel { position: absolute; top: calc(100% + 10px); right: 0; z-index: 40; width: min(360px, 90vw); max-height: 70vh; overflow-y: auto; padding: 14px; border: 1px solid #24423912; border-radius: 16px; background: var(--paper); box-shadow: 0 22px 60px #1f3c5028; text-align: left; }
.sino-painel h2 { margin: 0 0 10px; color: #82918a; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.sino-vazio { margin: 6px 0; color: #526b62; font-size: 13px; }
.sino-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.sino-item { padding: 12px; border: 1px solid #e8ece5; border-radius: 12px; background: #fafbfa; font-size: 13px; line-height: 1.5; }
.sino-item strong { display: block; }
.sino-item small { display: block; color: #82918a; font-size: 11px; }
.sino-acoes { display: flex; gap: 8px; margin-top: 10px; }
.sino-acao { flex: 1; min-height: 34px; padding: 6px 10px; border: 1px solid var(--teal); border-radius: 8px; color: var(--teal); background: transparent; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
.sino-acao.aprovar { color: white; background: var(--teal); }
.sino-acao:disabled { cursor: wait; opacity: .6; }
.sino-erro { margin: 8px 0 0; color: #984936; font-size: 12px; }
`;

function SinoIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export default function NotificacaoInscricoes() {
  const [pendentes, setPendentes] = useState([]);
  const [aberto, setAberto] = useState(false);
  const [respondendo, setRespondendo] = useState(null);
  const [erro, setErro] = useState("");
  const raiz = useRef(null);
  const ativo = useRef(true);

  const atualizar = useCallback(async () => {
    try {
      const lista = await listarInscricoesPendentes();
      if (ativo.current) setPendentes(lista);
    } catch {
      // Falha ao consultar não deve atrapalhar a tela; tenta de novo no próximo ciclo.
    }
  }, []);

  useEffect(() => {
    ativo.current = true;
    atualizar();
    const timer = setInterval(atualizar, INTERVALO_MS);
    return () => {
      ativo.current = false;
      clearInterval(timer);
    };
  }, [atualizar]);

  useEffect(() => {
    if (!aberto) return undefined;
    function aoClicarFora(evento) {
      if (raiz.current && !raiz.current.contains(evento.target)) setAberto(false);
    }
    function aoTeclar(evento) {
      if (evento.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  async function responder(item, decisao) {
    if (respondendo) return;
    setErro("");
    setRespondendo(item.inscricaoId);
    try {
      await responderInscricao(item.programaId, item.inscricaoId, decisao);
      setPendentes((atual) => atual.filter((p) => p.inscricaoId !== item.inscricaoId));
    } catch (err) {
      setErro(err.message || "Não foi possível responder à inscrição.");
    } finally {
      setRespondendo(null);
    }
  }

  const total = pendentes.length;

  return (
    <div className="sino-wrap" ref={raiz}>
      <style>{styles}</style>
      <button
        type="button"
        className="sino-btn"
        onClick={() => setAberto((atual) => !atual)}
        aria-label={total ? `Notificações: ${total} inscrição(ões) pendente(s)` : "Notificações"}
        aria-haspopup="true"
        aria-expanded={aberto}
      >
        <SinoIcon />
        {total > 0 && <span className="sino-badge" aria-hidden="true">{total > 9 ? "9+" : total}</span>}
      </button>

      {aberto && (
        <div className="sino-painel" role="region" aria-label="Inscrições pendentes">
          <h2>Inscrições pendentes</h2>
          {total === 0
            ? <p className="sino-vazio">Nenhuma inscrição aguardando resposta.</p>
            : (
              <ul className="sino-lista">
                {pendentes.map((item) => (
                  <li key={item.inscricaoId} className="sino-item">
                    <strong>{item.nome || "Nova pessoa"}</strong>
                    <small>quer participar de {item.programaNome}</small>
                    <div className="sino-acoes">
                      <button
                        type="button"
                        className="sino-acao aprovar"
                        onClick={() => responder(item, "aprovar")}
                        disabled={respondendo !== null}
                        aria-label={`Aceitar inscrição de ${item.nome} em ${item.programaNome}`}
                      >
                        {respondendo === item.inscricaoId ? "Enviando..." : "Aceitar"}
                      </button>
                      <button
                        type="button"
                        className="sino-acao"
                        onClick={() => responder(item, "recusar")}
                        disabled={respondendo !== null}
                        aria-label={`Recusar inscrição de ${item.nome} em ${item.programaNome}`}
                      >
                        Recusar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          {erro && <p className="sino-erro" role="alert">{erro}</p>}
        </div>
      )}
    </div>
  );
}
