import React, { useMemo, useState } from "react";

export const NOMES_DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const NOMES_DIAS_COMPLETOS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function formatarDataBR(ano, mes, dia) {
  return `${pad2(dia)}/${pad2(mes + 1)}/${ano}`;
}

export function parseDataBR(str) {
  if (!str || typeof str !== "string") return null;
  const partesBR = str.trim().split("/");
  if (partesBR.length === 3) {
    const dia = parseInt(partesBR[0], 10);
    const mes = parseInt(partesBR[1], 10) - 1;
    const ano = parseInt(partesBR[2], 10);
    if (!Number.isNaN(dia) && !Number.isNaN(mes) && !Number.isNaN(ano)) {
      return new Date(ano, mes, dia);
    }
  }
  const partesISO = str.trim().split("-");
  if (partesISO.length === 3) {
    const ano = parseInt(partesISO[0], 10);
    const mes = parseInt(partesISO[1], 10) - 1;
    const dia = parseInt(partesISO[2], 10);
    if (!Number.isNaN(dia) && !Number.isNaN(mes) && !Number.isNaN(ano)) {
      return new Date(ano, mes, dia);
    }
  }
  return null;
}

export function ordenarDatas(lista) {
  return [...lista].sort((a, b) => {
    const da = parseDataBR(a);
    const db = parseDataBR(b);
    if (da && db) return da.getTime() - db.getTime();
    return a.localeCompare(b);
  });
}

export function obterRotuloData(dataStr) {
  const data = parseDataBR(dataStr);
  if (!data) return dataStr;
  const diaSemana = NOMES_DIAS_CURTOS[data.getDay()];
  return `${dataStr} (${diaSemana})`;
}

export function gerarDatasRecorrentes({ diasSemana, semanas, dataInicio, dataFim }) {
  if (!Array.isArray(diasSemana) || diasSemana.length === 0) return [];

  const inicio = dataInicio ? new Date(dataInicio) : new Date();
  inicio.setHours(0, 0, 0, 0);

  let limite = new Date(inicio);
  if (dataFim) {
    const fim = parseDataBR(dataFim) || new Date(dataFim);
    fim.setHours(23, 59, 59, 999);
    limite = fim;
  } else {
    const totalSemanas = parseInt(semanas, 10) || 4;
    limite.setDate(limite.getDate() + totalSemanas * 7);
  }

  const datas = [];
  const atual = new Date(inicio);
  while (atual <= limite) {
    if (diasSemana.includes(atual.getDay())) {
      datas.push(formatarDataBR(atual.getFullYear(), atual.getMonth(), atual.getDate()));
    }
    atual.setDate(atual.getDate() + 1);
  }
  return datas;
}

const styles = String.raw`
.calendario-dias-wrapper { display: grid; gap: 14px; }
.calendario-container { display: grid; gap: 16px; padding: clamp(14px, 3vw, 20px); border: 1px solid var(--border-ui); border-radius: 14px; background: #ffffff; }
.recorrencia-toggle { display: flex; align-items: center; }
.recorrencia-checkbox-label { display: flex; align-items: center; gap: 9px; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--ink); user-select: none; }
.recorrencia-checkbox-label input[type="checkbox"] { width: 18px; height: 18px; min-height: auto; margin: 0; cursor: pointer; accent-color: var(--teal); }
.recorrencia-card { display: grid; gap: 12px; padding: 14px; border: 1px solid #c9ded5; border-radius: 12px; background: #f3f8f5; animation: fadeIn .2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
.recorrencia-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.recorrencia-header h3 { margin: 0; font-size: 14px; font-weight: 700; color: var(--ink); }
.recorrencia-dias { display: flex; flex-wrap: wrap; gap: 6px; }
.recorrencia-dia-btn { min-height: 36px; padding: 6px 12px; border: 1px solid var(--border-ui); border-radius: 8px; background: white; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--ink); transition: all .15s ease; }
.recorrencia-dia-btn:hover { background: #e4eee7; }
.recorrencia-dia-btn.ativo { background: var(--teal); color: white; border-color: var(--teal); }
.recorrencia-opcoes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: end; }
.recorrencia-acoes { display: flex; gap: 10px; flex-wrap: wrap; }
.recorrencia-acoes button { min-height: 38px; padding: 8px 14px; font-size: 13px; font-weight: 600; }
.calendario-nav { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.calendario-nav h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--ink); text-transform: capitalize; }
.calendario-nav-botoes { display: flex; gap: 6px; }
.calendario-nav-botoes button { min-height: 34px; padding: 4px 12px; font-size: 13px; }
.calendario-grade { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; }
.calendario-cabecalho-dia { font-size: 12px; font-weight: 700; color: var(--soft); padding: 6px 0; }
.calendario-dia-btn { aspect-ratio: 1; min-height: 36px; display: grid; place-items: center; border: 1px solid transparent; border-radius: 8px; background: transparent; color: var(--ink); cursor: pointer; font-size: 14px; font-weight: 500; transition: all .15s ease; padding: 0; }
.calendario-dia-btn:hover:not(:disabled) { background: #e4eee7; }
.calendario-dia-btn.selecionado { background: var(--teal); color: white; font-weight: 700; }
.calendario-dia-btn.hoje { border: 2px solid var(--teal); }
.calendario-dia-vazio { aspect-ratio: 1; min-height: 36px; }
.selecionados-container { display: grid; gap: 8px; padding-top: 10px; border-top: 1px solid #e1ece6; }
.selecionados-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.selecionados-header span { font-size: 13px; font-weight: 700; color: var(--ink); }
.selecionados-header button { min-height: 30px; padding: 2px 10px; font-size: 12px; border-color: #a4b6ac; color: #526b62; }
.selecionados-header button:hover { background: #f2dede; color: var(--error-ink); border-color: #ebccd1; }
.selecionados-chips { display: flex; flex-wrap: wrap; gap: 6px; max-height: 130px; overflow-y: auto; padding: 4px 0; }
.data-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 16px; background: #dcece3; color: #173e3b; font-size: 12px; font-weight: 600; }
.data-chip-remover { border: none; background: transparent; cursor: pointer; padding: 0; color: #526b62; font-size: 14px; line-height: 1; min-height: auto; width: 18px; height: 18px; display: grid; place-items: center; border-radius: 50%; }
.data-chip-remover:hover { color: var(--error-ink); background: rgba(0,0,0,0.05); }
.calendario-ajuda { color: #526b62; font-size: 12px; line-height: 1.4; }
@media (max-width: 480px) { .recorrencia-opcoes { grid-template-columns: 1fr; } }
`;

export default function CalendarioDiasDisponiveis({
  id = "diasDisponiveis",
  dias = [],
  onChange,
  disabled = false,
}) {
  const hoje = useMemo(() => new Date(), []);
  const [dataVisualizada, setDataVisualizada] = useState(
    () => new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  );

  // Estado da recorrência
  const [ehRecorrente, setEhRecorrente] = useState(false);
  const [diasSemanaRecorrencia, setDiasSemanaRecorrencia] = useState([]);
  const [duracaoRecorrencia, setDuracaoRecorrencia] = useState("4");
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState("");
  const [mensagemRecorrencia, setMensagemRecorrencia] = useState("");

  const listaDias = Array.isArray(dias)
    ? dias
    : typeof dias === "string"
    ? dias.split("\n").map((d) => d.trim()).filter(Boolean)
    : [];

  const ano = dataVisualizada.getFullYear();
  const mes = dataVisualizada.getMonth();

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

  function navegarMes(delta) {
    setDataVisualizada(new Date(ano, mes + delta, 1));
  }

  function irParaMesAtual() {
    setDataVisualizada(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  }

  function toggleDia(diaNumero) {
    if (disabled) return;
    const dataStr = formatarDataBR(ano, mes, diaNumero);
    let novaLista;
    if (listaDias.includes(dataStr)) {
      novaLista = listaDias.filter((d) => d !== dataStr);
    } else {
      novaLista = ordenarDatas([...listaDias, dataStr]);
    }
    if (onChange) onChange(novaLista);
  }

  function removerDia(dataStr) {
    if (disabled) return;
    const novaLista = listaDias.filter((d) => d !== dataStr);
    if (onChange) onChange(novaLista);
  }

  function limparTodosDias() {
    if (disabled) return;
    if (onChange) onChange([]);
    setMensagemRecorrencia("");
  }

  function toggleDiaSemanaRecorrencia(diaIndex) {
    setDiasSemanaRecorrencia((atuais) =>
      atuais.includes(diaIndex)
        ? atuais.filter((d) => d !== diaIndex)
        : [...atuais, diaIndex].sort()
    );
    setMensagemRecorrencia("");
  }

  function aplicarRecorrencia() {
    if (disabled || diasSemanaRecorrencia.length === 0) {
      setMensagemRecorrencia("Selecione pelo menos um dia da semana para a recorrência.");
      return;
    }

    const novasDatas = gerarDatasRecorrentes({
      diasSemana: diasSemanaRecorrencia,
      semanas: duracaoRecorrencia !== "custom" ? parseInt(duracaoRecorrencia, 10) : undefined,
      dataInicio: hoje,
      dataFim: duracaoRecorrencia === "custom" ? dataFimPersonalizada : undefined,
    });

    if (novasDatas.length === 0) {
      setMensagemRecorrencia("Nenhuma data foi gerada para o período configurado.");
      return;
    }

    const uniao = Array.from(new Set([...listaDias, ...novasDatas]));
    const ordenada = ordenarDatas(uniao);
    if (onChange) onChange(ordenada);
    setMensagemRecorrencia(`${novasDatas.length} dia(s) recorrente(s) adicionado(s) ao calendário!`);
  }

  const ehMesAtual = ano === hoje.getFullYear() && mes === hoje.getMonth();

  return (
    <div className="calendario-dias-wrapper" role="region" aria-label="Seleção de dias disponíveis">
      <style>{styles}</style>

      {/* Checkbox para Ativar Programa Recorrente */}
      <div className="recorrencia-toggle">
        <label className="recorrencia-checkbox-label" htmlFor={`${id}-recorrente-checkbox`}>
          <input
            id={`${id}-recorrente-checkbox`}
            type="checkbox"
            checked={ehRecorrente}
            onChange={(e) => {
              setEhRecorrente(e.target.checked);
              setMensagemRecorrencia("");
            }}
            disabled={disabled}
          />
          <span>Programa recorrente (repetir semanalmente)</span>
        </label>
      </div>

      {/* Seção com opções de Programa Recorrente (visível somente quando checkbox está marcado) */}
      {ehRecorrente && (
        <div className="recorrencia-card" aria-label="Opções de recorrência do programa">
          <div className="recorrencia-header">
            <h3>Configurar recorrência semanal</h3>
            <small className="calendario-ajuda">Repita automaticamente pelos dias da semana selecionados</small>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
              Dias da semana da atividade:
            </label>
            <div className="recorrencia-dias" role="group" aria-label="Dias da semana para repetição">
              {NOMES_DIAS_COMPLETOS.map((nomeCompleto, index) => {
                const ativo = diasSemanaRecorrencia.includes(index);
                return (
                  <button
                    key={nomeCompleto}
                    type="button"
                    className={`recorrencia-dia-btn ${ativo ? "ativo" : ""}`}
                    onClick={() => toggleDiaSemanaRecorrencia(index)}
                    disabled={disabled}
                    aria-pressed={ativo}
                    title={nomeCompleto}
                  >
                    {NOMES_DIAS_CURTOS[index]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="recorrencia-opcoes">
            <div>
              <label htmlFor={`${id}-duracao-recorrencia`} style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                Período de repetição:
              </label>
              <select
                id={`${id}-duracao-recorrencia`}
                value={duracaoRecorrencia}
                onChange={(e) => { setDuracaoRecorrencia(e.target.value); setMensagemRecorrencia(""); }}
                disabled={disabled}
              >
                <option value="4">Próximas 4 semanas (1 mês)</option>
                <option value="8">Próximas 8 semanas (2 meses)</option>
                <option value="12">Próximas 12 semanas (3 meses)</option>
                <option value="24">Próximas 24 semanas (6 meses)</option>
                <option value="custom">Até uma data final específica</option>
              </select>
            </div>

            {duracaoRecorrencia === "custom" && (
              <div>
                <label htmlFor={`${id}-data-fim`} style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                  Data final da recorrência:
                </label>
                <input
                  id={`${id}-data-fim`}
                  type="date"
                  value={dataFimPersonalizada}
                  min={hoje.toISOString().split("T")[0]}
                  onChange={(e) => { setDataFimPersonalizada(e.target.value); setMensagemRecorrencia(""); }}
                  disabled={disabled}
                />
              </div>
            )}
          </div>

          <div className="recorrencia-acoes">
            <button
              type="button"
              onClick={aplicarRecorrencia}
              disabled={disabled || diasSemanaRecorrencia.length === 0}
              style={{ color: "white", background: "var(--teal)", borderColor: "var(--teal)" }}
            >
              Aplicar dias recorrentes
            </button>
          </div>

          {mensagemRecorrencia && (
            <small style={{ color: "var(--teal)", fontWeight: "600" }} role="status">
              {mensagemRecorrencia}
            </small>
          )}
        </div>
      )}
  
      {/* Grade do Calendário Interativo */}
      <div className="calendario-container">
        <div className="calendario-nav">
          <h3>
            {NOMES_MESES[mes]} de {ano}
          </h3>
          <div className="calendario-nav-botoes">
            <button
              type="button"
              onClick={() => navegarMes(-1)}
              disabled={disabled}
              aria-label="Mês anterior"
            >
              ← Anterior
            </button>
            {!ehMesAtual && (
              <button
                type="button"
                onClick={irParaMesAtual}
                disabled={disabled}
                aria-label="Ir para o mês atual"
              >
                Hoje
              </button>
            )}
            <button
              type="button"
              onClick={() => navegarMes(1)}
              disabled={disabled}
              aria-label="Próximo mês"
            >
              Próximo →
            </button>
          </div>
        </div>

        <div className="calendario-grade" role="grid" aria-label={`Calendário de ${NOMES_MESES[mes]} de ${ano}`}>
          {NOMES_DIAS_CURTOS.map((d) => (
            <div key={d} className="calendario-cabecalho-dia" aria-hidden="true">
              {d}
            </div>
          ))}

          {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
            <div key={`vazio-${i}`} className="calendario-dia-vazio" aria-hidden="true" />
          ))}

          {Array.from({ length: totalDiasMes }).map((_, i) => {
            const diaNum = i + 1;
            const dataStr = formatarDataBR(ano, mes, diaNum);
            const selecionado = listaDias.includes(dataStr);
            const ehHoje =
              ano === hoje.getFullYear() &&
              mes === hoje.getMonth() &&
              diaNum === hoje.getDate();

            return (
              <button
                key={dataStr}
                type="button"
                className={`calendario-dia-btn ${selecionado ? "selecionado" : ""} ${ehHoje ? "hoje" : ""}`}
                onClick={() => toggleDia(diaNum)}
                disabled={disabled}
                aria-pressed={selecionado}
                aria-label={`${diaNum} de ${NOMES_MESES[mes]} de ${ano}${selecionado ? " (selecionado)" : ""}`}
              >
                {diaNum}
              </button>
            );
          })}
        </div>

        {/* Resumo de dias selecionados */}
        <div className="selecionados-container">
          <div className="selecionados-header">
            <span>
              {listaDias.length === 0
                ? "Nenhum dia selecionado"
                : `${listaDias.length} dia${listaDias.length > 1 ? "s" : ""} selecionado${listaDias.length > 1 ? "s" : ""}`}
            </span>
            {listaDias.length > 0 && (
              <button
                type="button"
                onClick={limparTodosDias}
                disabled={disabled}
                aria-label="Limpar todos os dias selecionados"
              >
                Limpar todos
              </button>
            )}
          </div>

          {listaDias.length > 0 ? (
            <div className="selecionados-chips" aria-label="Lista de dias selecionados">
              {listaDias.map((d) => (
                <span key={d} className="data-chip">
                  {obterRotuloData(d)}
                  <button
                    type="button"
                    className="data-chip-remover"
                    onClick={() => removerDia(d)}
                    disabled={disabled}
                    aria-label={`Remover ${d}`}
                    title={`Remover ${d}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <small className="calendario-ajuda" id="dias-ajuda">
              Clique nos dias acima ou use a ferramenta de recorrência para marcar os dias de disponibilidade.
            </small>
          )}
        </div>
      </div>
    </div>
  );
}
