
import React, { useCallback, useEffect, useState } from "react";
import Brand from "../components/PagInicial";
import FeedbackMessage from "../components/FeedbackMessage";
import SiteFooter from "../components/SiteFooter";
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
  color: #82918a;
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
  color: #82918a;
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
  color: #95632d;
  background: #f8ebd5;
}
.programa-acoes {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.programa-btn, .voltar-btn {
  padding: 10px 15px;
  border: 1px solid #dce4dc;
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
  color: #82918a;
  text-align: center;
}
@media (max-width: 650px) {
  .meus-programas { padding: 0 18px 30px; }
  .meus-programas-header { align-items: flex-start; flex-direction: column; }
  .programa-item { align-items: flex-start; flex-direction: column; }
  .programa-acoes { width: 100%; }
  .programa-btn { flex: 1; }
}
`;

export default function MeusProgramasScreen({ usuario, onInicio }) {
  const [programas, setProgramas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [alterando, setAlterando] = useState(null);

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

  async function mudarDisponibilidade(programa) {
    const novoEstado = !programa.ativo;

    const confirmacao = window.confirm(
      `Deseja realmente ${novoEstado ? "disponibilizar" : "indisponibilizar"} o programa "${programa.nome}"?`
    );

    if (!confirmacao) return;

    try {
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
    } catch (error) {
      setErro(error.message || "Não foi possível alterar a disponibilidade.");
    } finally {
      setAlterando(null);
    }
  }

  return (
    <>
      <style>{styles}</style>

      <div className="meus-programas">
        <header className="topbar">
          <Brand href="/inicio" />
          <button className="voltar-btn" onClick={onInicio}>
            ← Voltar ao início
          </button>
        </header>

        <main className="meus-programas-main">
          <div className="meus-programas-header">
            <div>
              <span className="kicker">GERENCIAMENTO</span>
              <h1>Meus programas</h1>
              <p>Gerencie a disponibilidade dos programas cadastrados por você.</p>
            </div>
          </div>

          {erro && <FeedbackMessage message={erro} />}
          {mensagem && <FeedbackMessage message={mensagem} />}

          {carregando ? (
            <div className="programa-carregando">
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
                      className="programa-btn"
                      disabled={alterando === programa.id}
                      onClick={() => mudarDisponibilidade(programa)}
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
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
