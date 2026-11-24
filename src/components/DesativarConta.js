import React, { useRef, useState } from "react";
import { desativarMinhaConta } from "../services/auth";
import FeedbackMessage from "./FeedbackMessage";

const estilos = `
.modal-desativar { box-sizing: border-box; margin: auto; width: min(420px, calc(100% - 32px)); max-height: 90vh; overflow: auto; padding: clamp(20px, 5vw, 28px); border: 0; border-radius: 16px; color: var(--ink); background: var(--paper, white); box-shadow: 0 24px 80px #0003; }
.modal-desativar::backdrop { background: rgba(23, 62, 59, .45); }
.modal-desativar h2 { margin: 0; font: 500 24px/1.3 Georgia, serif; letter-spacing: -.5px; }
.modal-desativar p { margin: 12px 0 20px; color: #526b62; font-size: 15px; line-height: 1.55; }
.modal-desativar .acoes { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; }
.modal-desativar button { min-height: 44px; }
.modal-desativar .desativar { background: #963e32; border-color: #963e32; color: white; }
.modal-desativar button:focus-visible { outline: 3px solid #1d5e57; outline-offset: 3px; }
.modal-desativar button[aria-disabled="true"] { cursor: wait; }
@media (max-width: 420px) { .modal-desativar .acoes button { width: 100%; } }
`;

export default function DesativarConta({ onSucesso }) {
  const modal = useRef(null);
  const origem = useRef(null);
  const cancelar = useRef(null);
  const confirmarBotao = useRef(null);
  const enviando = useRef(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  function abrir() {
    setErro("");
    modal.current.showModal();
    cancelar.current.focus();
  }

  function fechar() {
    if (enviando.current) return;
    modal.current.close();
    origem.current.focus();
  }

  function navegar(evento) {
    if (evento.key !== "Tab") return;
    const ultimo = evento.shiftKey ? cancelar.current : confirmarBotao.current;
    if (document.activeElement === ultimo) {
      evento.preventDefault();
      (evento.shiftKey ? confirmarBotao.current : cancelar.current).focus();
    }
  }

  async function confirmar() {
    if (enviando.current) return;
    enviando.current = true;
    setCarregando(true);
    setErro("");
    try {
      await desativarMinhaConta();
      onSucesso();
    } catch (falha) {
      setErro(falha.message);
      enviando.current = false;
      setCarregando(false);
    }
  }

  return (
    <div className="perfil-section">
      <style>{estilos}</style>
      <button ref={origem} type="button" className="perfil-btn-cancel" aria-haspopup="dialog" onClick={abrir}>
        Desativar minha conta
      </button>
      <dialog ref={modal} className="modal-desativar" aria-labelledby="desativar-titulo"
        aria-describedby="desativar-texto" onKeyDown={navegar}
        onCancel={evento => { evento.preventDefault(); fechar(); }}>
        <h2 id="desativar-titulo">Desativar minha conta?</h2>
        <p id="desativar-texto">Você perderá o acesso à plataforma. Seus dados e inscrições serão preservados.</p>
        <FeedbackMessage>{erro}</FeedbackMessage>
        <div className="acoes">
          <button ref={cancelar} type="button" className="perfil-btn-cancel" aria-disabled={carregando} onClick={fechar}>Cancelar</button>
          <button ref={confirmarBotao} type="button" className="perfil-btn-save desativar" aria-disabled={carregando} onClick={confirmar}>
            {carregando ? "Desativando..." : "Desativar minha conta"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
