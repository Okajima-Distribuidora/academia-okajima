# Tempo de exibição por vídeo

## Implementado

O player de aulas envia reprodução observada ao endpoint autenticado
`POST /api/home/watch-time`. O progresso da aula e as visualizações continuam
independentes. Previews, autoplay da vitrine e vídeos fora do player de aulas
não geram tempo por este mecanismo.

O tempo é medido com `performance.now()`, corroborado pelo avanço da posição
do Vimeo e pela velocidade. Pausa, buffering, busca, aba oculta e saltos longos
de eventos não contam. Reassistir conta novamente; um minuto real em 2x conta
como um minuto. A precisão depende dos eventos do player (aproximadamente
250 ms); isso mede reprodução, não comprova atenção humana.

O cliente abre uma sessão apenas quando há reprodução. Envia um snapshot
cumulativo a cada 30 segundos e no encerramento/pausa. Cada snapshot contém os
acumulados horários de toda a sessão e uma sequência crescente. Hora é UTC;
o dia é calculado em America/Sao_Paulo. Intervalos que atravessam a hora são
divididos. O relógio do cliente é ancorado na hora retornada pelo servidor.

## Persistência e invariantes

Migration: `20260922000000_add_video_watch_time`, compatível com MySQL 5.7.

| Tabela | Chave | Conteúdo |
| --- | --- | --- |
| academy_video_watch_sessions | UUID | Usuário, vídeo, estado, início/último contato/expiração/fim, sequência e acumulados aceitos |
| academy_video_watch_hourly | usuário + vídeo + hora UTC | Milissegundos acumulados na hora |
| academy_video_watch_daily | usuário + vídeo + dia de São Paulo | Milissegundos acumulados no dia |

Todas as identidades de vídeo usam `videos.id`, não o ID Vimeo. Não há
cascade de exclusão: os IDs escalares são validados na entrada e preservados
para auditoria, inclusive após exclusão lógica. Não apagar essas tabelas para
remover um vídeo. Índices cobrem vídeo/período, usuário/período e período global.

O servidor bloqueia a linha do usuário antes de abrir/atualizar uma sessão.
Só uma sessão ativa contabiliza por usuário, mesmo em vídeos ou abas distintos.
Uma segunda recebe 409 e tenta novamente após 30 segundos. Após dois minutos
sem contato, a sessão perde a validade; ao abrir outra, a antiga é marcada
expirada. Cada sessão também expira em 24 horas. Esses são controles de validade
durante requisições, não rotinas de limpeza.

Dentro de uma transação: validar dono, estado, sequência e limites temporais;
calcular diferenças positivas dos buckets; incrementar hora e dia; atualizar
sessão. Uma falha reverte tudo. Retries antigos/repetidos não incrementam nada.
Não é permitido diminuir/remover buckets já aceitos nem informar mais tempo
que o decorrido. Uma sessão ausente/expirada não é recriada por um checkpoint.
O start usa UUID estável para tornar sua própria repetição idempotente.

Falhas curtas são recuperadas pelo próximo snapshot cumulativo em memória.
Se a conexão ficar indisponível por mais de dois minutos, o saldo não confirmado
da sessão expirada é perdido. Fechamento forçado do navegador também pode
perder o último saldo: beacon/keepalive são best effort. Não há fila persistente
offline nem promessa de medição exata de reproduções sem conexão.

## Consultas e Studio

`getWatchTimeReport` aceita filtros combináveis `videoId`, `userId`,
`subcategoryId`, `categoryId`, e períodos `all`, `24h`, `7d`, `28d`.

Endpoint de auditoria (somente administradores):

```text
GET /api/studio/watch-time?period=24h&videoId=123
GET /api/studio/watch-time?period=7d&subcategoryId=10
GET /api/studio/watch-time?period=28d&categoryId=6
GET /api/studio/watch-time?period=all&userId=42
GET /api/studio/watch-time?period=all
```

A resposta inclui milissegundos/horas, total por vídeo, início/fim e precisão.
Os períodos recentes usam 24/168/672 **horas fechadas**. Às 14h35, o fim é
14h00, excluindo a hora parcial. `all` usa exclusivamente o diário e inclui
os últimos envios aceitos; hora e dia nunca são somados entre si.

As categorias usam a classificação atual, indicada na resposta. `IN` evita
duplicar vídeos em múltiplas subcategorias. A academia soma os registros-base,
nunca os totais de categorias. Sem filtro de categoria/publicação, o relatório
preserva inclusive IDs cujos vídeos foram removidos. Com categoria, a seleção
depende dos vínculos atuais; não é uma reconstrução da categoria histórica.

Dashboard e categoria exibem o tempo dos vídeos públicos, aprovados, prontos,
não excluídos, não shorts, não filmes e não lives. A API de auditoria não aplica
esse filtro de publicação, para permitir reconciliação de histórico removido.
O gráfico de tempo do dashboard usa os totais diários reais, preenchendo dias
sem consumo com zero. A categoria mantém somente o gráfico de visualizações.

## Legado

Não foi importado tempo de `video_progresso`, `video_time` ou posições de
`academy_video_progress`. O PHP antigo gravava posição em marcos de 25%,
sobrescrevia valores e podia zerar segundos na conclusão. Esses valores não
são tempo real. Todos os dados legados permanecem intactos. Os novos totais
começam após a implantação da medição; zero não significa ausência de consumo
antes dela. Importação de progresso legado é um trabalho separado.

## Instalação e verificação

Aplicar a migration antes de disponibilizar o código. No banco local desta
implementação, somente esta migration foi executada e registrada como aplicada;
baseline/seed antigos pendentes não foram executados. Em outros ambientes,
revisar o status de migrations antes do deploy, sem executar indiscriminadamente
migrations antigas sobre dados existentes.

```text
npm run test:watch-time
npm run test:watch-time:db
npm run typecheck
npx prisma validate
```

O teste de banco usa tabelas TEMPORARY em conexão dedicada, com os mesmos nomes
das tabelas reais, sem gravar nos dados existentes. Cobre retries concorrentes,
rollback após falha parcial, dono da sessão, sessão expirada, virada de hora/dia,
filtros, deduplicação de categoria e preservação após exclusão lógica.

## Retenção

**Nenhuma rotina de exclusão está implementada ou agendada.** Sessões e resumos
permanecem armazenados. O plano de retenção, reconciliação e limpeza por lotes
está em [Updates futuros](./updates-futuros.md).
