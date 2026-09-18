# Academia Okajima

Nova academia em Next.js App Router. Primeira entrega: login local por RCA/e-mail,
sessão NextAuth, início protegido, logout e temas claro/escuro.

Consulte [Login local — execução e testes](C:/Users/Okajima/Documents/ChatGPT/academia-okajima/docs/login-local.md)
antes de iniciar. O banco/conta são exclusivamente de desenvolvimento; não há
cadastro, autorização administrativa ou migração de usuários reais nesta entrega.

## Desenvolvimento

Com Docker ativo e os arquivos privados de ambiente configurados:

```bash
docker compose up -d --wait
npm install
npm run dev -- --hostname 127.0.0.1
```

Abra [o login local](http://localhost:3000/login). O RCA `admin` já foi provisionado
no banco desta máquina; iniciar a aplicação não recria contas nem senhas.

A página inicial está em `app/(protected)/page.tsx`. A autenticação usa `auth.ts`
e `lib/auth`; as consultas Kysely/mysql2 ficam no servidor, sem API REST separada
ou Prisma. Confira `AGENTS.md` antes de alterar UI.

Verificações rápidas: `npm test`, `npm run lint`, `npm run typecheck` e `npm run build`.
Os testes de banco e HTTP são opt-in; veja os comandos e limites no documento do login.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Antes de publicar

Esta entrega não deve ser exposta como autenticação de produção. O acesso ao banco
está restrito ao destino local, e o limite de tentativas está em memória por processo.
As pendências de segurança, migração e infraestrutura estão no plano de autenticação.

Não versione `.env.local`, `.env.docker.local`, hashes/credenciais reais ou dumps com dados.

## Interface da academia

A interface usa **shadcn/ui + Tailwind CSS**, com referências de plataformas de
streaming e YouTube. O shadcn fornece os componentes básicos; catálogo, cards de
aulas, listas de reprodução e progresso terão componentes próprios da academia.
O player de vídeo é uma integração separada da biblioteca de UI.

- Configuração inicial: preset `base-nova` (Base UI), cores neutras e ícones Lucide.
- Preferência para novos ícones e alterações de UI: [Tabler Icons](https://tabler.io/icons); Lucide somente quando não houver uma opção adequada no Tabler. Os ícones existentes não foram migrados em lote.
- Configuração do shadcn: `components.json`; tema e tokens: `app/globals.css`.
- Componentes oficiais do formulário, alertas e estado vazio em `components/ui`;
  composição do login em `components/auth`, cabeçalho/marca/tema compartilhados.
- Claro por padrão, escuro manual persistido na chave do tema, fonte Geist e
  roxo `#BD2CAC` nos dois temas. Catálogo e player ficam para etapas seguintes.

Para adicionar um componente do registro oficial, por exemplo um campo de entrada:

```bash
npx shadcn@latest add @shadcn/input
```

## Documentação do projeto

- [Home — estrutura inicial](docs/home.md)
- [Upload e webhooks do Vimeo](docs/vimeo-upload.md)
- [Login local implementado: fluxo, limites e testes](C:/Users/Okajima/Documents/ChatGPT/academia-okajima/docs/login-local.md)
- [Banco de desenvolvimento local](C:/Users/Okajima/Documents/ChatGPT/academia-okajima/docs/banco-local.md)
- [Fluxo completo de autenticação do legado PHP](C:/Users/Okajima/Documents/ChatGPT/academia-okajima/docs/autenticacao-legado.md)
- [Plano de autenticação do novo projeto](C:/Users/Okajima/Documents/ChatGPT/academia-okajima/docs/plano-autenticacao.md)
