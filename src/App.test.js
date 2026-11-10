import { act, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

const fetchOriginal = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
  sessionStorage.clear();
  window.history.replaceState({}, '', '/login');
});

afterEach(async () => {
  await act(async () => {});
  global.fetch = fetchOriginal;
});

function criarSessao(tipoUsuario, ativo = true, nome = 'Ana Teste') {
  sessionStorage.setItem('migus.token', 'token-ficticio');
  sessionStorage.setItem('migus.expiresAt', String(Date.now() + 60000));
  sessionStorage.setItem('migus.usuario', JSON.stringify({ id: 'usuario-teste', nome, email: 'ana@exemplo.invalid', tipoUsuario, ativo }));
}

test('mostra o login existente sem sessão', async () => {
  await act(async () => { render(<App />); });
  expect(screen.getByRole('button', { name: /Entrar na minha conta/ })).toBeInTheDocument();
});

test('responsável acessa o cadastro e volta ao início', async () => {
  criarSessao('RESPONSAVEL');
  window.history.replaceState({}, '', '/inicio');
  await act(async () => { render(<App />); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Cadastrar programa' })); });
  expect(screen.getByRole('form', { name: 'Cadastro de programa' })).toBeInTheDocument();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Voltar ao início' })); });
  expect(screen.getByRole('button', { name: 'Cadastrar programa' })).toBeInTheDocument();
});

test.each([['interessado', true], ['RESPONSAVEL', false]])('não oferece cadastro para %s ativo=%s', async (tipo, ativo) => {
  criarSessao(tipo, ativo);
  window.history.replaceState({}, '', '/inicio');
  let tela;
  await act(async () => { tela = render(<App />); });
  expect(screen.queryByRole('button', { name: 'Cadastrar programa' })).not.toBeInTheDocument();
  tela.unmount();
  window.history.replaceState({}, '', '/programas/cadastro');
  await act(async () => { render(<App />); });
  expect(screen.getByRole('alert')).toHaveTextContent('Somente um responsável ativo');
  expect(screen.queryByRole('form')).not.toBeInTheDocument();
});

test('abrir o cadastro sem sessão leva ao login', async () => {
  window.history.replaceState({}, '', '/programas/cadastro');
  await act(async () => { render(<App />); });
  expect(screen.getByRole('button', { name: /Entrar na minha conta/ })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/login');
});

test.each([
  ['interessado', 'Interessado', 'Área do interessado'],
  ['RESPONSAVEL', 'Responsável', 'Área do responsável'],
  ['VOLUNTARIO', 'Voluntário', 'Área do voluntário'],
  ['outro-perfil', 'outro-perfil', 'Área da conta'],
])('mostra o perfil real %s sem alterar a sessão', async (tipo, nome, titulo) => {
  criarSessao(tipo);
  window.history.replaceState({}, '', '/inicio');
  await act(async () => { render(<App />); });
  expect(screen.getByText(nome, { exact: true })).toBeInTheDocument();
  expect(screen.getByText(titulo, { exact: true })).toBeInTheDocument();
  expect(JSON.parse(sessionStorage.getItem('migus.usuario')).tipoUsuario).toBe(tipo);
});

test('mantém uma única ação de sair da conta', async () => {
  criarSessao('interessado');
  window.history.replaceState({}, '', '/inicio');
  await act(async () => { render(<App />); });
  expect(screen.getAllByRole('button', { name: /Sair/ })).toHaveLength(1);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Sair/ })); });
  expect(screen.getByRole('button', { name: /Entrar na minha conta/ })).toBeInTheDocument();
});


test.each([
  ['interessado', 'Interessado', true, 'Ativo'],
  ['RESPONSAVEL', 'Responsável', false, 'Inativo'],
])('consulta o próprio cadastro e mostra perfil, datas e status de %s', async (tipo, perfil, ativo, status) => {
  criarSessao(tipo);
  window.history.replaceState({}, '', '/inicio');
  const fetchOriginal = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ nome: 'Ana Teste', email: 'ana@exemplo.invalid', tipoUsuario: tipo,
      ativo, dataCadastro: '2026-10-01', dataAtualizacao: '2026-10-30' }),
  });
  try {
    await act(async () => { render(<App />); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Ver meu cadastro/ })); });
    expect(await screen.findByText('01/10/2026')).toBeInTheDocument();
    expect(screen.getByText('30/10/2026')).toBeInTheDocument();
    expect(screen.getByText(perfil, { exact: true })).toBeInTheDocument();
    expect(screen.getByText(status, { exact: true })).toBeInTheDocument();
    const [url, opcoes] = global.fetch.mock.calls.find(([chamada]) => chamada.includes('/api/usuarios/me'));
    expect(url).toContain('/api/usuarios/me');
    expect(opcoes.headers.get('Authorization')).toBe('Bearer token-ficticio');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Voltar ao início/ })); });
    expect(screen.getByRole('button', { name: /Ver meu cadastro/ })).toBeInTheDocument();
    if (tipo === 'RESPONSAVEL') {
      expect(screen.getByRole('button', { name: 'Cadastrar programa' })).toBeInTheDocument();
    } else {
      expect(screen.queryByRole('button', { name: 'Cadastrar programa' })).not.toBeInTheDocument();
    }
  } finally {
    global.fetch = fetchOriginal;
  }
});


test("acessa minhas inscrições pelo início e mantém o acesso ao perfil", async () => {
  criarSessao('interessado');
  window.history.replaceState({}, '', '/inicio');
  await act(async () => { render(<App />); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Minhas inscrições' })); });
  expect(await screen.findByText('Você ainda não se inscreveu em nenhum programa.')).toBeInTheDocument();
  expect(window.location.pathname).toBe('/minhas-inscricoes');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Voltar ao início' })); });
  expect(screen.getByRole('button', { name: /Ver meu cadastro/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Ver programas ativos/ })).toBeInTheDocument();
});

test("bloqueia acesso direto a minhas inscrições sem sessão", async () => {
  window.history.replaceState({}, '', '/minhas-inscricoes');
  await act(async () => { render(<App />); });
  expect(screen.getByRole('button', { name: /Entrar na minha conta/ })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/login');
  expect(fetch).not.toHaveBeenCalled();
});

test.each(["Maria Carolina de Albuquerque e Vasconcelos", "MariaCarolinaAlbuquerqueVasconcelos"])(
  "apresenta o nome completo no cartão da conta: %s", async nome => {
    criarSessao("interessado", true, nome);
    window.history.replaceState({}, "", "/inicio");
    await act(async () => { render(<App />); });
    expect(screen.getByText(nome, { selector: "strong" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Minhas inscrições" })).toBeEnabled();
  }
);

async function abrirPerfil(tipoUsuario) {
  criarSessao('interessado');
  window.history.replaceState({}, '', '/perfil');
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({
    id: 'usuario-teste', nome: 'Ana Teste', tipoUsuario, ativo: true,
  }) });
  await act(async () => { render(<App />); });
}

test('responsável não recebe a opção mesmo com cargo antigo na sessão', async () => {
  await abrirPerfil('RESPONSAVEL');
  expect(screen.getByText('Responsável', { exact: true })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Desativar minha conta' })).toBeNull();
});

// O jsdom não implementa os métodos de abertura e fechamento de dialog.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterAll(() => {
  delete HTMLDialogElement.prototype.showModal;
  delete HTMLDialogElement.prototype.close;
});

test.each(['interessado', 'VOLUNTARIO'])('participante %s pode cancelar ou confirmar uma única vez', async tipo => {
  await abrirPerfil(tipo);
  const origem = screen.getByRole('button', { name: 'Desativar minha conta' });
  fireEvent.click(origem);
  const modal = screen.getByRole('dialog', { name: 'Desativar minha conta?' });
  expect(modal).toHaveAccessibleDescription('Você perderá o acesso à plataforma. Seus dados e inscrições serão preservados.');
  const cancelar = within(modal).getByRole('button', { name: 'Cancelar' });
  const confirmar = within(modal).getByRole('button', { name: 'Desativar minha conta' });
  expect(cancelar).toHaveFocus();
  fireEvent.keyDown(cancelar, { key: 'Tab', shiftKey: true });
  expect(confirmar).toHaveFocus();
  fireEvent.keyDown(confirmar, { key: 'Tab' });
  expect(cancelar).toHaveFocus();
  fireEvent.click(cancelar);
  expect(origem).toHaveFocus();
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(origem);
  fireEvent(modal, new Event('cancel', { cancelable: true }));
  expect(origem).toHaveFocus();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(global.fetch).toHaveBeenCalledTimes(1); // Somente a consulta do perfil.

  fireEvent.click(origem);
  let concluir;
  global.fetch.mockImplementationOnce(() => new Promise(resolve => { concluir = resolve; }));
  fireEvent.click(confirmar);
  expect(confirmar).toHaveTextContent('Desativando...');
  fireEvent.click(confirmar);
  fireEvent.click(cancelar);
  fireEvent(modal, new Event('cancel', { cancelable: true }));
  expect(modal).toHaveAttribute('open');
  expect(global.fetch).toHaveBeenCalledTimes(2);
  const [url, opcoes] = global.fetch.mock.calls[1];
  expect(url).toMatch(/api[/]usuarios[/]me[/]desativar$/);
  expect(opcoes.method).toBe('PATCH');
  expect(opcoes.body).toBeUndefined();
  expect(opcoes.headers.get('Authorization')).toBe('Bearer token-ficticio');
  await act(async () => { concluir({ status: 204 }); });
  expect(window.location.pathname).toBe('/login');
  expect(screen.getByText('Conta desativada com sucesso.')).toBeInTheDocument();
  for (const chave of ['token', 'usuario', 'expiresAt']) expect(sessionStorage.getItem('migus.' + chave)).toBeNull();
});

test('uma recusa da API preserva a sessão e permite tentar novamente', async () => {
  await abrirPerfil('VOLUNTARIO');
  fireEvent.click(screen.getByRole('button', { name: 'Desativar minha conta' }));
  const modal = screen.getByRole('dialog');
  const confirmar = within(modal).getByRole('button', { name: 'Desativar minha conta' });
  global.fetch.mockResolvedValueOnce({ status: 403, json: async () => ({ message: 'Perfil sem permissão' }) });
  await act(async () => { fireEvent.click(confirmar); });
  expect(within(modal).getByRole('alert')).toHaveTextContent('Perfil sem permissão');
  expect(sessionStorage.getItem('migus.token')).toBeTruthy();
  expect(window.location.pathname).toBe('/perfil');
  global.fetch.mockResolvedValueOnce({ status: 204 });
  await act(async () => { fireEvent.click(confirmar); });
  expect(window.location.pathname).toBe('/login');
});
