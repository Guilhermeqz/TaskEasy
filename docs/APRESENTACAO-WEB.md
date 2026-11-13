# Apresentar o TaskEasy com API na internet

API: **https://taskeasy-ejrv.onrender.com**. Banco: **Supabase PostgreSQL**. Aplicativo: **TaskEasy 1.1.0**, APK Android proprio com despertador.

[Baixar TaskEasy-APK-3 no GitHub](https://github.com/Guilhermeqz/TaskEasy/actions/runs/43336605357/artifacts/13998945369) (entre na sua conta, extraia o ZIP e instale `TaskEasy.apk`). O checksum, a URL da API, a versao e a assinatura foram conferidos; a assinatura coincide com o APK local anterior.

## Antes de apresentar

1. Instale o APK 1.1.0 e mantenha uma copia do arquivo no computador e no celular.
2. Abra [a verificacao da API](https://taskeasy-ejrv.onrender.com/health). Aguarde aparecer `status: ok`. O Render gratuito pode demorar na primeira chamada apos ficar inativo; espere responder antes do login.
3. Entre com `demo@taskeasy.com` e senha `TaskEasy@123`. A configuracao web utiliza outro segredo JWT; pode ser necessario entrar novamente ao atualizar o APK local.
4. Desligue o Wi-Fi do celular e teste usando dados moveis. Confira a lista, crie, edite, conclua e exclua uma tarefa de demonstracao. Isso confirma o acesso sem a rede do computador.
5. Em **Perfil > Despertadores**, confira as permissoes. Programe um horario dois minutos a frente, bloqueie a tela e teste o toque e o botao de parar. Depois exclua ou conclua a tarefa de teste.

O computador pode ficar desligado durante o uso da versao web. Login e tarefas precisam de internet; os despertadores ja agendados no aparelho funcionam sem internet. A API publica de frases continua dependendo de seu proprio servico externo.

## Na faculdade

Abra `/health` pouco antes de apresentar e aguarde responder. Use o APK ja testado com a rede disponivel ou com dados moveis. O endereco da API permanece o mesmo quando o IP do computador muda.

## Reserva local preservada

O pacote `backups/TaskEasy-Apresentacao-Local-v1-Windows.zip` e a tag `apresentacao-local-v1` preservam a API SQLite, o banco local e o APK 1.0.0 com `http://192.168.0.107:3000`. Essa reserva continua exigindo uma rede propria que permita o computador nesse IP; o Wi-Fi da faculdade pode nao permitir isso.

As duas versoes usam o mesmo pacote Android e a mesma assinatura, conferida nos APKs. O APK web tem versionCode 2 e pode atualizar o local (versionCode 1). Para voltar ao APK antigo, o Android pode exigir desinstalar a versao mais nova. A desinstalacao apaga sessao, preferencias e alarmes do aparelho; os bancos SQLite no computador e Supabase permanecem separados e preservados. Siga [o guia local](../APRESENTACAO-LOCAL.md) se escolher essa contingencia.

Os dados nao sao sincronizados automaticamente entre SQLite e Supabase. A migracao copiou os registros existentes naquele momento; tarefas criadas depois em um dos bancos nao aparecem no outro.
