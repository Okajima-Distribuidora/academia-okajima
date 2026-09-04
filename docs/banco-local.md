# Banco de desenvolvimento

MySQL 5.7.44 em Docker, para reproduzir a estrutura do banco legado sem acessar a producao. Esta versao antiga nao deve ser publicada na internet nem utilizada para um novo ambiente de producao.

## Iniciar e verificar

Na raiz do projeto, com o Docker Desktop em execucao:

```powershell
docker compose up -d --wait
docker compose ps
docker compose logs --tail 50 banco
```

O Compose cria recursos com o prefixo `academia-okajima-dev` e nao utiliza os bancos dos outros projetos.

## Conexao

- Aplicacao no Windows: `127.0.0.1:3307`.
- Banco: `academia_local`.
- Usuario: `academia_dev`, com permissoes apenas nesse banco.
- Senha e URL da aplicacao: `.env.local`.
- Credenciais de inicializacao do MySQL: `.env.docker.local`.
- Aplicacao em outro servico do mesmo Compose: host `banco`, porta `3306`.

Os dois arquivos de ambiente estao ignorados pelo Git. A URL nao deve ter o prefixo `NEXT_PUBLIC_`. A camada de acesso foi implementada em `lib/db` com Kysely/mysql2, pool compartilhado de ate 5 conexoes e validacao estrita deste destino local. Veja [Login local](C:/Users/Okajima/Documents/ChatGPT/academia-okajima/docs/login-local.md).

O banco de desenvolvimento ja tem uma conta ficticia `admin` provisionada separadamente. O arquivo SQL continua sendo somente estrutura. Iniciar o aplicativo nao importa o dump, cria contas ou regrava senhas.

Em outra maquina, crie `.env.docker.local` com `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER` e `MYSQL_PASSWORD`, usando novas senhas. Crie `.env.local` com a `DATABASE_URL` correspondente.

Alterar as variaveis de inicializacao nao muda a senha nem o nome de um banco que ja existe no volume.

## Importacao do schema

O schema validado esta em `database/legacy-schema.sql`: 66 tabelas, sem registros. Ele foi obtido do arquivo `C:\Users\Okajima\Downloads\okaji169_academia.sql`, exportado em 02/09/2026. O original foi preservado. Apenas os comandos `CREATE DATABASE` e `USE` referentes ao banco original foram removidos da copia, com um comentario explicativo acrescentado no inicio.

Para importar novamente em uma instalacao nova, confirme primeiro que `academia_local` esta vazio. Execute na raiz do projeto:

```powershell
docker compose cp ./database/legacy-schema.sql banco:/tmp/academia-legacy-schema.sql
docker compose exec -T banco sh -c 'export MYSQL_PWD=$MYSQL_PASSWORD; exec mysql --binary-mode=1 --local-infile=0 --protocol=TCP -h127.0.0.1 -u$MYSQL_USER $MYSQL_DATABASE < /tmp/academia-legacy-schema.sql'
```

A importacao nao e automatica ao iniciar o container e nao deve ser repetida em um banco com tabelas. Comandos de estrutura MySQL podem persistir parcialmente se ocorrer um erro; nao tente corrigir isso apagando o volume sem conferir seu conteudo.

Depois da importacao, confira as tabelas e que todas possuem zero registros. Crie dados ficticios por meio de um seed separado. Os indices, engines, valores padrao e contadores de auto-incremento do dump foram mantidos; nao foram adicionados relacionamentos ou chaves inexistentes no legado.

Nao coloque dumps completos no repositorio nem em `public/`.

## Persistencia e parada

```powershell
docker compose stop
docker compose start --wait
```

As tabelas e os dados ficam no volume `academia-okajima-dev_banco_dados` e sobrevivem a reinicializacoes. `docker compose down` remove os containers e a rede deste projeto, mas preserva o volume. Nao acrescente `-v`: isso apagaria o banco local.

O parametro `lower_case_table_names=1` permite que referencias legadas em maiusculas, como `APP_LOGIN`, encontrem as tabelas em minusculas. Mantenha essa configuracao enquanto reutilizar o mesmo volume.
