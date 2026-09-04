# Home — catálogo inicial

## Escopo

Estrutura visual protegida pelo login existente. A primeira integração real lê as
categorias e o vídeo em destaque do MySQL local e consulta a API do Vimeo somente
no servidor para obter a capa. O player do destaque é carregado apenas após uma
ação explícita do usuário. Ainda não há listagens, contagem de visualizações,
rankings ou alteração do banco.

## Estrutura

- `app/(protected)/layout.tsx`: valida a sessão, mantém sua renovação e compõe `HomeShell`.
- `app/(protected)/page.tsx`: repete a proteção junto à página; interpreta os parâmetros de apresentação e carrega o catálogo inicial no servidor.
- `components/home/home-shell.tsx`: cabeçalho compacto de 60 px no desktop, logo, pesquisa centralizada e avatar com menu do usuário; sem botão externo de tema.
- `components/home/home-sidebar.tsx`: vídeos recentes, vídeos em alta, mais vistos, shorts; ajuda fixada ao rodapé.
- `components/home/home-search.tsx`: formulário GET local. A consulta altera a apresentação, mas ainda não pesquisa o catálogo.
- `components/home/user-menu.tsx`: avatar, nome e RCA da sessão, configurações desabilitadas, seletor de tema antes de Sair e logout existente via NextAuth. Usa Popover do shadcn para acomodar ações e controles com navegação por Tab.
- `components/theme-selector.tsx`: Toggle Group do shadcn em cápsula compacta de 96 × 32 px, na mesma linha de "Tema", com três ícones Tabler (Claro, Escuro e Sistema). Botões de 28 px e indicador circular magenta que desliza em 320 ms. A pedido, o deslizamento deste controle continua habilitado com movimento reduzido, em versão breve de 180 ms, sem alterar as demais regras de acessibilidade da página. Nomes acessíveis e identificação ao passar o mouse; seleção única preservada.
- `components/home/category-filter.tsx`: faixa horizontal de categorias, com aparência próxima aos filtros do YouTube e navegação por URL.
- `components/home/featured-video.tsx`: hero responsivo com capa, título, descrição e player Vimeo sob demanda.
- `components/home/home-content.tsx`: compõe categorias e destaque na seção inicial; mantém os estados explicativos das demais seções.
- `lib/home/catalog.ts`: consulta `langs` e `videos`, valida a categoria e interpreta os dois formatos Vimeo encontrados no legado.
- `lib/vimeo/videos.ts`: consulta autenticada à API Vimeo no servidor, valida a resposta e só aceita capas HTTPS do CDN oficial.
- `lib/home/navigation.ts`: destinos permitidos, textos e normalização da pesquisa.

## Comportamentos

- Desktop: sidebar de 240 px, recolhível para 72 px com ícones e tooltips; botão do cabeçalho e atalho Ctrl/Cmd+B.
- Celular, abaixo de 768 px: menu em Sheet sobre o conteúdo, com título acessível, fechamento por botão/Escape/overlay. A escolha de um destino fecha o menu.
- Abaixo de 768 px, a pesquisa começa como botão de lupa de 32 px, do mesmo tamanho visual do avatar. Ao abrir, o campo aparece em uma faixa abaixo da linha de 60 px do topo, mantendo logo, menu, lupa e avatar visíveis. Tocar novamente na lupa ou pressionar Escape fecha o campo e devolve o foco ao botão; o texto digitado é preservado ao reabrir. No desktop o campo permanece visível; voltar ao tamanho móvel recolhe a pesquisa novamente.
- Menu lateral e avatar no topo têm hover circular visível nos dois temas; a lupa também realça ao passar o mouse. O botão de pesquisa fica contido no contorno arredondado do campo, sem a margem negativa padrão do addon.
- Links utilizam `/?secao=em-alta`, `/?secao=mais-vistos`, `/?secao=shorts` e `/?secao=ajuda`. Recentes é `/`. Destinos inválidos voltam para recentes.
- Categorias são lidas de `langs` com `type = 'category'`; “Outro” representa o `category_id = 0`. “Tudo” é uma opção local, não uma categoria persistida.
- O filtro usa `/?categoria=<id>`. IDs ausentes ou desconhecidos voltam para “Tudo”; a consulta SQL recebe somente IDs presentes na lista carregada.
- O destaque segue os critérios úteis do legado: `featured` tem prioridade, seguido do conteúdo mais recente; exige vídeo aprovado, público, não convertido com erro, não live, não filme e não short. Ao filtrar uma categoria sem destaque próprio, o vídeo mais recente dela ocupa o hero.
- O ID Vimeo pode vir de `videos.vimeo` ou do `video_location` URL-encoded legado. O token `VIMEO_ACCESS_TOKEN` nunca é enviado ao cliente.
- A capa do Vimeo é armazenada em cache por uma hora. A URL é normalizada sem query string e `next/image` permite exclusivamente `https://i.vimeocdn.com/video/**`.
- Ao selecionar “Assistir”, o player oficial é aberto dentro do hero. Vídeos ainda restritos ao antigo `upload/` exibem a reprodução como indisponível para esta etapa.
- Busca usa `/?q=...`, com trim e limite de 120 caracteres; o texto é renderizado pelo React, nunca como HTML. Não há histórico salvo ou requisição ao Vimeo.
- Estado de recolhimento fica em memória enquanto o layout está montado; recarregar a página volta ao menu expandido. O cookie genérico do componente original não é gravado.
- Configurações é apenas uma posição reservada. O botão Sair encerra a sessão e volta ao login.
- Tema: Claro continua sendo o padrão inicial. A preferência é salva pelo `next-themes` na mesma chave `academia-okajima-theme`; Sistema acompanha `prefers-color-scheme` do dispositivo. Trocar de tema não fecha o menu, e clicar na opção ativa não remove a seleção. O controle binário da tela de login foi preservado.
- Ícones novos usam `@tabler/icons-react`; ícones antigos não relacionados não foram migrados.

## Paleta compartilhada

Os tokens ficam em `app/globals.css` e também são utilizados no login.

| Papel | Cor |
| --- | --- |
| Principal, nos dois temas | `#BD2CAC` |
| Texto sobre principal | `#FFFFFF` |
| Fundo claro | `#FFFFFF` |
| Fundo suave | `#F8FAFC` |
| Superfície secundária | `#F1F5F9` |
| Bordas e inputs claros | `#E2E8F0` |
| Texto escuro | `#0F172A` |
| Fundo escuro | `#020617` |
| Sucesso | `#348352` |
| Alerta | `#E77828` |
| Erro | `#E63535` |
| Informação | `#0DA6F2` |

No escuro, superfícies usam `#0F172A`, texto `#F8FAFC` e bordas derivadas
da paleta para não manter bordas claras intensas. Texto secundário usa `#475569`
no claro e `#CBD5E1` no escuro. As cores de estado estão disponíveis como tokens;
seu uso futuro deve verificar contraste, sem comunicar estados apenas por cor.

## Próximas etapas

1. Definir as opções reais de configurações e ajuda.
2. Listar vídeos recentes e demais trilhos usando o catálogo local.
3. Implementar pesquisa real e tratamento completo de privacidade por domínio no Vimeo.
4. Definir regras e fontes dos rankings de vídeos em alta/mais vistos e de Shorts.

O acesso de produção continua fora do escopo: as limitações de autenticação e
infraestrutura em `docs/login-local.md` e `docs/plano-autenticacao.md` permanecem.

## Verificação

`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
No navegador: login, troca de seção, recolher/expandir, tooltips, pesquisa,
menu da conta, tema, navegação móvel e logout. Não é teste de reprodução Vimeo.
