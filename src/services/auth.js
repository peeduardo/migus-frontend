const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function post(path, body) {
  let response;
  try {
    response = await fetch(API_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(data?.message || "Não foi possível concluir a solicitação.", response.status);
  }
  return data;
}

export function cadastrar(dados) {
  return post("/api/auth/cadastro", dados);
}

export async function entrar(email, senha) {
  const resposta = await post("/api/auth/login", { email, senha });
  if (!resposta?.token || !resposta?.expiraEm || !resposta?.usuario) {
    throw new Error("O servidor retornou uma resposta de login inválida.");
  }

  sessionStorage.setItem("migus.token", resposta.token);
  sessionStorage.setItem("migus.expiresAt", String(Date.now() + Number(resposta.expiraEm)));
  sessionStorage.setItem("migus.usuario", JSON.stringify(resposta.usuario));
  return resposta.usuario;
}

export function obterSessao() {
  const token = sessionStorage.getItem("migus.token");
  const expiresAt = Number(sessionStorage.getItem("migus.expiresAt"));
  const usuarioJson = sessionStorage.getItem("migus.usuario");

  if (!token || !expiresAt || Date.now() >= expiresAt || !usuarioJson) {
    sair();
    return null;
  }

  try {
    return { token, expiresAt, usuario: JSON.parse(usuarioJson) };
  } catch {
    sair();
    return null;
  }
}

export async function requisicaoAutenticada(path, options = {}) {
  const sessao = obterSessao();
  if (!sessao) {
    window.location.replace("/login");
    throw new Error("Sua sessão expirou. Entre novamente.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", "Bearer " + sessao.token);
  if (options.body && !headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response;
  try {
    response = await fetch(API_URL + path, { ...options, headers });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
  }

  if (response.status === 401) {
    sair();
    window.location.replace("/login");
    throw new Error("Sua sessão expirou. Entre novamente.");
  }
  return response;
}

export function sair() {
  sessionStorage.removeItem("migus.token");
  sessionStorage.removeItem("migus.expiresAt");
  sessionStorage.removeItem("migus.usuario");
}

export async function obterCadastro() {
  const response = await requisicaoAutenticada("/api/usuarios/me");

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(data?.message || "Não foi possível carregar os dados do cadastro.", response.status);
  }
  return data;
}

export async function atualizarUsuario(id, dados) {
  const response = await requisicaoAutenticada(`/api/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (Array.isArray(data?.errors)
        ? data.errors.map((e) => e.defaultMessage || e.message || String(e)).join(". ")
        : null) ||
      (data?.errors && typeof data.errors === "object"
        ? Object.values(data.errors).join(". ")
        : null) ||
      data?.error ||
      "Não foi possível atualizar os dados do cadastro.";
    throw new ApiError(errorMsg, response.status);
  }

  const sessao = obterSessao();
  if (sessao?.usuario) {
    const usuarioAtualizado = { ...sessao.usuario, ...data };
    sessionStorage.setItem("migus.usuario", JSON.stringify(usuarioAtualizado));
  }

  return data;
}

export async function desativarMinhaConta() {
  const resposta = await requisicaoAutenticada("/api/usuarios/me/desativar", { method: "PATCH" });
  if (resposta.status !== 204) {
    const erro = await resposta.json().catch(() => null);
    throw new ApiError(erro?.message || "Não foi possível desativar a conta.", resposta.status);
  }
}
