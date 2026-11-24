import React, { useCallback, useEffect, useRef, useState } from "react";
import Brand from "../components/PagInicial";
import FeedbackMessage from "../components/FeedbackMessage";
import SiteFooter from "../components/SiteFooter";
import { listarExVoluntarios } from "../services/exVoluntarios";

const styles = String.raw`
.ex-voluntarios { color: var(--ink); background: var(--cream); }
.ex-voluntarios header { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 88px; border-bottom: 1px solid #173e3b1a; }
.ex-voluntarios main { width: min(960px, 100%); margin: 36px auto; padding: clamp(20px, 4vw, 38px); border: 1px solid #24423912; border-radius: 24px; background: var(--paper); box-shadow: 0 22px 75px #1f3c510c; }
.ex-voluntarios h1 { margin: 0 0 12px; font: 500 clamp(29px, 4vw, 36px)/1.15 Georgia, serif; letter-spacing: -1px; }
.ex-voluntarios .intro { margin: 0 0 24px; color: #526b62; font-size: 14px; line-height: 1.6; }
.ex-voluntarios button { min-height: 44px; padding: 8px 16px; border: 1px solid var(--teal); border-radius: 9px; color: var(--teal); background: transparent; cursor: pointer; font: inherit; font-size: 13px; }
.ex-voluntarios button:hover:not(:disabled) { background: #e4eee7; }
.ex-voluntarios button:disabled { cursor: wait; opacity: .6; }
.ex-voluntarios .filtrar { color: white; background: var(--teal); font-weight: 700; }
.ex-voluntarios .filtrar:hover:not(:disabled) { background: #1d5e57; }
.ex-voluntarios :is(input, select, button):focus-visible { outline: 3px solid var(--teal); outline-offset: 3px; }
.ex-voluntarios-filtros { display: grid; grid-template-columns: 2fr 1fr auto auto; gap: 12px; align-items: end; margin-bottom: 24px; }
.ex-voluntarios-filtros label { display: grid; gap: 7px; font-size: 14px; font-weight: 600; }
.ex-voluntarios-filtros :is(input, select) { width: 100%; min-width: 0; min-height: 44px; padding: 11px; border: 1px solid #a4b6ac; border-radius: 8px; color: var(--ink); background: white; font: inherit; font-weight: 400; }
.ex-voluntarios-tabela-wrap { overflow-x: auto; }
.ex-voluntarios-tabela { width: 100%; border-collapse: collapse; font-size: 13px; }
.ex-voluntarios-tabela caption { padding: 0 0 10px; text-align: left; color: #82918a; font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
.ex-voluntarios-tabela th, .ex-voluntarios-tabela td { padding: 11px 12px; border-bottom: 1px solid #e8ece5; text-align: left; vertical-align: top; }
.ex-voluntarios-tabela th { color: #82918a; font-size: 10px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
.ex-voluntarios-situacao { display: flex; flex-wrap: wrap; gap: 6px; }
.ex-voluntarios-etiqueta { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.ex-voluntarios-etiqueta.inativo { color: #526b62; background: #eaecef; }
.ex-voluntarios-etiqueta.saida { color: #984936; background: #fff2ed; }
.ex-voluntarios-vazio { padding: 30px 10px; text-align: center; color: #526b62; }
@media (max-width: 700px) { .ex-voluntarios-filtros { grid-template-columns: 1fr; } }
`;

const situacoes = [
  { valor: "", rotulo: "Todas" },
  { valor: "INATIVO", rotulo: "Cadastro inativo" },
  { valor: "SAIDA", rotulo: "Saída registrada" },
];

export function formatarData(valor) {
  if (!valor) return "—";
  const somenteData = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (somenteData) return `${somenteData[3]}/${somenteData[2]}/${somenteData[1]}`;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleDateString("pt-BR");
}

function formatarTelefone(telefone) {
  if (!telefone) return "—";
  const digitos = String(telefone).replace(/\D/g, "");
  if (digitos.length === 11) return digitos.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digitos.length === 10) return digitos.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return String(telefone);
}

export default function ExVoluntariosScreen({ usuario, onInicio }) {
  const permitido = usuario?.tipoUsuario === "RESPONSAVEL" && usuario?.ativo === true;
  const [nome, setNome] = useState("");
  const [situacao, setSituacao] = useState("");
  const [filtrosAplicados, setFiltrosAplicados] = useState({ nome: "", situacao: "" });
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(permitido);
  const [erro, setErro] = useState("");
  const consultaAtual = useRef(0);

  const carregar = useCallback(async (filtros) => {
    const consulta = consultaAtual.current + 1;
    consultaAtual.current = consulta;
    setCarregando(true);
    setErro("");
    try {
      const resultado = await listarExVoluntarios(filtros);
      if (consultaAtual.current === consulta) setLista(resultado);
    } catch (err) {
      if (consultaAtual.current === consulta) {
        setLista([]);
        setErro(err.message || "Não foi possível carregar os ex-voluntários.");
      }
    } finally {
      if (consultaAtual.current === consulta) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (permitido) carregar({ nome: "", situacao: "" });
  }, [permitido, carregar]);

  function filtrar(event) {
    event.preventDefault();
    const filtros = { nome: nome.trim(), situacao };
    setFiltrosAplicados(filtros);
    carregar(filtros);
  }

  function limpar() {
    setNome("");
    setSituacao("");
    setFiltrosAplicados({ nome: "", situacao: "" });
    carregar({ nome: "", situacao: "" });
  }

  const comFiltro = Boolean(filtrosAplicados.nome || filtrosAplicados.situacao);

  return (
    <div className="site-shell ex-voluntarios">
      <style>{styles}</style>
      <header>
        <Brand href="/inicio" onClick={onInicio} />
        <button type="button" onClick={onInicio}>Voltar ao início</button>
      </header>
      <main>
        <h1>Ex-voluntários</h1>
        {!permitido ? (
          <FeedbackMessage>Somente um responsável ativo pode consultar ex-voluntários.</FeedbackMessage>
        ) : (
          <>
            <p className="intro">Pessoas com cadastro inativo ou com saída registrada em algum programa.</p>
            <form className="ex-voluntarios-filtros" onSubmit={filtrar} aria-label="Filtros de ex-voluntários">
              <label>
                Nome
                <input name="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Buscar por nome" />
              </label>
              <label>
                Situação
                <select name="situacao" value={situacao} onChange={(e) => setSituacao(e.target.value)}>
                  {situacoes.map((s) => <option key={s.valor} value={s.valor}>{s.rotulo}</option>)}
                </select>
              </label>
              <button type="submit" className="filtrar" disabled={carregando}>Filtrar</button>
              <button type="button" onClick={limpar} disabled={carregando}>Limpar</button>
            </form>

            {carregando && <p className="ex-voluntarios-vazio" role="status">Carregando ex-voluntários...</p>}

            {!carregando && erro && (
              <>
                <FeedbackMessage>{erro}</FeedbackMessage>
                <button type="button" onClick={() => carregar(filtrosAplicados)}>Tentar novamente</button>
              </>
            )}

            {!carregando && !erro && lista.length === 0 && (
              <p className="ex-voluntarios-vazio">
                {comFiltro ? "Nenhum ex-voluntário encontrado com esses filtros." : "Nenhum ex-voluntário cadastrado na plataforma."}
              </p>
            )}

            {!carregando && !erro && lista.length > 0 && (
              <div className="ex-voluntarios-tabela-wrap">
                <table className="ex-voluntarios-tabela">
                  <caption>{lista.length} ex-voluntário(s)</caption>
                  <thead>
                    <tr>
                      <th scope="col">Nome</th>
                      <th scope="col">E-mail</th>
                      <th scope="col">Telefone</th>
                      <th scope="col">Situação</th>
                      <th scope="col">Última saída</th>
                      <th scope="col">Cadastrado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((pessoa) => (
                      <tr key={pessoa.id}>
                        <td>{pessoa.nome || "—"}</td>
                        <td>{pessoa.email || "—"}</td>
                        <td>{formatarTelefone(pessoa.telefone)}</td>
                        <td>
                          <div className="ex-voluntarios-situacao">
                            {pessoa.cadastroAtivo === false && <span className="ex-voluntarios-etiqueta inativo">Cadastro inativo</span>}
                            {pessoa.saidaRegistrada && <span className="ex-voluntarios-etiqueta saida">Saída registrada</span>}
                          </div>
                        </td>
                        <td>{formatarData(pessoa.ultimaSaida)}</td>
                        <td>{formatarData(pessoa.dataCadastro)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
