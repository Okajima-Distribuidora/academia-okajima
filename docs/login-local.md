# Login local — primeira entrega

Implementado em 02/09/2026. Escopo: contas fictícias no MySQL de desenvolvimento. Não é a migração dos usuários de produção.

## Executar

Na raiz do projeto:

```powershell
docker compose up -d --wait
npm install
npm run dev -- --hostname 127.0.0.1
```

Abra `http://localhost:3000/login`. A conta local já provisionada usa RCA `admin` ou e-mail `admin@academia.test`. Sua senha de teste está em `AUTH_DEV_SEED_PASSWORD`, em `.env.local`; o login **não lê essa variável**. Ele compara a entrada com `users.password`. Não use essa conta/senha simples em produção.

Configuração privada em `.env.local`, ignorado pelo Git:

- `DATABASE_URL`: aceita exclusivamente `127.0.0.1:3307/academia_local`; URL com outro destino/parâmetros é recusada antes da conexão.
- `AUTH_SECRET`: segredo aleatório exclusivo desta academia. Não é salt nem chave do bcrypt.
- `AUTH_URL`: `http://localhost:3000`. Use esse endereço no navegador, consistentemente.
- `AUTH_DEV_SEED_PASSWORD`: somente provisionamento/teste local; nenhuma dependência no fluxo de login.

Em outra máquina, gere outro `AUTH_SECRET` privado, configure o banco e provisione uma conta fictícia deliberadamente. Iniciar a aplicação não cria contas, executa seed ou importa schema.

## Fluxo implementado

`/login` → `signIn("credentials")` → `/api/auth/[...nextauth]` → Zod/limite → Kysely/mysql2 → `users` → bcryptjs → cookie NextAuth → `/`.

- Campos `identifier` e `password`. Somente o identificador recebe trim. RCA permanece string; e-mail precisa ter formato válido.
- Consulta parametrizada por RCA/e-mail, no máximo duas candidatas. Duplicidades/cross-colisões falham; `username` é apenas exibição.
- Exige `active = 1` e `two_factor = 0`; nenhum bypass de segundo fator. Falhas de conta/senha têm a mesma mensagem.
- Hash bcrypt `$2a$`, `$2b$` ou `$2y$` bem formado. A comparação lê custo/salt do hash, sem editá-lo. Hashes novos usam custo 12 e salt aleatório; geração rejeita mais de 72 bytes UTF-8.
- Não usa PT_Secure, SHA-1, senha em texto puro, `SENHA`, `app_login`, sessões/cookies PHP ou rehash automático.
- Login é somente leitura. O pool mysql2 é lazy, compartilhado por processo/hot reload, com no máximo 5 conexões e fila limitada.
- `auth.ts` valida a identidade atual pelo ID a cada leitura da sessão. `requireUser()` repete a barreira junto à página/dados protegidos; layout não é a única proteção.
- Sessão pública contém apenas `id`, `name`, `email` válido ou `null`, `codigorca` e `expires`. Não contém `admin`, permissões, hash ou segredos.
- Cookie com namespace `academia-okajima.*`, HttpOnly, SameSite=Lax e Secure em HTTPS. Portas não são isolamento de cookies; o namespace evita colisão com o padrão do dashboard.
- Janela renovável de 8h. GET `/api/auth/session` reemite o cookie. `SessionRefresh` faz essa leitura ao abrir/retornar à área protegida e a cada 5 minutos enquanto visível; leituras RSC de `auth()` sozinhas não renovam cookies no navegador. Não existe limite absoluto adicional nem “lembrar dispositivo”.
- Logout usa NextAuth e navegação completa para `/login`. Encerra este navegador, não revoga JWT já copiado em outro dispositivo.
- Redirecionamentos restritos à origem da aplicação e `/` ou `/login`. POST da autenticação limitado a 16 KiB reais, além dos limites Zod (identificador 255 caracteres, senha 1024 caracteres como limite de transporte).

## Limite local de tentativas

Janela fixa de 15 minutos: 5 falhas por identificador e 5 por conta encontrada, mais 30 falhas por origem. O contador por ID impede contornar as 5 falhas alternando RCA, e-mail ou variações equivalentes da collation. Logins bem-sucedidos **não consomem o limite**.

Cada requisição reserva vagas antes das operações assíncronas, para também limitar envios simultâneos. No sucesso, libera somente suas próprias reservas; não apaga falhas de outras tentativas. Entradas inválidas, conta ausente/ambígua/indisponível e senha incorreta mantêm a contagem. Exceções operacionais e requisições já recusadas pelo limite liberam as reservas parciais, sem conceder acesso. Ao atingir o limite por falhas, inclusive uma senha correta precisa aguardar a janela.

Nesta entrega existe **uma única origem local compartilhada**; não se confia em `X-Forwarded-For`/headers enviados pelo cliente. Contadores usam chaves HMAC efêmeras, TTL e capacidade máxima de 10 mil entradas, recusando novas chaves se lotarem. Não guardam identificadores em claro.

Isso é adequado somente para o marco local de processo único. Reiniciar o processo limpa os limites; hot reload preserva o objeto. A correção usa o cache `academiaFailedLoginLimiterV2`: substitui uma única vez os contadores anteriores, que misturavam sucessos e falhas e não podem ser migrados com precisão. Não altera conta, senha, estado no banco ou cookies de sessão. Antes de produção: armazenamento compartilhado/atômico, IP/proxy confiável, política contra bloqueio abusivo e medições de custo/concorrência do bcrypt. Mensagens genéricas não significam que todo caminho de falha tenha tempo de resposta indistinguível.

## Interface

- Tema claro na primeira visita; alternância manual para escuro. Preferência persistida por `next-themes` na chave `academia-okajima-theme`; nenhum token/senha em localStorage.
- Logo existente com versões para os dois temas, fonte Geist e neutros. Cor principal definida: **`#BD2CAC` tanto no claro quanto no escuro**, com texto branco nos botões. Tokens compartilhados também aplicam a cor ao foco e à cor principal da sidebar; hover escurece levemente o roxo sem transparência para preservar contraste. Os arquivos dos logos não foram recoloridos.
- shadcn oficial, Base UI `base-nova`: componentes de formulário, mensagens, botões, separador e estado vazio. Tokens compartilhados em `app/globals.css`, cabeçalho/marca/tema reutilizáveis.
- Formulário com labels, autocomplete, erros anunciados, foco no campo inválido, mostrar/ocultar senha, envio por Enter e estado de envio. Senha incorreta é limpa do campo.
- Spinner do botão mantém o componente shadcn e a rotação padrão de 1s por volta. Com `prefers-reduced-motion: reduce`, o spinner fica estático e “Entrando…” informa o carregamento. A regra global de movimento reduzido limita as animações a uma execução, evitando que a duração reduzida de `0.01ms` acelere loops infinitos.
- “Lembre-se de mim” é opcional e começa desmarcado. Ao marcar/editar, salva somente o RCA ou e-mail neste navegador, na chave `academia-okajima:remembered-identifier:v1` de localStorage. Reabrir o login restaura o campo e a opção; desmarcar remove imediatamente o valor salvo sem apagar o campo atual. Não salva senha/token, não autentica automaticamente nem altera as 8h da sessão. Evitar em dispositivos compartilhados. Falhas de armazenamento não impedem o login; sem armazenamento disponível, a preferência não persiste.
- Início protegido mínimo, identificação da conta e botão Sair. Sem catálogo fictício, links de cadastro/recuperação, permissões administrativas ou login social.

## Verificar novamente

```powershell
npm test
npm run lint
npm run typecheck
npm run build

# Integração opt-in: Docker ativo, tabela users existente.
$env:AUTH_TEST_DATABASE = '1'
npm run test:db
Remove-Item Env:AUTH_TEST_DATABASE

# HTTP opt-in: app já rodando em http://localhost:3000.
$env:AUTH_TEST_HTTP = '1'
npm run test:http
Remove-Item Env:AUTH_TEST_HTTP
```

`npm test` não carrega `.env.local` nem acessa banco/rede. `test:db` e `test:http` são pulados sem a opção explícita. Os testes HTTP usam a conta fictícia existente, não a recriam; os cenários negativos consomem o limite agregado, portanto aguarde a janela antes de repetir várias vezes. Os oito logins corretos não consomem esse limite.

- Testes unitários: PHP `$2y$10$` (fixture pública sintética do Laravel), `$2b$12$`, salt, UTF-8, entrada original, hash inválido, RCA/email, regras de estado, ambiguidades, falha de repositório, limites/TTL, configuração local e cookies/redirects.
- Regressão do limite: 35 acessos válidos na mesma janela, falhas anteriores preservadas, limite agregado preservado, concorrência, indisponibilidade sem penalizar a conta, liberação idempotente, capacidade recuperada e resultados tardios sem alterar uma nova janela.
- Preferência de identificador: RCA com zeros iniciais, troca por e-mail, remoção isolada, valores vazios/excessivos e armazenamento bloqueado. No navegador: marcar → recarregar → campo restaurado e senha vazia; desmarcar → recarregar → campo vazio.
- Integração MySQL: usa cópia **TEMPORARY** do schema de `users` em conexão exclusiva para consultas/fixtures; não cria tabela permanente nem altera contas reais. Ao fechar a conexão ela desaparece. Fingerprint da tabela original antes/depois confirma preservação.
- HTTP: sessão criada por RCA/email, CSRF, contrato público mínimo, cookie 8h/reemissão, cookie inválido/expirado, segredo diferente, ID inexistente, update do cliente ignorado, cookie de outra aplicação ignorado, logout e POST direto limitado.
- Navegador: conferir `/` anônimo → `/login`, campos vazios, senha incorreta, mostrar/ocultar, Enter → início, recarregar mantendo sessão, tema persistente, Sair → `/login` e novo acesso direto recusado; desktop e celular.

Testes de desativação/remoção/2FA e indisponibilidade usam fixtures/repositório de teste: não desativam o admin nem derrubam o MySQL do desenvolvedor. Não houve teste com usuários reais, produção, múltiplas instâncias, outro navegador físico ou com o dashboard BEES rodando simultaneamente.

### Resultado da verificação desta entrega

- Passaram 15 testes unitários, 1 teste de integração MySQL e 1 teste HTTP com múltiplos cenários, além de lint, tipos e build.
- Navegador integrado: fluxo de login por teclado, senha incorreta, mostrar/ocultar, persistência de sessão, troca/persistência de tema e logout verificados sem erros relevantes no console. Larguras de 1280/1586 px e celulares de 390/320 px verificadas, sem rolagem horizontal.
- Referência visual comparada com a renderização: textos, formulário aberto centralizado, fundo branco, destaque magenta, ícones e uso dos logos existentes. Dimensões compactas de componentes/cabeçalho seguem o projeto. Conforme a referência posterior dos campos, as bordas no tema claro usam o token compartilhado `--input: #E2E8F0`, com 1 px e foco roxo preservado; o tema escuro permanece inalterado. Não foi uma reprodução pixel a pixel do mockup.
- Verificação dos 14 arquivos do bundle cliente de produção e do HTML de login não encontrou o segredo da sessão, credencial/URL do banco ou hash do admin. A resposta pública de sessão também foi verificada pelo teste HTTP.
- A base terminou com exatamente a mesma conta de desenvolvimento (`id = 1`), sem alteração de senha. Tabelas temporárias dos testes foram removidas automaticamente ao encerrar suas conexões.
- Foi corrigida uma incompatibilidade de requisições nesta versão do Next.js: o POST limitado agora reconstrói `NextRequest` por URL, método, headers e corpo explícitos; não passa o objeto de requisição já consumido ao construtor.

## Evolução da home

O início mínimo descrito nesta entrega foi substituído pelo esqueleto de navegação
documentado em [Home — estrutura inicial](home.md). A sessão e as regras de acesso
permanecem; o logout agora está no menu do usuário. A nova paleta compartilhada
substitui os valores anteriores de fundo, texto e borda. Os resultados acima são
o registro histórico da entrega do login.

## Próxima etapa

Definir conteúdo inicial e permissões do produto. Cadastro, recuperação, 2FA, autorização administrativa, migração de senhas legadas incompatíveis e requisitos de produção permanecem fora desta entrega. `admin = 1` no banco não concede sozinho nenhuma função administrativa no aplicativo novo.

Referências usadas: [Credentials/Auth.js](https://authjs.dev/getting-started/authentication/credentials), [tema Next.js/shadcn](https://ui.shadcn.com/docs/dark-mode/next), [dialeto MySQL/Kysely](https://kysely-org.github.io/kysely-apidoc/classes/MysqlDialect.html), [bcryptjs](https://github.com/dcodeIO/bcrypt.js), [fixture PHP sintética](https://github.com/laravel/laravel/blob/8.x/database/factories/UserFactory.php).
