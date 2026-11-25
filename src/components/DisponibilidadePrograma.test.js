import { render, screen } from "@testing-library/react";
import DisponibilidadePrograma from "./DisponibilidadePrograma";

test("não presume reativação para programa antigo ou inscrição posterior", () => {
  const view = render(<DisponibilidadePrograma programaAtivo={true} dataInscricao="2026-11-24" />);
  expect(view.container).toBeEmptyDOMElement();
  view.rerender(<DisponibilidadePrograma programaAtivo={true} dataInscricao="2026-11-24" dataReativacao="2026-11-23" />);
  expect(view.container).toBeEmptyDOMElement();
  view.rerender(<DisponibilidadePrograma programaAtivo={null} dataInscricao="2026-11-24" />);
  expect(view.container).toBeEmptyDOMElement();
});

test("prioriza indisponibilidade atual depois de uma nova inativação", () => {
  render(<DisponibilidadePrograma programaAtivo={false} dataInscricao="2026-11-01" dataReativacao="2026-11-23" />);
  expect(screen.getByText("Programa indisponível. Sua inscrição foi preservada.")).toBeInTheDocument();
  expect(screen.queryByText(/disponível novamente/)).not.toBeInTheDocument();
});
