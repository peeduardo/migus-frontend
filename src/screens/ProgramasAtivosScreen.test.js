import { act, fireEvent, render, screen, within } from "@testing-library/react";
import ProgramasAtivosScreen from "./ProgramasAtivosScreen";

const fetchOriginal = global.fetch;
const usuario = { id: "ana", tipoUsuario: "INTERESSADO" };
const programa = { id: "leitura", nome: "Leitura", ativo: true };
const resposta = dados => ({ ok: true, status: 200, json: async () => dados });
let minhas;
beforeEach(() => {
  sessionStorage.setItem("migus.token", "token-ficticio");
  sessionStorage.setItem("migus.expiresAt", String(Date.now() + 60000));
  sessionStorage.setItem("migus.usuario", JSON.stringify(usuario));
  minhas = [];
  global.fetch = jest.fn(async (url, opcoes = {}) => {
    if (opcoes.method === "POST") return resposta({ inscricaoId: "nova" });
    return resposta(new URL(url).pathname.endsWith("/ativos") ? [programa] : minhas);
  });
});
afterEach(() => { global.fetch = fetchOriginal; sessionStorage.clear(); });

test.each(["PENDENTE", "APROVADA", "RECUSADA", "CANCELADA", "SAIDA", "TRANSFERIDA", "SUSPENSA"])(
  "reconhece inscrição %s ao abrir novamente o catálogo", async status => {
    minhas = [{ inscricaoId: "original", programaId: "leitura", status }];
    render(<ProgramasAtivosScreen usuario={usuario} />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver detalhes de Leitura" }));
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Cadastrado ✓" })).toBeDisabled();
    expect(fetch.mock.calls.some(([, opcoes]) => opcoes?.method === "POST")).toBe(false);
    expect(fetch.mock.calls.some(([url]) => new URL(url).pathname === "/api/usuarios/me/inscricoes")).toBe(true);
  }
);

test("inscreve uma vez e mantém o botão bloqueado na tela", async () => {
  let concluir;
  const consulta = fetch.getMockImplementation();
  fetch.mockImplementation((url, opcoes) => opcoes?.method === "POST"
    ? new Promise(resolve => { concluir = resolve; }) : consulta(url, opcoes));
  render(<ProgramasAtivosScreen usuario={usuario} />);
  fireEvent.click(await screen.findByRole("button", { name: "Ver detalhes de Leitura" }));
  const botao = screen.getByRole("button", { name: "Quero me cadastrar" });
  fireEvent.click(botao);
  fireEvent.click(botao);
  expect(screen.getByRole("button", { name: "Cadastrando..." })).toBeDisabled();
  expect(fetch.mock.calls.filter(([, opcoes]) => opcoes?.method === "POST")).toHaveLength(1);
  await act(async () => concluir(resposta({ inscricaoId: "nova" })));
  expect(screen.getByText('Você se cadastrou no programa "Leitura".')).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ver detalhes de Leitura" }));
  expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Cadastrado ✓" })).toBeDisabled();
});

test("não libera inscrição quando a consulta das inscrições falha", async () => {
  fetch.mockImplementation(async url => new URL(url).pathname.endsWith("/ativos") ? resposta([programa])
    : { ok: false, status: 500, json: async () => ({ message: "Falha ao consultar inscrições" }) });
  render(<ProgramasAtivosScreen usuario={usuario} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao consultar inscrições");
  expect(screen.queryByRole("button", { name: "Ver detalhes de Leitura" })).not.toBeInTheDocument();
});

test("ignora a consulta antiga após trocar de conta", async () => {
  let responderAna;
  fetch.mockImplementation(url => new URL(url).pathname.endsWith("/ativos") ? Promise.resolve(resposta([programa]))
    : new Promise(resolve => { responderAna = resolve; }));
  const view = render(<ProgramasAtivosScreen key="ana" usuario={usuario} />);
  sessionStorage.setItem("migus.usuario", JSON.stringify({ ...usuario, id: "bia" }));
  fetch.mockImplementation(async url => resposta(new URL(url).pathname.endsWith("/ativos") ? [programa] : []));
  view.rerender(<ProgramasAtivosScreen key="bia" usuario={{ ...usuario, id: "bia" }} />);
  await screen.findByRole("button", { name: "Ver detalhes de Leitura" });
  await act(async () => responderAna(resposta([{ programaId: "leitura" }])));
  fireEvent.click(screen.getByRole("button", { name: "Ver detalhes de Leitura" }));
  expect(screen.getByRole("button", { name: "Quero me cadastrar" })).toBeEnabled();
});

test("trata o conflito da API sem permitir repetir a inscrição", async () => {
  const consulta = fetch.getMockImplementation();
  fetch.mockImplementation((url, opcoes) => opcoes?.method === "POST"
    ? Promise.resolve({ ok: false, status: 409, json: async () => ({ message: "Você já está inscrito neste programa" }) })
    : consulta(url, opcoes));
  render(<ProgramasAtivosScreen usuario={usuario} />);
  fireEvent.click(await screen.findByRole("button", { name: "Ver detalhes de Leitura" }));
  fireEvent.click(screen.getByRole("button", { name: "Quero me cadastrar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Você já está inscrito");
  expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Cadastrado ✓" })).toBeDisabled();
});
