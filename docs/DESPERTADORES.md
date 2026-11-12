# Tarefas por horário e despertador Android

## Comportamento

Ao criar ou editar uma tarefa, ative **Despertador por horário** e informe, por exemplo, `09:00` para **Tomar café**. O horário usa o fuso local do celular. Sem repetição, o aplicativo escolhe a próxima ocorrência: hoje se ainda não passou, ou amanhã. Com **Repetir todos os dias**, o alarme volta a ser agendado a cada dia até a tarefa ser concluída, excluída ou ter o despertador desativado.

O Android guarda o agendamento localmente, usando `AlarmManager.setAlarmClock`. Quando chega o horário, um serviço em primeiro plano reproduz o som de alarme do aparelho em loop, com vibração, até tocar em **Parar despertador** na tela do alarme, na notificação ou no Perfil. Parar o som não conclui a tarefa.

A tela de alarme pode aparecer com o celular bloqueado quando a permissão de tela cheia estiver habilitada. Se o Android restringir a tela cheia, o controle continua disponível na notificação. Volume de alarmes, Não Perturbe e configurações do fabricante podem afetar a apresentação e o som. O aplicativo não altera o volume nem contorna as escolhas de Não Perturbe do usuário.

Não são usados temporizadores JavaScript como substitutos do agendador do Android. Depois de salvar e agendar com sucesso, o despertador não depende de uma conexão com a API para tocar. Reiniciar o celular restaura agendamentos futuros; um alarme único já passado não dispara retroativamente. Forçar a parada do aplicativo nas configurações do Android pode cancelar os alarmes até abri-lo novamente.

## Expo Go e APK próprio

O SDK continua sendo o **57**. O Expo Go permite testar o formulário e salvar horários na API, mas não contém o módulo nativo `TaskEasyAlarm`; por isso, ele exibe uma mensagem clara de que o despertador depende do APK próprio. Não há um despertador simulado no Expo Go.

O módulo fica em `mobile/modules/taskeasy-alarm`, é encontrado pelo autolinking do Expo e é compilado no APK. A pasta `mobile/android` gerada pelo prebuild permanece ignorada pelo Git. Os fontes nativos do módulo são versionados.

## Permissões no APK

Entre no aplicativo e abra **Perfil → Despertadores → Configurar permissões**:

1. Permita notificações, quando o Android solicitar.
2. Autorize **Alarmes e lembretes** para o TaskEasy.
3. Nos aparelhos que exigem autorização adicional, permita a **tela de alarme em tela cheia**. Pode ser necessário tocar novamente em Configurar permissões depois de retornar de cada tela do sistema.

Ao retornar das configurações, o Perfil consulta as permissões e tenta sincronizar as tarefas novamente. Atualizar a lista também sincroniza os agendamentos, sem criar cópias do mesmo alarme. O aplicativo informa falhas e permissões ausentes sem reenviar a criação de uma tarefa que já foi salva no servidor.

Ao concluir ou excluir uma tarefa, seu alarme é cancelado. Ao sair da conta, todos os despertadores locais dessa conta são removidos. Alterações feitas por outro dispositivo precisam ser sincronizadas ao abrir ou atualizar a lista neste celular.

## Banco e API

A inicialização do backend adiciona estas colunas à tabela existente, sem apagar registros:

- `horario`: texto `HH:mm`, ou `null` quando não há despertador.
- `lembrete_em`: data da ocorrência inicial em ISO UTC, ou `null`.
- `repetir_diariamente`: 0/1 no SQLite, booleano na API.

Exemplo de criação:

```json
{
  "titulo": "Tomar café",
  "descricao": "Preparar o café da manhã",
  "concluida": false,
  "horario": "09:00",
  "lembrete_em": "2030-01-02T12:00:00.000Z",
  "repetir_diariamente": true
}
```

A data é calculada pelo celular, pois o fuso do servidor pode ser diferente. O exemplo corresponde a 09:00 em UTC−03:00. No aplicativo, não é necessário informar a data manualmente. Para remover o despertador pela API, envie `horario: null`, `lembrete_em: null` e `repetir_diariamente: false` no PUT. Clientes antigos que omitam os campos preservam o agendamento ao editar.

Editar apenas o texto não rearma automaticamente um alarme único que já passou. Para tocá-lo novamente, use **Reagendar no próximo horário**, altere o horário ou reabra uma tarefa concluída.

## Gerar o APK pela Expo/EAS

O perfil `preview` de `mobile/eas.json` produz um APK de distribuição interna. A conta Expo precisa estar autenticada antes de criar ou vincular o projeto e iniciar o build. Execute na pasta `mobile`, sem compartilhar senha no chat:

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest whoami
```

Antes do build, configure no ambiente **preview** do projeto EAS a variável pública `EXPO_PUBLIC_API_URL` com a URL acessível da API. Para o APK final, use a URL HTTPS do backend publicado no Render. Para testes apenas no mesmo Wi-Fi, é possível usar `http://IPV4_DO_COMPUTADOR:3000`, mantendo o computador ligado e a API em execução. APKs não possuem o host de desenvolvimento do Expo para descobrir a API automaticamente.

O plugin `with-local-api` permite HTTP na rede local no APK de teste. O backend publicado deve continuar sendo acessado por HTTPS. Não coloque `JWT_SECRET`, credenciais de banco nem dados de backup em variáveis públicas.

Depois de vincular o projeto à conta e configurar a URL:

```powershell
npx.cmd eas-cli@latest build --platform android --profile preview
```

A geração exige acesso à conta Expo/EAS. Ao finalizar, a Expo fornece o link do APK para instalação. O build nativo e o teste em um Android físico são necessários para validar o som, a tela bloqueada e as permissões; a exportação JavaScript não substitui essa validação.

Para quem já possui Android SDK e ferramentas configuradas localmente, `npm.cmd run android:native` compila e instala uma versão de desenvolvimento. `npm.cmd start` mantém o teste de telas pelo Expo Go.

## Teste no celular

1. Reinicie a API atualizada e instale o APK com o módulo nativo.
2. Entre na conta e conceda as permissões no Perfil.
3. Cadastre **Tomar café** para dois minutos à frente, sem repetição, e salve.
4. Bloqueie o celular. No horário, confira o toque em loop e o botão para parar. Confira que a tarefa continua pendente após parar o som.
5. Repita o teste após concluir, excluir ou remover o horário de uma tarefa: ela não deve tocar.
6. Confira a edição de horário, a repetição diária, a saída da conta e a restauração após reiniciar o aparelho.

## Verificações automatizadas

Foram executados os testes da API e do mobile, a exportação Android, o prebuild e a resolução do módulo pelo autolinking. Os testes JavaScript do agendador usam uma ponte nativa substituída para verificar agendamento, cancelamento, troca de usuário e erros. Eles não comprovam sozinhos o comportamento do Android bloqueado.

Referências: [alarmes Android](https://developer.android.com/develop/background-work/services/alarms), [módulos locais Expo](https://docs.expo.dev/modules/get-started/) e [geração de APK com EAS](https://docs.expo.dev/build-reference/apk/).
