import { ApiError, requisicaoAutenticada } from "./auth";

export async function cadastrarPrograma(dados) {
  const resposta = await requisicaoAutenticada("/api/programas", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  let resultado;
  try {
    resultado = await resposta.json();
  } catch {
    resultado = null;
  }
  if (!resposta.ok) {
    const mensagem = resposta.status === 403
      ? "Acesso negado. Confira sua permissão ou entre novamente."
      : "Não foi possível cadastrar o programa. Tente novamente.";
    throw new ApiError(resultado?.message || mensagem, resposta.status);
  }
  return resultado;
}
