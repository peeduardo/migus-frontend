import { act, fireEvent, render, screen } from "@testing-library/react";
import ProgramaScreen from "./ProgramaScreen";

const usuario = { id: "responsavel-ficticio", nome: "Ana Teste", tipoUsuario: "RESPONSAVEL", ativo: true };

beforeEach(() => {
  sessionStorage.clear();
  sessionStorage.setItem("migus.token", "token-ficticio");
  sessionStorage.setItem("migus.expiresAt", String(Date.now() + 60000));
  sessionStorage.setItem("migus.usuario", JSON.stringify(usuario));
  global.fetch = jest.fn();
});

test.each([
  [400, "nome: Nome é obrigatório"],
  [403, "Somente um responsável ativo pode cadastrar programas"],
  [500, "Erro interno no servidor"],
])("mostra o erro HTTP %s e mantém os dados", async (status, message) => {
  fetch.mockResolvedValue({ ok: false, status, json: async () => ({ message }) });
  render(<ProgramaScreen usuario={usuario} onInicio={() => {}} />);
  preencher();
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar programa" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(message);
  expect(screen.getByLabelText("Nome")).toHaveValue("Oficina de leitura");
  expect(screen.getByLabelText("Ativo")).toHaveValue("false");
});

test("mantém o formulário após falha de conexão", async () => {
  fetch.mockRejectedValue(new TypeError("Failed to fetch"));
  render(<ProgramaScreen usuario={usuario} onInicio={() => {}} />);
  preencher();
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar programa" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar ao servidor");
  expect(screen.getByLabelText("Descrição")).toHaveValue("Leitura em grupo");
});

test("bloqueia outro envio enquanto aguarda a resposta", async () => {
  let responder;
  fetch.mockReturnValue(new Promise(resolve => { responder = resolve; }));
  render(<ProgramaScreen usuario={usuario} onInicio={() => {}} />);
  preencher();
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar programa" }));
  expect(screen.getByRole("button", { name: "Cadastrando..." })).toBeDisabled();
  fireEvent.submit(screen.getByRole("form"));
  expect(fetch).toHaveBeenCalledTimes(1);
  await act(async () => responder({ ok: true, status: 201, json: async () => ({ id: "novo" }) }));
});

test("não aceita campos contendo apenas espaços", () => {
  render(<ProgramaScreen usuario={usuario} onInicio={() => {}} />);
  preencher();
  fireEvent.change(screen.getByLabelText("Categorias"), { target: { value: "  \n " } });
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar programa" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Preencha todos os campos");
  expect(fetch).not.toHaveBeenCalled();
});

test("recupera os dados ao voltar para a tela após entrar novamente", () => {
  const tela = render(<ProgramaScreen usuario={usuario} onInicio={() => {}} />);
  preencher();
  tela.unmount();
  render(<ProgramaScreen usuario={usuario} onInicio={() => {}} />);
  expect(screen.getByLabelText("Nome")).toHaveValue("Oficina de leitura");
  expect(screen.getByLabelText("Ativo")).toHaveValue("false");
});

test("exige uma escolha para ativo antes de enviar", () => {
  render(<ProgramaScreen usuario={usuario} onInicio={() => {}} />);
  preencher();
  fireEvent.change(screen.getByLabelText("Ativo"), { target: { value: "" } });
  expect(screen.getByLabelText("Ativo")).toBeInvalid();
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar programa" }));
  expect(fetch).not.toHaveBeenCalled();
});

test("orienta sobre permissão ou sessão quando o backend retorna 403 sem mensagem", async () => {
  fetch.mockResolvedValue({ ok: false, status: 403, json: async () => { throw new Error(); } });
  render(<ProgramaScreen usuario={usuario} onInicio={() => {}} />);
  preencher();
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar programa" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Acesso negado. Confira sua permissão ou entre novamente.");
});

test("uma resposta 401 limpa a sessão e encaminha para o login sem perder o rascunho", async () => {
  const location = window.location;
  delete window.location;
  window.location = { replace: jest.fn() };
  try {
    fetch.mockResolvedValue({ ok: false, status: 401 });
    render(<ProgramaScreen usuario={usuario} onInicio={() => {}} />);
    preencher();
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar programa" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sua sessão expirou");
    expect(window.location.replace).toHaveBeenCalledWith("/login");
    expect(sessionStorage.getItem("migus.token")).toBeNull();
    expect(sessionStorage.getItem("migus.programa.rascunho." + usuario.id)).toContain("Oficina de leitura");
  } finally {
    window.location = location;
  }
});

function preencher() {
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Oficina de leitura" } });
  fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Leitura em grupo" } });
  fireEvent.change(screen.getByLabelText("Categorias"), { target: { value: "Educação\nCultura" } });
  fireEvent.change(screen.getByLabelText("Dias disponíveis"), { target: { value: "segunda\nquarta" } });
  fireEvent.change(screen.getByLabelText("Horário de início"), { target: { value: "09:00" } });
  fireEvent.change(screen.getByLabelText("Horário de fim"), { target: { value: "12:00" } });
  fireEvent.change(screen.getByLabelText("Ativo"), { target: { value: "false" } });
}

test("cadastra com ativo false e envia somente os campos do formulário", async () => {
  fetch.mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: "programa-ficticio" }) });
  render(<ProgramaScreen usuario={usuario} onInicio={() => {}} />);
  preencher();
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar programa" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Programa cadastrado com sucesso");
  expect(sessionStorage.getItem("migus.programa.rascunho." + usuario.id)).toBeNull();
  const [url, pedido] = fetch.mock.calls[0];
  expect(url).toMatch(/\/api\/programas$/);
  expect(pedido.method).toBe("POST");
  expect(pedido.headers.get("Authorization")).toBe("Bearer token-ficticio");
  expect(JSON.parse(pedido.body)).toEqual({
    nome: "Oficina de leitura", descricao: "Leitura em grupo", categoria: ["Educação", "Cultura"],
    diasDisponiveis: ["segunda", "quarta"], horarioInicio: "09:00", horarioFim: "12:00", ativo: false,
  });
});

test("outra conta não recebe o rascunho do responsável anterior", () => {
  const primeiraTela = render(<ProgramaScreen usuario={usuario} onInicio={() => {}} />);
  preencher();
  primeiraTela.unmount();
  const segundaTela = render(<ProgramaScreen usuario={{ ...usuario, id: "outro-responsavel" }} onInicio={() => {}} />);
  expect(screen.getByLabelText("Nome")).toHaveValue("");
  segundaTela.unmount();
  render(<ProgramaScreen usuario={usuario} onInicio={() => {}} />);
  expect(screen.getByLabelText("Nome")).toHaveValue("Oficina de leitura");
});
