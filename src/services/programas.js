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

export async function listarProgramasAtivos() {
  const resposta = await requisicaoAutenticada("/api/programas/ativos");
  let resultado;
  try {
    resultado = await resposta.json();
  } catch {
    resultado = null;
  }
  if (!resposta.ok) {
    throw new ApiError(resultado?.message || "Não foi possível carregar os programas.", resposta.status);
  }
  return Array.isArray(resultado) ? resultado : [];
}

// ATENÇÃO: o backend ainda não expõe uma rota de inscrição; ajuste o caminho quando ela existir.
export async function inscreverEmPrograma(programaId) {
  const resposta = await requisicaoAutenticada(`/api/programas/${programaId}/inscricoes`, { method: "POST" });
  let resultado;
  try {
    resultado = await resposta.json();
  } catch {
    resultado = null;
  }
  if (!resposta.ok) {
    throw new ApiError(resultado?.message || "Não foi possível concluir o cadastro no programa.", resposta.status);
  }
  return resultado;
}

export async function listarInscritos(programaId) {
  const resposta = await requisicaoAutenticada(`/api/programas/${encodeURIComponent(programaId)}/inscricoes`);
  let resultado;
  try {
    resultado = await resposta.json();
  } catch {
    resultado = null;
  }
  if (!resposta.ok) {
    const mensagem = resposta.status === 403
      ? "Você só pode ver os inscritos dos programas que criou."
      : "Não foi possível carregar os inscritos.";
    throw new ApiError(resultado?.message || mensagem, resposta.status);
  }
  return Array.isArray(resultado) ? resultado : [];
}

async function lerJson(resposta) {
  try {
    return await resposta.json();
  } catch {
    return null;
  }
}

export async function responderInscricao(programaId, inscricaoId, decisao) {
  const acao = decisao === "aprovar" ? "aprovar" : "recusar";
  const resposta = await requisicaoAutenticada(
    `/api/programas/${encodeURIComponent(programaId)}/inscricoes/${encodeURIComponent(inscricaoId)}/${acao}`,
    { method: "PATCH" },
  );
  const resultado = await lerJson(resposta);
  if (!resposta.ok) {
    throw new ApiError(resultado?.message || "Não foi possível responder à inscrição.", resposta.status);
  }
  return resultado;
}

// Não existe rota de notificações: busca os programas ativos e, em cada um, os inscritos.
// Programas de outros responsáveis respondem 403 e são ignorados; sobram os programas do próprio usuário.
export async function listarInscricoesPendentes() {
  const programas = await listarProgramasAtivos();
  const resultados = await Promise.allSettled(programas.map((p) => listarInscritos(p.id)));
  const pendentes = [];
  resultados.forEach((r, indice) => {
    if (r.status !== "fulfilled") return;
    r.value.forEach((inscrito) => {
      if (String(inscrito.status || "").toUpperCase() !== "PENDENTE") return;
      pendentes.push({
        programaId: programas[indice].id,
        programaNome: programas[indice].nome,
        inscricaoId: inscrito.inscricaoId || inscrito.id,
        nome: inscrito.nome,
        email: inscrito.email,
      });
    });
  });
  return pendentes;
}
