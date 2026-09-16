# TanStack Query no projeto

Este documento orienta a adoção incremental do `@tanstack/react-query` na
Academia Okajima. A infraestrutura é global, mas a migração acontece por
domínio e somente onde existe estado remoto interativo. O Studio é a prioridade
inicial.

Versão de referência atual: `@tanstack/react-query` 5.102.8.

## Responsabilidades

Use TanStack Query para dados remotos que precisam de cache no navegador,
revalidação, polling, invalidação após mutations ou compartilhamento entre
componentes clientes.

Não use TanStack Query como substituto automático para:

- leituras exclusivas de Server Components;
- estado local de formulário ou de apresentação;
- transporte de arquivos pelo TUS;
- `sendBeacon` e eventos de telemetria ligados ao ciclo de vida da página;
- webhooks, crons ou outros processos executados apenas no servidor.

O banco e as APIs continuam sendo a fonte da verdade. O cache do Query nunca é
uma autorização, persistência ou garantia de que uma mutation foi concluída.

## Estrutura adotada

- `components/providers/query-provider.tsx`: provider único da aplicação.
- `lib/query/client.ts`: políticas padrão do `QueryClient`.
- `lib/query/http.ts`: cliente HTTP e normalização de erros das APIs internas.
- `lib/query/keys.ts`: catálogo hierárquico de query keys.
- `hooks/queries/`: hooks de queries e mutations separados por domínio.
- `lib/<dominio>/<recurso>/contracts.ts`: contratos serializáveis compartilhados
  entre API, Server Component e cliente.

Componentes de UI não devem montar URLs, interpretar respostas HTTP ou definir
query keys diretamente. Essas responsabilidades pertencem ao hook do domínio.

## Query keys

Todas as chaves devem sair de `queryKeys`. Organize do geral para o específico,
permitindo invalidar um domínio, recurso ou registro:

```ts
queryKeys.studio.all
queryKeys.studio.content.all
queryKeys.studio.content.page(type, page)
```

- Inclua todos os parâmetros que alteram o resultado da consulta.
- Use valores serializáveis e estáveis.
- Não use texto solto de query key dentro dos componentes.
- A query key organiza o cache, mas não substitui validação de sessão e
  autorização na API.

## Server Components e hidratação

Mantenha leituras iniciais críticas no servidor quando isso evitar estados de
carregamento e proteger acesso ao banco ou a credenciais. Passe o resultado
serializável ao hook como `initialData` quando houver apenas uma query simples.

Adote `prefetchQuery`, `dehydrate` e `HydrationBoundary` quando uma rota tiver
múltiplas queries clientes, navegação que se beneficie de prefetch ou risco de
waterfall. O `QueryClient` do navegador deve ser criado uma única vez por ciclo
do provider e nunca em escopo global compartilhado entre usuários.

Não importe módulos `server-only`, banco, SDKs privados ou variáveis secretas em
Client Components. Separe contratos e transformações puras em arquivos seguros
para ambos os ambientes.

## Queries

- Crie hooks nomeados, como `useStudioContent`, dentro de `hooks/queries`.
- Use `apiRequest` para APIs JSON internas.
- Defina `enabled` para consultas que dependem de parâmetros válidos.
- Sobrescreva `staleTime`, retries ou polling somente quando o domínio exigir.
- Polling deve ter condição explícita de parada; não mantenha intervalos depois
  de estados finais.
- Preserve os dados anteriores apenas quando isso não apresentar informação
  incorreta para os novos parâmetros.
- Trate loading, erro, vazio e atualização em segundo plano conforme o impacto
  da tela.

## Mutations

- Encapsule mutations no hook do domínio.
- Invalide a menor família de query keys que represente os dados alterados.
- Retorne ou aguarde a Promise de invalidação quando a UI precisar permanecer
  pendente até a sincronização.
- Use atualização otimista somente quando o ganho de interação compensar a
  complexidade.
- Antes de atualizar o cache de forma otimista, cancele refetches concorrentes,
  guarde snapshots e restaure-os em `onError`.
- Mutations destrutivas devem continuar protegidas por confirmação na UI e ser
  idempotentes no servidor quando houver possibilidade de repetição.

## Migração incremental

Antes de migrar um fluxo:

1. Identifique a fonte da verdade e os consumidores do dado.
2. Separe o contrato serializável da implementação `server-only`.
3. Adicione a família de query keys do domínio.
4. Crie a API interna somente se o cliente realmente precisar reconsultar.
5. Implemente o hook de query ou mutation.
6. Remova do componente o `fetch`, cache manual e efeitos substituídos.
7. Teste invalidação, concorrência, rollback, polling e mudança de parâmetros.
8. Valide TypeScript, Biome, testes e build de produção.

Não migre arquivos adjacentes apenas para uniformizar. Uma área pode continuar
usando Server Actions, Server Components ou chamadas imperativas quando essas
opções modelarem melhor o comportamento.

## Implementação inicial

`/studio/conteudo` é o primeiro consumidor. A listagem usa dados iniciais do
Server Component, polling apenas durante `uploading` ou `processing`, progresso
local do TUS e mutation otimista para cancelamento. Porcentagem e tempo restante
não são persistidos.

## Referências oficiais

- [Visão geral do TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Server rendering e hidratação](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [Advanced Server Rendering](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- [Query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [Invalidação de queries](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
- [Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [Atualizações otimistas](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
