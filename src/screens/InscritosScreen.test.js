import { fireEvent, render, screen, within } from "@testing-library/react";
import InscritosScreen from "./InscritosScreen";
import { listarInscricoesPendentes, listarProgramasAtivos } from "../services/programas";

const responsavel = { id: "ana", tipoUsuario: "RESPONSAVEL", ativo: true };
const fetchOriginal = global.fetch;

beforeEach(() => {
  sessionStorage.setItem("migus.token", "token-de-teste");
  sessionStorage.setItem("migus.expiresAt", String(Date.now() + 60000));
  sessionStorage.setItem("migus.usuario", JSON.stringify(responsavel));
  const respostas = {
    "/api/programas/meus": [{ id: "horta", nome: "Minha horta" }],
    "/api/programas/ativos": [{ id: "horta", nome: "Minha horta" }, { id: "leitura", nome: "Leitura aberta" }],
    "/api/programas/horta/inscricoes?status=PENDENTE": [{ inscricaoId: "1", nome: "Bia", status: "PENDENTE" }],
    "/api/programas/horta/inscricoes": [
      { inscricaoId: "1", nome: "Bia", status: "PENDENTE" },
      { inscricaoId: "2", nome: "Caio", status: "RECUSADA" },
      { inscricaoId: "3", nome: "Eva", status: "APROVADA" },
      { inscricaoId: "4", nome: "Davi", status: "TRANSFERIDA" },
    ],
  };
  global.fetch = jest.fn(async url => {
    const { pathname, search } = new URL(url);
    const dados = respostas[pathname + search];
    return { ok: Boolean(dados), json: async () => dados };
  });
});

afterEach(() => {
  global.fetch = fetchOriginal;
  sessionStorage.clear();
});

test("gestão oferece apenas programas do responsável", async () => {
  render(<InscritosScreen usuario={responsavel} />);
  expect(await screen.findByRole("option", { name: "Minha horta" })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "Leitura aberta" })).not.toBeInTheDocument();
});

test("sino consulta somente inscrições pendentes dos próprios programas", async () => {
  const lista = await listarInscricoesPendentes();
  expect(lista.map(item => item.nome)).toEqual(["Bia"]);
  expect(fetch.mock.calls.map(([url]) => new URL(url).pathname + new URL(url).search)).toEqual([
    "/api/programas/meus", "/api/programas/horta/inscricoes?status=PENDENTE",
  ]);
});

test("catálogo geral continua usando os programas ativos", async () => {
  expect(await listarProgramasAtivos()).toEqual([{ id: "horta", nome: "Minha horta" }, { id: "leitura", nome: "Leitura aberta" }]);
});

test("oferece decisões somente para inscrições pendentes", async () => {
  render(<InscritosScreen usuario={responsavel} />);
  await screen.findByRole("option", { name: "Minha horta" });
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "horta" } });
  const pendente = within(await screen.findByRole("row", { name: /Bia/ }));
  expect(pendente.getByRole("button", { name: /Aceitar/ })).toBeEnabled();
  expect(pendente.getByRole("button", { name: /Recusar/ })).toBeEnabled();
  expect(pendente.queryByRole("button", { name: /Transferir/ })).not.toBeInTheDocument();
  for (const nome of [/Caio/, /Eva/, /Davi/]) {
    const linha = within(screen.getByRole("row", { name: nome }));
    expect(linha.queryByRole("button", { name: /Aceitar/ })).not.toBeInTheDocument();
    expect(linha.queryByRole("button", { name: /Recusar/ })).not.toBeInTheDocument();
  }
  expect(screen.getByRole("button", { name: /Transferir Eva/ })).toBeEnabled();
  expect(screen.queryByRole("button", { name: /Transferir Caio|Transferir Davi/ })).not.toBeInTheDocument();
});

test("transferência oferece os destinos ativos do catálogo, exceto a origem", async () => {
  render(<InscritosScreen usuario={responsavel} />);
  await screen.findByRole("option", { name: "Minha horta" });
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "horta" } });
  fireEvent.click(await screen.findByRole("button", { name: /Transferir Eva/ }));
  const modal = within(screen.getByRole("dialog"));
  expect(await modal.findByRole("option", { name: "Leitura aberta" })).toBeInTheDocument();
  expect(modal.queryByRole("option", { name: "Minha horta" })).not.toBeInTheDocument();
});
