
import React, { useCallback, useEffect, useRef, useState } from "react";
import Brand from "../components/PagInicial";
import SkipLink from "../components/SkipLink";
import FeedbackMessage from "../components/FeedbackMessage";
import SiteFooter from "../components/SiteFooter";
import EditarProgramaScreen from "./EditarProgramaScreen";
import {
  listarMeusProgramas,
  alterarDisponibilidade
} from "../services/programas";

const styles = String.raw`
.meus-programas {
  min-height: 100vh;
  padding: 0 7% 40px;
  background: var(--cream);
}
.meus-programas header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 88px;
  border-bottom: 1px solid #173e3b1a;
}
.meus-programas header button {
  min-height: 44px;
  padding: 8px 16px;
  border: 1px solid var(--teal);
  border-radius: 9px;
  color: var(--teal);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
}
.meus-programas header button:hover {
  background: #e4eee7;
}
.meus-programas-main {
  max-width: 1000px;
  margin: 0 auto;
  padding: 45px 0;
}
.meus-programas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 28px;
}
.meus-programas-header h1 {
  margin: 5px 0;
  font: 500 38px Georgia, serif;
  color: #173e3b;
}
.meus-programas-header p {
  color: #4f6159;
  font-size: 13px;
}
.programa-lista {
  display: grid;
  gap: 14px;
}
.programa-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 22px;
  border: 1px solid #e8ece5;
  border-radius: 16px;
  background: white;
}
.programa-item h2 {
  margin: 0 0 8px;
  color: #173e3b;
  font-size: 17px;
}
.programa-item p {
  margin: 0;
  color: #4f6159;
  font-size: 12px;
}
.programa-status {
  display: inline-block;
  margin-bottom: 8px;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}
.status-ativo {
  color: #236b50;
  background: #dff4e8;
}
.status-inativo {
  color: #7d4f1d;
  background: #f8ebd5;
}
.programa-acoes {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.programa-btn, .voltar-btn {
  padding: 10px 15px;
  border: 1px solid var(--border-ui);
  border-radius: 9px;
  background: white;
  color: #1d5e57;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.programa-btn:hover, .voltar-btn:hover {
  background: #f1f7f1;
}
.programa-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}
.programa-vazio, .programa-carregando {
  padding: 35px;
  border: 1px solid #e8ece5;
  border-radius: 16px;
  background: white;
  color: #4f6159;
  text-align: center;
}
.modal-disponibilidade { box-sizing: border-box; margin: auto; width: min(440px, calc(100% - 32px)); max-height: 90vh; overflow: auto; padding: clamp(20px, 5vw, 28px); border: 0; border-radius: 16px; color: var(--ink); background: var(--paper, white); box-shadow: 0 24px 80px #0003; }
.modal-disponibilidade::backdrop { background: rgba(23, 62, 59, .45); }
.modal-disponibilidade h2 { margin: 0; color: #173e3b; font: 500 24px/1.3 Georgia, serif; }
.modal-disponibilidade p { margin: 12px 0 20px; color: #526b62; font-size: 15px; line-height: 1.55; overflow-wrap: anywhere; }
.modal-disponibilidade .acoes { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; }
.modal-disponibilidade button { min-height: 44px; }
.modal-disponibilidade .confirmar { color: white; background: var(--teal); border-color: var(--teal); }
.modal-disponibilidade button:focus-visible { outline: 3px solid #1d5e57; outline-offset: 3px; }
@media (max-width: 420px) { .modal-disponibilidade .acoes button { width: 100%; } }
@media (max-width: 650px) {
  .meus-programas { padding: 0 18px 30px; }
  .meus-programas-header { align-items: flex-start; flex-direction: column; }
  .programa-item { align-items: flex-start; flex-direction: column; }
  .programa-acoes { width: 100%; }
  .programa-btn { flex: 1; }
}
`;

export default function MeusProgramasScreen({ usuario, onInicio }) {
  const modalDisponibilidade = useRef(null);
  const botaoOrigem = useRef(null);
  const botaoCancelar = useRef(null);
  const botaoConfirmar = useRef(null);
  const envioEmAndamento = useRef(false);
  const [programas, setProgramas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [alterando, setAlterando] = useState(null);
  const [editando, setEditando] = useState(null);
  const [confirmacaoDisponibilidade, setConfirmacaoDisponibilidade] = useState(null);
  const [erroDisponibilidade, setErroDisponibilidade] = useState("");

  const carregarProgramas = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const resultado = await listarMeusProgramas();
      setProgramas(Array.isArray(resultado) ? resultado : []);
    } catch (error) {
      setErro(error.message || "Não foi possível carregar seus programas.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarProgramas();
  }, [carregarProgramas]);

  useEffect(() => {
    if (!confirmacaoDisponibilidade || !modalDisponibilidade.current) return;
    modalDisponibilidade.current.showModal();
    botaoCancelar.current.focus();
  }, [confirmacaoDisponibilidade]);

  function abrirConfirmacaoDisponibilidade(programa, evento) {
    botaoOrigem.current = evento.currentTarget;
    setErroDisponibilidade("");
    setConfirmacaoDisponibilidade({ programa, novoEstado: !programa.ativo });
  }

  function fecharConfirmacaoDisponibilidade() {
    if (envioEmAndamento.current) return;
    modalDisponibilidade.current?.close();
    setConfirmacaoDisponibilidade(null);
    setErroDisponibilidade("");
    if (botaoOrigem.current?.isConnected) botaoOrigem.current.focus();
  }

  function manterFocoNoModal(evento) {
    if (evento.key !== "Tab") return;
    const ultimoFocado = evento.shiftKey ? botaoCancelar.current : botaoConfirmar.current;
    if (document.activeElement === ultimoFocado) {
      evento.preventDefault();
      (evento.shiftKey ? botaoConfirmar.current : botaoCancelar.current).focus();
    }
  }

  async function confirmarDisponibilidade() {
    if (envioEmAndamento.current || !confirmacaoDisponibilidade) return;
    const { programa, novoEstado } = confirmacaoDisponibilidade;

    try {
      envioEmAndamento.current = true;
      setAlterando(programa.id);
      setErro("");
      setMensagem("");

      const atualizado = await alterarDisponibilidade(
        programa.id,
        novoEstado
      );

      setProgramas((anteriores) =>
        anteriores.map((item) =>
          item.id === programa.id ? atualizado : item
        )
      );

      setMensagem(
        `Programa ${novoEstado ? "disponibilizado" : "indisponibilizado"} com sucesso!`
      );
      envioEmAndamento.current = false;
      modalDisponibilidade.current?.close();
      setConfirmacaoDisponibilidade(null);
      requestAnimationFrame(() => {
        if (botaoOrigem.current?.isConnected) botaoOrigem.current.focus();
        else document.querySelector(".meus-programas-main")?.focus();
      });
    } catch (error) {
      setErroDisponibilidade(error.message || "Não foi possível alterar a disponibilidade.");
    } finally {
      envioEmAndamento.current = false;
      setAlterando(null);
    }
  }

  return (
    <>
      <style>{styles}</style>

      <div className="meus-programas">
        <SkipLink />
        <header>
          <Brand href="/inicio" onClick={onInicio} />
          <button type="button" onClick={onInicio}>Voltar ao início</button>
        </header>

        <main id="conteudo" tabIndex={-1} className="meus-programas-main">
          {editando ? (
            <EditarProgramaScreen
              key={editando}
              programaId={editando}
              onVoltar={() => setEditando(null)}
              onSalvo={(atualizado) =>
                setProgramas((anteriores) =>
                  anteriores.map((item) =>
                    item.id === atualizado.id ? { ...item, ...atualizado } : item
                  )
                )
              }
            />
          ) : (<>
          <div className="meus-programas-header">
            <div>
              <span className="kicker">GERENCIAMENTO</span>
              <h1>Meus programas</h1>
              <p>Gerencie a disponibilidade dos programas cadastrados por você.</p>
            </div>
          </div>

          <FeedbackMessage>{erro}</FeedbackMessage>
          <FeedbackMessage type="success">{mensagem}</FeedbackMessage>

          {carregando ? (
            <div className="programa-carregando" role="status">
              Carregando seus programas...
            </div>
          ) : programas.length === 0 ? (
            <div className="programa-vazio">
              Você ainda não cadastrou nenhum programa.
            </div>
          ) : (
            <div className="programa-lista">
              {programas.map((programa) => (
                <article className="programa-item" key={programa.id}>
                  <div>
                    <span className={`programa-status ${
                      programa.ativo ? "status-ativo" : "status-inativo"
                    }`}>
                      {programa.ativo ? "Ativo" : "Inativo"}
                    </span>

                    <h2>{programa.nome}</h2>
                    <p>{programa.descricao}</p>
                  </div>

                  <div className="programa-acoes">
                    <button
                      type="button"
                      className="programa-btn"
                      aria-label={`Editar ${programa.nome}`}
                      onClick={() => {
                        setErro("");
                        setMensagem("");
                        setEditando(programa.id);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="programa-btn"
                      disabled={alterando === programa.id}
                      aria-haspopup="dialog"
                      onClick={(evento) => abrirConfirmacaoDisponibilidade(programa, evento)}
                    >
                      {alterando === programa.id
                        ? "Aguarde..."
                        : programa.ativo
                          ? "Indisponibilizar"
                          : "Disponibilizar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          </>)}
        </main>
      </div>
      <dialog
        ref={modalDisponibilidade}
        className="modal-disponibilidade"
        aria-labelledby="disponibilidade-titulo"
        aria-describedby="disponibilidade-texto"
        onKeyDown={manterFocoNoModal}
        onCancel={(evento) => { evento.preventDefault(); fecharConfirmacaoDisponibilidade(); }}
      >
        {confirmacaoDisponibilidade && (
          <>
            <h2 id="disponibilidade-titulo">
              {confirmacaoDisponibilidade.novoEstado ? "Disponibilizar programa?" : "Indisponibilizar programa?"}
            </h2>
            <p id="disponibilidade-texto">{confirmacaoDisponibilidade.programa.nome}</p>
            <FeedbackMessage>{erroDisponibilidade}</FeedbackMessage>
            <div className="acoes">
              <button type="button" className="programa-btn" disabled={alterando !== null} ref={botaoCancelar} onClick={fecharConfirmacaoDisponibilidade}>
                Cancelar
              </button>
              <button type="button" className="programa-btn confirmar" disabled={alterando !== null} ref={botaoConfirmar} onClick={confirmarDisponibilidade}>
                {alterando !== null
                  ? (confirmacaoDisponibilidade.novoEstado ? "Disponibilizando..." : "Indisponibilizando...")
                  : (confirmacaoDisponibilidade.novoEstado ? "Disponibilizar" : "Indisponibilizar")}
              </button>
            </div>
          </>
        )}
      </dialog>
      <SiteFooter />
    </>
  );
}
