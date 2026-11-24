import { act, fireEvent, render, screen, within } from "@testing-library/react";
import MinhasInscricoesScreen from "./MinhasInscricoesScreen";

const fetchOriginal = global.fetch;
beforeEach(() => {
  sessionStorage.clear();
  sessionStorage.setItem("migus.token", "token-ficticio");
  sessionStorage.setItem("migus.expiresAt", String(Date.now() + 60000));
  sessionStorage.setItem("migus.usuario", JSON.stringify({ id: "ana", tipoUsuario: "interessado" }));
  global.fetch = jest.fn();
});
afterEach(() => { global.fetch = fetchOriginal; });

test("mostra programa, data e os três estados das próprias inscrições", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => [
    { inscricaoId: "1", programaId: "p1", programaNome: "Leitura", dataInscricao: "2026-11-01T12:00:00Z", status: "PENDENTE" },
    { inscricaoId: "2", programaId: "p2", programaNome: "Horta", dataInscricao: "2026-11-02T12:00:00Z", status: "APROVADA" },
    { inscricaoId: "3", programaId: "p3", programaNome: "Oficina", dataInscricao: "2026-11-03T12:00:00Z", status: "RECUSADA" },
  ] });
  render(<MinhasInscricoesScreen onInicio={() => {}} />);
  expect(await screen.findByText("Leitura")).toBeInTheDocument();
  expect(screen.getByText("Horta")).toBeInTheDocument();
  expect(screen.getByText("Oficina")).toBeInTheDocument();
  expect(screen.getByText("01/11/2026")).toBeInTheDocument();
  for (const estado of ["Pendente", "Aprovada", "Recusada"]) {
    expect(screen.getByText(estado)).toBeInTheDocument();
  }
  const [url, opcoes] = fetch.mock.calls[0];
  expect(url).toMatch(/\/api\/usuarios\/me\/inscricoes$/);
  expect(opcoes.headers.get("Authorization")).toBe("Bearer token-ficticio");
});


test("mostra carregamento e depois a mensagem de lista vazia", async () => {
  let responder;
  fetch.mockReturnValue(new Promise(resolve => { responder = resolve; }));
  render(<MinhasInscricoesScreen onInicio={() => {}} />);
  expect(screen.getByRole("status")).toHaveTextContent("Carregando inscrições");
  await act(async () => responder({ ok: true, json: async () => [] }));
  expect(screen.getByText("Você ainda não se inscreveu em nenhum programa.")).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("mantém a inscrição quando o programa está indisponível", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => [
    { inscricaoId: "1", programaId: "removido", programaNome: null, dataInscricao: "2026-11-01T12:00:00Z", status: "RECUSADA" },
  ] });
  render(<MinhasInscricoesScreen onInicio={() => {}} />);
  expect(await screen.findByText("Programa indisponível")).toBeInTheDocument();
  expect(screen.getByText("Recusada")).toBeInTheDocument();
  expect(screen.getByText("01/11/2026")).toBeInTheDocument();
});

test("mostra erro e permite tentar novamente", async () => {
  fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"))
    .mockResolvedValueOnce({ ok: true, json: async () => [] });
  render(<MinhasInscricoesScreen onInicio={() => {}} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar ao servidor");
  expect(screen.queryByText("Você ainda não se inscreveu em nenhum programa.")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Você ainda não se inscreveu em nenhum programa.")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("não apresenta falha HTTP como lista vazia", async () => {
  fetch.mockResolvedValue({ ok: false, status: 403, json: async () => ({ message: "Usuário inativo" }) });
  render(<MinhasInscricoesScreen onInicio={() => {}} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Usuário inativo");
  expect(screen.queryByRole("list", { name: "Suas inscrições" })).not.toBeInTheDocument();
});

test("ignora resposta antiga depois que a tela é remontada para outra conta", async () => {
  let responderAna;
  fetch.mockReturnValueOnce(new Promise(resolve => { responderAna = resolve; }))
    .mockResolvedValueOnce({ ok: true, json: async () => [
      { inscricaoId: "bia", programaId: "p2", programaNome: "Programa da Bia", dataInscricao: "2026-11-02", status: "APROVADA" },
    ] });
  const tela = render(<MinhasInscricoesScreen key="ana" onInicio={() => {}} />);
  sessionStorage.setItem("migus.token", "token-bia");
  sessionStorage.setItem("migus.usuario", JSON.stringify({ id: "bia", tipoUsuario: "interessado" }));
  tela.rerender(<MinhasInscricoesScreen key="bia" onInicio={() => {}} />);
  expect(await screen.findByText("Programa da Bia")).toBeInTheDocument();
  await act(async () => responderAna({ ok: true, json: async () => [
    { inscricaoId: "ana", programaId: "p1", programaNome: "Programa da Ana", dataInscricao: "2026-11-01", status: "PENDENTE" },
  ] }));
  expect(screen.queryByText("Programa da Ana")).not.toBeInTheDocument();
  expect(screen.getByText("Programa da Bia")).toBeInTheDocument();
  expect(fetch.mock.calls[1][1].headers.get("Authorization")).toBe("Bearer token-bia");
});

test("limpa os dados já exibidos ao trocar de conta", async () => {
  let responderBia;
  fetch.mockResolvedValueOnce({ ok: true, json: async () => [
    { inscricaoId: "ana", programaId: "p1", programaNome: "Programa da Ana", dataInscricao: "2026-11-01", status: "PENDENTE" },
  ] }).mockReturnValueOnce(new Promise(resolve => { responderBia = resolve; }));
  const tela = render(<MinhasInscricoesScreen key="ana" onInicio={() => {}} />);
  expect(await screen.findByText("Programa da Ana")).toBeInTheDocument();
  sessionStorage.setItem("migus.token", "token-bia");
  sessionStorage.setItem("migus.usuario", JSON.stringify({ id: "bia", tipoUsuario: "interessado" }));
  tela.rerender(<MinhasInscricoesScreen key="bia" onInicio={() => {}} />);
  expect(screen.queryByText("Programa da Ana")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Carregando inscrições");
  await act(async () => responderBia({ ok: true, json: async () => [] }));
  expect(screen.getByText("Você ainda não se inscreveu em nenhum programa.")).toBeInTheDocument();
});

test("mostra a origem transferida e o destino aprovado com suas datas", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => [
    { inscricaoId: "origem", programaId: "p1", programaNome: "Horta", status: "TRANSFERIDA", dataInscricao: "2026-11-01" },
    { inscricaoId: "destino", programaId: "p2", programaNome: "Leitura", status: "APROVADA", dataInscricao: "2026-11-05" },
  ] });
  render(<MinhasInscricoesScreen />);
  const [origem, destino] = await screen.findAllByRole("listitem");
  expect(within(origem).getByRole("heading", { name: "Horta" })).toBeInTheDocument();
  expect(within(origem).getByText("Transferida")).toBeInTheDocument();
  expect(within(origem).getByText("01/11/2026")).toBeInTheDocument();
  expect(within(destino).getByRole("heading", { name: "Leitura" })).toBeInTheDocument();
  expect(within(destino).getByText("Aprovada")).toBeInTheDocument();
  expect(within(destino).getByText("05/11/2026")).toBeInTheDocument();
});
