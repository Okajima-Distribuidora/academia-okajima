# Updates futuros

## Limpeza e retenção do tempo de exibição — NÃO IMPLEMENTADO

Por decisão do produto, não há cron, job, evento MySQL ou endpoint que exclua
sessões ou resumos. Os prazos abaixo são propostas para uma atualização futura,
não garantias do comportamento atual. Até sua ativação, todas as linhas ficam
armazenadas.

### Política proposta

| Dados | Retenção futura |
| --- | --- |
| Sessões encerradas/expiradas | 30 dias após encerramento |
| Consumo horário | 90 dias |
| Consumo diário | Sem exclusão automática |

Sessões abertas abandonadas devem primeiro transitar para expiradas usando
os limites persistidos. Não excluir sessões ativas, intervalos ainda sujeitos
a confirmação ou sessões com divergência de consolidação.

### Pré-requisitos antes de ativar

1. Medir volume, tamanho de índices, latência e carga; confirmar os prazos.
2. Implementar reconciliação hora → dia por usuário/vídeo e dia de São Paulo.
   Hora e dia já são atualizados atomicamente: não somar novamente ao limpar.
3. Conservar relatório de divergências e bloquear a exclusão do lote divergente.
   Para sessões, a reconciliação precisa considerar a cobertura disponível:
   não comparar apenas sessões recentes com consolidados que contêm sessões
   já removidas. Registrar os cortes de cobertura e baselines antes da primeira
   limpeza, ou reconciliar coortes completas antes de descartá-las.
4. Persistir watermark de cobertura horária e data de cada execução. Relatórios
   solicitados fora da cobertura devem informar indisponibilidade ou precisão
   diária; nunca retornar zero silenciosamente por causa da limpeza.
5. Preservar a rejeição de checkpoints ausentes/expirados. Para evitar reabrir um
   start antigo cujo UUID foi apagado, adicionar validade verificável à solicitação
   de start (token emitido pelo servidor com prazo ou tombstone de deduplicação)
   antes de remover sessões. Checkpoints nunca recriam sessões.
6. Fazer backup e validar restauração, timezone, limites de datas e índices em staging.

### Execução futura sugerida

- Uma execução diária, com bloqueio para impedir duas execuções simultâneas.
- Lotes pequenos, ordenados pela chave/data indexada e com cursor retomável.
- Timeout, limite de linhas por execução e pausa entre lotes, sem transações longas.
- Revalidar estado e cutoff no DELETE; não confiar apenas na seleção inicial.
- Registrar início/fim, cutoff, contagens verificadas/removidas e falhas.
- Reexecução idempotente: retomar cursor sem incrementar resumos.
- Testar falha entre lotes, virada do dia, sessão reativada/rejeitada, reconciliação
  divergente e requisição atrasada após exclusão.

Após a limpeza, a auditoria mais antiga continua disponível por aluno, vídeo
e dia, mas perde detalhe horário e de sessão. Alterações nessa política exigem
decisão explícita antes da primeira exclusão; não é possível reconstruir depois
o detalhe removido usando apenas o resumo diário.
