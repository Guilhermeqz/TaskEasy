import { PermissionsAndroid, Platform } from 'react-native';
import NativeAlarm from '../../modules/taskeasy-alarm';

export const alarmsAvailable = Platform.OS === 'android' && Boolean(NativeAlarm);
let activeUser;
let queue = Promise.resolve();
let warning = '';
const listeners = new Set();

export const getAlarmWarning = () => warning;
export const subscribeAlarmWarning = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
function warn(message) {
  warning = message;
  listeners.forEach((listener) => listener());
}
function enqueue(action) {
  const pending = queue.then(action);
  queue = pending.catch(() => {});
  return pending;
}

export function activateAlarmUser(id) {
  const user = id == null ? null : String(id);
  activeUser = user;
  warn('');
  if (!alarmsAvailable) return Promise.resolve();
  return enqueue(() => NativeAlarm.activateUser(user));
}

function nativeTask(task) {
  const enabled = Boolean(task.horario && task.lembrete_em && !task.concluida);
  return {
    id: task.id, enabled, title: task.titulo, body: task.descricao || '',
    hour: task.horario || '', at: enabled ? Date.parse(task.lembrete_em) : 0,
    repeats: Boolean(task.repetir_diariamente),
    signature: JSON.stringify([task.horario, task.lembrete_em, Boolean(task.repetir_diariamente), task.titulo, task.descricao || '']),
  };
}

async function update(userId, tasks, fullSync) {
  const user = String(userId);
  if (!alarmsAvailable) {
    if (tasks.some((task) => task.horario && !task.concluida)) {
      warn('Horário salvo. Para o despertador tocar, instale o APK próprio do TaskEasy. O Expo Go não contém o módulo de despertador.');
    }
    return;
  }
  try {
    await enqueue(async () => {
      if (activeUser !== user) return;
      if (fullSync) await NativeAlarm.sync(user, tasks.map(nativeTask));
      else await NativeAlarm.upsert(user, nativeTask(tasks[0]));
      if (activeUser !== user) return;
      const status = await NativeAlarm.getStatus();
      const needsAlarm = tasks.some((task) => task.horario && !task.concluida
        && (task.repetir_diariamente || Date.parse(task.lembrete_em) > Date.now()));
      warn(needsAlarm && (!status.exact || !status.notifications)
        ? 'Tarefa salva. Ative as permissões do despertador em Perfil para ele tocar.'
        : needsAlarm && !status.fullScreen
          ? 'Despertador agendado. Autorize a tela de alarme em Perfil para exibi-la com o celular bloqueado.' : '');
    });
  } catch {
    warn('A tarefa foi salva, mas houve uma falha no despertador. Atualize a lista para tentar agendar novamente e confira as permissões em Perfil.');
  }
}

export const syncTaskAlarms = (userId, tasks) => update(userId, tasks, true);
export const updateTaskAlarm = (userId, task) => update(userId, [task], false);
export async function cancelTaskAlarm(userId, taskId) {
  if (!alarmsAvailable) return;
  try {
    await enqueue(async () => { if (activeUser === String(userId)) await NativeAlarm.cancel(String(userId), String(taskId)); });
  } catch {
    warn('A tarefa foi excluída, mas não foi possível cancelar o despertador. Use Parar despertadores em Perfil e atualize a lista.');
  }
}

export const getAlarmStatus = () => alarmsAvailable ? NativeAlarm.getStatus() : Promise.resolve(null);
export const stopAlarms = () => alarmsAvailable ? NativeAlarm.stop() : Promise.resolve();
export async function enableAlarms() {
  if (!alarmsAvailable) return;
  if (Number(Platform.Version) >= 33) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  const status = await NativeAlarm.getStatus();
  if (!status.notifications) await NativeAlarm.openNotificationSettings();
  else if (!status.exact) await NativeAlarm.openExactSettings();
  else if (!status.fullScreen) await NativeAlarm.openFullScreenSettings();
}
