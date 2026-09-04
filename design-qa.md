# Design QA — hero integrado aos vídeos recentes

## Evidências

- Verdade visual: `C:\Users\Okajima\AppData\Local\Temp\codex-clipboard-93b0f3ec-8c15-4434-886b-54ed15169dbf.png` (1498 × 783 px).
- Implementação desktop: `C:\Users\Okajima\AppData\Local\Temp\academia-okajima-playwright-qa\home-recent-desktop.png` (1440 × 1031 px; viewport CSS 1440 × 900; DPR 1).
- Recorte desktop: `C:\Users\Okajima\AppData\Local\Temp\academia-okajima-playwright-qa\home-recent-desktop-crop.png` (1136 × 863 px).
- Implementação mobile: `C:\Users\Okajima\AppData\Local\Temp\academia-okajima-playwright-qa\home-recent-mobile.png` (390 × 954 px; viewport CSS 390 × 844; DPR 1).
- Estado: tema claro, usuário autenticado, categoria “Tudo”, hero fechado e oito vídeos recentes carregados.
- Normalização: a fonte mostra apenas a região de conteúdo e tem largura diferente. A comparação usou o recorte do showcase para layout e transição; a página completa foi usada para verificar o encaixe no shell existente.

## Comparação visual

A referência e as implementações desktop/mobile foram abertas juntas. O fundo escuro da prateleira agora invade os últimos pixels do hero e alcança a mesma cor na base da imagem, formando uma única superfície. Não existe sombra externa na borda do vídeo. No desktop, cinco cards ficam visíveis como na referência; os demais permanecem no trilho horizontal. No mobile, um card completo e parte do próximo indicam o gesto de rolagem.

O recorte do showcase foi necessário para avaliar o encontro entre a imagem, a sombra progressiva, o título da seção e as miniaturas. Título, duração, categoria, visualizações e data relativa estão legíveis no mesmo recorte.

## Superfícies de fidelidade

- Tipografia: Geist preservada; hero mantém hierarquia forte e os cards usam escala compacta, peso distinto e truncamento de duas linhas.
- Espaçamento e layout: hero e prateleira formam um único container; a seção recente sobe sobre a base da imagem. O trilho não produz overflow na página.
- Cores e tokens: a transição termina em `--hero-scrim`; roxo `--primary` identifica ação e seção; textos secundários usam mistura semântica sobre o fundo escuro.
- Imagens: hero e cards usam miniaturas reais do Vimeo por `next/image`; nenhuma miniatura fictícia foi criada.
- Conteúdo: oito registros públicos, aprovados, não short e não live são ordenados por data; duração, categoria, visualizações e publicação vêm do catálogo.
- Ícones e estados: Tabler em vídeo e play; hover revela play e escurece a miniatura; foco visível e estado indisponível estão cobertos.
- Responsividade e acessibilidade: trilho horizontal acessível, botões com nome de reprodução, foco de teclado e movimento reduzido respeitado.

## Histórico de comparação

### Iteração 1

- [P1] O hero anterior tinha sombra externa e terminava como um card isolado, enquanto a referência pede continuidade com uma prateleira escura.
- [P1] A faixa de vídeos recentes ainda não existia.
- Correção: removida a sombra externa, criado um showcase único com sobreposição gradual e adicionados oito vídeos reais com miniaturas e metadados.
- Evidência posterior: `home-recent-desktop-crop.png` mostra a imagem dissolvendo no mesmo fundo da prateleira.

### Iteração 2

- [P2] A seleção local poderia permanecer ao navegar para outra categoria.
- Correção: o showcase agora reinicia por categoria.
- Evidência posterior: Playwright validou “Tudo → reprodução de Outubro rosa e novembro azul → Farmax”, atualizando o hero para “Farmax categoria básicos - 1”.

### Iteração 3

- Nenhuma diferença P0, P1 ou P2 acionável permaneceu.

## Verificação funcional

- Playwright Chromium em 1440 × 900 e 390 × 844.
- Oito cards carregados; primeiro card abre no player principal e pode ser fechado.
- Mudança de categoria atualiza hero e prateleira.
- CTA principal ativo no mobile.
- Sem overflow horizontal, erros ou avisos no console.
- `npm run typecheck`, `npm run lint` e 34 testes automatizados aprovados.

## Findings

Nenhum P0, P1 ou P2 restante. Como P3 futuro, “Explore mais” pode ser adicionado quando houver uma rota de catálogo completa, evitando um controle sem destino funcional nesta etapa.

final result: passed
