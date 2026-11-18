import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "../App";
import ExVoluntariosScreen, { formatarData } from "./ExVoluntariosScreen";

const responsavel = { id: "ana", nome: "Ana Responsável", email: "ana@migus.invalid", tipoUsuario: "RESPONSAVEL", ativo: true };
const exVoluntarios = [
  { id: "u-bruno", nome: "Bruno Lima", email: "bruno@exemplo.invalid", telefone: "11999990000", cadastroAtivo: false,
    saidaRegistrada: true, ultimaSaida: "2026-11-10T12:00:00Z", dataCadastro: "2026-09-01" },
  { id: "u-carla", nome: "Carla Dias", email: "carla@exemplo.invalid", telefone: null, cadastroAtivo: true,
    saidaRegistrada: true, ultimaSaida: "2026-10-05T12:00:00Z", dataCadastro: "2026-08-20" },
];
const fetchOriginal = global.fetch;
let respostaLista;

beforeEach(() => {
  sessionStorage.clear();
  sessionStorage.setItem("migus.token", "token-de-teste");
  sessionStorage.setItem("migus.expiresAt", String(Date.now() + 60000));
  sessionStorage.setItem("migus.usuario", JSON.stringify(responsavel));
  respostaLista = () => ({ ok: true, status: 200, dados: exVoluntarios });
  global.fetch = jest.fn(async (url) => {
    const { pathname } = new URL(url);
    if (pathname === "/api/usuarios/ex-voluntarios") {
      const { ok, status, dados } = respostaLista(new URL(url));
      return { ok, status, json: async () => dados };
    }
    return { ok: true, status: 200, json: async () => [] };
  });
});

afterEach(() => {
  global.fetch = fetchOriginal;
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

function consultas() {
  return fetch.mock.calls
    .map(([url]) => new URL(url))
    .filter((url) => url.pathname === "/api/usuarios/ex-voluntarios");
}

test("lista os ex-voluntários com situação e datas", async () => {
  render(<ExVoluntariosScreen usuario={responsavel} onInicio={() => {}} />);

  const bruno = within(await screen.findByRole("row", { name: /Bruno Lima/ }));
  expect(bruno.getByText("bruno@exemplo.invalid")).toBeInTheDocument();
  expect(bruno.getByText("(11) 99999-0000")).toBeInTheDocument();
  expect(bruno.getByText("Cadastro inativo")).toBeInTheDocument();
  expect(bruno.getByText("Saída registrada")).toBeInTheDocument();
  expect(bruno.getByText("10/11/2026")).toBeInTheDocument();
  expect(bruno.getByText("01/09/2026")).toBeInTheDocument();

  const carla = within(screen.getByRole("row", { name: /Carla Dias/ }));
  expect(carla.queryByText("Cadastro inativo")).not.toBeInTheDocument();
  expect(carla.getByText("Saída registrada")).toBeInTheDocument();
  expect(screen.getByText("2 ex-voluntário(s)")).toBeInTheDocument();

  const [url, opcoes] = fetch.mock.calls[0];
  expect(new URL(url).search).toBe("");
  expect(opcoes.headers.get("Authorization")).toBe("Bearer token-de-teste");
});

test("mostra a data no fuso local e não desloca datas sem horário", () => {
  const noiteDoDia15 = new Date(2026, 10, 15, 23, 30).toISOString();
  expect(formatarData(noiteDoDia15)).toBe("15/11/2026");
  expect(formatarData("2026-11-15")).toBe("15/11/2026");
  expect(formatarData(null)).toBe("—");
});

test("envia os filtros de nome e situação e limpa os filtros", async () => {
  render(<ExVoluntariosScreen usuario={responsavel} onInicio={() => {}} />);
  await screen.findByRole("row", { name: /Bruno Lima/ });

  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "  joão " } });
  fireEvent.change(screen.getByLabelText("Situação"), { target: { value: "SAIDA" } });
  fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));
  await screen.findByRole("row", { name: /Bruno Lima/ });

  const filtrada = consultas()[1];
  expect(filtrada.searchParams.get("nome")).toBe("joão");
  expect(filtrada.searchParams.get("situacao")).toBe("SAIDA");

  fireEvent.click(screen.getByRole("button", { name: "Limpar" }));
  await screen.findByRole("row", { name: /Bruno Lima/ });
  expect(consultas()[2].search).toBe("");
  expect(screen.getByLabelText("Nome")).toHaveValue("");
  expect(screen.getByLabelText("Situação")).toHaveValue("");
});

test("informa quando não há ex-voluntários", async () => {
  respostaLista = () => ({ ok: true, status: 200, dados: [] });
  render(<ExVoluntariosScreen usuario={responsavel} onInicio={() => {}} />);
  expect(await screen.findByText("Nenhum ex-voluntário cadastrado na plataforma.")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Zeca" } });
  fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));
  expect(await screen.findByText("Nenhum ex-voluntário encontrado com esses filtros.")).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});

test("mostra o erro e permite tentar novamente", async () => {
  respostaLista = () => ({ ok: false, status: 500, dados: { message: "Erro interno no servidor" } });
  render(<ExVoluntariosScreen usuario={responsavel} onInicio={() => {}} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Erro interno no servidor");

  respostaLista = () => ({ ok: true, status: 200, dados: exVoluntarios });
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByRole("row", { name: /Bruno Lima/ })).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("mostra a mensagem de permissão do backend", async () => {
  respostaLista = () => ({ ok: false, status: 403, dados: null });
  render(<ExVoluntariosScreen usuario={responsavel} onInicio={() => {}} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Somente um responsável ativo pode consultar ex-voluntários.");
});

test.each([
  [{ ...responsavel, tipoUsuario: "interessado" }],
  [{ ...responsavel, ativo: false }],
])("bloqueia quem não é responsável ativo sem consultar o backend", async (usuario) => {
  render(<ExVoluntariosScreen usuario={usuario} onInicio={() => {}} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Somente um responsável ativo pode consultar ex-voluntários.");
  expect(screen.queryByRole("form")).not.toBeInTheDocument();
  await waitFor(() => expect(consultas()).toHaveLength(0));
});

test("responsável acessa ex-voluntários pela tela inicial", async () => {
  window.history.replaceState({}, "", "/inicio");
  await act(async () => { render(<App />); });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Ex-voluntários" })); });
  expect(window.location.pathname).toBe("/ex-voluntarios");
  expect(await screen.findByRole("heading", { name: "Ex-voluntários" })).toBeInTheDocument();
  expect(await screen.findByRole("row", { name: /Bruno Lima/ })).toBeInTheDocument();
});

test("interessado não vê o acesso a ex-voluntários", async () => {
  sessionStorage.setItem("migus.usuario", JSON.stringify({ ...responsavel, tipoUsuario: "interessado" }));
  window.history.replaceState({}, "", "/inicio");
  await act(async () => { render(<App />); });
  expect(screen.queryByRole("button", { name: "Ex-voluntários" })).not.toBeInTheDocument();
});
