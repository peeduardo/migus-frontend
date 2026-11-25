import { render, screen, within } from "@testing-library/react";
import HistoricoParticipacaoScreen from "./HistoricoParticipacaoScreen";

const fetchOriginal = global.fetch;
beforeEach(() => {
  sessionStorage.setItem("migus.token", "token-ficticio");
  sessionStorage.setItem("migus.expiresAt", String(Date.now() + 60000));
  sessionStorage.setItem("migus.usuario", JSON.stringify({ id: "ana", tipoUsuario: "INTERESSADO" }));
  global.fetch = jest.fn();
});
afterEach(() => { global.fetch = fetchOriginal; sessionStorage.clear(); });

test.each([false, true])("preserva situação e datas com programa ativo=%s", async programaAtivo => {
  const estados = ["PENDENTE", "APROVADA", "RECUSADA", "CANCELADA", "SAIDA", "TRANSFERIDA", "SUSPENSA"];
  fetch.mockResolvedValue({ ok: true, json: async () => estados.map((situacao, indice) => ({
    inscricaoId: String(indice), programaId: String(indice), programaNome: `Programa ${indice}`,
    dataInscricao: "2026-11-01", inicioParticipacao: situacao === "APROVADA" ? "2026-11-02" : null,
    situacao, programaAtivo, dataReativacao: "2026-11-24",
  })) });
  render(<HistoricoParticipacaoScreen />);
  const lista = await screen.findByRole("list", { name: "Histórico de participação" });
  expect(within(lista).getAllByRole("listitem")).toHaveLength(7);
  for (const rotulo of ["Pendente", "Aprovada", "Recusada", "Cancelada", "Saída registrada", "Transferida", "Suspensa"]) {
    expect(within(lista).getByText(rotulo)).toBeInTheDocument();
  }
  expect(within(lista).getAllByText("01/11/2026")).toHaveLength(7);
  expect(within(lista).getByText("02/11/2026")).toBeInTheDocument();
  expect(within(lista).getAllByText(programaAtivo
    ? "Programa disponível novamente. Sua inscrição foi preservada."
    : "Programa indisponível. Sua inscrição foi preservada.")).toHaveLength(7);
});
