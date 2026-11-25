import { act, fireEvent, render, screen, within } from "@testing-library/react";
import MeusProgramasScreen from "./MeusProgramasScreen";

const responsavel = { id: "ana", tipoUsuario: "RESPONSAVEL", ativo: true };
const horta = {
  id: "horta", nome: "Minha horta", descricao: "Cuidar da horta", categoria: ["Meio ambiente"],
  diasDisponiveis: ["segunda", "quarta"], horarioInicio: "09:00", horarioFim: "12:00", ativo: true,
};
const fetchOriginal = global.fetch;
const showModalOriginal = HTMLDialogElement.prototype.showModal;
const closeDialogOriginal = HTMLDialogElement.prototype.close;
let respostaEdicao;

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
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
  if (showModalOriginal) HTMLDialogElement.prototype.showModal = showModalOriginal;
  else delete HTMLDialogElement.prototype.showModal;
  if (closeDialogOriginal) HTMLDialogElement.prototype.close = closeDialogOriginal;
  else delete HTMLDialogElement.prototype.close;
  sessionStorage.clear();
});

test("filtra todos, ativos e inativos sem consultar o catálogo geral", async () => {
  fetch.mockResolvedValue({ ok: true, status: 200, json: async () => [horta, { ...horta, id: "leitura", nome: "Leitura", ativo: false }] });
  render(<MeusProgramasScreen usuario={responsavel} />);
  expect(await screen.findByRole("heading", { name: "Minha horta" })).toBeInTheDocument();
  const filtro = screen.getByLabelText("Mostrar programas");
  fireEvent.change(filtro, { target: { value: "ativos" } });
  expect(screen.queryByRole("heading", { name: "Leitura" })).not.toBeInTheDocument();
  fireEvent.change(filtro, { target: { value: "inativos" } });
  expect(screen.getByRole("heading", { name: "Leitura" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Minha horta" })).not.toBeInTheDocument();
  fireEvent.change(filtro, { target: { value: "todos" } });
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(fetch.mock.calls.map(([url]) => new URL(url).pathname)).toEqual(["/api/programas/meus"]);
});

test("abre e cancela a confirmação sem chamar a API e devolve o foco", async () => {
  render(<MeusProgramasScreen usuario={responsavel} />);
  const origem = await screen.findByRole("button", { name: "Indisponibilizar" });
  const chamadasAntes = fetch.mock.calls.length;
  origem.focus();
  fireEvent.click(origem);
  const modal = screen.getByRole("dialog", { name: "Indisponibilizar programa?" });
  const cancelar = within(modal).getByRole("button", { name: "Cancelar" });
  expect(cancelar).toHaveFocus();
  fireEvent.click(cancelar);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(origem).toHaveFocus();
  expect(fetch).toHaveBeenCalledTimes(chamadasAntes);
});

test("Escape cancela antes do envio e mantém o foco no botão de origem", async () => {
  render(<MeusProgramasScreen usuario={responsavel} />);
  const origem = await screen.findByRole("button", { name: "Indisponibilizar" });
  fireEvent.click(origem);
  const modal = screen.getByRole("dialog");
  const cancelar = within(modal).getByRole("button", { name: "Cancelar" });
  const confirmar = within(modal).getByRole("button", { name: "Indisponibilizar" });
  confirmar.focus();
  fireEvent.keyDown(modal, { key: "Tab" });
  expect(cancelar).toHaveFocus();
  fireEvent.keyDown(modal, { key: "Tab", shiftKey: true });
  expect(confirmar).toHaveFocus();
  fireEvent(modal, new Event("cancel", { bubbles: false, cancelable: true }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(origem).toHaveFocus();
  expect(fetch.mock.calls.some(([, opcoes]) => opcoes?.method === "PATCH")).toBe(false);
});

test("confirma a indisponibilidade, atualiza a lista e mantém edição disponível", async () => {
  const consulta = fetch.getMockImplementation();
  fetch.mockImplementation((url, opcoes) => opcoes?.method === "PATCH"
    ? Promise.resolve({ ok: true, status: 200, json: async () => ({ ...horta, ativo: false }) }) : consulta(url, opcoes));
  render(<MeusProgramasScreen usuario={responsavel} />);
  await screen.findByRole("heading", { name: "Minha horta" });
  fireEvent.change(screen.getByLabelText("Mostrar programas"), { target: { value: "ativos" } });
  fireEvent.click(screen.getByRole("button", { name: "Indisponibilizar" }));
  const modal = screen.getByRole("dialog");
  expect(modal).toHaveTextContent("Minha horta");
  fireEvent.click(within(modal).getByRole("button", { name: "Indisponibilizar" }));
  expect(await screen.findByText("Nenhum programa encontrado para o filtro selecionado.")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Mostrar programas"), { target: { value: "inativos" } });
  expect(screen.getByRole("button", { name: "Editar Minha horta" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Disponibilizar" })).toBeEnabled();
});

test("confirma a disponibilidade e envia o estado true", async () => {
  const inativa = { ...horta, ativo: false };
  const consulta = fetch.getMockImplementation();
  fetch.mockImplementation((url, opcoes) => {
    const caminho = new URL(url).pathname;
    if (caminho === "/api/programas/meus") return Promise.resolve({ ok: true, status: 200, json: async () => [inativa] });
    if (opcoes?.method === "PATCH") return Promise.resolve({ ok: true, status: 200, json: async () => horta });
    return consulta(url, opcoes);
  });
  render(<MeusProgramasScreen usuario={responsavel} />);
  fireEvent.click(await screen.findByRole("button", { name: "Disponibilizar" }));
  const modal = screen.getByRole("dialog", { name: "Disponibilizar programa?" });
  expect(modal).toHaveTextContent("Minha horta");
  fireEvent.click(within(modal).getByRole("button", { name: "Disponibilizar" }));
  expect(await screen.findByText("Programa disponibilizado com sucesso!")).toBeInTheDocument();
  const [, opcoes] = fetch.mock.calls.find(([, chamada]) => chamada?.method === "PATCH");
  expect(JSON.parse(opcoes.body)).toEqual({ ativo: true });
});

test("mostra carregamento e impede confirmar duas vezes", async () => {
  let resolver;
  let chamadasPatch = 0;
  const consulta = fetch.getMockImplementation();
  fetch.mockImplementation((url, opcoes) => {
    if (opcoes?.method !== "PATCH") return consulta(url, opcoes);
    chamadasPatch += 1;
    return new Promise(resolve => { resolver = resolve; });
  });
  render(<MeusProgramasScreen usuario={responsavel} />);
  fireEvent.click(await screen.findByRole("button", { name: "Indisponibilizar" }));
  const modal = screen.getByRole("dialog");
  const confirmar = within(modal).getByRole("button", { name: "Indisponibilizar" });
  fireEvent.click(confirmar);
  expect(within(modal).getByRole("button", { name: "Indisponibilizando..." })).toBeDisabled();
  fireEvent.click(within(modal).getByRole("button", { name: "Indisponibilizando..." }));
  expect(chamadasPatch).toBe(1);
  await act(async () => resolver({ ok: true, status: 200, json: async () => ({ ...horta, ativo: false }) }));
  expect(await screen.findByText("Programa indisponibilizado com sucesso!")).toBeInTheDocument();
});

test("mantém a confirmação aberta após erro e permite tentar novamente", async () => {
  let tentativas = 0;
  const consulta = fetch.getMockImplementation();
  fetch.mockImplementation((url, opcoes) => {
    if (opcoes?.method !== "PATCH") return consulta(url, opcoes);
    tentativas += 1;
    return Promise.resolve(tentativas === 1
      ? { ok: false, status: 503, json: async () => ({ message: "Serviço indisponível" }) }
      : { ok: true, status: 200, json: async () => ({ ...horta, ativo: false }) });
  });
  render(<MeusProgramasScreen usuario={responsavel} />);
  fireEvent.click(await screen.findByRole("button", { name: "Indisponibilizar" }));
  const modal = screen.getByRole("dialog");
  const confirmar = within(modal).getByRole("button", { name: "Indisponibilizar" });
  fireEvent.click(confirmar);
  expect(await within(modal).findByRole("alert")).toHaveTextContent("Serviço indisponível");
  expect(confirmar).toBeEnabled();
  fireEvent.click(confirmar);
  expect(await screen.findByText("Programa indisponibilizado com sucesso!")).toBeInTheDocument();
  expect(tentativas).toBe(2);
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
  expect(await screen.findByRole("button", { name: "Editar Minha horta" })).toBeInTheDocument();
});
