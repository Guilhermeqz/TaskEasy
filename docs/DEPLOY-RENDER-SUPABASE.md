# Publicar a API TaskEasy no Render com banco Supabase

A referencia `apresentacao-local-v1` e o pacote em `backups/` preservam o APK com IP local e a API SQLite. A versao web usa o mesmo contrato HTTP, login JWT e horarios; o banco passa a ser PostgreSQL. O aplicativo sera recompilado com a URL HTTPS do Render depois que a API estiver validada.

## 1. Projeto Supabase

Projeto autorizado: `azkbtwgsqbpjucduolft`. A conexao escolhida e **Connect > Direct > Session pooler**, porta **5432**, host `aws-0-sa-east-1.pooler.supabase.com`, usuario `postgres.azkbtwgsqbpjucduolft` e banco `postgres`.

A Data API pode ficar desativada: somente a API Express acessa o banco. As tabelas recebem RLS e nenhum acesso para os papeis `anon` e `authenticated`. As credenciais PostgreSQL pertencem somente ao backend. A autenticacao do TaskEasy continua usando sua tabela de usuarios e bcrypt; ela nao utiliza Supabase Auth.

Para configurar sem enviar a senha pela conversa, no PowerShell da raiz:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\api\scripts\configure-cloud.ps1
```

O script pede a senha com entrada oculta, codifica caracteres especiais e gera um segredo JWT. Grava **api/.env.cloud**, ignorado pelo Git, sem sobrescrever um arquivo existente. `api/.env` continua configurando somente a API local. Nao inclua os colchetes do marcador `[YOUR-PASSWORD]` na senha real.

Na raiz, confira a conexao antes de migrar:

```powershell
npm.cmd run cloud:check --prefix api
```

O cliente exige TLS e verifica o certificado do servidor. Para os hosts do pooler Supabase, utiliza a CA publica incluida em `api/src/database/certs/`; nao e necessario configurar outra variavel. Se o provedor renovar o certificado, baixe a CA do proprio projeto no painel Supabase e configure `DATABASE_CA_CERT` no arquivo privado e no Render (PEM; pode usar `\n` entre linhas). Nao desative a verificacao do certificado.

## 2. Transferir os dados locais

```powershell
npm.cmd run cloud:migrate --prefix api
```

Esse comando cria um novo backup consistente do SQLite, valida checksums, cria as tabelas PostgreSQL e importa usuarios e tarefas numa transacao. Preserva IDs, hashes bcrypt, conclusao e agendamentos. A importacao exige tabelas vazias e cancela sem substituir dados caso ja existam registros. Nao apaga nem modifica o SQLite original. O recibo fica na pasta do novo backup.

Para testar a API com o banco remoto sem disputar a porta da API local:

```powershell
npm.cmd run start:cloud --prefix api
```

Essa configuracao usa `http://127.0.0.1:3001/health`. A API local continua na porta 3000. A configuracao web usa outro JWT; o aplicativo precisara fazer login novamente ao trocar de servidor.

## 3. Criar o Web Service no Render

Conecte o repositorio privado `Guilhermeqz/TaskEasy` ao Render. As alteracoes web foram integradas a `main` a partir da branch `feat/api-render-supabase`; a versao local permanece preservada na tag `apresentacao-local-v1`.

O servico existente foi configurado para acompanhar `feat/api-render-supabase` e pode continuar usando essa branch, com a mesma API ja validada. A integracao Git nao muda automaticamente a branch do servico no painel Render. Para novos servicos ou ao atualizar explicitamente essa configuracao, utilize `main`, conforme abaixo.

No painel **New > Web Service**, use:

| Campo | Valor |
| --- | --- |
| Repository | Guilhermeqz/TaskEasy |
| Branch | main |
| Name | taskeasy-api (ou nome disponivel) |
| Runtime | Node |
| Root Directory | api |
| Build Command | npm ci --omit=dev |
| Start Command | npm start |
| Instance Type | Free |
| Health Check Path | /health |

Se `api/.env.render` tiver sido preparado localmente, abra esse arquivo privado e use **Add from .env** em **Environment Variables** no Render para importar seu conteudo. Ele contem somente as variaveis de producao abaixo; nao envie o arquivo pela conversa e nao importe `api/.env.cloud`, que usa host e porta para testes locais.

Para preencher manualmente, configure:

| Variavel | Valor |
| --- | --- |
| NODE_VERSION | 20.20.0 |
| NODE_ENV | production |
| HOST | 0.0.0.0 |
| DATABASE_URL | Valor privado de api/.env.cloud |
| JWT_SECRET | Valor privado de api/.env.cloud (ou outro segredo aleatorio de pelo menos 32 caracteres) |
| SEED_DEMO | false |

O Render fornece `PORT`; nao fixe a porta 3001 da verificacao local. `DATABASE_PATH` nao e necessario. Se `DATABASE_URL` estiver ausente no Render, o servidor recusa iniciar para evitar criar um SQLite temporario. O arquivo `render.yaml` permite configurar o mesmo servico como Blueprint; nele, o segredo JWT pode ser gerado automaticamente.

Escolha **Free** explicitamente; este procedimento nao autoriza planos pagos. O plano gratuito pode suspender por inatividade e demorar para responder na primeira chamada. Antes da apresentacao, abra `/health` e aguarde responder antes de entrar no app. Os dados continuam no Supabase mesmo que a API reinicie.

## 4. Validar antes do novo APK

A API foi publicada em **https://taskeasy-ejrv.onrender.com**. O endpoint [health](https://taskeasy-ejrv.onrender.com/health), login, perfil, exigencia de autenticacao, listagem, criacao, edicao, leitura, horarios e exclusao foram validados por HTTP publico. A tarefa temporaria de teste foi removida e as 3 tarefas originais permaneceram preservadas.

Para repetir essa verificacao na raiz:

```powershell
npm.cmd run deploy:verify --prefix api -- https://taskeasy-ejrv.onrender.com
```

O comando usa o usuario demo, cria e remove uma tarefa temporaria, sem alterar as tarefas existentes. A verificacao de persistencia apos reabrir conexoes foi feita com Supabase; reiniciar o servico no Render ainda depende do acesso ao painel.

O aplicativo 1.1.0 (versionCode 2) possui essa URL como padrao no APK, e o workflow recebe o mesmo endereco em `api_url`. `EXPO_PUBLIC_API_URL` continua permitindo compilar APKs locais; no Expo Go, o host LAN continua disponivel para desenvolvimento. O APK antigo e o backup local continuam preservados.

## Validacao realizada na preparacao

- Migracao do SQLite para o projeto autorizado: 1 usuario e 3 tarefas, com recibo no backup privado.
- Login e CRUD por HTTP real usando Supabase, incluindo horarios e persistencia ao reabrir conexoes; a tarefa temporaria de verificacao foi removida.
- Suíte SQLite/TLS local: 19 testes aprovados; a integracao PostgreSQL descartavel e executada no CI.
- [GitHub Actions: PostgreSQL 16 e SQLite aprovados](https://github.com/Guilhermeqz/TaskEasy/actions/runs/43333802129), incluindo importacao atomica, protecao contra sobrescrita, isolamento por usuario, horarios, CRUD e reabertura das conexoes.

A API publica foi validada e o [APK web 1.1.0 foi compilado](APK-GITHUB.md). Foram conferidos checksum, URL publica, modulo nativo e assinatura. O usuario confirmou o funcionamento do novo APK no celular. A confirmacao especifica do uso com dados moveis e do despertador nessa nova versao permanece pendente.

Referencias: [Supabase: conectar ao PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres), [Render: Express](https://render.com/docs/deploy-node-express-app), [limites gratuitos](https://render.com/docs/free).
