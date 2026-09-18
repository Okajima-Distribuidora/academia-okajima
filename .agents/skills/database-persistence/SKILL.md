---
name: database-persistence
description: Planeja, implementa e revisa persistência, schemas, migrations e transições de estado no banco da Academia Okajima.
---

# Persistência de dados

Use esta skill sempre que o trabalho alterar schema, migration, consulta,
comando, relacionamento ou ciclo de vida persistido.

## Princípios

- Comece pelo modelo de domínio e pela fonte da verdade. Separe estado atual,
  histórico operacional e auditoria apenas quando cada um tiver valor real.
- Inspecione schema, migrations e acessos existentes antes de escolher nomes,
  tipos ou abstrações. Preserve contratos e dados legados.
- Prefira tipos, constraints, chaves estrangeiras e índices que tornem estados
  inválidos difíceis de representar. Documente invariantes que o banco não
  consiga expressar.
- Use timestamps semânticos para eventos relevantes; não derive auditoria de
  campos genéricos quando a data do evento precisa ser preservada.
- Modele transições finitas e valide o estado anterior no comando de atualização.
  Operações repetidas devem ser idempotentes quando houver retries, callbacks ou
  integrações externas.
- Use transações para mudanças locais atômicas. Integrações externas não fazem
  parte da transação do banco: defina ordem, compensação e comportamento de retry
  para falhas parciais.
- Não persista payloads, erros transitórios ou duplicações sem uso operacional.
  Não exclua definitivamente dados auditáveis sem requisito explícito.
- Mantenha consultas públicas restritas aos estados publicáveis por padrão.
  Considere autorização, isolamento por proprietário e exposição de IDs.

## Fluxo de trabalho

1. Registre as invariantes e transições afetadas.
2. Crie uma migration incremental e compatível com registros existentes.
3. Atualize o schema declarativo e os tipos da camada de acesso.
4. Centralize comandos de escrita no servidor e valide entradas na fronteira.
5. Teste o caminho feliz, repetição idempotente, transição inválida e falha
   parcial relevante.
6. Execute validação do schema, checagem de tipos, testes e verificação do diff.

Não aplique migrations a ambientes compartilhados ou de produção sem pedido
explícito. Criar e validar o arquivo de migration local não autoriza o deploy.
