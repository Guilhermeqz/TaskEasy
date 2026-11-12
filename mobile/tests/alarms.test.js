import { Platform } from 'react-native';
import NativeAlarm from '../modules/taskeasy-alarm';

jest.mock('../modules/taskeasy-alarm', () => ({ __esModule: true, default: {
  activateUser: jest.fn(), upsert: jest.fn(), sync: jest.fn(), cancel: jest.fn(), getStatus: jest.fn(), stop: jest.fn(),
} }));
Platform.OS = 'android';
const alarms = require('../src/services/alarms');
const task = { id: 2, titulo: 'Tomar café', descricao: '', concluida: false, horario: '09:00', lembrete_em: '2030-01-01T12:00:00.000Z', repetir_diariamente: false };

beforeEach(async () => {
  jest.clearAllMocks();
  NativeAlarm.getStatus.mockResolvedValue({ exact: true, notifications: true, fullScreen: true });
  NativeAlarm.upsert.mockResolvedValue(undefined);
  await alarms.activateAlarmUser(1);
});

test('agenda o instante correto e desativa o despertador de uma tarefa concluída', async () => {
  await alarms.updateTaskAlarm(1, task);
  expect(NativeAlarm.upsert).toHaveBeenCalledWith('1', expect.objectContaining({ id: 2, enabled: true, hour: '09:00', at: Date.parse(task.lembrete_em) }));
  await alarms.updateTaskAlarm(1, { ...task, concluida: true });
  expect(NativeAlarm.upsert).toHaveBeenLastCalledWith('1', expect.objectContaining({ enabled: false }));
});

test('logout e troca de usuário impedem agendamentos de respostas antigas', async () => {
  await alarms.activateAlarmUser(null);
  await alarms.updateTaskAlarm(1, task);
  expect(NativeAlarm.upsert).not.toHaveBeenCalled();
  await alarms.activateAlarmUser(2);
  await alarms.syncTaskAlarms(1, [task]);
  expect(NativeAlarm.sync).not.toHaveBeenCalled();
});

test('falha nativa informa que a tarefa foi salva, sem provocar criação duplicada', async () => {
  NativeAlarm.upsert.mockRejectedValueOnce(new Error('Falha nativa'));
  await expect(alarms.updateTaskAlarm(1, task)).resolves.toBeUndefined();
  expect(alarms.getAlarmWarning()).toContain('A tarefa foi salva');
  await alarms.cancelTaskAlarm(1, 2);
  expect(NativeAlarm.cancel).toHaveBeenCalledWith('1', '2');
});

test('permissão ausente é informada e a sincronização é enviada para o módulo nativo', async () => {
  NativeAlarm.getStatus.mockResolvedValueOnce({ exact: false, notifications: true, fullScreen: false });
  await alarms.syncTaskAlarms(1, [task]);
  expect(NativeAlarm.sync).toHaveBeenCalledWith('1', expect.any(Array));
  expect(alarms.getAlarmWarning()).toContain('permissões');
});
