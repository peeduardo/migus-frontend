import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import CalendarioDiasDisponiveis, {
  formatarDataBR,
  gerarDatasRecorrentes,
  ordenarDatas,
  parseDataBR,
} from "./CalendarioDiasDisponiveis";

describe("CalendarioDiasDisponiveis helper functions", () => {
  test("formatarDataBR formata dia, mês e ano corretamente", () => {
    expect(formatarDataBR(2026, 10, 5)).toBe("05/11/2026");
    expect(formatarDataBR(2026, 0, 25)).toBe("25/01/2026");
  });

  test("parseDataBR interpreta datas no formato DD/MM/YYYY e YYYY-MM-DD", () => {
    const d1 = parseDataBR("15/08/2026");
    expect(d1.getFullYear()).toBe(2026);
    expect(d1.getMonth()).toBe(7);
    expect(d1.getDate()).toBe(15);

    const d2 = parseDataBR("2026-11-20");
    expect(d2.getFullYear()).toBe(2026);
    expect(d2.getMonth()).toBe(10);
    expect(d2.getDate()).toBe(20);

    expect(parseDataBR(null)).toBeNull();
    expect(parseDataBR("invalido")).toBeNull();
  });

  test("ordenarDatas ordena datas em ordem cronológica", () => {
    const datas = ["25/12/2026", "01/01/2026", "15/06/2026"];
    const ordenadas = ordenarDatas(datas);
    expect(ordenadas).toEqual(["01/01/2026", "15/06/2026", "25/12/2026"]);
  });

  test("gerarDatasRecorrentes gera datas para os dias da semana selecionados", () => {
    // 01/11/2026 é Domingo (0).
    const dataInicio = new Date(2026, 10, 1);
    // Gerar para Segunda (1) e Quarta (3) por 2 semanas
    const recorrentes = gerarDatasRecorrentes({
      diasSemana: [1, 3],
      semanas: 2,
      dataInicio,
    });
    expect(recorrentes).toEqual([
      "02/11/2026", // Segunda
      "04/11/2026", // Quarta
      "09/11/2026", // Segunda
      "11/11/2026", // Quarta
    ]);
  });
});

describe("CalendarioDiasDisponiveis Component", () => {
  test("renderiza o calendário e a checkbox de programa recorrente desmarcada por padrão", () => {
    render(<CalendarioDiasDisponiveis dias={[]} onChange={jest.fn()} />);
    expect(screen.getByRole("region", { name: "Seleção de dias disponíveis" })).toBeInTheDocument();
    
    const checkboxRecorrente = screen.getByLabelText("Programa recorrente (repetir semanalmente)");
    expect(checkboxRecorrente).toBeInTheDocument();
    expect(checkboxRecorrente).not.toBeChecked();

    // Enquanto desmarcada, as opções de recorrência NÃO aparecem
    expect(screen.queryByText("Configurar recorrência semanal")).not.toBeInTheDocument();
    expect(screen.queryByText("Dias da semana da atividade:")).not.toBeInTheDocument();

    // O calendário permanece visível
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByText("Nenhum dia selecionado")).toBeInTheDocument();
  });

  test("exibe as opções de recorrência ao marcar a checkbox e oculta ao desmarcar", () => {
    render(<CalendarioDiasDisponiveis dias={[]} onChange={jest.fn()} />);
    
    const checkboxRecorrente = screen.getByLabelText("Programa recorrente (repetir semanalmente)");
    
    // Marca a checkbox
    fireEvent.click(checkboxRecorrente);
    expect(checkboxRecorrente).toBeChecked();
    expect(screen.getByText("Configurar recorrência semanal")).toBeInTheDocument();
    expect(screen.getByText("Dias da semana da atividade:")).toBeInTheDocument();

    // Desmarca a checkbox
    fireEvent.click(checkboxRecorrente);
    expect(checkboxRecorrente).not.toBeChecked();
    expect(screen.queryByText("Configurar recorrência semanal")).not.toBeInTheDocument();
  });

  test("permite selecionar e desmarcar um dia clicando no calendário", () => {
    const onChange = jest.fn();
    render(<CalendarioDiasDisponiveis dias={[]} onChange={onChange} />);

    // Clica no dia 15
    const botaoDia15 = screen.getByRole("button", { name: /^15 de / });
    fireEvent.click(botaoDia15);
    expect(onChange).toHaveBeenCalledTimes(1);
    const primeiraChamada = onChange.mock.calls[0][0];
    expect(primeiraChamada.length).toBe(1);
    expect(primeiraChamada[0]).toMatch(/^15\//);
  });

  test("exibe os chips das datas selecionadas e permite remoção", () => {
    const onChange = jest.fn();
    render(<CalendarioDiasDisponiveis dias={["10/11/2026", "12/11/2026"]} onChange={onChange} />);

    expect(screen.getByText("2 dias selecionados")).toBeInTheDocument();
    expect(screen.getByText(/10\/11\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/12\/11\/2026/)).toBeInTheDocument();

    // Clicar no botão de remover de uma data
    const botaoRemover = screen.getByRole("button", { name: "Remover 10/11/2026" });
    fireEvent.click(botaoRemover);
    expect(onChange).toHaveBeenCalledWith(["12/11/2026"]);
  });

  test("botão Limpar todos limpa a lista de dias", () => {
    const onChange = jest.fn();
    render(<CalendarioDiasDisponiveis dias={["10/11/2026", "12/11/2026"]} onChange={onChange} />);

    const botaoLimpar = screen.getByRole("button", { name: "Limpar todos os dias selecionados" });
    fireEvent.click(botaoLimpar);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  test("permite navegar entre os meses", () => {
    render(<CalendarioDiasDisponiveis dias={[]} onChange={jest.fn()} />);

    const botaoProximo = screen.getByRole("button", { name: "Próximo mês" });
    fireEvent.click(botaoProximo);

    // Deve exibir o botão "Hoje" após navegar
    expect(screen.getByRole("button", { name: "Ir para o mês atual" })).toBeInTheDocument();

    const botaoAnterior = screen.getByRole("button", { name: "Mês anterior" });
    fireEvent.click(botaoAnterior);
  });

  test("permite configurar e aplicar recorrência semanal após marcar a checkbox", () => {
    const onChange = jest.fn();
    render(<CalendarioDiasDisponiveis dias={[]} onChange={onChange} />);

    // Marca a checkbox de programa recorrente
    const checkboxRecorrente = screen.getByLabelText("Programa recorrente (repetir semanalmente)");
    fireEvent.click(checkboxRecorrente);

    // Seleciona Terça e Quinta na recorrência
    const botaoTer = screen.getByRole("button", { name: "Ter" });
    const botaoQui = screen.getByRole("button", { name: "Qui" });
    fireEvent.click(botaoTer);
    fireEvent.click(botaoQui);

    // Clica em Aplicar dias recorrentes
    const botaoAplicar = screen.getByRole("button", { name: "Aplicar dias recorrentes" });
    fireEvent.click(botaoAplicar);

    expect(onChange).toHaveBeenCalled();
    const datasGeradas = onChange.mock.calls[0][0];
    expect(datasGeradas.length).toBeGreaterThan(0);
    expect(screen.getByRole("status")).toHaveTextContent("recorrente(s) adicionado(s) ao calendário!");
  });
});
