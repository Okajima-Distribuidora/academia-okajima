# Plano de autenticação — Academia Okajima

Data: 02/09/2026. Status: primeira entrega local implementada e verificada. Este documento preserva o planejamento e suas referências; o comportamento entregue, execução, testes e limites estão em [Login local](C:/Users/Okajima/Documents/ChatGPT/academia-okajima/docs/login-local.md).

Decisões da implementação: reutilizar o admin já provisionado, sem regravar contas/senhas; cenários negativos em testes isolados, sem seed de contas extras. Tema claro inicial com opção escura, componentes shadcn oficiais e cabeçalho compartilhado. NextAuth v5 instalado, Kysely/mysql2 e bcryptjs, sem Prisma/adapter. Nenhuma alteração nos projetos PHP ou BEES.

## 1. Objetivo e limites

Implementar primeiro login web por RCA/e-mail e senha, sessão, logout e uma página protegida. Usar o padrão NextAuth do dashboard BEES e a tabela de usuários da academia, sem depender de uma API REST separada ou executar o PHP antigo.

Este plano resulta de leitura estática dos dois projetos, do schema importado e dos esclarecimentos posteriores na conversa. Não comprova que todos os caminhos encontrados estejam em uso ou funcionando em produção. Pelo agente, não foram executados logins, consultados bancos de produção, copiados usuários reais nem alterados os projetos de referência.

A documentação [Autenticação do legado](C:/Users/Okajima/Documents/ChatGPT/academia-okajima/docs/autenticacao-legado.md) é inventário técnico, não escopo obrigatório da reescrita.

Primeira entrega: exclusivamente desenvolvimento local, com contas fictícias. A liberação para usuários reais depende das verificações da seção 10.

### Decisões para começar

- NextAuth v5 com Credentials e JWT, seguindo a organização do dashboard.
- MySQL existente, acessado pelo servidor Next.js com Kysely + mysql2; sem API REST separada.
- Login por RCA/e-mail, usando `users.password` e identidade estável em `users.id`.
- **bcryptjs**, com métodos assíncronos `hashPassword` e `comparePassword`. Não usar o pacote nativo `bcrypt` como substituto sem revisar a compatibilidade.
- Novas senhas: bcrypt com **custo inicial 12**, salt automático e senha sem transformações. Senhas antigas: ler o custo de cada hash automaticamente, preservando seu conteúdo.
- Nenhuma chave secreta ou salt fixo para bcrypt. `AUTH_SECRET` protege a sessão NextAuth, não as senhas.
- Primeiro implementar conta fictícia, login, página protegida e logout. Cadastro administrativo, integrações e recuperação de senha ficam para entregas seguintes.

O usuário relatou acesso ao banco antigo por um cliente de banco e apresentou um hash no formato `$2y$10$...`. O formato informa bcrypt com custo 10; não comprova a origem da conta, a senha correspondente ou o formato de todas as outras contas. Não registrar neste documento o hash completo nem as credenciais reais.

## 2. O que o dashboard efetivamente faz

| Parte | Comportamento encontrado | Evidência |
| --- | --- | --- |
| Versão | Declara `next-auth ^5.0.0-beta.30`; o lock fixa `5.0.0-beta.30`. | [package.json](C:/Users/Okajima/Documents/bees/dashboard/package.json:65), [lock](C:/Users/Okajima/Documents/bees/dashboard/package-lock.json:8079) |
| Entrada usada pela página | `/login` chama `login()` de `lib/auth/client.ts`, que chama `signIn("credentials", ...)` sem redirecionamento automático. | [página](C:/Users/Okajima/Documents/bees/dashboard/app/login/page.tsx:13), [helper](C:/Users/Okajima/Documents/bees/dashboard/lib/auth/client.ts:3) |
| Configuração central | `auth.ts` exporta `handlers`, `auth`, `signIn`, `signOut`; usa Credentials e sessão JWT. | [configuração](C:/Users/Okajima/Documents/bees/dashboard/auth.ts:28) |
| Validação | O campo de entrada se chama `username`, mas a consulta procura `User.email`. Compara `User.password` com `bcryptjs.compare`. | [authorize](C:/Users/Okajima/Documents/bees/dashboard/auth.ts:37) |
| Acesso ao banco | Kysely com SQLite e `node:sqlite`, dentro do processo do servidor Next.js. | [getDb](C:/Users/Okajima/Documents/bees/dashboard/lib/sqlite/db.ts:10) |
| Permissões | Busca `UserRole`/`Role`; inclui nomes de perfis no JWT e na sessão. | [perfis](C:/Users/Okajima/Documents/bees/dashboard/auth.ts:52) |
| Atualização da sessão | O callback JWT consulta novamente o usuário por e-mail, atualiza os perfis e retorna `null` se o usuário não existe. | [callback JWT](C:/Users/Okajima/Documents/bees/dashboard/auth.ts:68) |
| Endpoint NextAuth | Reexporta GET/POST em `app/api/auth/[...nextauth]/route.ts`. | [endpoint](C:/Users/Okajima/Documents/bees/dashboard/app/api/auth/[...nextauth]/route.ts:1) |
| Proteção | Layout protegido chama `auth()` e redireciona; existem também verificações em Server Actions e helper de permissões. Não foi feita auditoria de todas as rotas. | [layout](C:/Users/Okajima/Documents/bees/dashboard/app/(protected)/layout.tsx:11), [actions](C:/Users/Okajima/Documents/bees/dashboard/app/(protected)/minha-conta/actions.ts:11), [helper](C:/Users/Okajima/Documents/bees/dashboard/lib/auth/permissions.ts:12) |
| Logout | O helper chama `signOut()` e retorna para `/login`. | [logout](C:/Users/Okajima/Documents/bees/dashboard/lib/auth/client.ts:18) |

Distinções importantes para não copiar arquivos sem necessidade:

- Existe outro componente `components/auth/login-form.tsx`, mas a página de login inspecionada implementa o formulário diretamente e utiliza o helper acima. A busca não encontrou importação daquele componente.
- `@auth/kysely-adapter` está instalado e existem tipos `Account`, `Session` e `VerificationToken`, mas o `NextAuth()` examinado não configura `adapter`. O login observado é Credentials + consultas próprias + JWT, não sessão persistida pelo adapter.
- Existem helpers de cookie `auth_token`/JSON em Base64 em [middleware.ts](C:/Users/Okajima/Documents/bees/dashboard/lib/auth/middleware.ts:5) e [utils.ts](C:/Users/Okajima/Documents/bees/dashboard/lib/auth/utils.ts:3). Não encontrei consumidores externos desses helpers na busca. Eles não representam o fluxo NextAuth descrito e não devem ser levados para a academia: decodificar Base64 não autentica uma identidade.
- A academia terá autenticação independente. Reaproveitar a arquitetura não significa compartilhar banco, contas, segredo, cookies ou sessão com o BEES.

## 3. Contrato de dados da academia

O login web principal recebe `codigorca` e `password` e consulta `users` por `(codigorca = entrada OR email = entrada)`. Ele não autentica pelo campo `username` nem consulta `app_login` durante essa validação. Evidências: [formulário PHP](C:/Users/Okajima/Documents/academia-okajima-old/themes/youplay/layout/auth/login/content.html:5), [consulta](C:/Users/Okajima/Documents/academia-okajima-old/sources/login/content.php:43).

| Coluna existente | Uso proposto no primeiro login |
| --- | --- |
| `users.id` | Identidade estável. Inteiro no MySQL, convertido para string no contrato NextAuth. Não usar RCA/e-mail como ID de sessão. |
| `users.codigorca` | Identificador de entrada; `varchar(32)`. Manter como string, inclusive zeros à esquerda. |
| `users.email` | Identificador alternativo. Há código legado que grava `"0"` como ausência de e-mail; não tratar esse marcador como e-mail válido. |
| `users.password` | Hash para verificar a senha; somente servidor. Nullable no schema: ausência/hash desconhecido deve recusar autenticação. |
| `users.active` | Permitir somente `1`. Qualquer outro valor recusa acesso, inclusive com sessão anteriormente aberta. |
| `users.username` | Nome de exibição inicial, com RCA como fallback. Não é um terceiro identificador de login. |
| `users.two_factor` | Barreira de segurança: primeira etapa só aceita `0`; outros valores ficam sem acesso até suportar/avaliar o segundo fator. |
| `users.admin`, `permission`, `CODMOD` | Fora da autorização do primeiro marco. Não conceder acesso administrativo a partir deles sem definir o mapeamento. |
| `users.SENHA`, `app_login.SENHA` | Não consultar nem comparar no login novo. Não copiar para cliente, logs ou fixtures. |

Evidências de estrutura: [users](C:/Users/Okajima/Documents/ChatGPT/academia-okajima/database/legacy-schema.sql:853), [estado e perfis](C:/Users/Okajima/Documents/ChatGPT/academia-okajima/database/legacy-schema.sql:876), [campos corporativos](C:/Users/Okajima/Documents/ChatGPT/academia-okajima/database/legacy-schema.sql:929).

O sincronizador [cron_hash.php](C:/Users/Okajima/Documents/academia-okajima-old/cron_hash.php:16) lê `app_login`, gera hash e grava `users`; é uma etapa de provisionamento, não uma chamada que o novo login precisa fazer. A existência desse arquivo não comprova execução agendada atual.

Há uma divergência no PHP: o controlador bloqueia `active = 0`, mas [PT_UserActive](C:/Users/Okajima/Documents/academia-okajima-old/assets/includes/functions_one.php:536) exige `active = 1`. O plano adota a regra restritiva e uniforme.

Não há unicidade garantida para RCA ou e-mail no [schema de índices](C:/Users/Okajima/Documents/ChatGPT/academia-okajima/database/legacy-schema.sql:1667). Buscar até duas contas candidatas e recusar se houver ambiguidade; não escolher a primeira, nem usar a senha ou o estado ativo para desempatar contas.

## 4. Arquitetura proposta

```text
Navegador: formulário /login
    │ signIn("credentials", { identifier, password })
    ▼ HTTP para o próprio Next.js
NextAuth: /api/auth/[...nextauth]
    ▼ authorize()
Serviço de autenticação: validação + limite de tentativas + regras
    ▼ repositório de usuários
Kysely + mysql2 → MySQL local / users
    ▼ usuário mínimo, somente após validação completa
NextAuth: sessão JWT em cookie HttpOnly
    ▼ requisições seguintes
auth() + consulta por users.id + validação de estado → recurso protegido
```

Proposta de dependências:

- **NextAuth v5 / Credentials / JWT:** repetir o padrão do dashboard. A versão `5.0.0-beta.30` é referência observada, não garantia de adequação futura. Antes de instalar, verificar compatibilidade com Next.js 16.3.4, avisos de segurança e fixar a versão escolhida no lock. A [instalação oficial](https://authjs.dev/getting-started/installation) consultada ainda aponta para a linha beta.
- **Kysely + mysql2:** manter a organização de queries que o dashboard já usa, trocando `SqliteDialect` por `MysqlDialect`. Kysely é o construtor tipado de SQL; mysql2 faz a conexão. O [dialeto oficial](https://kysely-org.github.io/kysely-apidoc/classes/MysqlDialect.html) usa pool de `mysql2`, não o pool Promise de `mysql2/promise` passado diretamente ao dialeto.
- **bcryptjs:** geração e comparação assíncronas de hashes; aceita os prefixos `$2a$`, `$2b$` e `$2y$`. Manter testes explícitos com fixtures PHP `$2y$10$` e novas `$2b$12$`; reconhecer um prefixo não comprova como a senha foi tratada no código de origem. Detalhamento na seção 6.
- **Zod e server-only:** validação de entradas e isolamento dos módulos de banco/autenticação do bundle do navegador.
- **Executor de testes TypeScript:** escolher uma opção compatível com o Node local; o dashboard usa `tsx` com o runner nativo. Não é necessário copiar todo seu ferramental.

Em relação à sugestão inicial de usar apenas mysql2, Kysely passa a fazer sentido para manter o padrão que você já tem no dashboard. Ele não exige recriar tabelas, instalar Prisma ou iniciar migrações automáticas.

Banco/configuração:

- Reutilizar `DATABASE_URL` privada e o MySQL local descrito em [Banco de desenvolvimento](C:/Users/Okajima/Documents/ChatGPT/academia-okajima/docs/banco-local.md). Não ler configurações PHP ou ambientes do BEES.
- Executar acesso MySQL no runtime Node.js. Pool compartilhado por processo, inicialização sob demanda, limite pequeno de conexões e tratamento de hot reload; não criar um pool por requisição.
- Criar `AUTH_SECRET` exclusivo da academia. Não reutilizar segredo ou sessão de outro projeto.
- Não instalar `@auth/kysely-adapter` para este marco. A consulta própria a `users` não precisa do modelo de tabelas desse adapter. [Credentials](https://authjs.dev/getting-started/authentication/credentials) deixa a validação e persistência customizada com a aplicação.
- Não alterar o dump, importar dados reais, rodar cron PHP ou escrever em `sessions`, `app_login` e `bad_login` para entregar esse primeiro fluxo.

Variáveis e parâmetros não devem ser confundidos:

| Nome | Finalidade | Participa do hash da senha? |
| --- | --- | --- |
| `DATABASE_URL` | Conectar ao banco local. | Não. |
| `AUTH_SECRET` | Proteger tokens/cookies de sessão do NextAuth; exclusivo da academia. | Não. |
| `AUTH_DEV_SEED_PASSWORD` — nome proposto | Fornecer a senha fictícia ao script de seed local, sem versioná-la. Não será lida durante o login. | É apenas a entrada usada para criar a conta fictícia; não é uma chave de hashing. |
| `PASSWORD_HASH_COST = 12` — constante no servidor | Definir o custo para gerar novos hashes. Não precisa ser variável de ambiente. | Sim, somente na geração. A comparação usa o custo contido no hash salvo. |

Salt não é uma variável de configuração: é aleatório, gerado pela biblioteca e embutido no hash. Alterar `AUTH_SECRET` pode invalidar sessões, mas não altera nem exige recalcular `users.password`.

## 5. Comportamento do login

### Entrada e consulta

1. Exibir campos “RCA ou e-mail” e “Senha”; nomes internos `identifier` e `password`. Adaptar os dois lados do contrato, sem conservar `username` com significado enganoso.
2. Validar no servidor que ambos são strings não vazias e limitar tamanho da requisição/entrada. Identificador com até 255 caracteres; RCA com até 32 quando usado como RCA. Senha não recebe trim, conversão de caixa ou escape HTML/SQL.
3. Remover espaços externos somente do identificador. Preservar RCA como texto. Não impor a política de criação de senha nova ao verificar uma senha legada.
4. Consultar por RCA e, quando a entrada tiver formato válido de e-mail, também por e-mail. Isso mantém as duas formas legítimas de acesso e impede usar marcadores de ausência de e-mail como credencial alternativa. Não adicionar busca por telefone ou username.
5. Usar os parâmetros do query builder; não concatenar entrada em SQL. Recuperar até duas contas e selecionar explicitamente só as colunas necessárias.
6. Conta inexistente, ambígua, inativa, com segundo fator não suportado ou senha inválida: não emitir sessão. Não revelar ao navegador qual regra falhou.
7. Validar hash conforme a política da seção 6. Não criar conta automaticamente quando o identificador não existir.
8. Retornar ao NextAuth somente `id`, `name`, `email` válido ou `null` e `codigorca`. Campos de estado ficam na validação do servidor; hashes e segredos nunca entram no JWT ou na sessão pública.

Usar mensagem genérica como “RCA/e-mail ou senha inválidos, ou conta indisponível”. Falha de infraestrutura deve ter tratamento de indisponibilidade, sem mostrar SQL, URL de conexão ou exceções internas. Nunca autenticar caso o banco falhe.

### Limite de tentativas

É uma proteção temporária contra testes automáticos de muitas senhas. Quando o limite é atingido, a tentativa é recusada até a janela liberar novamente. Isso não muda a senha, não apaga a conta e não altera `users.active`.

Aplicar o limite dentro do caminho de `authorize`, antes da comparação de senha; proteger também chamadas diretas ao endpoint, não só o botão do formulário.

Política ajustada para o desenvolvimento de processo único: contador em memória com TTL e tamanho máximo, com 5 falhas por par origem/identificador e por origem/conta em 15 minutos, mais 30 falhas agregadas por origem. Logins corretos não consomem o limite. Reservar vagas antes da consulta/comparação para impedir contorno por concorrência; liberar somente as reservas da própria requisição no sucesso ou em exceção operacional, sem apagar falhas anteriores. São parâmetros iniciais de teste, não regras herdadas do PHP. Evitar guardar o identificador em claro no contador/log. Detalhes da transição dos contadores antigos em `docs/login-local.md`.

Não considerar contador em memória uma proteção de produção multi-instância. Antes de exposição pública, definir armazenamento compartilhado, atualização atômica e obtenção confiável do IP atrás do proxy; não confiar cegamente em headers fornecidos pelo cliente. Testar a limitação por RCA e por e-mail da mesma conta, além de tentativas distribuídas.

## 6. Senhas: implementação definida e compatibilidade com o PHP

### 6.1 Biblioteca e formato dos hashes

Usar `bcryptjs`, como no dashboard. `bcrypt` é o algoritmo e também o nome de outro pacote Node; `bcryptjs` é uma implementação distinta desse algoritmo. O pacote nativo `bcrypt` documenta suporte a `$2a$` e `$2b$`, enquanto o código do `bcryptjs` reconhece também `$2y$`. Não tratar os dois pacotes como intercambiáveis sem testes. Fontes: [compatibilidade do bcrypt](https://github.com/kelektiv/node.bcrypt.js#compatibility-note), [implementação do bcryptjs](https://github.com/dcodeIO/bcrypt.js/blob/main/index.js).

| Formato | Interpretação | Regra no projeto novo |
| --- | --- | --- |
| `$2y$10$...` | Bcrypt na variante usada pelo PHP, custo 10. | Verificar com bcryptjs; manter o hash salvo sem edição. |
| `$2b$12$...` | Formato esperado ao gerar um novo hash com bcryptjs e custo 12. | Usar para contas novas e fixtures novas. |
| `$2a$...`, `$2b$...`, `$2y$...` válidos com outros custos | O custo é parte do hash, não uma configuração externa da conta. | A comparação lê o custo salvo; não exigir que todo hash tenha custo 12. |
| SHA-1, texto puro, hash ausente ou malformado | Fora do contrato inicial de autenticação. | Recusar, sem buscar outra senha em `SENHA`/`app_login`. |

O hash contém o algoritmo/variante, o custo, o salt e o resultado. Não há chave secreta para recuperar e não é possível determinar pelo hash qual função de cadastro o gravou. A senha é verificada, não descriptografada. [Formato e verificação no PHP](https://www.php.net/manual/en/function.password-verify.php)

Não substituir manualmente `$2y$` por `$2b$`, não extrair/armazenar salt em coluna separada e não recalcular todos os hashes antigos só para igualar o custo ao das contas novas.

### 6.2 Contrato do módulo de senhas

Centralizar em `lib/auth/password.ts`, exclusivo do servidor e independente de NextAuth, UI e conexão com o banco. Pode usar a classe `PasswordUtils` discutida, mantendo estas responsabilidades:

| Método | Operação e resultado |
| --- | --- |
| `hashPassword(password): Promise<string>` | Validar a senha nova, recusar truncamento e executar `bcrypt.hash(password, PASSWORD_HASH_COST)`, com custo inicial 12. A biblioteca gera o salt. |
| `comparePassword(password, hashedPassword): Promise<boolean>` | Validar o formato do hash e executar `bcrypt.compare(password, hashedPassword)`. Custo e salt vêm do hash; não gerar outro salt ou outro hash para comparação textual. |

Regras de implementação:

- Usar as APIs assíncronas e aguardar com `await`; não usar `hashSync`, `genSaltSync` ou `compareSync` no caminho de requisição. Isso não elimina o custo de CPU: medir latência e concorrência antes de produção.
- Nomear a operação `hashPassword`, não `encryptPassword`: ela não é criptografia reversível.
- Receber a senha exatamente como digitada, sem trim, escape HTML/SQL, remoção de caracteres ou mudança de caixa. A proteção das consultas é feita com parâmetros SQL, não modificando a senha.
- Na criação, rejeitar entrada que exceda **72 bytes em UTF-8**, usando a verificação de truncamento da biblioteca. Não cortar a senha silenciosamente. Na comparação, não impor retroativamente a política de criação; a compatibilidade de senhas antigas acima desse limite precisa de decisão antes da migração real. [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- Hash nulo, vazio, malformado ou não suportado deve resultar em autenticação recusada, com mensagem genérica. Tratar os erros esperados da biblioteca sem liberar acesso.
- Manter UUID e códigos de confirmação fora deste módulo: não participam do hash nem são usados como salt ou senha.
- Não incluir senha/hash em logs, tokens, sessão, respostas HTTP, exemplos versionados ou mensagens de erro. Fixtures devem conter apenas dados sintéticos claramente identificados.

### 6.3 Como serão criados os usuários novos

NextAuth não cadastra automaticamente usuários neste fluxo Credentials. A criação de conta é uma operação nossa, separada do login:

1. Receber RCA, nome de exibição, e-mail e senha por um canal autorizado.
2. Validar os dados e rejeitar duplicidades/ambiguidades de RCA e e-mail.
3. Chamar `hashPassword(senha)` com custo 12 e salt automático.
4. Inserir o usuário em `users`, preenchendo `password` somente com o hash; não preencher `SENHA` com a senha original.
5. No login, usar `comparePassword(senhaDigitada, users.password)`, a mesma função usada para os hashes bcrypt antigos.

Primeiro marco: somente script de seed **local e opt-in**, com contas fictícias e senha de entrada por `AUTH_DEV_SEED_PASSWORD`. Não imprimir nem versionar seu valor. A fixture ativa terá `active = 1` e `two_factor = 0`; o seed também terá fixtures negativas para testar estado/2FA. Isso não autoriza desativar o segundo fator de contas reais.

Próxima entrega sugerida: cadastro controlado por administrador, sem cadastro público. A UI administrativa, a autorização dessa operação e sua política completa de senha serão implementadas separadamente. Uma integração corporativa futura poderá reutilizar a mesma operação de criação. Antes de um cadastro concorrente em produção, tratar unicidade no banco/na operação; uma consulta prévia isolada não elimina corrida entre inserts.

### 6.4 O que é PT_Secure e por que não será copiado

[PT_Secure](C:/Users/Okajima/Documents/academia-okajima-old/assets/includes/functions_general.php:484) é uma função do projeto PHP que modifica texto; não faz parte de bcrypt ou NextAuth. Entre outras operações, remove espaços externos e aplica escape MySQL/HTML. Exemplos fictícios: `"  minhaSenha  "` vira `"minhaSenha"`; `"teste&123"` vira `"teste&amp;123"`.

Os caminhos antigos não tratam a entrada de modo uniforme:

- O [cron_hash.php](C:/Users/Okajima/Documents/academia-okajima-old/cron_hash.php:41) gera hash da senha original.
- O [cadastro web](C:/Users/Okajima/Documents/academia-okajima-old/sources/register/content.php:58) e a [troca de senha web](C:/Users/Okajima/Documents/academia-okajima-old/ajax/user.php:450) geram hash da senha transformada por `PT_Secure`.
- O [login PHP](C:/Users/Okajima/Documents/academia-okajima-old/sources/login/content.php:64) transforma a senha antes de verificá-la; também contém um fallback SHA-1 que pode regravar bcrypt da senha original.

Para uma senha composta apenas por dígitos, sem espaços, essa função não altera o texto. Para caracteres especiais, espaços e outras sequências, pode alterar. O prefixo `$2y$` identifica bcrypt, mas não revela qual texto foi passado à função de hash.

Decisão: **não usar PT_Secure no código novo** e não implementar um fallback genérico que tenta várias versões da senha a cada login. Novas contas terão geração e comparação consistentes da entrada original. Hashes antigos poderão ser verificados sem alteração quando corresponderem a essa entrada; reconhecer o formato não é garantia de compatibilidade de todas as contas.

### 6.5 Testes antes de liberar contas reais

1. Primeiro, testar localmente fixtures sintéticas: hash PHP `$2y$10$`, hash bcryptjs `$2b$12$`, senha correta/incorreta, entrada numérica, espaços, caracteres especiais e UTF-8. Uma verificação pontual de senha conhecida e hash da mesma conta pode comprovar aquele par, mas não identifica a rotina de origem se as transformações não mudarem a entrada. Nenhuma verificação de senha real foi executada nesta análise.
2. Gerar fixtures também com as transformações PHP para identificar as diferenças; esses testes não devem acessar produção nem carregar o bootstrap antigo que abre conexões reais.
3. Não persistir aqui o hash real apresentado, não copiar usuários reais para o seed e não executar tentativa de descoberta de senha. Não regravar hashes existentes durante o login inicial.
4. Antes da migração de usuários reais, levantar de forma autorizada os formatos de hash/estados e decidir o tratamento **somente das contas incompatíveis**: redefinição assistida ou verificador legado temporário, isolado e com retirada planejada. Não exigir troca geral de senha só por mudar PHP para Node.
5. Se futuramente houver rehash automático, definir como distinguir contas migradas; `is_hashed` não comprova qual normalização foi usada. Verificar concorrência com o sincronizador corporativo e o efeito sobre o PHP antigo antes de escrever em um banco compartilhado.

O banco local pode conter fixtures dos formatos antigo e novo desde a primeira entrega. “Começar localmente” não significa ignorar bcrypt do PHP: significa testar essa compatibilidade sem mexer nos usuários de produção. SHA-1, senhas em texto puro e reprodução de PT_Secure permanecem fora desse primeiro login.

## 7. Sessão, proteção e logout

- Repetir JWT + callbacks do dashboard, mas ancorar a identidade em `users.id`, não em `email`, que pode mudar, estar ausente ou repetido.
- Na criação do JWT, copiar o ID somente do usuário retornado por `authorize`. Nunca aceitar ID/perfil vindo de atualização de sessão pelo navegador como fonte confiável.
- No callback de atualização, consultar o usuário por ID e recusar sessão quando não existir, `active != 1` ou houver segundo fator não suportado. Expor apenas dados mínimos no callback `session`.
- Criar uma função central `requireUser()` que verifica `auth()` e o estado atual da conta no banco antes de fornecer dados protegidos. Não criar dependência circular: o repositório não importa `auth.ts`, e o callback JWT não chama `requireUser()`.
- Pode haver deduplicação dentro da mesma requisição/renderização, mas não cache global de sessão/estado entre usuários ou requisições.
- Layout protegido organiza a experiência. Páginas que carregam dados, Route Handlers e Server Actions protegidos precisam da verificação no servidor, próxima ao acesso aos dados; esconder a tela ou redirecionar pelo layout não basta. Isso está explícito no [guia local de autenticação do Next.js](C:/Users/Okajima/Documents/ChatGPT/academia-okajima/node_modules/next/dist/docs/01-app/02-guides/authentication.md:1350).
- Não é necessário `proxy.ts` no primeiro marco. Se adicionado depois, deve ser filtro de navegação, não substituto da validação do servidor. No Next.js 16, conferir a convenção `proxy.ts`, sem copiar instruções antigas de middleware.
- Proposta inicial de sessão: janela renovável de 8 horas, sem opção “lembrar dispositivo”. Não confundir renovação com um limite absoluto desde o primeiro login; confirmar a expiração efetiva por testes na versão instalada.
- Refinamento da interface: “Lembre-se de mim” guarda somente o RCA ou e-mail no navegador, por adesão explícita. Não é “lembrar dispositivo”, não guarda senha/token nem muda a duração da sessão. Implementação e testes em `docs/login-local.md`.
- Usar cookies da biblioteca com `HttpOnly`, política `SameSite` adequada e `Secure` em HTTPS; não guardar token em localStorage. Configurar nomes exclusivos da academia para os cookies de autenticação, preservando as opções de segurança. Portas diferentes em localhost não isolam cookies: testar coexistência com o dashboard para evitar que login/logout de um interfira no outro.
- `signOut()` encerra a sessão no navegador atual. Não anunciar “logout de todos os dispositivos”: JWT copiado pode continuar válido até expirar sem mecanismo de revogação. Alteração de senha e revogação global exigem desenho próprio antes dessas funcionalidades entrarem.
- Primeiro redirecionamento após login: `/`. Se futuramente aceitar retorno para uma página, permitir somente caminho interno validado, nunca URL arbitrária do formulário.
- `SessionProvider` somente se algum componente cliente precisar de `useSession`; a leitura de sessão no servidor e os botões `signIn`/`signOut` não justificam copiar todo o layout/provider do dashboard.

Não há migração de cookies PHP, tokens antigos ou linhas de `sessions`. O usuário precisará fazer novo login na aplicação nova.

## 8. Arquivos planejados

Os caminhos abaixo registram a organização planejada. O código principal foi implementado; o script de seed não foi necessário porque a conta local já havia sido provisionada. Fixtures negativas ficaram isoladas nos testes.

| Arquivo | Responsabilidade |
| --- | --- |
| `auth.ts` | Configuração NextAuth, Credentials, callbacks, sessão e página de login. |
| `app/api/auth/[...nextauth]/route.ts` | GET/POST da biblioteca, executados em Node.js. |
| `lib/db/index.ts` | `getDb()`, pool mysql2 e Kysely, com `server-only`. |
| `lib/db/types.ts` | Tipos mínimos reais das colunas de `users` necessárias; não importar o schema SQLite do BEES. |
| `lib/auth/users.ts` | Busca limitada de candidatos por identificador e consulta por ID. |
| `lib/auth/credentials.ts` | Validação de entrada e regra de autenticação, sem dependência da interface. |
| `lib/auth/password.ts` | `PasswordUtils` com `hashPassword`/`comparePassword` assíncronos, bcryptjs, custo inicial 12 para geração e verificação dos formatos existentes. |
| `lib/auth/rate-limit.ts` | Limite local de tentativas, isolado para substituição antes de produção. |
| `lib/auth/session.ts` | `requireUser()` e DTO público da identidade. |
| `types/next-auth.d.ts` | Extensão tipada de User, Session e JWT, sem casts de dados não verificados. |
| `app/login/page.tsx` | Página pública de entrada. |
| `components/auth/login-form.tsx` | Um único formulário, loading, mensagens e chamada ao Credentials. |
| `components/auth/logout-button.tsx` | Logout usando NextAuth. |
| `app/(protected)/layout.tsx` | Estrutura visual da área autenticada. |
| `app/(protected)/page.tsx` | Página inicial mínima protegida com identidade e botão de sair. |
| `scripts/seed-auth-dev.ts` (não criado) | Substituído neste marco pelo provisionamento local já concluído; nenhuma criação automática no login. |
| `tests/auth/` | Testes do serviço, integração MySQL e roteiro do fluxo de navegador. |

A rota `/` já existe em `app/page.tsx`. Ao implementar, adaptar/mover deliberadamente essa página para o grupo protegido, preservando o que for relevante; não deixar duas páginas resolvendo para `/`.

## 9. Ordem de implementação e critérios de aceite

### Etapa 1 — infraestrutura de acesso e contas de teste

- Conferir versão do Node, dependências e os guias locais do Next.js antes de escrever código.
- Instalar dependências escolhidas, configurar segredo exclusivo e pool local. Não copiar arquivos `.env` dos outros projetos.
- Tipar as colunas necessárias sem mudar a estrutura existente; implementar repositório com consultas parametrizadas.
- Implementar o módulo de senhas da seção 6 com `bcryptjs` e custo inicial 12 na geração; teste de verificação de fixture PHP `$2y$10$` sem rehash ou edição do prefixo.
- Criar seed opt-in, idempotente e restrito ao destino local esperado (`academia_local` no host/porta de desenvolvimento). Recusar produção ou destino desconhecido. Antes de inserir, detectar colisões; não sobrescrever usuários ou senhas já existentes.
- Seed básico: conta ativa fictícia, conta inativa e conta marcada com segundo fator para teste negativo. Duplicidades e outros cenários devem ser fixtures controladas em banco de testes isolado, sem limpar a base do desenvolvedor.

Aceite: repositório encontra a conta correta, mantém RCA textual, rejeita candidatos ambíguos e não vaza colunas sensíveis. Nenhum login da aplicação altera tabelas de origem.

### Etapa 2 — autenticação e sessão

- Integrar validação, limite de tentativas, `comparePassword` assíncrono, estado da conta e Credentials.
- Configurar callbacks com ID estável e cookie exclusivo; endpoint da biblioteca e tipos da sessão.
- Testar comportamento dos erros e indisponibilidade do MySQL sem autenticação permissiva de fallback.

Aceite: credenciais válidas da fixture criam sessão; todos os caminhos inválidos a recusam; resposta de sessão contém somente o contrato mínimo.

### Etapa 3 — interface, proteção e logout

- Formulário acessível com rótulos explícitos, envio por Enter, loading e prevenção de envio duplicado. Não exibir recuperação/cadastro como links funcionais antes de implementá-los.
- Integrar login à página inicial protegida e incluir logout. Não refazer outras telas da academia neste marco.
- Aplicar `requireUser()` às entradas protegidas, e não só ao layout.

Aceite: visitante não recebe dados protegidos; conta ativa entra, atualiza a página mantendo a sessão e consegue sair; sessão deixa de autorizar acesso após desativar/remover a conta.

### Etapa 4 — verificação e entrega local

Executar testes automatizados de serviço e integração em fixtures isoladas, depois teste de navegador. Rodar lint, checagem de tipos e build. Registrar problemas preexistentes separadamente; não executar correções automáticas de dependências fora do escopo.

| Cenário mínimo | Resultado esperado |
| --- | --- |
| RCA válido / e-mail válido | Mesma identidade `users.id`. |
| RCA com zeros à esquerda | Sem conversão numérica. |
| Campo username, telefone ou e-mail marcador `0` | Não viram formas extras de acesso; `0` só pode ser RCA se existir uma conta explicitamente com esse RCA. |
| Conta inexistente, senha errada ou campos ausentes | Sem sessão e sem enumeração de conta pela mensagem. |
| `active = 0`, `active = 2` ou valor inesperado | Sem acesso. |
| Conta com `two_factor != 0` | Sem bypass por senha isolada. |
| Identificador duplicado ou colisão RCA/e-mail | Recusa, sem escolher a primeira linha. |
| Aspas, caracteres SQL e entrada inválida | Tratados como dados/validação; não alteram a consulta. |
| Fixture PHP `$2y$10$` e fixture nova `$2b$12$` | Ambas verificadas por `comparePassword`; custo lido do hash e conteúdo salvo preservado. |
| Gerar dois hashes da mesma senha nova | Salt aleatório produz hashes distintos; ambos aceitam a senha correta e rejeitam outra. |
| Criar senha nova com mais de 72 bytes UTF-8 | Rejeição antes da persistência, sem truncamento silencioso. |
| Caracteres especiais, espaços e UTF-8 | Senha original preservada; nenhuma chamada a PT_Secure. Divergências das fixtures PHP documentadas. |
| Hash de fixture cuja senha foi efetivamente alterada por PT_Secure | Não aceitar a entrada original por fallback implícito; caso incompatível identificado para decisão posterior. |
| Trocar `AUTH_SECRET` somente em teste isolado | Hashes de senha continuam verificáveis; sessões antigas não devem continuar válidas com o segredo substituído. |
| SHA-1, texto puro, hash nulo/malformado | Recusados no primeiro marco. |
| Limite de tentativas e liberação após a janela | Bloqueio aplicado também na chamada direta ao Credentials. |
| Cookie adulterado ou expirado | Sem acesso. |
| Remover/desativar usuário com sessão aberta | Próxima operação protegida recusada. |
| Alterar e-mail do usuário com sessão aberta | Identidade permanece vinculada ao ID, nunca a outra conta. |
| Logout e novo acesso direto à página | Retorno para login; sem dados protegidos. |
| Banco indisponível | Erro controlado, nenhum acesso liberado. |
| Resposta de sessão, HTML e bundle cliente | Ausência de hash, `SENHA`, segredo e credencial de banco. |
| Dashboard e academia no mesmo navegador | Login/logout e cookies independentes. |
| Reinício/hot reload | Sem crescimento descontrolado de pools; limite em memória reconhecidamente reinicia. |

Primeira entrega pronta significa este fluxo funcionar com dados fictícios. Não significa compatibilidade completa com contas de produção.

## 10. O que fica fora e o que precisa ser decidido depois

Fora do primeiro marco: tela de cadastro administrativo, cadastro público, recuperação/troca de senha, disparo de e-mail, 2FA completo, login social, autenticação mobile/TV, troca de contas, lembrar dispositivo, logout global, gestão de perfis e sincronização corporativa. A geração de hash para contas novas já será implementada e usada pelo seed, sem criar endpoint público de cadastro.

Antes de usar usuários reais ou publicar:

1. Validar as senhas conforme a seção 6 e aprovar a estratégia de migração/redefinição. Não copiar fallback frágil por conveniência.
2. Confirmar a origem e manutenção das contas: se `users` continuará sendo alimentada por processo corporativo, como desativação e alteração de senha serão propagadas.
3. Auditar duplicidades, placeholders e collation dos identificadores; decidir saneamento e índices em migração separada, não adicionar `UNIQUE` cegamente. O plano não muda a semântica case/accent-insensitive do schema sem essa revisão.
4. Confirmar se há usuários com 2FA requerido. Até existir fluxo novo aprovado, essas contas não podem entrar apenas com senha.
5. Definir permissões administrativas com base no negócio. Não converter automaticamente `CODMOD` em roles do BEES nem concluir que todo `admin != 0` é administrador total.
6. Validar limite distribuído de tentativas, HTTPS, isolamento dos ambientes e política final de duração/revogação de sessão.
7. Definir acesso seguro ao banco de produção. O MySQL 5.7 local foi montado para compatibilidade do legado, não como recomendação para uma nova implantação pública.

Nenhuma dessas pendências impede construir o marco local descrito. Elas impedem tratá-lo prematuramente como substituição pronta do login de produção.

## 11. Resultado deste planejamento

Arquitetura definida para o início local: **NextAuth como no dashboard, Kysely adaptado para MySQL, tabela `users` da academia, identidade por ID, login por RCA/e-mail e bcryptjs assíncrono**. Hashes novos com custo inicial 12 e salt automático; hashes antigos preservados e verificados conforme seus parâmetros. Sem chave secreta para bcrypt, API REST separada, adapter de persistência NextAuth ou execução do PHP em produção.

Checklist da primeira entrega local:

- [x] Preparar dependências, configuração privada e pool MySQL local.
- [x] Implementar `PasswordUtils` com hash/verificação e testes de `$2y$10$`/`$2b$12$`.
- [x] Implementar repositório `users` e reutilizar a conta fictícia já provisionada.
- [x] Integrar Credentials, sessão, limite de tentativas e validação de estado.
- [x] Entregar formulário, página protegida, logout e testes do fluxo.

Nesta implementação foram adicionados código, dependências de tema/isolamento, segredo privado e testes. A conta existente foi preservada. Nenhuma migração, importação de dados reais, atualização de senha ou alteração dos projetos de referência foi executada. As pendências de produção da seção 10 continuam abertas.
