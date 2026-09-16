<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Alterações de interface — obrigatório

Antes de criar, modificar ou revisar UI, componentes, estilos,
layouts, formulários ou responsividade:

1. Leia integralmente `.agents/skills/shadcn/SKILL.md`.
2. Leia os arquivos de referência indicados pela skill que
   forem relevantes para a alteração.
3. Confira `components.json` e os componentes existentes.
4. Consulte a documentação dos componentes envolvidos,
   conforme as instruções da skill.
5. Preserve a direção visual da academia: referências de
   streaming e YouTube, com identidade própria.
6. Informe brevemente qual skill está usando antes de editar.

Use a skill `migrate-radix-to-base` somente quando houver
uma migração de Radix para Base UI no escopo do pedido.

Se uma skill necessária estiver ausente ou ilegível,
informe o problema; não prossiga como se tivesse consultado.

## Ícones — preferência do projeto

- Use prioritariamente [Tabler Icons](https://tabler.io/icons).
- Use Lucide somente quando não houver um ícone adequado no Tabler.
- Essa preferência se aplica às próximas criações e alterações de UI,
  mesmo que componentes existentes ou `components.json` ainda usem Lucide.
- Não migre ícones não relacionados ao pedido apenas para uniformizar
  a biblioteca; preserve o escopo da alteração.

## Persistência de dados — obrigatório

Antes de criar ou modificar schemas, migrations, consultas, comandos ou regras
de persistência:

1. Leia integralmente `.agents/skills/database-persistence/SKILL.md`.
2. Inspecione o schema, as migrations e a camada de acesso existentes.
3. Modele estados, transições, timestamps, constraints e índices de forma
   explícita e proporcional ao valor operacional dos dados.
4. Preserve compatibilidade com dados legados e não descarte histórico sem uma
   decisão explícita do produto.
5. Valide migrations e cubra transições críticas, idempotência e falhas parciais.

Informe brevemente que está usando a skill antes de editar persistência.

## TanStack Query — adoção incremental

Antes de criar, modificar ou migrar queries, mutations, cache cliente, polling
ou invalidação com `@tanstack/react-query`:

1. Leia integralmente `docs/tanstack-query.md`.
2. Preserve Server Components para leituras que não precisam de estado remoto
   interativo no navegador.
3. Use a infraestrutura compartilhada em `lib/query` e hooks por domínio em
   `hooks/queries`; não declare query keys ou tratamento HTTP dentro da UI.
4. Separe contratos serializáveis de módulos `server-only`.
5. Migre de forma incremental, começando pelo Studio, sem alterar fluxos
   adjacentes apenas para uniformizar.
6. Valide invalidação, polling, concorrência e rollback conforme o risco da
   operação.

Informe brevemente que está seguindo o guia antes de editar integrações com
TanStack Query.
