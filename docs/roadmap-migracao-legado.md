# Roadmap de caminhos e migração do legado

## Objetivo

Este documento registra como as URLs e os fluxos principais funcionavam na
Academia antiga e propõe a ordem de implementação na aplicação Next.js. O foco
é a academia de vídeos autenticada. Recursos genéricos da plataforma antiga,
como anúncios, carteira, afiliados e rede social, não devem ser copiados sem uma
necessidade de negócio explícita.

O levantamento foi feito por análise estática do projeto PHP em
`C:\Users\Okajima\Documents\academia-okajima-old`, especialmente `.htaccess`,
`index.php`, `api.php`, `sources/`, os templates do tema e o esquema legado.
Logs de produção ainda serão necessários antes do corte definitivo para provar
quais URLs continuam recebendo acessos externos.

## Como os caminhos funcionavam no projeto antigo

O Apache recebia a URL amigável e o `.htaccess` a convertia em parâmetros PHP.
Quase todas as páginas passavam por um único arquivo:

```text
/videos/latest
    -> .htaccess
    -> index.php?link1=videos&page=latest
    -> sources/videos/content.php
    -> themes/youplay/layout/videos/*
```

O `index.php` usava `link1` como nome da pasta em `sources/` e carregava
dinamicamente `sources/<link1>/content.php`. A autenticação e a autorização não
ficavam centralizadas: cada página verificava `IS_LOGGED`, `PT_IsAdmin()` e
outras regras por conta própria.

Havia quatro entradas paralelas:

| Entrada antiga | Responsabilidade |
| --- | --- |
| `index.php?link1=...` | Páginas HTML e navegação principal |
| `ajax.php?type=...` por meio de `/aj/...` | Ações assíncronas dos templates |
| `api.php?v=1.0&type=...` | API separada para o aplicativo móvel |
| `admincp.php?page=...` por meio de `/admin-cp/...` | Painel administrativo |

Arquivos e diretórios físicos eram ignorados pelo redirecionamento do Apache.
Por isso, conteúdos em `upload/` podiam ser servidos diretamente pelo servidor,
enquanto vídeos Vimeo eram identificados por `videos.vimeo` ou por uma URL
gravada em `videos.video_location`.

Na nova aplicação não devemos reproduzir esse despachante. O equivalente será:

- páginas no App Router para navegação;
- um layout protegido compartilhado e validação de sessão também junto aos
  dados sensíveis;
- Server Components para leituras;
- Server Actions ou Route Handlers somente para mutações e integrações;
- autorização do recurso no servidor, não apenas ocultação na interface;
- Vimeo como fonte de reprodução e capa, sem expor o token no navegador.

## Regras de catálogo encontradas no legado

As listagens principais filtravam vídeos públicos, aprovados, não live, não
filmes e não shorts. Também excluíam autores bloqueados. As diferenças eram:

| Seção | Regra antiga |
| --- | --- |
| Destaque da home | Um vídeo com `featured = 1`, escolhido aleatoriamente; se não existisse, o mais recente |
| Recentes | Ordem decrescente de `videos.id` |
| Em alta | Publicado nas últimas 48 horas, com visualizações, ordenado por `videos.views` |
| Mais vistos — geral | Ordem decrescente de `videos.views` |
| Mais vistos — período | Eventos da tabela `views`, agrupados por vídeo entre o início e o fim do período |
| Categoria | `category_id` igual ao selecionado, em ordem decrescente de ID |
| Shorts | `is_short = 1`; o legado carregava pequenos lotes aleatórios e navegava para frente e para trás |
| Pesquisa | Título, tags e descrição dos vídeos; também pesquisava usuários por RCA ou nome |

A nova home já tornou o destaque determinístico: prioriza `featured` e depois
ordena por data/ID. Isso evita que o hero mude aleatoriamente a cada acesso.

## Mapa de URLs

### Catálogo e reprodução

| Caminho antigo | Situação atual | Caminho de destino recomendado |
| --- | --- | --- |
| `/` | Home protegida implementada | `/` |
| `/videos/latest` | Conteúdo recente existe apenas no trilho da home | `/videos/recentes` |
| `/videos/trending` | Placeholder `/?secao=em-alta` | `/videos/em-alta` |
| `/videos/top?type=...` | Placeholder `/?secao=mais-vistos` | `/videos/mais-vistos?periodo=...`, com geral, hoje, semana, mês ou ano |
| `/videos/category/:id` | Filtro funcional em `/?categoria=:id` | Manter `/?categoria=:id` na home e aceitar `/videos/categoria/:id` nas listagens completas |
| `/shorts` e `/shorts/:id` | Placeholder `/?secao=shorts` | `/shorts` e `/shorts/[publicId]` |
| `/search?keyword=...` | Campo preparado em `/?q=...`, sem consulta | `/pesquisa?q=...` |
| `/watch/:slug` | Ainda não existe página de reprodução | `/videos/[publicId]` |
| `/v/:shortId` | Redirecionava para a URL canônica do vídeo | Redirecionamento de compatibilidade para `/videos/[publicId]` |
| `/embed/:id` | Não implementado | Não recriar inicialmente; usar o player Vimeo somente dentro da página autorizada |

`publicId` deve usar `videos.video_id`, não a chave numérica `videos.id`. A chave
numérica continua interna ao banco; o identificador público é mais apropriado
para URLs e permite preservar links durante importações.

### Biblioteca do usuário

| Caminho antigo | Dados existentes | Destino futuro |
| --- | --- | --- |
| `/history` | `history` | `/minha-conta/historico` |
| `/liked-videos` | `likes_dislikes` com `type = 1` | `/minha-conta/curtidos`, somente se curtidas entrarem no produto |
| `/saved-videos` e lista `wl` | `saved_videos` e `watch_later` | Unificar como `/minha-conta/salvos` depois de decidir qual tabela prevalece |
| listas em `/watch/.../list/:id` | `lists` e `play_list` | `/listas/[id]`, etapa posterior |

### Gestão de conteúdo

| Caminho antigo | Destino recomendado |
| --- | --- |
| `/upload-video` e `/import-video` | `/admin/videos/novo` |
| `/video_studio` e `/manage-videos` | `/admin/videos` |
| `/edit-video/:id` | `/admin/videos/[id]/editar` |
| `/view_analytics/:id` | `/admin/videos/[id]/metricas` |
| `/admin-cp/...` | `/admin/...`, dividido por domínio e protegido por papel |

### Novos caminhos

- `/arquivos` não tem equivalente funcional no legado. É uma capacidade nova e
  precisa de modelo de dados, armazenamento, permissão e auditoria próprios.
- `/ajuda` deve substituir a dispersão antiga entre contato, páginas estáticas e
  suporte. Pode começar como conteúdo editorial e canais de atendimento.

## Estado atual da nova aplicação

- `/login` autentica por RCA ou e-mail.
- `/` exige sessão no servidor e já carrega categorias, destaque e vídeos
  recentes do MySQL.
- Categorias usam `/?categoria=<id>`.
- A navegação provisória usa `/?secao=recentes|em-alta|mais-vistos|shorts|arquivos|ajuda`.
- A busca usa `/?q=...`, mas ainda não consulta o catálogo.
- Capas e player dos vídeos Vimeo vêm da integração no servidor.
- Vídeos cuja mídia existe apenas no antigo `upload/` ainda não são reproduzidos.
- Não existem ainda páginas canônicas de vídeo, rankings funcionais, histórico,
  administração, arquivos ou ajuda.

Os parâmetros `secao` são adequados como esqueleto, mas as áreas com paginação,
metadados e estado próprio devem ganhar páginas reais. Após cada página real ser
entregue, o item correspondente da sidebar deixa de apontar para `/?secao=...`.

## Roadmap por fases

### Fase 0 — Inventário e decisões de compatibilidade

Objetivo: impedir perda de links e descobrir o tamanho real da migração.

- inventariar no banco quantos vídeos são Vimeo, locais em `upload/`, externos,
  shorts, privados, reprovados e com mídia ausente;
- localizar IDs Vimeo inválidos, duplicados ou sem permissão para o novo app;
- extrair dos logs de produção as URLs antigas ainda acessadas;
- decidir se a nova academia será sempre autenticada, inclusive para links
  compartilhados e páginas de vídeo;
- congelar uma tabela de redirecionamentos antigos → novos;
- definir o que significa uma visualização válida e quando ela será registrada.

Critério de conclusão: relatório de inventário conferido, política de acesso
decidida e mapa de redirecionamentos aprovado.

### Fase 1 — Fechar o catálogo da home

Objetivo: transformar os placeholders atuais em listagens navegáveis.

- implementar pesquisa real de vídeos por título, descrição e tags;
- não pesquisar usuários/RCA na primeira versão, evitando expor um diretório de
  pessoas sem uma necessidade definida;
- criar `/videos/recentes`, com paginação por cursor e filtros de categoria;
- criar `/videos/em-alta` com a regra legada de 48 horas como primeira versão;
- criar `/videos/mais-vistos` e o seletor de período;
- manter a mesma regra de elegibilidade em todas as consultas;
- adicionar estados de carregamento, vazio, falha e mídia indisponível;
- trocar os links provisórios da sidebar pelos caminhos canônicos.

Critério de conclusão: cada item de vídeos abre uma URL própria, filtros podem ser
compartilhados, resultados não vazam conteúdo sem acesso e paginação não repete
nem omite itens.

### Fase 2 — Página de vídeo e reprodução

Objetivo: ter um destino único para qualquer card ou destaque.

- criar `/videos/[publicId]` usando `videos.video_id`;
- carregar metadados no servidor e validar sessão, aprovação e visibilidade;
- abrir o player Vimeo apenas para vídeos autorizados;
- mostrar título, categoria, duração, descrição e vídeos relacionados;
- registrar início/progresso/conclusão de forma idempotente;
- decidir se a tabela `history` será preservada ou substituída por um modelo com
  progresso em segundos e data da última reprodução;
- criar redirecionamentos para `/watch/:slug` e `/v/:shortId` depois de validar a
  extração dos identificadores antigos.

Critério de conclusão: qualquer card chega à página correta, acesso direto sem
sessão é bloqueado e atualizar a página não multiplica visualizações.

### Fase 3 — Métricas confiáveis

Objetivo: sustentar “Em alta”, “Mais vistos” e histórico com dados auditáveis.

- manter temporariamente `videos.views` para o ranking histórico;
- validar e importar os eventos existentes de `views`;
- criar uma regra anti-duplicação por usuário/sessão e janela de tempo;
- registrar eventos com timestamp para rankings por período;
- calcular “Em alta” por janela móvel; começar com 48 horas para compatibilidade
  e ajustar depois com dados reais;
- documentar fuso horário, virada dos períodos e política para administradores.

Critério de conclusão: rankings são reproduzíveis por consulta, têm testes de
limite de período e não dependem apenas de um contador que pode divergir.

### Fase 4 — Shorts

Objetivo: entregar a experiência vertical sem reaproveitar o AJAX fragmentado.

- criar `/shorts` e `/shorts/[publicId]`;
- consultar somente vídeos aprovados com `is_short = 1`;
- usar paginação por cursor em vez de `RAND()` para evitar repetições;
- carregar próximo e anterior, preservando URL e histórico do navegador;
- adaptar controles, foco, teclado, toque e reprodução automática para mobile;
- reutilizar autorização e registro de progresso da página de vídeo.

Critério de conclusão: navegação funciona nos dois sentidos, não repete itens no
mesmo lote e respeita movimento reduzido, foco e política de reprodução do browser.

### Fase 5 — Migração das mídias locais para Vimeo

Objetivo: retirar a dependência de `./upload` sem perder vídeos.

- classificar cada registro pela fonte real da mídia;
- criar uma fila idempotente com estados `pendente`, `enviando`, `processando`,
  `verificado`, `falhou` e `migrado`;
- calcular hash/tamanho antes do envio para detectar duplicatas;
- enviar ao Vimeo com título, descrição, privacidade e pasta definidos;
- aguardar o processamento e validar duração, reprodução e thumbnail;
- gravar o novo ID Vimeo somente depois da validação;
- registrar origem, destino, tentativas e erro para auditoria;
- manter backup e arquivo local durante uma janela de retenção; não excluir em
  lote na mesma operação que migra;
- migrar primeiro um lote piloto, depois lotes pequenos e retomáveis.

Critério de conclusão: relatório 1:1 entre registros e mídias, nenhum item
marcado como migrado sem reprodução validada e procedimento de retomada testado.

### Fase 6 — Arquivos e ajuda

Objetivo: completar os dois destinos que não pertencem ao catálogo de vídeos.

- definir tipos aceitos, limite, versão, categoria e vínculo opcional com vídeo;
- escolher armazenamento privado e gerar downloads temporários autorizados;
- registrar quem publicou, baixou, substituiu ou removeu um arquivo;
- implementar `/arquivos` com pesquisa e filtros;
- implementar `/ajuda` com perguntas frequentes e canais de atendimento;
- garantir que arquivos não sejam servidos por uma pasta pública semelhante ao
  antigo `upload/`.

Critério de conclusão: acesso direto ao objeto sem autorização falha, downloads
autorizados expiram e conteúdo de ajuda pode ser mantido sem alterar a home.

### Fase 7 — Administração

Objetivo: permitir operação diária sem alterar o banco manualmente.

- criar papéis e permissões explícitos para administrador e editor;
- gerir vídeos, categorias, destaque, visibilidade e thumbnails;
- enviar novos vídeos diretamente ao Vimeo;
- acompanhar processamento e migração;
- consultar métricas e auditoria;
- validar permissão em cada leitura e mutação no servidor.

Critério de conclusão: um editor executa o fluxo publicar → revisar → destacar;
um usuário comum não acessa nem chama as operações administrativas.

### Fase 8 — Compatibilidade e corte

Objetivo: trocar a aplicação sem quebrar acessos válidos.

- aplicar redirecionamentos permanentes apenas para páginas públicas e estáveis;
- para conteúdo protegido, redirecionar ao login preservando um retorno seguro;
- monitorar 404, falhas do Vimeo, latência e erros de autorização;
- manter backup do banco e das mídias antes do corte;
- colocar o PHP antigo em somente leitura antes de desligá-lo;
- remover endpoints antigos de mutação e credenciais apenas após a estabilização;
- revisar logs após 7, 30 e 90 dias antes de eliminar compatibilidade residual.

Critério de conclusão: rotas principais não geram 404 inesperado, não há novas
gravações no legado e existe um procedimento testado de rollback.

## Ordem recomendada de execução

```text
Inventário
  -> catálogo completo
  -> página de vídeo
  -> métricas
  -> shorts
  -> migração das mídias locais
  -> arquivos e ajuda
  -> administração
  -> corte e redirecionamentos
```

A página de vídeo vem antes da migração em massa porque fornece o ponto único de
validação. Assim, o lote piloto pode ser testado na mesma experiência que irá
para produção.

## Recursos do legado que não entram automaticamente

Estão fora do roadmap inicial: artigos, posts, mensagens, comentários sociais,
canais públicos, anúncios, carteira, pagamentos, assinaturas Pro, afiliados,
aplicativos OAuth, filmes, lives, vídeos de estoque e API móvel. As tabelas podem
continuar no dump para referência, mas isso não transforma esses recursos em
requisitos da nova Academia.

## Decisões que precisam ser fechadas antes das fases correspondentes

1. A página `/videos/[publicId]` exige login em todos os casos?
2. “Em alta” mantém 48 horas ou usará 7 dias/uma fórmula com aceleração de views?
3. Curtidos, salvos e listas farão parte da primeira versão do usuário?
4. Quais tipos de documento entram em `/arquivos` e quem pode publicá-los?
5. O Vimeo será a única fonte permitida após a migração?
6. Por quanto tempo os arquivos locais serão retidos depois da validação?
7. Algum aplicativo externo ainda consome `/api/v1.0` ou URLs `/embed`?
