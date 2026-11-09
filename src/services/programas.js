import { ApiError, requisicaoAutenticada } from "./auth";
export async function alterarDisponibilidade(programaId, ativo) {
  const resposta = await requisicaoAutenticada(
    `/api/programas/${encodeURIComponent(programaId)}/disponibilidade`,
    {
      method: "PATCH",
      body: JSON.stringify({ ativo }),
    }
  );

  const resultado = await lerJson(resposta);

  if (!resposta.ok) {
    throw new ApiError(
      resultado?.message || "Não foi possível alterar a disponibilidade do programa.",
      resposta.status
    );
  }

  return resultado;
}

export async function listarMeusProgramas() {
  const resposta = await requisicaoAutenticada("/api/programas/meus");
  const resultado = await lerJson(resposta);

  if (!resposta.ok) {
    throw new ApiError(
      resultado?.message || "Não foi possível carregar seus programas.",
      resposta.status
    );
  }

  return resultado;
}

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

export async function listarInscritos(programaId, status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const resposta = await requisicaoAutenticada(`/api/programas/${encodeURIComponent(programaId)}/inscricoes${query}`);
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

export async function transferirInscricao(programaOrigemId, inscricaoId, programaDestinoId) {
  const resposta = await requisicaoAutenticada(
    `/api/programas/${encodeURIComponent(programaOrigemId)}/inscricoes/${encodeURIComponent(inscricaoId)}/transferir`,
    {
      method: "POST",
      body: JSON.stringify({ programaDestinoId }),
    }
  );
  const resultado = await lerJson(resposta);
  if (!resposta.ok) {
    const mensagem =
      resultado?.message ||
      (resultado?.errors && typeof resultado.errors === "object"
        ? Object.values(resultado.errors).join(". ")
        : null) ||
      "Não foi possível transferir o voluntário.";
    throw new ApiError(mensagem, resposta.status);
  }
  return resultado;
}


export async function listarInscricoesPendentes() {
  const programas = await listarMeusProgramas(); // ← era listarProgramasAtivos()
  const resultados = await Promise.allSettled(programas.map((p) => listarInscritos(p.id, "PENDENTE")));
  const pendentes = [];
  resultados.forEach((r, indice) => {
    if (r.status !== "fulfilled") return;
    r.value.forEach((inscrito) => {
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

export async function listarMinhasInscricoes() {
  const resposta = await requisicaoAutenticada("/api/usuarios/me/inscricoes");
  const resultado = await lerJson(resposta);
  if (!resposta.ok) {
    throw new ApiError(resultado?.message || "Não foi possível carregar suas inscrições.", resposta.status);
  }
  if (!Array.isArray(resultado)) {
    throw new Error("O servidor retornou uma lista de inscrições inválida.");
  }
  return resultado;
}
