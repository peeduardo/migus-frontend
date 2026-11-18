import { ApiError, requisicaoAutenticada } from "./auth";

export async function listarExVoluntarios({ nome = "", situacao = "" } = {}) {
  const parametros = new URLSearchParams();
  if (nome.trim()) parametros.set("nome", nome.trim());
  if (situacao) parametros.set("situacao", situacao);
  const consulta = parametros.toString();
  const resposta = await requisicaoAutenticada("/api/usuarios/ex-voluntarios" + (consulta ? "?" + consulta : ""));
  const resultado = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const mensagem = resposta.status === 403
      ? "Somente um responsável ativo pode consultar ex-voluntários."
      : "Não foi possível carregar os ex-voluntários.";
    throw new ApiError(resultado?.message || mensagem, resposta.status);
  }
  return Array.isArray(resultado) ? resultado : [];
}
