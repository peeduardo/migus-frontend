export default function DisponibilidadePrograma({ programaAtivo, dataReativacao, dataInscricao }) {
  if (programaAtivo === false) {
    return <p>Programa indisponível. Sua inscrição foi preservada.</p>;
  }
  if (programaAtivo === true && dataReativacao && dataInscricao
      && Date.parse(dataReativacao) >= Date.parse(dataInscricao)) {
    return <p>Programa disponível novamente. Sua inscrição foi preservada.</p>;
  }
  return null;
}
