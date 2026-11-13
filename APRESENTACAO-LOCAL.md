# TaskEasy — versão local para apresentação

Esta versão utiliza o APK que já foi instalado e testado no seu celular, a API Node.js local e o SQLite. O usuário confirmou que o despertador também funcionou no aparelho. Render e Supabase não participam desta execução.

## Abrir a API no Windows

Dê dois cliques em **INICIAR-APRESENTACAO.cmd** na raiz do projeto. Se o pacote contiver `runtime/node.exe`, será usado o Node incluído nele. A configuração local será preparada sem sobrescrever um segredo existente. A API será iniciada sem o modo de reinicialização automática ao editar arquivos.

Se a API já estiver respondendo na porta 3000, o iniciador avisa e não abre outra instância. Mantenha aberta a janela que já executa a API. Para parar uma API iniciada pelo pacote, pressione `Ctrl+C` na janela dela.

Alternativa no terminal da raiz, com dependências e `.env` já preparados:

```powershell
npm.cmd start --prefix api
```

Na primeira utilização de uma cópia somente do código, com internet e Node.js compatível instalado:

```powershell
npm.cmd ci --prefix api
npm.cmd run setup --prefix api
npm.cmd start --prefix api
```

O pacote local completo inclui as dependências da API e o executável Node para Windows do ambiente testado. Ele não precisa baixar pacotes para iniciar a API. Os fontes do aplicativo estão incluídos, mas não suas dependências de desenvolvimento; para a apresentação, use o APK pronto.

## Conferir a rede antes da apresentação

O APK preservado usa **http://192.168.0.107:3000**. O celular e o computador precisam estar no mesmo Wi-Fi e o computador precisa continuar com o IPv4 **192.168.0.107**. Usar outra rede ou mudar o endereço do computador pode impedir login e acesso às tarefas, mesmo que os arquivos estejam corretos.

1. No computador, abra `http://localhost:3000/health`.
2. No navegador do celular, abra `http://192.168.0.107:3000/health`.
3. Nos dois deve aparecer `status: ok` e `service: TaskEasy API`.
4. Se a página não abrir no celular, confira IP, mesma rede Wi-Fi e a autorização do Node.js no Firewall para a rede privada. Não desative o firewall.

Faça essa conferência na rede que será usada na apresentação. O iniciador mostra os IPv4 encontrados e avisa se o IP esperado pelo APK estiver ausente. Essa verificação não altera as configurações da rede.

### Ajuste manual escolhido para esta apresentação

Na conferência, o Wi-Fi estava em `192.168.0.102`, com prefixo `/24`, gateway `192.168.0.1` e DNS `189.36.151.26` / `189.36.144.18`. O APK continua esperando `192.168.0.107`.

Prefira reservar `192.168.0.107` para este computador na configuração DHCP do seu roteador, verificando antes que outro dispositivo não utiliza o endereço. A ausência de resposta a ping não confirma que um IP está livre.

Se for configurar manualmente no Windows, na rede atual:

1. Abra **Configurações → Rede e Internet → Wi-Fi**, selecione a rede e procure **Atribuição de IP → Editar**.
2. Selecione **Manual** e habilite IPv4.
3. Use `192.168.0.107`, máscara `255.255.255.0` (ou comprimento do prefixo `24`) e gateway `192.168.0.1`.
4. Se a tela solicitar DNS, os valores desta conexão são `189.36.151.26` e `189.36.144.18`.
5. Salve, confira o endereço e teste `/health` pelo celular. Para voltar à configuração anterior, escolha **Automático (DHCP)**.

Esses valores são da rede conferida neste computador. Não os aplique cegamente em outra rede, por exemplo uma rede `192.168.1.x`. A escolha do usuário foi manter o APK, portanto o local da apresentação precisa permitir o computador em `192.168.0.107` e a comunicação entre celular e computador. Nenhuma configuração de rede foi alterada pelo assistente.

Referência: [configurações TCP/IP do Windows — Microsoft](https://support.microsoft.com/en-us/windows/experience/connectivity-networking/essential-network-settings-and-tasks-in-windows).

## Login

- E-mail: **demo@taskeasy.com**
- Senha: **TaskEasy@123**

O SQLite incluído no pacote é um snapshot dos seus dados, feito pelo backup online do SQLite. A cópia original permanece preservada. Na primeira execução do pacote de contingência, pode ser necessário fazer login novamente porque ele gera seu próprio segredo JWT local.

## Roteiro curto

1. Confira o acesso a `/health` no celular e faça login no APK.
2. Crie uma tarefa com título e descrição.
3. Edite e confira a atualização da lista.
4. Programe um despertador para dois minutos à frente e confira as permissões no Perfil.
5. Bloqueie o celular e teste o toque e o botão de parar. Depois conclua ou exclua essa tarefa de teste para não deixar alarmes disparando durante a explicação.
6. Demonstre tema escuro e persistência da sessão ao reabrir o app.

As tarefas dependem da API na rede local. Despertadores já agendados no aparelho não precisam de internet para tocar. A frase do dia usa uma API pública e pode exibir seu estado de erro se a rede não tiver internet; isso não bloqueia o CRUD local.

## Versão preservada e recuperação

A referência Git **apresentacao-local-v1**, na branch **release/apresentacao-local**, preserva esta versão para separar alterações futuras. O APK permanece exatamente o já validado, com o SHA-256 registrado em `apresentacao.local.json`.

O pacote privado de contingência fica em `backups/` e contém código, dependências da API, runtime Windows, banco de dados e APK. Ele contém dados pessoais e hashes de senha; não envie o pacote completo para um repositório público. Para entrega do código, utilize o repositório privado ou o ZIP somente de fontes.

Extraia o pacote de contingência em uma pasta separada. Para testá-lo com seu próprio banco, primeiro encerre a API atual; duas APIs não podem utilizar a porta 3000 ao mesmo tempo. A cópia só deve substituir a execução atual quando você escolher usar a contingência.
