import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProgramaScreen from "./ProgramaScreen";
import { cadastrarPrograma } from "../services/programas";

jest.mock("../services/programas", () => ({
  cadastrarPrograma: jest.fn(),
}));

const usuarioResponsavel = {
  id: "resp1",
  nome: "Responsável Teste",
  tipoUsuario: "RESPONSAVEL",
  ativo: true,
};

describe("ProgramaScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  test("bloqueia cadastro para usuário que não é responsável ativo", () => {
    const usuarioComum = { id: "vol1", tipoUsuario: "VOLUNTARIO", ativo: true };
    render(<ProgramaScreen usuario={usuarioComum} onInicio={jest.fn()} />);
    expect(
      screen.getByText("Somente um responsável ativo pode cadastrar programas.")
    ).toBeInTheDocument();
  });

  test("renderiza o formulário com o campo de calendário de dias disponíveis para responsável", () => {
    render(<ProgramaScreen usuario={usuarioResponsavel} onInicio={jest.fn()} />);

    expect(screen.getByRole("heading", { name: "Cadastrar programa" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
    expect(screen.getByLabelText("Categorias")).toBeInTheDocument();
    expect(screen.getByText("Dias disponíveis")).toBeInTheDocument();
    expect(screen.getByLabelText("Programa recorrente (repetir semanalmente)")).toBeInTheDocument();
    expect(screen.getByLabelText("Horário de início")).toBeInTheDocument();
    expect(screen.getByLabelText("Horário de fim")).toBeInTheDocument();
    expect(screen.getByLabelText("Ativo")).toBeInTheDocument();
  });

  test("valida campos obrigatórios quando nenhum dia disponível for selecionado", async () => {
    render(<ProgramaScreen usuario={usuarioResponsavel} onInicio={jest.fn()} />);

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Apoio Escolar" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Ajudar crianças" } });
    fireEvent.change(screen.getByLabelText("Categorias"), { target: { value: "Educação" } });
    fireEvent.change(screen.getByLabelText("Horário de início"), { target: { value: "14:00" } });
    fireEvent.change(screen.getByLabelText("Horário de fim"), { target: { value: "17:00" } });
    fireEvent.change(screen.getByLabelText("Ativo"), { target: { value: "true" } });

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar programa" }));

    expect(
      await screen.findByText(
        "Preencha todos os campos. Informe pelo menos uma categoria e selecione ao menos um dia disponível no calendário."
      )
    ).toBeInTheDocument();
    expect(cadastrarPrograma).not.toHaveBeenCalled();
  });

  test("cadastra programa com sucesso ao selecionar dias e submeter", async () => {
    cadastrarPrograma.mockResolvedValueOnce({ id: "prog123", nome: "Apoio Escolar" });

    render(<ProgramaScreen usuario={usuarioResponsavel} onInicio={jest.fn()} />);

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Apoio Escolar" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Ajudar crianças" } });
    fireEvent.change(screen.getByLabelText("Categorias"), { target: { value: "Educação\nInfantil" } });
    fireEvent.change(screen.getByLabelText("Horário de início"), { target: { value: "14:00" } });
    fireEvent.change(screen.getByLabelText("Horário de fim"), { target: { value: "17:00" } });
    fireEvent.change(screen.getByLabelText("Ativo"), { target: { value: "true" } });

    // Selecionar dia no calendário
    const botaoDia15 = screen.getByRole("button", { name: /^15 de / });
    fireEvent.click(botaoDia15);

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar programa" }));

    await waitFor(() => {
      expect(cadastrarPrograma).toHaveBeenCalledTimes(1);
    });

    const dadosEnviados = cadastrarPrograma.mock.calls[0][0];
    expect(dadosEnviados.nome).toBe("Apoio Escolar");
    expect(dadosEnviados.descricao).toBe("Ajudar crianças");
    expect(dadosEnviados.categoria).toEqual(["Educação", "Infantil"]);
    expect(dadosEnviados.diasDisponiveis.length).toBe(1);
    expect(dadosEnviados.diasDisponiveis[0]).toMatch(/^15\//);
    expect(dadosEnviados.horarioInicio).toBe("14:00");
    expect(dadosEnviados.horarioFim).toBe("17:00");
    expect(dadosEnviados.ativo).toBe(true);

    expect(await screen.findByText("Programa cadastrado com sucesso!")).toBeInTheDocument();
  });
});
