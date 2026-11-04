import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState({}, '', '/login');
});

function criarSessao(tipoUsuario, ativo = true) {
  sessionStorage.setItem('migus.token', 'token-ficticio');
  sessionStorage.setItem('migus.expiresAt', String(Date.now() + 60000));
  sessionStorage.setItem('migus.usuario', JSON.stringify({ id: 'usuario-teste', nome: 'Ana Teste', email: 'ana@exemplo.invalid', tipoUsuario, ativo }));
}

test('mostra o login existente sem sessão', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /Entrar na minha conta/ })).toBeInTheDocument();
});

test('responsável acessa o cadastro e volta ao início', () => {
  criarSessao('RESPONSAVEL');
  window.history.replaceState({}, '', '/inicio');
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar programa' }));
  expect(screen.getByRole('form', { name: 'Cadastro de programa' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Voltar ao início' }));
  expect(screen.getByRole('button', { name: 'Cadastrar programa' })).toBeInTheDocument();
});

test.each([['interessado', true], ['RESPONSAVEL', false]])('não oferece cadastro para %s ativo=%s', (tipo, ativo) => {
  criarSessao(tipo, ativo);
  window.history.replaceState({}, '', '/inicio');
  const tela = render(<App />);
  expect(screen.queryByRole('button', { name: 'Cadastrar programa' })).not.toBeInTheDocument();
  tela.unmount();
  window.history.replaceState({}, '', '/programas/cadastro');
  render(<App />);
  expect(screen.getByRole('alert')).toHaveTextContent('Somente um responsável ativo');
  expect(screen.queryByRole('form')).not.toBeInTheDocument();
});

test('abrir o cadastro sem sessão leva ao login', () => {
  window.history.replaceState({}, '', '/programas/cadastro');
  render(<App />);
  expect(screen.getByRole('button', { name: /Entrar na minha conta/ })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/login');
});

test.each([
  ['interessado', 'Interessado', 'Área do interessado'],
  ['RESPONSAVEL', 'Responsável', 'Área do responsável'],
  ['VOLUNTARIO', 'Voluntário', 'Área do voluntário'],
  ['outro-perfil', 'outro-perfil', 'Área da conta'],
])('mostra o perfil real %s sem alterar a sessão', (tipo, nome, titulo) => {
  criarSessao(tipo);
  window.history.replaceState({}, '', '/inicio');
  render(<App />);
  expect(screen.getByText(nome, { exact: true })).toBeInTheDocument();
  expect(screen.getByText(titulo, { exact: true })).toBeInTheDocument();
  expect(JSON.parse(sessionStorage.getItem('migus.usuario')).tipoUsuario).toBe(tipo);
});

test('mantém uma única ação de sair da conta', () => {
  criarSessao('interessado');
  window.history.replaceState({}, '', '/inicio');
  render(<App />);
  expect(screen.getAllByRole('button', { name: /Sair/ })).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: /Sair/ }));
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
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Ver meu cadastro/ }));
    expect(await screen.findByText('01/10/2026')).toBeInTheDocument();
    expect(screen.getByText('30/10/2026')).toBeInTheDocument();
    expect(screen.getByText(perfil, { exact: true })).toBeInTheDocument();
    expect(screen.getByText(status, { exact: true })).toBeInTheDocument();
    const [url, opcoes] = global.fetch.mock.calls.find(([chamada]) => chamada.includes('/api/usuarios/me'));
    expect(url).toContain('/api/usuarios/me');
    expect(opcoes.headers.get('Authorization')).toBe('Bearer token-ficticio');
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao início/ }));
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
