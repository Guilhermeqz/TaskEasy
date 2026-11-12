# Gerar o APK pelo GitHub Actions

Este caminho compila o TaskEasy diretamente com o Android Gradle Plugin em um runner do GitHub. Não usa EAS, não exige conta Expo e o APK não depende de Expo Go ou Metro para abrir. As bibliotecas do Expo continuam fazendo parte do projeto e são compiladas dentro do aplicativo.

## Preparar o repositório

Envie o projeto completo para um repositório do GitHub, preservando `api`, `mobile` e `.github`. Não envie `.env`, arquivos do banco, `node_modules`, `backups` ou a pasta Android gerada. Esses caminhos estão ignorados pelo Git. O workflow deve estar na branch padrão do repositório para aparecer o botão de execução manual.

O arquivo `.github/workflows/android-apk.yml` configura Node 20.20.0, Java 21, Android SDK e NDK, instala as dependências, executa os testes do mobile, gera o projeto Android e compila o módulo nativo de despertador com o restante do app.

## Executar

1. Abra o repositório no GitHub.
2. Entre em **Actions → Gerar APK Android → Run workflow**.
3. Informe a URL pública da API em `api_url` e execute.
4. Espere a execução terminar. O build ainda precisa passar para existir um APK válido.
5. Na página da execução, baixe o artefato **TaskEasy-APK-N**. Extraia o ZIP e transfira **TaskEasy.apk** para o Android.
6. Abra o APK no celular e autorize a instalação pela origem utilizada, se o Android solicitar.

O artefato também contém `TaskEasy.apk.sha256`. O APK atende celulares ARM de 32 e 64 bits; este workflow não produz uma versão para emuladores x86.

## Qual URL informar

Para usar de qualquer rede, informe o endereço HTTPS do backend publicado no Render, sem `/health` ou `/tasks` ao final. Por exemplo: `https://SEU-SERVICO.onrender.com`.

Para teste no mesmo Wi-Fi, informe `http://IPV4_DO_COMPUTADOR:3000`. Nesse caso, a API precisa estar rodando no computador e o celular deve conseguir acessar esse endereço. `localhost` não funciona no APK, pois aponta para o próprio celular.

A URL é uma configuração pública embutida no aplicativo. Nunca informe senha de banco, token de acesso ou `JWT_SECRET` nesse campo. Este workflow não publica o backend nem migra dados para o Supabase; esses serviços precisam ser configurados separadamente.

## Tipo de assinatura

Este fluxo gera um APK de teste em modo release com a chave de desenvolvimento do template Android do Expo. O JavaScript é incluído no APK e não depende do Metro. Para distribuição de produção ou loja, configure uma chave de assinatura própria e estável antes de publicar. Uma mudança de chave pode exigir desinstalar a versão anterior do app, removendo os dados locais desse aplicativo.

## Depois de instalar

Entre no TaskEasy, abra **Perfil → Despertadores** e conceda as permissões. Cadastre **Tomar café** com um horário dois minutos à frente, bloqueie a tela e teste o toque contínuo e o botão **Parar despertador**. Os detalhes de funcionamento estão em [Despertadores](DESPERTADORES.md).

O GitHub precisa permitir a execução do workflow e ter minutos disponíveis para o repositório/conta. Caso a plataforma exija cobrança para continuar, confirme o custo antes de habilitá-la.

Referências: [GitHub Actions para Android SDK](https://github.com/android-actions/setup-android) e [artefatos de workflows](https://github.com/actions/upload-artifact).
