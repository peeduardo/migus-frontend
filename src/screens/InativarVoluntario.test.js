import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import InscritosScreen from "./InscritosScreen";

const responsavel = { id: "ana", tipoUsuario: "RESPONSAVEL", ativo: true };
const fetchOriginal = global.fetch;
let respostaInativar;

beforeEach(() => {
  sessionStorage.setItem("migus.token", "token-de-teste");
  sessionStorage.setItem("migus.expiresAt", String(Date.now() + 60000));
  sessionStorage.setItem("migus.usuario", JSON.stringify(responsavel));
  respostaInativar = () => ({
    ok: true, status: 200,
    dados: { mensagem: "Cadastro inativado com sucesso!", usuario: { id: "u-eva", ativo: false } },
  });
  global.fetch = jest.fn(async (url, opcoes = {}) => {
    const { pathname } = new URL(url);
    if (pathname === "/api/programas/meus") {
      return { ok: true, status: 200, json: async () => [{ id: "horta", nome: "Minha horta" }] };
    }
    if (pathname === "/api/programas/horta/inscricoes") {
      return {
        ok: true, status: 200,
        json: async () => [
          { inscricaoId: "1", usuarioId: "u-eva", nome: "Eva", status: "APROVADA", usuarioAtivo: true },
          { inscricaoId: "2", usuarioId: "u-caio", nome: "Caio", status: "RECUSADA", usuarioAtivo: false },
        ],
      };
    }
    if (pathname === "/api/usuarios/u-eva/inativar" && opcoes.method === "PATCH") {
      const { ok, status, dados } = respostaInativar();
      return { ok, status, json: async () => dados };
    }
    return { ok: false, status: 404, json: async () => null };
  });
});

afterEach(() => {
  global.fetch = fetchOriginal;
  sessionStorage.clear();
});

async function abrirPrograma() {
  render(<InscritosScreen usuario={responsavel} />);
  await screen.findByRole("option", { name: "Minha horta" });
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "horta" } });
  await screen.findByRole("row", { name: /Eva/ });
}

function chamadasDeInativacao() {
  return fetch.mock.calls.filter(([url]) => new URL(url).pathname.endsWith("/inativar"));
}

test("oferece a inativação somente para cadastros ativos", async () => {
  await abrirPrograma();
  expect(screen.getByRole("button", { name: "Inativar cadastro de Eva" })).toBeEnabled();
  expect(screen.queryByRole("button", { name: "Inativar cadastro de Caio" })).not.toBeInTheDocument();
  expect(within(screen.getByRole("row", { name: /Caio/ })).getByText("Cadastro inativo")).toBeInTheDocument();
  expect(within(screen.getByRole("row", { name: /Eva/ })).queryByText("Cadastro inativo")).not.toBeInTheDocument();
});

test("pede confirmação e não envia nada ao cancelar", async () => {
  await abrirPrograma();
  fireEvent.click(screen.getByRole("button", { name: "Inativar cadastro de Eva" }));
  const modal = within(screen.getByRole("dialog"));
  expect(modal.getByText(/Confirma a inativação do cadastro de/)).toBeInTheDocument();
  expect(chamadasDeInativacao()).toHaveLength(0);
  fireEvent.click(modal.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(chamadasDeInativacao()).toHaveLength(0);
  expect(screen.getByRole("button", { name: "Inativar cadastro de Eva" })).toBeInTheDocument();
});

test("inativa após a confirmação, atualiza a situação e informa o sucesso", async () => {
  await abrirPrograma();
  fireEvent.click(screen.getByRole("button", { name: "Inativar cadastro de Eva" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar inativação" }));

  expect(await screen.findByText("Cadastro de Eva inativado com sucesso.")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(within(screen.getByRole("row", { name: /Eva/ })).getByText("Cadastro inativo")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Inativar cadastro de Eva" })).not.toBeInTheDocument();

  const chamadas = chamadasDeInativacao();
  expect(chamadas).toHaveLength(1);
  const [url, opcoes] = chamadas[0];
  expect(new URL(url).pathname).toBe("/api/usuarios/u-eva/inativar");
  expect(opcoes.method).toBe("PATCH");
  expect(opcoes.headers.get("Authorization")).toBe("Bearer token-de-teste");
});

test.each([
  [409, "O cadastro já está inativo"],
  [403, "Somente um responsável ativo pode inativar cadastros"],
  [404, "Voluntário não encontrado com o ID: u-eva"],
])("mostra o erro %s do backend e mantém a situação exibida", async (status, message) => {
  respostaInativar = () => ({ ok: false, status, dados: { message } });
  await abrirPrograma();
  fireEvent.click(screen.getByRole("button", { name: "Inativar cadastro de Eva" }));
  const modal = within(screen.getByRole("dialog"));
  fireEvent.click(modal.getByRole("button", { name: "Confirmar inativação" }));

  expect(await modal.findByRole("alert")).toHaveTextContent(message);
  await waitFor(() => expect(modal.getByRole("button", { name: "Confirmar inativação" })).toBeEnabled());
  fireEvent.click(modal.getByRole("button", { name: "Cancelar" }));
  expect(within(screen.getByRole("row", { name: /Eva/ })).queryByText("Cadastro inativo")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Inativar cadastro de Eva" })).toBeInTheDocument();
});
