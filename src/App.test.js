import { act, fireEvent, render, screen } from '@testing-library/react';
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
