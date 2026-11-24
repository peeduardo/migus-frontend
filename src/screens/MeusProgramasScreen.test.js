import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MeusProgramasScreen from "./MeusProgramasScreen";

const responsavel = { id: "ana", tipoUsuario: "RESPONSAVEL", ativo: true };
const horta = {
  id: "horta", nome: "Minha horta", descricao: "Cuidar da horta", categoria: ["Meio ambiente"],
  diasDisponiveis: ["segunda", "quarta"], horarioInicio: "09:00", horarioFim: "12:00", ativo: true,
};
const fetchOriginal = global.fetch;
let respostaEdicao;

beforeEach(() => {
  sessionStorage.setItem("migus.token", "token-de-teste");
  sessionStorage.setItem("migus.expiresAt", String(Date.now() + 60000));
  sessionStorage.setItem("migus.usuario", JSON.stringify(responsavel));
  respostaEdicao = corpo => ({ ok: true, status: 200, dados: { ...horta, ...corpo } });
  global.fetch = jest.fn(async (url, opcoes = {}) => {
    const { pathname } = new URL(url);
    if (pathname === "/api/programas/meus") return { ok: true, status: 200, json: async () => [horta] };
    if (pathname === "/api/programas/horta" && opcoes.method === "PUT") {
      const { ok, status, dados } = respostaEdicao(JSON.parse(opcoes.body));
      return { ok, status, json: async () => dados };
    }
    if (pathname === "/api/programas/horta") return { ok: true, status: 200, json: async () => horta };
    return { ok: false, status: 404, json: async () => ({ message: "Programa não encontrado com o ID: sumiu" }) };
  });
});

afterEach(() => {
  global.fetch = fetchOriginal;
  sessionStorage.clear();
});

async function abrirEdicao() {
  render(<MeusProgramasScreen usuario={responsavel} />);
  fireEvent.click(await screen.findByRole("button", { name: "Editar Minha horta" }));
  return screen.findByRole("form", { name: "Edição de programa" });
}

test("carrega os dados atuais do programa na tela de edição", async () => {
  await abrirEdicao();
  expect(screen.getByLabelText("Nome")).toHaveValue("Minha horta");
  expect(screen.getByLabelText("Descrição")).toHaveValue("Cuidar da horta");
  expect(screen.getByLabelText("Categorias")).toHaveValue("Meio ambiente");
  expect(screen.getByLabelText("Dias disponíveis")).toHaveValue("segunda\nquarta");
  expect(screen.getByLabelText("Horário de início")).toHaveValue("09:00");
  expect(screen.getByLabelText("Horário de fim")).toHaveValue("12:00");
  expect(screen.getByLabelText("Ativo")).toHaveValue("true");
});

test("envia os dados alterados, informa o sucesso e atualiza a lista", async () => {
  await abrirEdicao();
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "  Horta comunitária " } });
  fireEvent.change(screen.getByLabelText("Dias disponíveis"), { target: { value: "sábado\n\n domingo " } });
  fireEvent.change(screen.getByLabelText("Ativo"), { target: { value: "false" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

  expect(await screen.findByRole("status")).toHaveTextContent("Programa atualizado com sucesso!");
  const [url, opcoes] = fetch.mock.calls.find(([, o]) => o?.method === "PUT");
  expect(new URL(url).pathname).toBe("/api/programas/horta");
  expect(opcoes.headers.get("Authorization")).toBe("Bearer token-de-teste");
  expect(JSON.parse(opcoes.body)).toEqual({
    nome: "Horta comunitária", descricao: "Cuidar da horta", categoria: ["Meio ambiente"],
    diasDisponiveis: ["sábado", "domingo"], horarioInicio: "09:00", horarioFim: "12:00", ativo: false,
  });

  fireEvent.click(screen.getByRole("button", { name: "Voltar aos meus programas" }));
  expect(await screen.findByRole("heading", { name: "Horta comunitária" })).toBeInTheDocument();
  expect(screen.getByText("Inativo")).toBeInTheDocument();
});

test("não envia a edição com campos obrigatórios vazios", async () => {
  const form = await abrirEdicao();
  fireEvent.change(screen.getByLabelText("Categorias"), { target: { value: "  \n " } });
  fireEvent.submit(form);
  expect(await screen.findByRole("alert")).toHaveTextContent("Preencha todos os campos");
  expect(fetch.mock.calls.some(([, o]) => o?.method === "PUT")).toBe(false);
});

test.each([
  [403, "Somente o responsável pelo programa pode editá-lo"],
  [404, "Programa não encontrado com o ID: horta"],
  [400, "nome: Nome é obrigatório"],
])("mostra o erro %s do backend e mantém os campos preenchidos", async (status, message) => {
  respostaEdicao = () => ({ ok: false, status, dados: { message } });
  await abrirEdicao();
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Outro nome" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(message);
  expect(screen.getByLabelText("Nome")).toHaveValue("Outro nome");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("informa quando o programa não pode ser carregado", async () => {
  global.fetch.mockImplementation(async url => new URL(url).pathname === "/api/programas/meus"
    ? { ok: true, status: 200, json: async () => [{ ...horta, id: "sumiu" }] }
    : { ok: false, status: 404, json: async () => ({ message: "Programa não encontrado com o ID: sumiu" }) });
  render(<MeusProgramasScreen usuario={responsavel} />);
  fireEvent.click(await screen.findByRole("button", { name: "Editar Minha horta" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Programa não encontrado com o ID: sumiu");
  expect(screen.queryByRole("form")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Voltar aos meus programas" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Editar Minha horta" })).toBeInTheDocument());
});
