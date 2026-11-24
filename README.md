# Getting Started with Create React App

## C11 — RF04: Cadastrar programa

A branch de entrega `feature/C11-RF04-Cadastrar-programa-entrega` parte da
`develop` atualizada em 31/10/2026, commit `4ef937d`.
O login do Rafael e a consulta do cadastro do Henrique já estão incorporados.
A RF04 mantém o acesso ao próprio perfil e acrescenta o cadastro de programas.
A tela de perfil usa os campos do backend e mostra o cargo e o status reais.

O responsável ativo encontra **Cadastrar programa** na tela inicial.
A tela usa a sessão existente e envia `POST /api/programas` com nome, descrição,
categorias, dias disponíveis, horários e ativo. Categorias e dias são escritos
um por linha. Ativo exige escolher Sim ou Não; Não é enviado como `false`.
ID, responsável e datas são definidos pelo backend e não são enviados pelo formulário.
O backend confirma a permissão; o frontend não cria nem altera cargos.

Durante o envio, o formulário fica bloqueado. Os erros são exibidos sem limpar os
campos, e o sucesso aparece após a resposta da API. Um rascunho fica no
`sessionStorage`, separado por usuário, para recuperar os campos ao entrar novamente
na mesma aba. Ele é removido no sucesso ou ao encerrar a aba. Sair da conta não apaga
o rascunho: outra conta não o recebe, e o mesmo usuário pode recuperá-lo ao entrar novamente.
O helper de autenticação existente trata 401 encaminhando ao login.
Um 403 com mensagem mostra o motivo; sem mensagem, orienta conferir a permissão
ou entrar novamente, pois o backend também pode retornar 403 para token inválido.

### Executar e verificar

```powershell
npm ci
$env:REACT_APP_API_URL = 'http://localhost:8080'
npm start
```

Em outro terminal, na pasta do frontend:

```powershell
$env:CI = 'true'
npm test -- --watchAll=false --runInBand
npm run build
```

Os testes simulam apenas as respostas HTTP. Verificam formulário, dados enviados,
mensagens, envio duplicado, rascunho e acesso pela sessão. Não acessam MongoDB.
O teste antigo da tela inicial do Create React App foi atualizado para o login real.

Para validar o fluxo completo, use o backend local da RF04 e somente `migus_testes`.
Antes de iniciar, confira a conexão e a rotina de inicialização do backend.
Use contas fictícias desse ambiente e remova somente os dados criados na validação.
Nunca coloque URI de banco, senha ou segredo JWT no frontend ou nas variáveis `REACT_APP_*`:
essas variáveis ficam visíveis no navegador. Não use o banco compartilhado da aplicação.

Na revisão de 30/10/2026, passaram 22 testes do frontend e o build. A tela foi conferida em
desktop e celular. O fluxo real passou com login, cadastro com `ativo: false`,
validação e bloqueio de usuário sem permissão. A persistência e a remoção dos dados
fictícios foram confirmadas em `migus_testes`, sem executar a rotina de exemplo do Leo.
O lançador usado nessa validação é temporário, fica fora dos repositórios e não muda
o comportamento padrão de inicialização do backend.

A tela inicial apresenta o perfil recebido na sessão, sem mudar o cargo no banco.
O cadastro público continua criando interessado, sem acesso ao cadastro de programas.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## C17 — RF10: Minhas inscrições

Após entrar, use **Minhas inscrições** na tela inicial. A rota protegida
`/minhas-inscricoes` consulta `GET /api/usuarios/me/inscricoes` pela requisição
autenticada existente. Não envia um identificador de usuário para escolher a conta.

A tela mostra programa, data e situação: Pendente, Aprovada, Recusada ou Transferida. Após a transferência, a origem aparece como Transferida e o destino como Aprovada, cada um com a data da sua inscrição.
Também trata carregamento, lista vazia, falha e tentativa novamente.
Um programa ausente aparece como **Programa indisponível**, sem esconder a inscrição.
Ao trocar de conta, a tela começa sem os dados anteriores e ignora respostas antigas.

Verificações locais:

```sh
npm test -- --watchAll=false --runInBand --coverage
npm run build
```

Os testes simulam as respostas HTTP, inclusive as chamadas do sino nos cenários
de navegação. Verificam dados, estados, lista vazia, erro, nova tentativa,
rota protegida e troca de conta. Não conectam ao MongoDB.
A prévia com respostas simuladas foi conferida manualmente pelo autor em desktop, celular com 393 px, teclado e cenários de tela. Em 06/11/2026, a API e o MongoDB foram validados no banco `migus`, com dados fictícios exclusivos e limpeza confirmada. Depois, o autor conferiu a interface conectada ao backend e ao banco reais em desktop e celular emulado de 393 px: os três estados, programa inativo, programa indisponível, lista vazia e isolamento entre contas funcionaram. Uma inscrição adicional apareceu como pendente. A evidência de teclado continua sendo a da prévia simulada. Os dados exclusivos da demonstração foram removidos pelos IDs ao encerrar, preservando o programa existente usado na inscrição adicional.
